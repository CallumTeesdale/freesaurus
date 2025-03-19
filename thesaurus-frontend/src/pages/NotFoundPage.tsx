import {useNavigate} from "react-router-dom";
import {Box, Button, Center, Container, Group, Stack, Text, Title,} from "@mantine/core";
import {IconArrowLeft, IconHome} from "@tabler/icons-react";

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <Container py={80}>
            <Center>
                <Stack align="center" maw={500}>
                    <Title order={1} size="3.5rem" fw={900}>
                        404
                    </Title>

                    <Box mb="xl">
                        <Title order={2} mb="md">
                            Page not found
                        </Title>
                        <Text c="dimmed" size="lg">
                            The page you are looking for doesn't exist or has been moved to
                            another URL.
                        </Text>
                    </Box>

                    <Group>
                        <Button
                            leftSection={<IconArrowLeft size={16}/>}
                            onClick={() => navigate(-1)}
                            variant="outline"
                        >
                            Go Back
                        </Button>
                        <Button
                            leftSection={<IconHome size={16}/>}
                            onClick={() => navigate("/")}
                        >
                            Back to Home
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </Container>
    );
};

export default NotFoundPage;
