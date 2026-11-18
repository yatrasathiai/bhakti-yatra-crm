import { useEffect, useState } from "react";
import Chatbot from "./components/Chatbot";
import CrmDashboard from "./components/CrmDashboard";
import PinLock from "./components/PinLock";

function checkIsAdmin() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === "/admin" || path.startsWith("/admin/") || hash === "#admin";
}

export default function App() {
  const [route, setRoute] = useState(checkIsAdmin() ? "admin" : "home");
  const [isAuth, setIsAuth] = useState(
    () => sessionStorage.getItem("yatra_crm_auth") === "true"
  );

  // Sync with browser URL changes (pathname or hash)
  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(checkIsAdmin() ? "admin" : "home");
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, "", "/");
    setRoute("home");
  };

  // If user navigates to /admin
  if (route === "admin") {
    if (!isAuth) {
      return (
        <PinLock
          onUnlock={() => setIsAuth(true)}
          onCancel={navigateToHome}
        />
      );
    }
    return <CrmDashboard onSwitchToChat={navigateToHome} />;
  }

  // Default: Pure Public Chatbot View
  return (
    <div className="chat-app-root">
      <Chatbot />
    </div>
  );
}
