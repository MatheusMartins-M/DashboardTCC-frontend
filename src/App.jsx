import { BrowserRouter } from "react-router-dom";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import { AppRoutes } from "./routes/AppRoutes";
import { clearAuth } from "./services/authStorage";
import "./styles/Sidebar.css";
import "./styles/App.css";

function clearAuthOnBuildChange() {
  const stored = sessionStorage.getItem("appBuildId");
  const current = __APP_BUILD_ID__;

  if (stored !== current) {
    clearAuth();
    sessionStorage.setItem("appBuildId", current);
  }
}

clearAuthOnBuildChange();

function App() {
  return (
    <BrowserRouter>
      <ConfirmDialogProvider>
        <AppRoutes />
      </ConfirmDialogProvider>
    </BrowserRouter>
  );
}

export default App;
