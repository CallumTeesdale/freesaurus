import {Component, ErrorInfo, ReactNode} from "react";
import {Button, Container, Group, Paper, Text, Title} from "@mantine/core";
import {IconAlertTriangle, IconRefresh} from "@tabler/icons-react";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container size="md" py="xl">
                    <Paper p="xl" radius="md" withBorder>
                        <Group align="flex-start" mb="md">
                            <IconAlertTriangle size={40} color="var(--mantine-color-red-6)"/>
                            <div>
                                <Title order={2} mb="xs">
                                    Something went wrong
                                </Title>
                                <Text mb="lg">
                                    We're sorry, but something unexpected happened. The error has
                                    been logged, and we're working on a fix.
                                </Text>
                            </div>
                        </Group>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <Paper p="md" withBorder mb="lg" bg="gray.0">
                                <Text fw={700} mb="xs">
                                    Error Details:
                                </Text>
                                <Text
                                    ff="monospace"
                                    size="sm"
                                    style={{whiteSpace: "pre-wrap"}}
                                >
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <>
                                        <Text fw={700} mt="md" mb="xs">
                                            Component Stack:
                                        </Text>
                                        <Text
                                            ff="monospace"
                                            size="sm"
                                            style={{whiteSpace: "pre-wrap"}}
                                        >
                                            {this.state.errorInfo.componentStack}
                                        </Text>
                                    </>
                                )}
                            </Paper>
                        )}

                        <Group>
                            <Button
                                onClick={this.handleReset}
                                leftSection={<IconRefresh size={16}/>}
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="light"
                                onClick={() => (window.location.href = "/")}
                            >
                                Go to Homepage
                            </Button>
                        </Group>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
