import Image from "next/image";
import FileUpload from './components/FileUpload';

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center sm:text-left">
        <h1 className="text-4xl font-bold mb-4">File Upload and Parsing</h1>
        <p className="text-lg text-gray-600">
          Upload your document files and extract their content! Supported formats include:
        </p>
      </header>

      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <ul className="mt-2 text-lg text-gray-600 list-disc pl-5 sm:text-left">
          <li>PDF (.pdf)</li>
          <li>Word (.docx)</li>
          <li>Excel (.xlsx)</li>
        </ul>
        <FileUpload />
      </main>

      <footer className="text-center text-sm text-gray-500 mt-8">
        <p>&copy; 2025 Kaiwen</p>
      </footer>
    </div>
  );
}
