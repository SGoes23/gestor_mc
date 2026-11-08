import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './context/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { DefaultersPage } from './pages/DefaultersPage'
import { AttendancesPage } from './pages/AttendancesPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { EventsPage } from './pages/EventsPage'
import { LoginPage } from './pages/LoginPage'
import { MemberDetailPage } from './pages/MemberDetailPage'
import { MembersPage } from './pages/MembersPage'
import { MonthlyFeesPage } from './pages/MonthlyFeesPage'

function ProtectedLayout() {
  const { session } = useAuth()
  return session ? <AppShell /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="membros" element={<MembersPage />} />
        <Route path="membros/:id" element={<MemberDetailPage />} />
        <Route path="eventos" element={<EventsPage />} />
        <Route path="eventos/:id" element={<EventDetailPage />} />
        <Route path="presencas" element={<AttendancesPage />} />
        <Route path="mensalidades" element={<MonthlyFeesPage />} />
        <Route path="inadimplentes" element={<DefaultersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
