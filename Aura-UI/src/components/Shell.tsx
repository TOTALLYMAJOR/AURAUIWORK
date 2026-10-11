import { NavLink, Outlet } from "react-router-dom";
import { CalendarCheck, LayoutDashboard, UtensilsCrossed } from "lucide-react";

const links = [
  { to: "/", label: "Command", icon: LayoutDashboard, end: true },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed, end: false },
  { to: "/reservations", label: "Bookings", icon: CalendarCheck, end: false },
];

export default function Shell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">QP</span>
          <div>
            <strong>QuietPilot</strong>
            <em>ZZZZ catering</em>
          </div>
        </div>
        <nav className="side-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? "active" : "")}>
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="operator-card">
          <span className="avatar">MC</span>
          <div>
            <strong>Maya Chen</strong>
            <em>Owner · Harbor kitchen</em>
          </div>
        </div>
      </aside>
      <Outlet />
    </div>
  );
}
