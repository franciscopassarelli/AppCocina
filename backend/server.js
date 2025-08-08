const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 🔁 Middleware ANTES de las rutas
const allowedOrigins = [
  "http://localhost:5173", // frontend local
  "https://app-cocina.vercel.app", // frontend en producción
];

app.use(cors({ 
  origin: allowedOrigins
}));

app.use(express.json());

// ✅ Conexión a MongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 👉 Ruta de test para verificar funcionamiento
app.get("/api", (req, res) => {
  res.send("✅ API funcionando correctamente");
});

// 🛣️ Rutas
const productoRoutes = require("./routes/productos");
const historialRoutes = require("./routes/historial");
const recipesRouter = require('./routes/recipes');
const productionRunsRouter = require('./routes/productionRuns');

app.use('/api/recipes', recipesRouter);
app.use('/api/production-runs', productionRunsRouter);

app.use("/api/productos", productoRoutes);
app.use("/api/historial", historialRoutes);

// 🚀 Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
