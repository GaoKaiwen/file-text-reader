import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

// Disable Next.js default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Convert a buffer to a readable stream
function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Convert ReadableStream to AsyncIterable
async function* readableStreamToAsyncIterable(stream: ReadableStream<Uint8Array>): AsyncIterable<Uint8Array> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// Parse file content based on MIME type
async function parseFile(filePath: string, mimeType: string) {
  try {
    await fs.access(filePath); // Ensure file exists before reading

    if (mimeType === 'application/pdf') {
      // @ts-expect-error - pdf-parse has no TypeScript types
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const xlsx = await import('xlsx');
      const dataBuffer = await fs.readFile(filePath);
      const workbook = xlsx.read(dataBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return xlsx.utils.sheet_to_csv(sheet);
    }

    throw new Error('Unsupported file type');

  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse file');
  }
}


export async function POST(req: NextRequest) {
  try {
    if (!req.body) {
      return NextResponse.json({ error: 'Request body is null' }, { status: 400 });
    }

    const asyncIterable = readableStreamToAsyncIterable(req.body);
    const chunks: Uint8Array[] = [];
    for await (const chunk of asyncIterable) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const uploadDir = '/tmp/uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      multiples: true,
    });

    const stream = bufferToStream(buffer) as IncomingMessage;
    stream.headers = Object.fromEntries(req.headers);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_fields, files] = await form.parse(stream);

    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
    const fileContents: string[] = [];

    for (const uploadedFile of uploadedFiles) {
      if (!uploadedFile?.newFilename || !uploadedFile?.mimetype) {
        return NextResponse.json({ error: 'Invalid file upload' }, { status: 400 });
      }

      const filePath = path.join(uploadDir, uploadedFile.newFilename);

      try {
        const fileContent = await parseFile(filePath, uploadedFile.mimetype);
        fileContents.push(fileContent);
      } catch (error) {
        console.error('Error parsing file:', error);
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
      }
    }

    return NextResponse.json({ message: 'Files uploaded and parsed successfully', fileContents });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
