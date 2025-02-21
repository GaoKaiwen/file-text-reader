'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, XCircle } from 'lucide-react'; // Icons

const FileUpload: React.FC = () => {
  const [fileContents, setFileContents] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setFileContents((prev) => [...prev, ...data.fileContents]);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const highlightKeywords = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    const keywords = keyword.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.length === 0) return text;

    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');

    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };

  const clearDocuments = () => {
    setFileContents([]);
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-semibold text-center mb-2">📂 File Upload and Parsing</h1>
      <p className="text-gray-500 text-center mb-6">
        Upload your document files and extract their content. Supported formats:
      </p>

      <div className="flex justify-center gap-3 mb-6 text-gray-600">
        <span>📄 PDF</span>
        <span>📝 Word</span>
        <span>📊 Excel</span>
      </div>

      {/* Drag & Drop Box */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-8 rounded-lg flex flex-col items-center justify-center 
        cursor-pointer transition hover:border-blue-500 bg-gray-50 shadow-md"
      >
        <input {...getInputProps()} />
        <CloudUpload className="w-12 h-12 text-blue-500 mb-2" />
        <p className="text-gray-600">
          {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select'}
        </p>
      </div>

      {/* Clear All Button */}
      {fileContents.length > 0 && (
        <button
          onClick={clearDocuments}
          className="mt-4 p-2 px-4 bg-red-500 text-white rounded flex items-center gap-2 
          hover:bg-red-600 transition mx-auto block"
        >
          <XCircle className="w-5 h-5" /> Clear All Files
        </button>
      )}

      {/* Display File Contents */}
      {fileContents.map((content, index) => (
        <div key={index} className="mt-4 p-4 border rounded bg-white shadow-md">
          <h3 className="text-xl font-bold">📃 File {index + 1} Content:</h3>
          <input
            type="text"
            placeholder="Search keywords (comma-separated)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="mt-2 p-2 border rounded w-full"
          />
          <pre className="whitespace-pre-wrap text-gray-700">{highlightKeywords(content, searchKeyword)}</pre>
        </div>
      ))}

      {/* Footer */}
      <footer className="text-center text-gray-400 mt-8 text-sm">
        © 2025 Kaiwen
      </footer>
    </div>
  );
};

export default FileUpload;
