import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell, Box } from "@mantine/core";
import { AuthProvider } from "./contexts/AuthContext";
import { routes } from "./routes";
import AppHeader from "./components/layout/AppHeader";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { checkPlatform } from "./utils/platform";
import AnimatedRoutes from "./components/layout/AnimatedRoutes";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt.tsx";
import OfflineIndicator from "@/components/ui/OfflineIndicator.tsx";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const platform = checkPlatform();

    if (platform === "ios" || platform === "android") {
      document.addEventListener("backbutton", () => {
        if (location.pathname !== "/") {
          navigate(-1);
        }
      });
    }

    console.log(`Running on ${platform} platform`);

    if (isHomePage) {
      document.body.classList.add('home-page');
    } else {
      document.body.classList.remove('home-page');
    }

    return () => {
      document.body.classList.remove('home-page');
    };
  }, [navigate, location, isHomePage]);

  if (isHomePage) {
    return (
        <ErrorBoundary>
          <AuthProvider>
            <Box style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
              <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
              >
                <AppHeader />
              </Box>

              <AnimatedRoutes routes={routes} />

              <OfflineIndicator />
              <PWAInstallPrompt />
            </Box>
          </AuthProvider>
        </ErrorBoundary>
    );
  }


  return (
      <ErrorBoundary>
        <AuthProvider>
          <AppShell
              header={{ height: 60 }}
              padding="md"
              styles={{
                root: {
                  height: '100vh'
                },
                main: {
                  paddingTop: "calc(60px + 16px)",
                  background: 'transparent',
                  minHeight: 'calc(100vh - 60px)'
                }
              }}
          >
            <AppShell.Header>
              <AppHeader />
            </AppShell.Header>

            <AppShell.Main>
              <AnimatedRoutes routes={routes} />
            </AppShell.Main>

            <OfflineIndicator />
            <PWAInstallPrompt />
          </AppShell>
        </AuthProvider>
      </ErrorBoundary>
  );
}

export default App;