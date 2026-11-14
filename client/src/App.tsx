import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { RegisterParticipantPage } from './pages/RegisterParticipantPage';
import { TicketPage } from './pages/TicketPage';
import { MyTicketSearchPage } from './pages/MyTicketSearchPage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { CheckInPage } from './pages/CheckInPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { ManageEventPage } from './pages/ManageEventPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WaitlistPage } from './pages/WaitlistPage';
import { ExportPage } from './pages/ExportPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                {/* Public Discovery & Pass Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/events/:id/register" element={<RegisterParticipantPage />} />
                <Route path="/ticket/:id" element={<TicketPage />} />
                <Route path="/my-registration" element={<MyTicketSearchPage />} />
                <Route path="/my-ticket" element={<MyTicketSearchPage />} />

                {/* Participant Authenticated Hub */}
                <Route path="/my-registrations" element={<MyRegistrationsPage />} />

                {/* Check-In Gate Terminals */}
                <Route path="/check-in" element={<CheckInPage />} />
                <Route path="/staff/check-in" element={<CheckInPage />} />

                {/* Protected Organizer & Admin Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/create"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                      <CreateEventPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:id/manage"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                      <ManageEventPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:id/participants"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Check-in Staff', 'Admin']}>
                      <ParticipantsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/participants"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Check-in Staff', 'Admin']}>
                      <ParticipantsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:id/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/waitlist"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                      <WaitlistPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/export"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                      <ExportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={['Organizer', 'Check-in Staff', 'Admin']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
