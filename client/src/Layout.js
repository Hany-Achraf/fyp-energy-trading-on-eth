import React from "react";
import { Outlet } from "react-router-dom";
import CustomNavbar from "./components/CustomNavbar";

const Layout = ({ isAdmin, logout }) => {
  return (
    <>
      <CustomNavbar isAdmin={isAdmin} logout={logout} />
      <Outlet />
    </>
  )
};

export default Layout;