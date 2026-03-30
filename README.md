# Three-Way Match Engine

A full-stack application for processing and reconciling Purchase Orders (PO), Goods Receipt Notes (GRN), and Invoices using the Gemini AI API for document data extraction.

## Approach & Architecture

### Backend Stack
- **Node.js + Express**: Serves the RESTful APIs.
- **MongoDB + Mongoose**: Used to store parsed documents flexibly.
- **Multer**: Handled file uploads in-memory (to avoid local disk writes that may fail in ephemeral cloud environments).
- **Google Gemini API**: Utilized `gemini-2.5-flash` model to accurately extract structured JSON from raw document text. Used `pdf-parse` for PDF textual extraction.

### Frontend Stack
- **React (Vite)**: Fast build tool and component-based UI.
- **Vanilla CSS**: Used for styling the entire app to deliver a premium, dark-mode glassmorphic aesthetic per requirements without heavy UI libraries.

### Out-of-Order Upload Handling
The requirement stated that the order of document arrival must not matter.
This is addressed through:
1. **Independent Storage**: Every document (PO, GRN, or Invoice) is independently parsed and saved to a polymorphic `Document` MongoDB collection.
2. **On-the-Fly Matching**: The `matchService.js` performs a real-time aggregation of all `Document` rows matching a specific `poNumber`. It tallies up quantities received (from all GRNs) and quantities invoiced (from all Invoices) and compares them with the requested quantities (from the single PO).

### Data Model
- `Document`: A single Mongoose schema handles all three types by utilizing a `documentType` field.
  - Core fields: `documentType`, `poNumber`, `items[]` (containing `itemCode`, `sku`, `description`, `quantity`, `receivedQuantity`).
  - Specific fields: `poDate`, `grnDate`, `invoiceDate`, `vendorName`.
  - Auditing fields: `originalFileName`, `uploadDate`, `rawParsedJson`.

### Matching Logic
1. Validation requires exactly 1 PO document.
2. The logic iterates through PO items to build a mapping hash map (Item Key -> PO Quantity).
   - **Item Matching Key**: I chose a composite key check based on `itemCode` or `sku` or `description` depending on what the LLM successfully extracted. For a robust inventory system in production, `itemCode` or an internal `itemId` is optimal.
3. Iterates over all GRN items belonging to this PO and sums their `receivedQuantity`.
4. Iterates over all Invoice items and sums their `quantity`. Checks `invoiceDate` against `poDate`.
5. Compares the totals. Discrepancies generate specific error reasons (e.g. `grn_qty_exceeds_po_qty_for_item_ABC`).
6. Based on discrepancies, returns `matched`, `partially_matched`, `mismatch`, or `insufficient_documents`.

## Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB daemon running locally on port 27017, or update `MONGO_URI`.
- Google Gemini API Key.

### 1. Start Backend
\`\`\`bash
cd backend
npm install
# In backend/.env ensure your variables are set:
# GEMINI_API_KEY=YOUR_API_KEY
npm run dev
\`\`\`

### 2. Start Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Visit \`http://localhost:5173\` in your browser.

## Tradeoffs & Assumptions
- **PDF Parsing Strategy**: Relies solely on `pdf-parse` to extract text and passes it to Gemini. Complex table layouts might have text flow incorrectly. If I had more time, I would consider sending the raw file directly as a Base64 payload using Gemini's Vision/Multimodal capabilities for higher accuracy on structured PDF invoices.
- **Document Identification**: Assumed OCR/LLM extraction is reliable to find the `poNumber` on GRNs and Invoices. If this fails, the documents cannot be linked.
- **In-memory Multer Strategy**: Good for quick MVP and Serverless environments, but would consume a lot of RAM if many huge PDFs arrive concurrently.
- **Match State Persistence**: I chose to compute the Match State on the fly rather than storing it. For a large enterprise, an Event-Driven architecture (e.g. RabbitMQ/Kafka) updating a synchronized `MatchState` table and emitting webhooks would be better.

## Sample cURL (API Usage)

### 1. Upload Document
\`\`\`bash
curl -X POST http://localhost:5000/documents/upload \
  -F "file=@/path/to/invoice.pdf" \
  -F "documentType=invoice"
\`\`\`

### 2. Get Match Result
\`\`\`bash
curl http://localhost:5000/match/PO-10045
\`\`\`
