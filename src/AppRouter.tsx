import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/toaster";
import { ScrollToTop } from "./components/ScrollToTop";
import { SessionMonitor } from "./components/SessionMonitor";
import { URLFragmentHandler } from "./components/URLFragmentHandler";
import { VersionCheck } from "./components/VersionCheck";
import { CommandPalette } from "./components/CommandPalette";

import Index from "./pages/Index";
import Clone from "./pages/Clone";
import Settings from "./pages/Settings";
import Preferences from "./pages/Preferences";
import AISettings from "./pages/AISettings";
import GitSettings from "./pages/GitSettings";
import DeploySettings from "./pages/DeploySettings";
import SystemSettings from "./pages/SystemSettings";
import StorageSettings from "./pages/StorageSettings";
import AboutSettings from "./pages/AboutSettings";

import GitHubOAuth from "./pages/GitHubOAuth";
import NetlifyOAuth from "./pages/NetlifyOAuth";
import VercelOAuth from "./pages/VercelOAuth";
import OpenRouterOAuth from "./pages/OpenRouterOAuth";
import RemoteLoginSuccess from "./pages/RemoteLoginSuccess";
import NotFound from "./pages/NotFound";
import { ProjectView } from "./pages/ProjectView";
import { SettingsLayout } from "./components/SettingsLayout";
import { ChangelogPage } from "./pages/ChangelogPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster />
      <VersionCheck />
      <ScrollToTop />
      <SessionMonitor />
      <URLFragmentHandler />
      <CommandPalette />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/clone" element={<Clone />} />
        <Route path="/oauth/github" element={<GitHubOAuth />} />
        <Route path="/oauth/netlify" element={<NetlifyOAuth />} />
        <Route path="/oauth/vercel" element={<VercelOAuth />} />
        <Route path="/oauth/openrouter" element={<OpenRouterOAuth />} />
        <Route path="/remoteloginsuccess" element={<RemoteLoginSuccess />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Settings />} />
          <Route path="preferences" element={<Preferences />} />
          <Route path="ai" element={<AISettings />} />
          <Route path="git" element={<GitSettings />} />
          <Route path="deploy" element={<DeploySettings />} />
          <Route path="system" element={<SystemSettings />} />
          <Route path="storage" element={<StorageSettings />} />
          <Route path="about" element={<AboutSettings />} />
        </Route>
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/project/:projectId" element={<ProjectView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
