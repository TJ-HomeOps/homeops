import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import OperationsCenter from '@/pages/OperationsCenter';
import Assets from '@/pages/Assets';
import AssetDetail from '@/pages/AssetDetail';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import DocumentationList from '@/pages/DocumentationList';
import DocumentationDetail from '@/pages/DocumentationDetail';
import RunbookList from '@/pages/RunbookList';
import RunbookDetail from '@/pages/RunbookDetail';
import Monitoring from '@/pages/Monitoring';
import SettingsPage from '@/pages/SettingsPage';
import Providers from '@/pages/Providers';
import Nodes from '@/pages/Nodes';
import Topology from '@/pages/Topology';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Loading HomeOps...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<OperationsCenter />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/documentation" element={<DocumentationList />} />
          <Route path="/documentation/:id" element={<DocumentationDetail />} />
          <Route path="/runbooks" element={<RunbookList />} />
          <Route path="/runbooks/:id" element={<RunbookDetail />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/topology" element={<Topology />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App