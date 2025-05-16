import { ConnectMSSQL } from '../config/db.js';
import sql from 'msnodesqlv8';

const savePharmacyProfile = async (req, res) => {
  const { pharmacyName, pharmacistName, mobile, email, address, address2, area, pincode, city, state, userId } = req.body;
  const companyLogoPath = req.files['companyLogo'] ? `uploads/${req.files['companyLogo'][0].filename}` : null;
  const signaturePath = req.files['signature'] ? `uploads/${req.files['signature'][0].filename}` : null;

  try {
    const pool = req.app.get('db');
    const result = await pool.request()
      .input('userId', userId)
      .input('pharmacyName', pharmacyName)
      .input('pharmacistName', pharmacistName)
      .input('mobile', mobile)
      .input('email', email)
      .input('address', address)
      .input('address2', address2)
      .input('area', area)
      .input('pincode', pincode)
      .input('city', city)
      .input('state', state)
      .input('companyLogo', companyLogoPath)
      .input('signature', signaturePath)
      .query(`
        INSERT INTO [dbo].[pharmacy_profile] 
        (id, pharmacy_name, pharmacist_name, mobile, email, address, address2, area, pincode, city, state, company_logo, signature, created_at)
        VALUES
        (@userId, @pharmacyName, @pharmacistName, @mobile, @email, @address, @address2, @area, @pincode, @city, @state, @companyLogo, @signature, GETDATE())
      `);

    res.status(200).json({ message: 'Profile saved successfully', data: result.recordset });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ message: 'Error saving profile', error: error.message });
  }
};

const updatePharmacyProfile = async (req, res) => {
  const { pharmacyName, pharmacistName, mobile, email, address, address2, area, pincode, city, state, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const companyLogoPath = req.files['companyLogo'] ? `uploads/${req.files['companyLogo'][0].filename}` : null;
  const signaturePath = req.files['signature'] ? `uploads/${req.files['signature'][0].filename}` : null;

  try {
    const pool = req.app.get('db');

    const query = `
      UPDATE [dbo].[pharmacy_profile]
      SET
        pharmacy_name = @pharmacyName,
        pharmacist_name = @pharmacistName,
        mobile = @mobile,
        email = @email,
        address = @address,
        address2 = @address2,
        area = @area,
        pincode = @pincode,
        city = @city,
        state = @state,
        ${companyLogoPath ? 'company_logo = @companyLogo,' : ''}
        ${signaturePath ? 'signature = @signature,' : ''}
        updated_at = GETDATE()
      WHERE id = @userId
    `;

    const request = pool.request()
      .input('pharmacyName', pharmacyName)
      .input('pharmacistName', pharmacistName)
      .input('mobile', mobile)
      .input('email', email)
      .input('address', address)
      .input('address2', address2)
      .input('area', area)
      .input('pincode', pincode)
      .input('city', city)
      .input('state', state)
      .input('userId', userId);

    if (companyLogoPath) request.input('companyLogo', companyLogoPath);
    if (signaturePath) request.input('signature', signaturePath);

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Profile not found or no changes made for userId: ' + userId });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error.stack);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

const getPharmacyProfile = async (req, res) => {
  const userId = req.params.userId;

  try {
    const pool = req.app.get('db');

    const result = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT TOP 1
          pharmacy_name AS pharmacyName,
          pharmacist_name AS pharmacistName,
          mobile,
          email,
          address,
          address2,
          area,
          pincode,
          city,
          state,
          company_logo AS companyLogoPath,
          signature AS signaturePath
        FROM [dbo].[pharmacy_profile]
        WHERE id = @userId 
        ORDER BY created_at DESC
      `);

    if (result.recordset.length > 0) {
      res.status(200).json({ profile: result.recordset[0] });
    } else {
      res.status(404).json({ message: 'Profile not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

const savePharmacyDocument = async (req, res) => {
  const { documentName, documentType, licenseNumber, docExpiry, userId } = req.body;
  const documentDataPath = req.files['documentData'] ? `uploads/${req.files['documentData'][0].filename}` : null;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const pool = req.app.get('db');
    const result = await pool.request()
      .input('userId', userId)
      .input('documentName', documentName)
      .input('documentType', documentType)
      .input('licenseNumber', licenseNumber)
      .input('documentData', documentDataPath)
      .input('docExpiry', docExpiry || null)
      .query(`
        INSERT INTO [dbo].[pharmacy_documents] 
        (user_id, document_name, document_type, license_number, document_data, doc_expiry, created_at)
        VALUES
        (@userId, @documentName, @documentType, @licenseNumber, @documentData, @docExpiry, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const newDocument = {
      id: result.recordset[0].id,
      user_id: userId,
      document_name: documentName,
      document_type: documentType,
      license_number: licenseNumber,
      document_data: documentDataPath,
      doc_expiry: docExpiry,
      created_at: new Date().toISOString(),
    };

    res.status(200).json({ message: 'Document saved successfully', document: newDocument });
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ message: 'Error saving document', error: error.message });
  }
};

const updatePharmacyDocument = async (req, res) => {
  const documentId = req.params.documentId;
  const { documentName, documentType, licenseNumber, docExpiry, userId } = req.body;
  const documentDataPath = req.files['documentData'] ? `uploads/${req.files['documentData'][0].filename}` : null;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const pool = req.app.get('db');
    const query = `
      UPDATE [dbo].[pharmacy_documents]
      SET
        document_name = @documentName,
        document_type = @documentType,
        license_number = @licenseNumber,
        ${documentDataPath ? 'document_data = @documentData,' : ''}
        doc_expiry = @docExpiry,
        updated_at = GETDATE()
      WHERE id = @documentId AND user_id = @userId
    `;

    const request = pool.request()
      .input('documentName', documentName)
      .input('documentType', documentType)
      .input('licenseNumber', licenseNumber)
      .input('docExpiry', docExpiry || null)
      .input('documentId', documentId)
      .input('userId', userId);

    if (documentDataPath) request.input('documentData', documentDataPath);

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Document not found or no changes made' });
    }

    const updatedDocument = {
      id: documentId,
      user_id: userId,
      document_name: documentName,
      document_type: documentType,
      license_number: licenseNumber,
      document_data: documentDataPath,
      doc_expiry: docExpiry,
      updated_at: new Date().toISOString(),
    };

    res.status(200).json({ message: 'Document updated successfully', document: updatedDocument });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Error updating document', error: error.message });
  }
};

const getPharmacyDocuments = async (req, res) => {
  const userId = req.params.userId;

  try {
    const pool = req.app.get('db');
    const result = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT 
          id,
          user_id,
          document_name,
          document_type,
          license_number,
          document_data,
          doc_expiry,
          created_at,
          updated_at
        FROM [dbo].[pharmacy_documents]
        WHERE user_id = @userId AND isDeleted = 0
        ORDER BY created_at DESC
      `);

    res.status(200).json({ documents: result.recordset });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

export default {
  savePharmacyProfile,
  updatePharmacyProfile,
  getPharmacyProfile,
  savePharmacyDocument,
  updatePharmacyDocument,
  getPharmacyDocuments,
};