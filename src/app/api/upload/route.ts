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

// Helper to convert a buffer to a readable stream
function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

// Helper to convert ReadableStream to AsyncIterable
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

// Helper to parse files based on type
async function parseFile(filePath: string, mimeType: string) {
  try {
    console.log('🔍 Checking file path:', filePath);
    await fs.access(filePath); // Ensure file exists before reading
    console.log('✅ File exists!');

    if (mimeType === 'application/pdf') {
      console.log('🛠️ Importing pdf-parse...');
      // @ts-expect-error - pdf-parse has no TypeScript types
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;

      console.log(`📖 Parsing PDF file at: ${filePath}`);

      const dataBuffer = await fs.readFile(filePath);
      console.log(`✅ Successfully read file into buffer: ${filePath}`);

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
      console.log('📝 Parsing Excel file:', filePath);
      // Read the file into a buffer
      const dataBuffer = await fs.readFile(filePath);
      // Use xlsx.read to parse the buffer
      const workbook = xlsx.read(dataBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return xlsx.utils.sheet_to_csv(sheet);
    }

    return 'Unsupported file type';
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse file');
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('✅ POST request hit /api/upload');

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
      multiples: true, // ✅ Allow multiple file uploads
    });

    const stream = bufferToStream(buffer) as IncomingMessage;
    stream.headers = Object.fromEntries(req.headers);

    const [_fields, files] = await form.parse(stream);

    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files]; // Ensure an array
    const fileContents: string[] = [];

    for (const uploadedFile of uploadedFiles) {
      if (!uploadedFile?.newFilename || !uploadedFile?.mimetype) {
        console.error('❌ File upload failed: Missing file data');
        return NextResponse.json({ error: 'Invalid file upload' }, { status: 400 });
      }

      const filePath = path.join(uploadDir, uploadedFile.newFilename);
      console.log('📁 Corrected file path:', filePath);

      const fileContent = await parseFile(filePath, uploadedFile.mimetype);
      fileContents.push(fileContent);
    }

    return NextResponse.json({
      message: 'Files uploaded and parsed successfully',
      fileContents, // ✅ Return an array of parsed contents
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('❌ Error during file upload and parsing:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
