const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS
app.use(cors({
  origin: ["http://localhost:5173", "https://app-cocina.vercel.app"],
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(express.json());

// Mongo
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health
app.get("/api", (_req, res) => res.send("✅ API funcionando correctamente"));
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/meat-blend')) {
    console.log('→ meat-blend hit:', req.method, req.path);
  }
  next();
});
app.get('/api/meat-blend/health', (_req, res) => res.json({ ok: true }));

// Routers
const productoRoutes = require("./routes/productos");
const historialRoutes = require("./routes/historial");
const recipesRouter = require('./routes/recipes');
const productionRunsRouter = require('./routes/productionRuns');
const meatBlendRouter = require('./routes/meatBlend'); 
const proveedoresRouter = require('./routes/proveedores');
const departamentosRouter = require("./routes/departamentos");


// Montaje
app.use('/api/departamentos', departamentosRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/meat-blend', meatBlendRouter);     
app.use('/api/recipes', recipesRouter);
app.use('/api/production-runs', productionRunsRouter);
app.use("/api/productos", productoRoutes);
app.use("/api/historial", historialRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
