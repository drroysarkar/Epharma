import { insertEmployee , getAllEmployees, softDeleteEmployee, updateEmployeeById } from '../services/employeeService.js';

export const addEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, address } = req.body;
    const profileImage = req.file ? req.file.path.replace(/\\/g, '/') : null;

    const result = await insertEmployee({
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      profileImage,
    });

    res.status(201).json({ message: 'Employee added successfully', result });
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const fetchEmployees = async (req, res) => {
    try {
      const employees = await getAllEmployees();
      res.json({ success: true, employees });
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ success: false, message: "Failed to fetch employees" });
    }
  };


  export const updateEmployee = async (req, res) => {
    try {
      const { id } = req.params;
      const { first_Name, last_Name, email, phone_Number, address } = req.body;
      const profile_Image = req.file ? req.file.path.replace(/\\/g, '/') : null;
  
      const updatedData = {
        first_Name,
        last_Name,
        email,
        phone_Number,
        address,
        profile_Image,
      };
  
      await updateEmployeeById(id, updatedData);
      res.json({ success: true, message: 'Employee updated successfully' });
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ success: false, message: 'Failed to update employee' });
    }
  };
  
  export const deleteEmployee = async (req, res) => {
    try {
      const { id } = req.params;
      await softDeleteEmployee(id);
      res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ success: false, message: 'Failed to delete employee' });
    }
  };