import { ConnectMSSQL } from '../config/db.js';

export const insertEmployee = async (data) => {
  const pool = await ConnectMSSQL(); // Now safely reused

  const result = await pool
    .request()
    .input('first_name', data.firstName)
    .input('last_name', data.lastName)
    .input('email', data.email)
    .input('phone_number', data.phoneNumber)
    .input('address', data.address)
    .input('profile_image', data.profileImage)
    .query(`
      INSERT INTO Employees (first_name, last_name, email, phone_number, address, profile_image, created_at)
      VALUES (@first_name, @last_name, @email, @phone_number, @address, @profile_image, GETDATE())
    `);

  return result;
};



export const getAllEmployees = async () => {
    const pool = await ConnectMSSQL();
    const result = await pool.request().query(`
      SELECT id, first_name AS first_Name, last_name AS last_Name, email, phone_number AS phone_Number, address, profile_image AS profile_Image
      FROM Employees
      WHERE is_deleted = 0 OR is_deleted IS NULL
      ORDER BY id DESC
    `);
    return result.recordset;
  };
  

  export const updateEmployeeById = async (id, data) => {
    const pool = await ConnectMSSQL();
    const request = pool.request();
  
    request
      .input('id', id)
      .input('first_name', data.first_Name)
      .input('last_name', data.last_Name)
      .input('email', data.email)
      .input('phone_number', data.phone_Number)
      .input('address', data.address)
      .input('updated_at', new Date());
  
    let query = `
      UPDATE Employees SET 
        first_name = @first_name,
        last_name = @last_name,
        email = @email,
        phone_number = @phone_number,
        address = @address,
        updated_at = @updated_at
    `;
  
    if (data.profile_Image) {
      request.input('profile_image', data.profile_Image);
      query += `, profile_image = @profile_image`;
    }
  
    query += ` WHERE id = @id`;
  
    await request.query(query);
  };
  
  export const softDeleteEmployee = async (id) => {
    const pool = await ConnectMSSQL();
    await pool.request()
      .input('id', id)
      .input('updated_at', new Date())
      .query(`
        UPDATE Employees 
        SET is_deleted = 1, updated_at = @updated_at
        WHERE id = @id
      `);
  };
  