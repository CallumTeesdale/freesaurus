import {useContext} from "react";
import {Avatar, Box, Button, Card, Divider, Group, SimpleGrid, Text, Title,} from "@mantine/core";
import {IconEdit, IconLogout} from "@tabler/icons-react";

import {AuthContext} from "../contexts/AuthContext";
import AppLayout from "../components/layout/AppLayout";
import {formatDateTime} from "../utils/formatters";

const ProfilePage = () => {
    const {user, logout} = useContext(AuthContext);

    if (!user) {
        return (
            <AppLayout title="Profile">
                <Text>Loading profile...</Text>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Your Profile">
            <SimpleGrid cols={{base: 1, md: 2}} spacing="xl">
                <Card p="xl" radius="md" withBorder>
                    <Group>
                        <Avatar size="xl" radius="xl" color="blue">
                            {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Title order={3}>{user.name}</Title>
                            <Text c="dimmed">{user.email}</Text>
                        </Box>
                    </Group>

                    <Divider my="lg"/>

                    <Box>
                        <Text fw={500} mb="xs">
                            Account Details
                        </Text>
                        <Group grow>
                            <Box>
                                <Text size="sm" c="dimmed">
                                    Member Since
                                </Text>
                                <Text>{formatDateTime(user.created_at)}</Text>
                            </Box>
                            <Box>
                                <Text size="sm" c="dimmed">
                                    Last Updated
                                </Text>
                                <Text>{formatDateTime(user.updated_at)}</Text>
                            </Box>
                        </Group>
                    </Box>

                    <Group mt="xl">
                        <Button variant="outline" leftSection={<IconEdit size={16}/>}>
                            Edit Profile
                        </Button>
                        <Button
                            color="red"
                            variant="subtle"
                            leftSection={<IconLogout size={16}/>}
                            onClick={logout}
                        >
                            Logout
                        </Button>
                    </Group>
                </Card>

                <Card p="xl" radius="md" withBorder>
                    <Title order={3} mb="md">
                        Activity
                    </Title>
                    <Text c="dimmed">
                        Your recent activity and saved words will appear here.
                    </Text>

                    <Divider my="lg"/>

                    <Text ta="center" c="dimmed">
                        No recent activity to display.
                    </Text>
                </Card>
            </SimpleGrid>
        </AppLayout>
    );
};

export default ProfilePage;
