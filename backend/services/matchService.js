import Document from '../models/Document.js';

export async function performThreeWayMatch(poNumber) {
  // Fetch all documents for this PO
  const documents = await Document.find({ poNumber });

  const poDocs = documents.filter(d => d.documentType === 'po');
  const grnDocs = documents.filter(d => d.documentType === 'grn');
  const invDocs = documents.filter(d => d.documentType === 'invoice');

  if (poDocs.length === 0) {
    return { status: 'insufficient_documents', reasons: ['missing_po'], documents };
  }
  if (poDocs.length > 1) {
    return { status: 'mismatch', reasons: ['duplicate_po'], documents };
  }

  const po = poDocs[0];
  let reasons = [];

  // Match items logic
  // Item matching key: "itemCode" or "sku" or "description"
  const poItemsMap = new Map();
  po.items.forEach(item => {
    const key = item.itemCode || item.sku || item.description;
    if (key) {
      poItemsMap.set(key, {
        poQty: item.quantity || 0,
        grnQty: 0,
        invQty: 0
      });
    }
  });

  // Aggregate GRN quantities
  grnDocs.forEach(grn => {
    grn.items.forEach(item => {
      const key = item.itemCode || item.sku || item.description;
      if (poItemsMap.has(key)) {
        poItemsMap.get(key).grnQty += (item.receivedQuantity || 0);
      } else {
         reasons.push(`item_missing_in_po_from_grn: ${key}`);
      }
    });
  });

  // Aggregate Invoice quantities, Dates check
  let isDateMismatch = false;
  invDocs.forEach(inv => {
    if (inv.invoiceDate && po.poDate && new Date(inv.invoiceDate) > new Date(po.poDate)) {
      isDateMismatch = true;
    }
    inv.items.forEach(item => {
      const key = item.itemCode || item.sku || item.description;
      if (poItemsMap.has(key)) {
        poItemsMap.get(key).invQty += (item.quantity || 0);
      } else {
        reasons.push(`item_missing_in_po_from_invoice: ${key}`);
      }
    });
  });

  if (isDateMismatch) {
    reasons.push('invoice_date_after_po_date');
  }

  for (const [key, data] of poItemsMap.entries()) {
    if (data.grnQty > data.poQty) {
      reasons.push(`grn_qty_exceeds_po_qty_for_item_${key}`);
    }
    if (data.invQty > data.grnQty) {
      // NOTE: Requirements state "Invoice quantity must not be greater than total GRN quantity" 
      // AND "Invoice quantity must not be greater than PO quantity"
      reasons.push(`invoice_qty_exceeds_grn_qty_for_item_${key}`);
    }
    if (data.invQty > data.poQty) {
      reasons.push(`invoice_qty_exceeds_po_qty_for_item_${key}`);
    }
  }

  // Determine status
  let status = 'matched';
  if (reasons.length > 0) {
    status = 'mismatch';
  } else if (grnDocs.length === 0 || invDocs.length === 0) {
    status = 'insufficient_documents';
  } else {
      // Check partial Match: if GRN total < PO total, or Inv total < PO total
      let isPartial = false;
      for (const [key, data] of poItemsMap.entries()) {
         if (data.grnQty < data.poQty || data.invQty < data.poQty) {
             isPartial = true;
         }
      }
      if (isPartial) status = 'partially_matched';
  }

  return {
    status,
    reasons,
    documents
  };
}
