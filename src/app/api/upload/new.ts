import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs/promises';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { readFile, utils } from 'xlsx';
import officeParser from 'officeparser';

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

// Helper to parse files based on type
async function parseFile(filePath: string, mimeType: string) {
  try {
    if (mimeType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const dataBuffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    }

    if (mimeType === 'application/msword') {
      return new Promise((resolve, reject) => {
        officeParser.parseOffice(filePath, (err: any, data: any) => {
          if (err) reject(err);
          resolve(data);
        });
      });
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return utils.sheet_to_csv(sheet); // Can be changed to JSON, text, etc.
    }
    
    return NextResponse.json({
      error: 'Unsupported file type',
    }, { status: 400 });
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse file');
  }
}

export async function POST(req: NextRequest) {
  try {
    // Collect raw request body
    const chunks: Uint8Array[] = [];
    for await (const chunk of req.body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Create the upload directory
    const uploadDir = './public/uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    // Initialize formidable
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      multiples: false,
    });

    // Create a mock Node.js IncomingMessage
    const stream = bufferToStream(buffer) as IncomingMessage;
    stream.headers = Object.fromEntries(req.headers);

    // Parse the uploaded file
    const [fields, files] = await form.parse(stream);

    // Extract file path and type
    const uploadedFile = files.files?.[0];
    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const filePath = uploadedFile.filepath as string;
    const mimeType = uploadedFile.mimetype as string;

    // Parse the file based on its type
    const fileContent = await parseFile(filePath, mimeType);

    // Return file content
    return NextResponse.json({
      message: 'File uploaded and parsed successfully',
      fileContent,
      fields,
    });
  } catch (error) {
    console.error('Error during file upload and parsing:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
