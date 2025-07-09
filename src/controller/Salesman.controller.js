const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const MarketingManager = require('../models/MarketingManager.model');
const Salesman = require('../models/Salesman.model');

// =============================================================================================
// 📥 Register Salesman
// =============================================================================================
const registerSalesman = async (req, res) => {
  try {
    const {
      name,
      mobileNumber,
      email,
      ifscCode,
      bankAccountNumber,
      bankName,          // ✅ newly added
      password,
      managerMobile,
      managerName
    } = req.body;

    const agentCode = `AG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const salesmanData = {
      name,
      mobileNumber,
      email,
      ifscCode,
      bankAccountNumber,
      bankName,          // ✅ added to data
      password: hashedPassword,
      agentCode: [agentCode] // storing as array
    };

    let assignedManager = null;

    // 🔗 Link manager if both mobile and name are provided
    if (managerMobile && managerName) {
      const mgr = await MarketingManager.findOne({
        mobileNumber: managerMobile,
        name: managerName,
        isApproved: true
      });

      if (mgr) {
        salesmanData.manager = mgr._id;
        assignedManager = mgr;
      }
    }

    // 💾 Save salesman
    const newSalesman = new Salesman(salesmanData);
    await newSalesman.save();

    // 📎 If manager assigned, push this salesman to their assignedSalesmen list
    if (assignedManager) {
      assignedManager.assignedSalesmen.push(newSalesman._id);
      await assignedManager.save();
    }

    const token = jwt.sign({ id: newSalesman._id, role: 'salesman' }, process.env.JWT_SECRET, { expiresIn: '8h' });

    const salesmanResponse = newSalesman.toObject();
    delete salesmanResponse.password;

    res.status(201).json({
      message: 'Registered. Await admin approval.',
      token,
      salesman: salesmanResponse
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// =============================================================================================
// 🔐 Login Salesman
// =============================================================================================
const loginSalesman = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    const salesman = await Salesman.findOne({ mobileNumber });
    if (!salesman || !salesman.isApproved)
      return res.status(401).json({ message: 'Unauthorized' });

    const isMatch = await bcrypt.compare(password, salesman.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: salesman._id, role: 'salesman' }, process.env.JWT_SECRET, { expiresIn: '8h' });

    const salesmanResponse = salesman.toObject();
    delete salesmanResponse.password;

    res.json({
      message: 'Login successful',
      token,
      salesman: salesmanResponse
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  registerSalesman,
  loginSalesman
};
