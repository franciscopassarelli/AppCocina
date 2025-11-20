const express = require("express");
const router = express.Router();
const Historial = require("../models/Historial");

router.get("/", async (req, res) => {
  try {
    const registros = await Historial.find().sort({ fecha: -1 });
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const nuevoRegistro = new Historial(req.body);
    await nuevoRegistro.save();
    res.status(201).json(nuevoRegistro);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
