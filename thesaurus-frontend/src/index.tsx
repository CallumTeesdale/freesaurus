import {register as registerServiceWorker} from './serviceWorkerRegistration';
import React from "react";
import ReactDOM from "react-dom/client";
import {MantineProvider} from "@mantine/core";
import {Notifications} from "@mantine/notifications";
import {BrowserRouter} from "react-router-dom";
import App from "./App";
import {theme} from "./styles/theme";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/global.css";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
            retry: 1,
        },
    },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
                <Notifications position="top-right"/>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </MantineProvider>
            <ReactQueryDevtools initialIsOpen={false}/>
        </QueryClientProvider>
    </React.StrictMode>,
);

registerServiceWorker();