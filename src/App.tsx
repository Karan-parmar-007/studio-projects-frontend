import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import { AuthProvider } from '@/components/Auth'
import { Shell } from '@/components/Shell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { KeyPage } from '@/pages/KeyPage'
import { AdminPage } from '@/pages/AdminPage'
import { WhisperOverviewPage } from '@/pages/WhisperOverviewPage'
import { WhisperDocsPage } from '@/pages/WhisperDocsPage'
import { WhisperPlaygroundPage } from '@/pages/WhisperPlaygroundPage'
import { WhisperDownloadPage } from '@/pages/WhisperDownloadPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Home Page */}
          <Route
            path="/"
            element={
              <Shell>
                <HomePage />
              </Shell>
            }
          />

          {/* Protected Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Product: WhisperFlow (Standard /products path) */}
          <Route
            path="/products/whisperflow"
            element={
              <ProtectedRoute>
                <WhisperOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/whisperflow/docs"
            element={
              <ProtectedRoute>
                <WhisperDocsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/whisperflow/playground"
            element={
              <ProtectedRoute>
                <WhisperPlaygroundPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/whisperflow/download"
            element={
              <ProtectedRoute>
                <WhisperDownloadPage />
              </ProtectedRoute>
            }
          />

          {/* Backwards-compatible aliases for /whisperflow-clone */}
          <Route
            path="/whisperflow-clone"
            element={
              <ProtectedRoute>
                <WhisperOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whisperflow-clone/docs"
            element={
              <ProtectedRoute>
                <WhisperDocsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whisperflow-clone/playground"
            element={
              <ProtectedRoute>
                <WhisperPlaygroundPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whisperflow-clone/download"
            element={
              <ProtectedRoute>
                <WhisperDownloadPage />
              </ProtectedRoute>
            }
          />

          {/* API Keys Section */}
          <Route
            path="/keys"
            element={
              <ProtectedRoute>
                <KeyPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Secrets Section */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:projectSlug"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <Shell>
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
                  <p className="font-mono text-sm text-green">404 · Page Not Found</p>
                  <p className="mt-2 text-sm text-slate">That page does not exist in Studio.</p>
                  <Link
                    to="/"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 font-mono text-xs font-semibold text-navy hover:bg-green/90"
                  >
                    Return to Studio Home →
                  </Link>
                </div>
              </Shell>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
