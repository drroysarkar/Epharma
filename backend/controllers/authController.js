import jwt from 'jsonwebtoken';
import { sql, ConnectMSSQL } from '../config/db.js';

export const loginUser = async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const pool = await ConnectMSSQL();

    const result = await pool.request()
      .input('mobile', sql.VarChar, mobile)
      .query('SELECT * FROM pharmacy_profile WHERE mobile = @mobile');

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user.id, mobile: user.mobile },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, mobile: user.mobile }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};