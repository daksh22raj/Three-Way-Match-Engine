import express from 'express';
import { upload } from '../utils/multerConfig.js';
import { uploadDocument, getDocument } from '../controllers/documentController.js';
import { getMatchResult } from '../controllers/matchController.js';

const router = express.Router();

router.post('/documents/upload', upload.single('file'), uploadDocument);
router.get('/documents/:id', getDocument);
router.get('/match/:poNumber', getMatchResult);

export default router;
