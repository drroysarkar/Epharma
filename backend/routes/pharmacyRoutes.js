import express from 'express';
import upload from '../utils/upload.js';
import pharmacyController from '../controllers/pharmacyController.js';

const router = express.Router();

// Profile routes
router.post(
  '/save-profile',
  upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ]),
  pharmacyController.savePharmacyProfile
);
router.post(
  '/update-profile',
  upload.fields([{ name: 'companyLogo' }, { name: 'signature' }]),
  pharmacyController.updatePharmacyProfile
);
router.get('/profile/:userId', pharmacyController.getPharmacyProfile);

// Document routes
router.post(
  '/save-document',
  upload.fields([{ name: 'documentData', maxCount: 1 }]),
  pharmacyController.savePharmacyDocument
);
router.post(
  '/update-document/:documentId',
  upload.fields([{ name: 'documentData', maxCount: 1 }]),
  pharmacyController.updatePharmacyDocument
);
router.get('/documents/:userId', pharmacyController.getPharmacyDocuments);

export default router;