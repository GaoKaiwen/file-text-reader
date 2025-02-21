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
        setFileContents((prev) => [...prev, data.fileContent]); // Add new file content to the array
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  // Function to highlight keywords in the text
  const highlightKeywords = (text: string, keyword: string) => {
    if (!keyword) return text; // If no keyword, return the original text

    const regex = new RegExp(`(${keyword})`, 'gi'); // Create a regex to match the keyword
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index}>{part}</mark> : part // Highlight matching parts
    );
  };

  return (
    <div>
      {/* Dropzone for file upload */}
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

      {/* Display file content and search input */}
      {fileContents.map((content, index) => (
        <div key={index} className="mt-4 p-4 border rounded">
          <h3 className="text-xl font-bold">File Content {index + 1}:</h3>
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="mt-2 p-2 border rounded"
          />
          <pre>{highlightKeywords(content, searchKeyword)}</pre>
        </div>
      ))}
    </div>
  );
};

export default FileUpload;