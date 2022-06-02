import React from "react";
import { Outlet } from "react-router-dom";
import CustomNavbar from "./components/CustomNavbar";

const Layout = ({ isAdmin, logout }) => {
  return (
    <div style={{ backgroundColor: "gainsboro" }}>
      <CustomNavbar isAdmin={isAdmin} logout={logout} />
      <Outlet />
    </div>
  )
};

export default Layout;