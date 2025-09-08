import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getDepartamentos, createDepartamento, updateDepartamento, deleteDepartamento } from "../api/departamentos";

const Ctx = createContext(null);

export function DepartamentosProvider({ children }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDepartamentos();
      setDepartamentos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (displayName) => { const d = await createDepartamento(displayName); setDepartamentos(prev => [...prev, d].sort((a,b)=>a.displayName.localeCompare(b.displayName))); return d; };
  const rename = async (id, displayName) => { const d = await updateDepartamento(id, displayName); setDepartamentos(prev => prev.map(x => x._id === id ? d : x)); return d; };
  const remove = async (id) => { await deleteDepartamento(id); setDepartamentos(prev => prev.filter(x => x._id !== id)); };

  return (
    <Ctx.Provider value={{ departamentos, loading, refresh, add, rename, remove }}>
      {children}
    </Ctx.Provider>
  );
}

export const useDepartamentos = () => useContext(Ctx);
