import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'
import { RequireAuth } from './auth/RequireAuth'
import LoginPage from './pages/LoginPage'
import ObjectsPage from './pages/ObjectsPage'
import ObjectPage from './pages/ObjectPage'
import TaskPage from './pages/TaskPage'
import MyTasksPage from './pages/MyTasksPage'
import NewTaskPage from './pages/NewTaskPage'
import NewObjectPage from './pages/NewObjectPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/objects" replace /> },
      { path: 'objects', element: <ObjectsPage /> },
      {
        path: 'objects/new',
        element: (
          <RequireAuth role="provider">
            <NewObjectPage />
          </RequireAuth>
        ),
      },
      { path: 'objects/:objectId', element: <ObjectPage /> },
      {
        path: 'objects/:objectId/tasks/new',
        element: (
          <RequireAuth role="provider">
            <NewTaskPage />
          </RequireAuth>
        ),
      },
      { path: 'tasks/:taskId', element: <TaskPage /> },
      {
        path: 'my-tasks',
        element: (
          <RequireAuth role="executor">
            <MyTasksPage />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
