import React, { useState } from "react";
import { Container, Navbar, NavItem, Nav } from "react-bootstrap"
import { Link } from "react-router-dom";
import { GiElectric } from "react-icons/gi"

{/* <li>
<Link to="/">Home/Running Trades</Link>
</li>
<li>
<Link to="/create-trade">Create Trade</Link>
</li>
<li>
<Link to="/my-opened-trades">My Opened Trades</Link>
</li>
<li>
<Link to="/view-all-closed-trades">View All Closed Trades</Link>
</li> */}

const CustomNavbar = ({ isAdmin }) => {
    const [active, setActive] = useState('/');
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="#home"><h4><GiElectric /> Energy Trading on Blockchain</h4></Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto" activeKey={active} onSelect={(selectedKey) => setActive(selectedKey)}>
            <NavItem>
                  <Nav.Link as={Link} to="/" eventKey="/">Home/Running Trades</Nav.Link>
            </NavItem>
            <NavItem>
                  <Nav.Link as={Link} to="/create-trade" eventKey="/create-trade">Create Trade</Nav.Link>
            </NavItem>
            <NavItem>
                  <Nav.Link as={Link} to="/my-opened-trades" eventKey="/my-opened-trades">My Opened Trades</Nav.Link>
            </NavItem>
            <NavItem>
                  <Nav.Link as={Link} to="/view-all-closed-trades" eventKey="/view-all-closed-trades" >View All Closed Trades</Nav.Link>
            </NavItem>
            {
              isAdmin &&
                <NavItem>
                  <Nav.Link as={Link} to="/resolve-conflicts" eventKey="/resolve-conflicts" >Resolve Conflicts</Nav.Link>
                </NavItem>
            }
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default CustomNavbar