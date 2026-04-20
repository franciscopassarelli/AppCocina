import React from "react";
import { useProductos } from "../../context/ProductoContext";
import ProductionRunsList from "../production/ProductionRunsList";
export default function ProductosProducidos() {
  const { productos } = useProductos();

  const productosProducidos = productos.filter(
    (p) => p.tipo === "producido"
  );

  return (
    <div>
      <h4 className="mb-3">Productos producidos</h4>

      

      {productosProducidos.map((producto) => (
        <div key={producto._id} className="card mb-3 p-3">

          <div className="d-flex justify-content-between">
            <div>
              <strong>{producto.nombre}</strong>
              <div className="text-muted">
                Stock: {producto.stock} {producto.unidad}
              </div>
            </div>

            <button className="btn btn-warning btn-sm">
              Consumir
            </button>

          </div>

          {producto.lotes?.length > 0 && (
            <div className="mt-2 small">

              {producto.lotes.map((lote, i) => (
                <div key={i} className="border-top pt-1">

                  Lote: {lote.lote}  
                  | Disponible: {lote.cantidadDisponible}  
                  | Vencimiento: {lote.fechaVencimiento
                    ? new Date(lote.fechaVencimiento).toLocaleDateString()
                    : "No aplica"}

                </div>
              ))}

            </div>
          )}

        </div>

      ))}

      <ProductionRunsList/>

    </div>
  );
}