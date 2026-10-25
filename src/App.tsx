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
import { LlmOverviewPage } from '@/pages/LlmOverviewPage'
import { LlmPlaygroundPage } from '@/pages/LlmPlaygroundPage'
import { LlmDocsPage } from '@/pages/LlmDocsPage'
import { GmapsOverviewPage } from '@/pages/GmapsOverviewPage'
import { GmapsPlaygroundPage } from '@/pages/GmapsPlaygroundPage'
import { GmapsDocsPage } from '@/pages/GmapsDocsPage'
import { ServiceCatalogProvider } from '@/lib/services'

export function App() {
  return (
    <AuthProvider>
      <ServiceCatalogProvider>
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
          <Route
            path="/products/llm"
            element={
              <ProtectedRoute>
                <LlmOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/llm/playground"
            element={
              <ProtectedRoute>
                <LlmPlaygroundPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/llm/docs"
            element={
              <ProtectedRoute>
                <LlmDocsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/gmaps"
            element={
              <ProtectedRoute>
                <GmapsOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/gmaps/playground"
            element={
              <ProtectedRoute>
                <GmapsPlaygroundPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/gmaps/docs"
            element={
              <ProtectedRoute>
                <GmapsDocsPage />
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
                  <span className="rounded-full bg-green/10 border border-green/30 px-3 py-1 font-mono text-xs text-green font-semibold">
                    404 · Page Not Found
                  </span>
                  <h2 className="mt-4 text-3xl font-extrabold text-white">Lost in Space</h2>
                  <p className="mt-2 text-sm text-slate max-w-sm">
                    The requested page does not exist in the Studio ecosystem.
                  </p>
                  <Link
                    to="/"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green px-6 py-3 text-xs font-semibold text-ink hover:bg-green/90 transition-all shadow-md active:scale-95"
                  >
                    Return to Studio Home →
                  </Link>
                </div>
              </Shell>
            }
          />
        </Routes>
      </BrowserRouter>
      </ServiceCatalogProvider>
    </AuthProvider>
  )
}
