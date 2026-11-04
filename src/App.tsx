import { NavLink, Outlet } from 'react-router-dom'
import './App.css'

// Общий каркас для страниц после входа
export default function App() {
  return (
    <>
      <nav className="nav">
        <NavLink to="/objects">Объекты</NavLink>
        <NavLink to="/my-tasks">Мои задачи</NavLink>
        <NavLink to="/login" className="nav-exit">
          Выйти
        </NavLink>
      </nav>
      <Outlet />
    </>
  )
}
