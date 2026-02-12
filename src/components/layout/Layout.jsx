import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../common/Navbar";


export default function Layout({ isAuth }) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <>
      {isAuth && !isLogin && <Navbar />}
      <Outlet />
    </>
  );
}
