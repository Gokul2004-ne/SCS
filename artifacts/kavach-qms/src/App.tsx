import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { StoreProvider } from '@/lib/store';
import { Shell } from '@/components/layout';
import Overview from '@/pages/overview';
import Audits from '@/pages/audits';
import Findings from '@/pages/findings';
import FindingDetail from '@/pages/finding-detail';
import CorrectiveActions from '@/pages/corrective-actions';
import EvidencePage from '@/pages/evidence';
import Frameworks from '@/pages/frameworks';
import Governance from '@/pages/governance';
import Architecture from '@/pages/architecture';
import SettingsPage from '@/pages/settings';
import Landing from '@/pages/landing';
import Login from '@/pages/login';
import KnowledgeRepo from '@/pages/knowledge-repo';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login">{() => <Login />}</Route>
      <Route path="/login/auditor">{() => <Login persona="auditor" />}</Route>
      <Route path="/login/auditee">{() => <Login persona="auditee" />}</Route>
      <Route component={AppRoutes} />
    </Switch>
  );
}

function AppRoutes() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/dashboard" component={Overview} />
          <Route path="/audits" component={Audits} />
          <Route path="/findings" component={Findings} />
          <Route path="/findings/:id" component={FindingDetail} />
          <Route path="/corrective-actions" component={CorrectiveActions} />
          <Route path="/corrective-actions/:id" component={CorrectiveActions} />
          <Route path="/evidence" component={EvidencePage} />
          <Route path="/frameworks" component={Frameworks} />
          <Route path="/governance" component={Governance} />
          <Route path="/architecture" component={Architecture} />
          <Route path="/knowledge-repo" component={KnowledgeRepo} />
          <Route path="/framework-map" component={KnowledgeRepo} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StoreProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </StoreProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
