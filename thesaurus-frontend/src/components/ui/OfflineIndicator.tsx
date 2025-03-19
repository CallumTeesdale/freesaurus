import { useEffect, useState } from 'react';
import { Box, Collapse, Group, Paper, Text, useMantineTheme } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';

const OfflineIndicator = () => {
    const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
    const theme = useMantineTheme();

    useEffect(() => {
        const handleOnlineStatus = () => {
            setIsOffline(!navigator.onLine);
        };

        window.addEventListener('online', handleOnlineStatus);
        window.addEventListener('offline', handleOnlineStatus);

        return () => {
            window.removeEventListener('online', handleOnlineStatus);
            window.removeEventListener('offline', handleOnlineStatus);
        };
    }, []);

    return (
        <Collapse in={isOffline}>
            <Box
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                }}
            >
                <Paper
                    p="md"
                    shadow="md"
                    withBorder
                    style={{
                        background: theme.colors.yellow[1],
                        borderTop: `3px solid ${theme.colors.yellow[6]}`,
                    }}
                >
                    <Group>
                        <IconWifiOff size={24} color={theme.colors.yellow[7]} />
                        <div>
                            <Text fw={500}>You are currently offline</Text>
                            <Text size="sm" c="dimmed">
                                FreeSaurus will continue to work with cached data
                            </Text>
                        </div>
                    </Group>
                </Paper>
            </Box>
        </Collapse>
    );
};

export default OfflineIndicator;