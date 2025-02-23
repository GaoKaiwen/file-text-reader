# File Upload and Parsing Application

This is a Next.js application that allows users to upload files (PDF, Word, Excel) and extract their content. The application also includes a keyword search feature with highlighting for uploaded files.

## Features

- **File Upload**: Users can upload multiple files (PDF, Word, Excel).
- **File Parsing**: The application extracts and displays the content of uploaded files.
- **Keyword Search**: Users can search for keywords in the uploaded files, with matching keywords highlighted.
- **Error Handling**: Displays error messages for invalid file formats or upload failures.
- **Responsive UI**: A clean and user-friendly interface built with Tailwind CSS.

## Technologies Used

- **Next.js**: A React framework for server-side rendering and API routes.
- **TypeScript**: Adds type safety to the codebase.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **Formidable**: A library for parsing form data, including file uploads.
- **PDF-Parse**: A library for extracting text from PDF files.
- **Mammoth**: A library for extracting text from Word documents.
- **XLSX**: A library for parsing Excel files.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/GaoKaiwen/file-text-reader.git
   cd file-text-reader
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
4. Open your browser and navigate to http://localhost:3000.

### Deployment

To deploy the application on Vercel:

1. Push your code to a GitHub repository.
2. Go to Vercel and import your repository.
3. Follow the deployment steps, and Vercel will automatically deploy your app.

## How It Works

### File Upload

1. Users can drag and drop files or click to select them.
2. Supported file formats include:
   - PDF (`.pdf`)
   - Word (`.docx`)
   - Excel (`.xlsx`)

### File Parsing

- **PDF**: The application extracts text using the `pdf-parse` library.
- **Word**: The application extracts text using the `mammoth` library.
- **Excel**: The application extracts data as CSV using the `xlsx` library.

### Keyword Search

- Users can enter keywords (comma-separated) to search through the uploaded files.
- Matching keywords are highlighted in the displayed content.

### Error Handling

- Invalid file formats or upload failures are displayed as error messages.
- Users can dismiss error messages by clicking the close button.

## Code Structure

- `src/app/api/upload/route.ts`: API route for handling file uploads and parsing.
- `src/app/page.tsx`: The main page component with the file upload UI.
- `src/components/FileUpload.tsx`: The file upload and display component.

## Environment Variables

No environment variables are required for this project.