import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createCompany,
  getCompanies,
  getCompanyById,
} from "../controllers/companyController.js";

const router = express.Router();

router.post("/", authMiddleware, createCompany);

router.get("/", authMiddleware, getCompanies);

router.get("/:id", authMiddleware, getCompanyById);

export default router;