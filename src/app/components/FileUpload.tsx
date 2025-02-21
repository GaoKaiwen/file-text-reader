'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

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

    // Split keywords by comma or space
    const keywords = keyword.split(',').map(k => k.trim()).filter(k => k);

    if (keywords.length === 0) return text;

    // Create a regex pattern that matches any of the keywords
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');

    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };

  const clearDocuments = () => {
    setFileContents([]);
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-6 text-center rounded-md hover:border-blue-500 transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag & drop some files here, or click to select files</p>
        )}
      </div>

      {fileContents.length > 0 && (
        <button
          onClick={clearDocuments}
          className="mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Clear All
        </button>
      )}

      {fileContents.map((content, index) => (
        <div key={index} className="mt-4 p-4 border rounded">
          <h3 className="text-xl font-bold">File Content {index + 1}:</h3>
          <input
            type="text"
            placeholder="Search keywords (comma separated)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="mt-2 p-2 border rounded w-full"
          />
          <pre className="whitespace-pre-wrap">{highlightKeywords(content, searchKeyword)}</pre>
        </div>
      ))}
    </div>
  );
};

export default FileUpload;
