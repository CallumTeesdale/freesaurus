import {ReactNode} from "react";
import {Route, Routes, useLocation} from "react-router-dom";
import {AnimatePresence, motion} from "framer-motion";

interface RouteConfig {
    path: string;
    element: ReactNode;
}

interface AnimatedRoutesProps {
    routes: RouteConfig[];
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    in: {
        opacity: 1,
        y: 0,
    },
    out: {
        opacity: 0,
        y: -20,
    },
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4,
};

const AnimatedRoutes = ({routes}: AnimatedRoutesProps) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {routes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <motion.div
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                            >
                                {route.element}
                            </motion.div>
                        }
                    />
                ))}
            </Routes>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;