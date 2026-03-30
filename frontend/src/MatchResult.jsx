import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const MatchResult = ({ prefillPo }) => {
  const [poNumber, setPoNumber] = useState(prefillPo || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prefillPo) {
      setPoNumber(prefillPo);
      handleSearch(prefillPo);
    }
  }, [prefillPo]);

  const handleSearch = async (searchPo = poNumber) => {
    if (!searchPo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:5000/match/${searchPo}`);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch match result');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'matched': return <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}/> Matched</span>;
      case 'partially_matched': return <span className="badge badge-warning"><AlertTriangle size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}/> Partial Match</span>;
      case 'mismatch': return <span className="badge badge-error"><XCircle size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}/> Mismatch</span>;
      case 'insufficient_documents': return <span className="badge badge-info"><AlertTriangle size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}/> Insufficient Docs</span>;
      default: return null;
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <Search size={24} color="var(--primary)" />
        Three-Way Match Status
      </h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Enter PO Number (e.g. PO-1001)" 
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={() => handleSearch()} disabled={loading || !poNumber}>
          {loading ? <span className="loader" style={{ width: '20px', height: '20px' }}></span> : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={18} /> {error}
        </div>
      )}

      {result && (
        <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
          <div className="flex-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>PO Number: {poNumber}</h3>
            {getStatusBadge(result.status)}
          </div>

          {result.reasons && result.reasons.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h4 style={{ color: 'var(--error)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Resolution Required
              </h4>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text)' }}>
                {result.reasons.map((reason, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{reason.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
              Linked Documents ({result.documents?.length || 0})
            </h4>
            
            {result.documents?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No documents found for this PO Number yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Ref Number</th>
                      <th>Date</th>
                      <th>Items Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.documents.map((doc) => (
                      <tr key={doc._id}>
                        <td>
                          <span className={`badge ${doc.documentType === 'po' ? 'badge-info' : doc.documentType === 'grn' ? 'badge-success' : 'badge-warning'}`}>
                            {doc.documentType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {doc.documentType === 'po' ? doc.poNumber : 
                           doc.documentType === 'grn' ? doc.grnNumber : 
                           doc.invoiceNumber}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                           {(doc.poDate || doc.grnDate || doc.invoiceDate) ? new Date(doc.poDate || doc.grnDate || doc.invoiceDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>{doc.items?.length || 0} items</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchResult;
