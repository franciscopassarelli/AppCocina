import React, { useEffect, useState, useMemo } from "react";
import { useProductos } from "../../context/ProductoContext";
import FormularioProducto from "./FormularioProducto";
import ModalAddStock from "../admin/ModalAddStock";
import "../styles/ProductForm.css";
import AlertaStockModal from "../admin/AlertaStockModal";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useDepartamentos } from "../../context/DepartamentosContext";
import DepartmentsManagerModal from "./DepartmentsManagerModal";

const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

// ===== Umbrales de vencimiento =====
const DIAS_ALERTA = 10; // alerta (<= 10 días)
const DIAS_URGENTE = 5; // urgente (<= 5 días) -> lo resuelve el modal visualmente

export default function ProductForm() {
  const { productos, agregarProducto, actualizarProducto, eliminarProducto } = useProductos();
  const { departamentos } = useDepartamentos();

  const [noAplicaPeso, setNoAplicaPeso] = useState(false);
  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [pesoPromedio, setPesoPromedio] = useState("");
  const [stockCritico, setStockCritico] = useState("");
  const [productoEditando, setProductoEditando] = useState(null);
  const [departamento, setDepartamento] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [facturaRemito, setFacturaRemito] = useState("");

  const [productoParaStock, setProductoParaStock] = useState(null);
  const [lotesVisibles, setLotesVisibles] = useState({});
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("Todos");

  // 👇 Modal de alerta (igual que en CookPanel)
  const [mostrarAlertaStock, setMostrarAlertaStock] = useState(false);

  const [showDepModal, setShowDepModal] = useState(false);

  // ===== Helpers de fecha =====
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const daysUntil = (isoOrDate) => {
    if (!isoOrDate) return Infinity;
    const hoy = startOfDay(new Date());
    const fv = startOfDay(new Date(isoOrDate));
    return Math.ceil((fv - hoy) / (1000 * 60 * 60 * 24));
  };

  // ===== Alerta stock / vencimiento (como CookPanel) =====
  useEffect(() => {
    if (!Array.isArray(productos) || productos.length === 0) {
      setMostrarAlertaStock(false);
      return;
    }

    const hoy = startOfDay(new Date());

    const hayAlerta = productos.some((p) => {
      const stockNum = Number(p.stock) || 0;
      const crit = Number(p.stockCritico) || 0;

      // 1) Si no hay stock, no alerta de vencimiento (igual que en CookPanel)
      if (stockNum <= 0) return false;

      // 2) Stock crítico
      if (stockNum <= crit) return true;

      // 3) Lotes con stock disponible y vencimiento (vencidos o por vencer en <= 10 días)
      const lotes = Array.isArray(p.lotes) ? p.lotes : [];
      return lotes.some((l) => {
        const disp = Number(l.cantidadDisponible ?? l.cantidad ?? 0);
        if (disp <= 0) return false;
        if (!l.fechaVencimiento) return false;

        const fv = startOfDay(new Date(l.fechaVencimiento));
        const dias = Math.ceil((fv - hoy) / (1000 * 60 * 60 * 24));
        return dias <= DIAS_ALERTA; // incluye vencidos (dias < 0) y próximos a vencer
      });
    });

    setMostrarAlertaStock(hayAlerta);
  }, [productos]);

  // ===== Cargar datos al editar =====
  useEffect(() => {
    if (productoEditando) {
      setNombre(productoEditando.nombre || "");
      setStock(productoEditando.stock?.toString() || "");
      setUnidad(productoEditando.unidad || "kg");
      setPesoPromedio(productoEditando.pesoPromedio?.toString() || "");
      setDepartamento(productoEditando.departamento || "");
      setStockCritico(productoEditando.stockCritico?.toString() || "");
      setFacturaRemito(productoEditando.facturaRemito || "");

      const v = new Date(productoEditando.fechaVencimiento);
      if (!isNaN(v.getTime())) {
        const fechaLocal = new Date(v.getTime() + Math.abs(v.getTimezoneOffset() * 60000))
          .toISOString()
          .split("T")[0];
        setFechaVencimiento(fechaLocal);
      } else {
        setFechaVencimiento("");
      }
    } else {
      // si no hay edición, setear depto por defecto (si existe)
      if (!departamento) setDepartamento(departamentos[0]?.displayName || "");
    }
  }, [productoEditando, departamentos, departamento]);

  // ===== Limpiar form =====
  const limpiarFormulario = () => {
    setNombre("");
    setStock("");
    setUnidad("kg");
    setPesoPromedio("");
    setStockCritico("");
    setProductoEditando(null);
    setDepartamento(departamentos[0]?.displayName || "");
    setFechaVencimiento("");
    setFacturaRemito("");
  };

  // ===== Guardar producto =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !stock || !unidad || !stockCritico || !fechaVencimiento || !facturaRemito) return;
    if (unidad !== "unidad" && !noAplicaPeso && !pesoPromedio) return;

    const loteInicial = {
      lote: "Lote inicial",
      cantidad: parseFloat(stock),
      cantidadDisponible: parseFloat(stock),
      fechaVencimiento: new Date(fechaVencimiento + "T00:00:00").toISOString(),
      numeroFactura: facturaRemito,
      fechaIngreso: new Date().toISOString(),
    };

    const productoData = {
      nombre,
      stock: parseFloat(stock),
      unidad,
      pesoPromedio: pesoPromedio ? parseFloat(pesoPromedio) : 0,
      departamento,
      stockCritico: parseFloat(stockCritico),
      fechaVencimiento,
      facturaRemito,
      lotes: [loteInicial],
    };

    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando._id, productoData);
      } else {
        await agregarProducto(productoData);
      }
      limpiarFormulario();
    } catch (err) {
      console.error("Error al guardar producto:", err);
    }
  };

  // ===== Agregar stock (nuevo lote) =====
  const handleAgregarStock = async (productoId, nuevoLote) => {
    try {
      const producto = productos.find((p) => p._id === productoId);
      if (!producto) return;

      const nuevoStock = (Number(producto.stock) || 0) + (Number(nuevoLote.cantidad) || 0);
      const lotesActualizados = [...(producto.lotes || []), nuevoLote];

      await actualizarProducto(productoId, { ...producto, stock: nuevoStock, lotes: lotesActualizados });
      setProductoParaStock(null);
    } catch (err) {
      console.error("Error al agregar stock:", err);
    }
  };

  // ===== Borrar producto =====
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      if (productoEditando && productoEditando._id === id) limpiarFormulario();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  // ===== Borrar lote individual =====
  const handleEliminarLote = async (productoId, loteIndex) => {
    const producto = productos.find((p) => p._id === productoId);
    if (!producto) return;

    const lotes = Array.isArray(producto.lotes) ? [...producto.lotes] : [];
    const lote = lotes[loteIndex];
    if (!lote) return;

    const disponible = Number(lote.cantidadDisponible ?? lote.cantidad ?? 0);
    const mensaje =
      disponible > 0
        ? `Se descontarán ${nf2.format(disponible)} ${producto.unidad} del stock total. ¿Eliminar este lote?`
        : "Este lote ya está completamente usado. ¿Eliminarlo de todas formas?";

    if (!window.confirm(mensaje)) return;

    try {
      const nuevoStock = Math.max(0, Number(producto.stock || 0) - disponible);
      lotes.splice(loteIndex, 1);

      await actualizarProducto(productoId, { ...producto, stock: nuevoStock, lotes });
    } catch (e) {
      console.error("Error eliminando lote:", e);
      alert("No se pudo eliminar el lote.");
    }
  };

  const toggleLotes = (productoId) => {
    setLotesVisibles((prev) => ({ ...prev, [productoId]: !prev[productoId] }));
  };

  // ===== Filtro por departamento =====
  const productosFiltrados = useMemo(() => {
    return productos.filter(
      (p) => departamentoSeleccionado === "Todos" || p.departamento === departamentoSeleccionado
    );
  }, [productos, departamentoSeleccionado]);

  // ===== Agrupar por departamento =====
  const productosPorDepartamento = useMemo(() => {
    return productosFiltrados.reduce((acc, prod) => {
      const key = prod.departamento || "(sin departamento)";
      if (!acc[key]) acc[key] = [];
      acc[key].push(prod);
      return acc;
    }, {});
  }, [productosFiltrados]);

  return (
    <>
      {/* 🔔 Modal de alerta por stock crítico / vencimientos */}
      <AlertaStockModal
        productos={productos}
        visible={mostrarAlertaStock}
        onClose={() => setMostrarAlertaStock(false)}
      />

      {/* Formulario */}
      <FormularioProducto
        onSubmit={handleSubmit}
        nombre={nombre}
        stock={stock}
        unidad={unidad}
        pesoPromedio={pesoPromedio}
        stockCritico={stockCritico}
        departamento={departamento}
        fechaVencimiento={fechaVencimiento}
        facturaRemito={facturaRemito}
        productoEditando={productoEditando}
        setNombre={setNombre}
        setStock={setStock}
        setUnidad={setUnidad}
        setPesoPromedio={setPesoPromedio}
        setStockCritico={setStockCritico}
        setDepartamento={setDepartamento}
        setFechaVencimiento={setFechaVencimiento}
        setFacturaRemito={setFacturaRemito}
        limpiarFormulario={limpiarFormulario}
        noAplicaPeso={noAplicaPeso}
        setNoAplicaPeso={setNoAplicaPeso}
      />

      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <ModalAddStock
              show={!!productoParaStock}
              producto={productoParaStock}
              onAgregarStock={handleAgregarStock}
              onClose={() => setProductoParaStock(null)}
            />
          </div>
        </div>
      </div>

      {/* Encabezado + botón para gestionar departamentos */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="m-0">Productos agregados</h5>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowDepModal(true)}>
          <i className="bi bi-gear-wide-connected me-1" />
          Gestionar departamentos
        </button>
      </div>

      {/* Filtros por departamento */}
      <div className="mb-3">
        <button
          className={`btn btn-sm me-2 ${departamentoSeleccionado === "Todos" ? "btn-dark" : "btn-outline-dark"}`}
          onClick={() => setDepartamentoSeleccionado("Todos")}
        >
          Todos
        </button>
        {departamentos.map((d) => (
          <button
            key={d._id}
            className={`btn btn-sm me-2 ${departamentoSeleccionado === d.displayName ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setDepartamentoSeleccionado(d.displayName)}
          >
            {d.displayName}
          </button>
        ))}
      </div>

      {/* Listado de productos agrupados por departamento */}
      {productos.length === 0 ? (
        <p>No hay productos aún.</p>
      ) : (
        <ul className="list-group">
          {Object.entries(productosPorDepartamento).map(([depto, productosDepto]) => (
            <div key={depto} className="mb-4">
              <h5 className="bg-light p-2 border rounded">{depto}</h5>
              <ul className="list-group">
                {productosDepto.map((prod) => (
                  <li key={prod._id} className="list-group-item d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="producto-info p-2 rounded bg-light-subtle">
                        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                          <span className="badge badge-nombre">{prod.nombre}</span>
                          <span className="badge badge-stock">
                            {nf2.format(Number(prod.stock || 0))} {prod.unidad}
                          </span>
                          {prod.unidad !== "unidad" && (
                            <span className="badge badge-peso">
                              {prod.pesoPromedio
                                ? `${nf2.format(Number(prod.pesoPromedio))} ${prod.unidad === "l" ? "ml" : "g"} (unidad)`
                                : "-"}
                            </span>
                          )}
                          {typeof prod.stockCritico !== "undefined" && (
                            <span className="badge badge-critico">
                              Crítico: {nf2.format(Number(prod.stockCritico || 0))}
                            </span>
                          )}
                        </div>

                        <div className="text-muted small mb-1">
                          <strong>Venc.:</strong>{" "}
                          {prod.fechaVencimiento
                            ? new Date(prod.fechaVencimiento).toLocaleDateString("es-AR")
                            : "Sin fecha"}
                        </div>

                        <div className="text-muted small mb-1">
                          <strong>Creado:</strong>{" "}
                          {prod.fechaCreacion ? new Date(prod.fechaCreacion).toLocaleDateString("es-AR") : "—"} —{" "}
                          <strong>Actualizado:</strong>{" "}
                          {prod.fechaActualizacion ? new Date(prod.fechaActualizacion).toLocaleDateString("es-AR") : "—"}
                        </div>

                        <div className="text-muted small">
                          <strong>Factura/Remito:</strong> {prod.facturaRemito || "N/A"}
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button className="button-red-sm" onClick={() => handleEliminar(prod._id)}>
                          <i className="bi bi-trash3 me-1"></i> Borrar
                        </button>

                        <button className="button-green-sm" onClick={() => setProductoParaStock(prod)}>
                          <i className="bi bi-plus-circle me-1"></i> Agregar Lote
                        </button>
                      </div>
                    </div>

                    {/* ▼▼▼ Lotes ▼▼▼ */}
                    {prod.lotes && prod.lotes.length > 0 && (
                      <>
                        <button
                          className="btn btn-link btn-sm mt-2"
                          onClick={() => toggleLotes(prod._id)}
                          type="button"
                        >
                          {lotesVisibles[prod._id] ? "Ocultar lotes ▲" : "Ver lotes ▼"}
                        </button>

                        {lotesVisibles[prod._id] && (
                          <div className="mt-2">
                            <h6 className="text-muted mb-1">Lotes registrados:</h6>
                            <div className="table-responsive">
                              <table className="table table-sm table-bordered align-middle">
                                <thead>
                                  <tr>
                                    <th>Factura/Remito</th>
                                    <th>CANTIDAD DE FACTURA/REMITO</th>
                                    <th>CANTIDAD QUE SE CONTO</th>
                                    <th>Vencimiento</th>
                                    <th>Ingreso</th>
                                    <th>Estado</th>
                                    <th style={{ width: 80 }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prod.lotes.map((lote, idx) => {
                                    const cantidadTotal = Number(lote.cantidad || 0);
                                    const cantidadDisponible = Number(lote.cantidadDisponible ?? lote.cantidad ?? 0);

                                    let estado = "Disponible";
                                    let estadoClase = "text-success";
                                    if (cantidadDisponible === 0) {
                                      estado = "Usado";
                                      estadoClase = "text-danger";
                                    } else if (cantidadDisponible < cantidadTotal) {
                                      estado = "Parcial";
                                      estadoClase = "text-warning";
                                    }

                                    return (
                                      <tr key={`${prod._id}-lote-${idx}`}>
                                        <td>{lote.numeroFactura || "—"}</td>
                                        <td>{nf2.format(cantidadTotal)}</td>
                                        <td>{lote.lote || "—"}</td>
                                        <td>
                                          {lote.fechaVencimiento
                                            ? new Date(lote.fechaVencimiento).toLocaleDateString("es-AR")
                                            : "—"}
                                        </td>
                                        <td>
                                          {lote.fechaIngreso
                                            ? new Date(lote.fechaIngreso).toLocaleDateString("es-AR")
                                            : "—"}
                                        </td>
                                        <td className={estadoClase}>{estado}</td>
                                        <td className="text-end">
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            title="Eliminar lote"
                                            onClick={() => handleEliminarLote(prod._id, idx)}
                                          >
                                            <i className="bi bi-trash" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </ul>
      )}

      {/* Modal de gestión de departamentos */}
      <DepartmentsManagerModal show={showDepModal} onClose={() => setShowDepModal(false)} />
    </>
  );
}
