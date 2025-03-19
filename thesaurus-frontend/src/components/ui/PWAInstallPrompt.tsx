import { useEffect, useRef, useState } from 'react';
import {
    Button,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    UnstyledButton,
    useMantineTheme
} from '@mantine/core';
import {
    IconDownload,
    IconDeviceMobile,
    IconX,
    IconDeviceLaptop
} from '@tabler/icons-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [installPlatform, setInstallPlatform] = useState<'mobile' | 'desktop'>('desktop');
    const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
    const theme = useMantineTheme();

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setInstallPlatform(isMobile ? 'mobile' : 'desktop');

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            deferredPrompt.current = e as BeforeInstallPromptEvent;

            setTimeout(() => {
                setShowPrompt(true);
            }, 30000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt.current) {
            return;
        }

        deferredPrompt.current.prompt();
        await deferredPrompt.current.userChoice;
        deferredPrompt.current = null;
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) {
        return null;
    }

    return (
        <Paper
            p="md"
            radius="md"
            withBorder
            shadow="md"
            mx="md"
            mt="md"
            style={{
                position: 'fixed',
                bottom: 20,
                left: 20,
                right: 20,
                zIndex: 1000,
                maxWidth: 400,
                margin: '0 auto',
                background: `linear-gradient(45deg, ${theme.colors.blue[0]}, ${theme.colors.indigo[0]})`,
                border: `1px solid ${theme.colors.blue[2]}`,
            }}
        >
            <UnstyledButton
                onClick={handleDismiss}
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8
                }}
            >
                <IconX size={18} color={theme.colors.gray[6]} />
            </UnstyledButton>

            <Group align="flex-start" wrap="nowrap">
                <ThemeIcon
                    size={40}
                    radius="md"
                    variant="light"
                    color="blue"
                >
                    {installPlatform === 'mobile'
                        ? <IconDeviceMobile size={24} />
                        : <IconDeviceLaptop size={24} />}
                </ThemeIcon>

                <Stack style={{ flex: 1 }}>
                    <Text fw={600} size="md">
                        Install FreeSaurus
                    </Text>
                    <Text size="sm" c="dimmed">
                        {installPlatform === 'mobile'
                            ? 'Add FreeSaurus to your home screen for quick access when offline'
                            : 'Install FreeSaurus as an app for the best experience, even offline'}
                    </Text>

                    <Group mt="xs">
                        <Button
                            size="sm"
                            leftSection={<IconDownload size={16} />}
                            onClick={handleInstallClick}
                            variant="gradient"
                            gradient={{ from: theme.colors.blue[6], to: theme.colors.indigo[5] }}
                        >
                            Install
                        </Button>
                        <Button
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={handleDismiss}
                        >
                            Maybe later
                        </Button>
                    </Group>
                </Stack>
            </Group>
        </Paper>
    );
};

export default PWAInstallPrompt;