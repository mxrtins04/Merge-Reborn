import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Modular screens
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import GitHubConnectScreen from './screens/GitHubConnectScreen';
import GeminiTokenSetupScreen from './screens/GeminiTokenSetupScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import CadetWorkspaceScreen from './screens/CadetWorkspaceScreen';
import BuildWorkspaceScreen from './screens/BuildWorkspaceScreen';
import BuildComprehensionScreen from './screens/BuildComprehensionScreen';
import StagePromotionScreen from './screens/StagePromotionScreen';
import EngineeringIdentityScreen from './screens/EngineeringIdentityScreen';
import SessionStartScreen from './screens/SessionStartScreen';
import DrillResultScreen from './screens/DrillResultScreen';
import PeerReviewScreen from './screens/PeerReviewScreen';
import DashboardScreen from './screens/DashboardScreen';
import CadetCurriculumScreen from './screens/CadetCurriculumScreen';

import AppNodeBackground from './components/AppNodeBackground';
import { Outlet } from 'react-router-dom';

function AppLayout() {
  return (
    <div className="relative min-h-screen bg-[#0F1117] app-layout-wrapper">
      <AppNodeBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  const initialRoute = "/register";

  return (
    <Router>
      <Routes>
        {/* Auth routes (no app node background overlay) */}
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />

        {/* Application workspace routes (with AppNodeBackground) */}
        <Route element={<AppLayout />}>
          <Route path="/connect/github" element={<GitHubConnectScreen />} />
          <Route path="/setup/gemini" element={<GeminiTokenSetupScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/workspace" element={<CadetWorkspaceScreen />} />
          <Route path="/build-workspace" element={<BuildWorkspaceScreen />} />
          <Route path="/build-comprehension/:id" element={<BuildComprehensionScreen />} />
          <Route path="/promote" element={<StagePromotionScreen />} />
          <Route path="/identity" element={<EngineeringIdentityScreen />} />
          <Route path="/session/start" element={<SessionStartScreen />} />
          <Route path="/drill-result/:id" element={<DrillResultScreen />} />
          <Route path="/peer-review" element={<PeerReviewScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/curriculum" element={<CadetCurriculumScreen />} />
        </Route>

        <Route path="*" element={<Navigate to={initialRoute} replace />} />
      </Routes>
    </Router>
  );
}







