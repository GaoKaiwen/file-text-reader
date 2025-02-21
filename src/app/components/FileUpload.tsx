'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, XCircle } from 'lucide-react';

const FileUpload: React.FC = () => {
  const [fileContents, setFileContents] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handles file upload and sends them to the API
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
        setErrorMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setErrorMessage('Error uploading files');
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

  // Highlights matching keywords in the displayed text
  const highlightKeywords = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    const keywords = keyword.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.length === 0) return text;

    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');

    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };

  // Clears uploaded file contents
  const clearDocuments = () => {
    setFileContents([]);
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong> <span className="block sm:inline">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <XCircle className="w-5 h-5 text-red-500" />
          </button>
        </div>
      )}

      <h1 className="text-3xl font-semibold text-center mb-2">File Upload and Parsing</h1>
      <p className="text-gray-500 text-center mb-6">Upload your document files and extract their content.</p>

      <div className="flex justify-center gap-3 mb-6 text-gray-600">
        <span>PDF</span>
        <span>Word</span>
        <span>Excel</span>
      </div>

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

      {fileContents.length > 0 && (
        <button
          onClick={clearDocuments}
          className="mt-4 p-2 px-4 bg-red-500 text-white rounded flex items-center gap-2 
          hover:bg-red-600 transition mx-auto block"
        >
          <XCircle className="w-5 h-5" /> Clear All Files
        </button>
      )}

      {fileContents.map((content, index) => (
        <div key={index} className="mt-4 p-4 border rounded bg-white shadow-md">
          <h3 className="text-xl font-bold">File {index + 1} Content:</h3>
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
    </div>
  );
};

export default FileUpload;
