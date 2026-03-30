import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const Upload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('po');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      const res = await axios.post('http://localhost:5000/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setFile(null);

      document.getElementById('file-upload').value = "";
      if (onUploadSuccess && res.data.parsedData?.poNumber) {
        onUploadSuccess(res.data.parsedData.poNumber);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <UploadCloud size={24} color="var(--primary)" />
        Upload Document
      </h2>
      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label className="form-label">Document Type</label>
          <select
            className="form-control"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="po">Purchase Order (PO)</option>
            <option value="grn">Goods Receipt Note (GRN)</option>
            <option value="invoice">Invoice</option>
          </select>
        </div>

        <div className={`file-drop ${file ? 'active' : ''}`} onClick={() => document.getElementById('file-upload').click()}>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.txt,.png,.jpg,.jpeg"
          />
          {file ? (
            <div>
              <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600 }}>{file.name}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div>
              <UploadCloud size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <p>Click to browse or drag and drop your file here</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Supports PDF, TXT, Images</p>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle size={18} /> Document processed successfully!
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!file || loading}>
          {loading ? <span className="loader"></span> : 'Upload & Parse Document'}
        </button>
      </form>
    </div>
  );
};

export default Upload;
