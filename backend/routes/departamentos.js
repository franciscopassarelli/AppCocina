const express = require("express");
const router = express.Router();
const Departamento = require("../models/Departamento");


router.get("/", async (_req, res) => {
  const list = await Departamento.find().sort({ displayName: 1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName?.trim()) return res.status(400).json({ error: "displayName requerido" });
    const nombre = displayName.trim().toLowerCase();
    const existing = await Departamento.findOne({ nombre });
    if (existing) return res.status(409).json({ error: "Ya existe un departamento con ese nombre" });
    const dep = await Departamento.create({ displayName });
    res.status(201).json(dep);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName?.trim()) return res.status(400).json({ error: "displayName requerido" });
    const nombre = displayName.trim().toLowerCase();

    const collision = await Departamento.findOne({ nombre, _id: { $ne: req.params.id } });
    if (collision) return res.status(409).json({ error: "Ya existe un departamento con ese nombre" });

    const updated = await Departamento.findByIdAndUpdate(
      req.params.id,
      { displayName, nombre },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Departamento no encontrado" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    // const Producto = require("../models/Producto");
    // const enUso = await Producto.exists({ departamento: updated.displayName });
    // if (enUso) return res.status(400).json({ error: "No se puede borrar: hay productos en este departamento" });

    const deleted = await Departamento.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Departamento no encontrado" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
