
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex gap-4">
      <Link to="/" className="font-bold">🏍️ Bike Rental</Link>
      <Link to="/booking">Booking</Link>
      <Link to="/upload">Upload</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  );
}
