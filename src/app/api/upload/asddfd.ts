import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs/promises';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to convert a buffer to a readable stream
function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable._read = () => {}; // _read is required but you can noop it
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function POST(req: NextRequest) {
  try {
    // Collect the raw request body into a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of req.body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Create upload directory if it doesn't exist
    const uploadDir = './public/uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    // Initialize formidable
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      multiples: false,
    });

    // Create a mock Node.js IncomingMessage from the buffer
    const stream = bufferToStream(buffer) as IncomingMessage;
    stream.headers = Object.fromEntries(req.headers);

    // Parse the form from the mock IncomingMessage
    const [fields, files] = await form.parse(stream);

    console.log('Fields:', fields);
    console.log('Files:', files);

    return NextResponse.json({
      message: 'File uploaded successfully',
      fields,
      files,
    });
  } catch (error) {
    console.error('Error during file upload:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
