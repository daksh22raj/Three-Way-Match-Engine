import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: false },
  sku: { type: String, required: false },
  description: { type: String, required: false },
  quantity: { type: Number, required: false },
  receivedQuantity: { type: Number, required: false }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  documentType: { type: String, enum: ['po', 'grn', 'invoice'], required: true },
  poNumber: { type: String, required: true },
  
  // Specific fields based on document type
  poDate: { type: Date },
  vendorName: { type: String },
  
  grnNumber: { type: String },
  grnDate: { type: Date },
  
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  
  items: [itemSchema],
  
  // Metadata
  originalFileName: String,
  uploadDate: { type: Date, default: Date.now },
  rawParsedJson: mongoose.Schema.Types.Mixed // The exact structure returned by Gemini
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
