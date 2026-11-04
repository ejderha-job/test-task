import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'
import LoginPage from './pages/LoginPage'
import ObjectsPage from './pages/ObjectsPage'
import ObjectPage from './pages/ObjectPage'
import TaskPage from './pages/TaskPage'
import MyTasksPage from './pages/MyTasksPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/objects" replace /> },
      { path: 'objects', element: <ObjectsPage /> },
      { path: 'objects/:objectId', element: <ObjectPage /> },
      { path: 'tasks/:taskId', element: <TaskPage /> },
      { path: 'my-tasks', element: <MyTasksPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
