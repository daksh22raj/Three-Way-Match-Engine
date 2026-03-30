import Document from '../models/Document.js';
import { parseDocumentWithGemini } from '../services/geminiService.js';

export async function uploadDocument(req, res) {
  try {
    const file = req.file;
    const documentType = req.body.documentType; // po, grn, invoice

    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!['po', 'grn', 'invoice'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid documentType. Must be po, grn, or invoice' });
    }

    // Call Gemini
    const parsedData = await parseDocumentWithGemini(file.buffer, file.mimetype, documentType);

    // Prepare fields for Document mapping
    const docData = {
      documentType,
      poNumber: parsedData.poNumber,
      // mapping specific fields from JSON
      poDate: parsedData.poDate ? new Date(parsedData.poDate) : undefined,
      vendorName: parsedData.vendorName,
      grnNumber: parsedData.grnNumber,
      grnDate: parsedData.grnDate ? new Date(parsedData.grnDate) : undefined,
      invoiceNumber: parsedData.invoiceNumber,
      invoiceDate: parsedData.invoiceDate ? new Date(parsedData.invoiceDate) : undefined,
      items: parsedData.items,
      originalFileName: file.originalname,
      rawParsedJson: parsedData
    };

    const newDoc = new Document(docData);
    await newDoc.save();

    res.status(201).json({
      message: 'Document uploaded and parsed successfully',
      documentId: newDoc._id,
      parsedData
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to process document', details: error.message });
  }
}

export async function getDocument(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching document', details: error.message });
  }
}
