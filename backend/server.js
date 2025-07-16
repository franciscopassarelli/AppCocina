const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 🔁 Middleware ANTES de las rutas
app.use(cors());
app.use(express.json());

// ✅ Conexión a MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 🛣️ Rutas
const productoRoutes = require("./routes/productos");
const historialRoutes = require("./routes/historial");
// 🟢 Middleware para manejar rutas de productos y historial
const historial = require("./models/Historial");
const Producto = require("./models/Producto");



app.use("/api/productos", productoRoutes);
app.use("/api/historial", historialRoutes);

// 🚀 Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
