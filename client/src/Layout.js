import React from "react";
import { Outlet } from "react-router-dom";
import CustomNavbar from "./components/CustomNavbar";

const Layout = ({ isAdmin }) => {
  return (
    <>
      <CustomNavbar isAdmin={isAdmin} />
      <Outlet />
    </>
  )
};

export default Layout;