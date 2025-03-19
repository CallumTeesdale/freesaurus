import { Box } from '@mantine/core';

interface GradientBackgroundProps {
    colorA?: string;
    colorB?: string;
    colorC?: string;
}

const GradientBackground = ({
                                colorA = "#4263eb",
                                colorB = "#3b5bdb",
                                colorC = "#364fc7"
                            }: GradientBackgroundProps) => {
    return (
        <Box
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                margin: 0,
                padding: 0,
                zIndex: 0,
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 50%, ${colorC} 100%)`
            }}
        >
            <Box
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%),
                      radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%)`,
                    backgroundSize: '200% 200%',
                    animation: 'moveGradient 15s ease infinite'
                }}
            />
            <Box
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    opacity: 0.3
                }}
            />
        </Box>
    );
};

export default GradientBackground;