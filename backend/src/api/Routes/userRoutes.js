import express from 'express';
import { safeExecute } from "../../../db/config.js";
import { verifyAuthToken } from "../../middleware/authentication.js"; 

const router = express.Router();

router.put('/profile', verifyAuthToken, async (req, res) => {
  const { first_name, last_name, email } = req.body;
  
  const userId = req.user.id; 

  try {
    const query = `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?`;
    await safeExecute(query, [first_name, last_name, email, userId]);

    return res.status(200).json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "This email is already in use by another account." });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;