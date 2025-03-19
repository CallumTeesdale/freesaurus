import {ReactNode} from "react";
import {Box, Container, Text, Title} from "@mantine/core";

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    fluid?: boolean;
    size?: string | number;
}

const AppLayout = ({
                       children,
                       title,
                       description,
                       fluid = false,
                       size = "lg",
                   }: AppLayoutProps) => {
    return (
        <Container fluid={fluid} size={size} py="xl">
            {(title || description) && (
                <Box mb="xl">
                    {title && (
                        <Title order={2} mb={description ? "xs" : 0}>
                            {title}
                        </Title>
                    )}
                    {description && (
                        <Text c="dimmed" size="lg">
                            {description}
                        </Text>
                    )}
                </Box>
            )}

            {children}
        </Container>
    );
};

export default AppLayout;
