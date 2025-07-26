import {useContext} from "react";
import {Avatar, Box, Button, Card, Container, Divider, Grid, Group, Tabs, Text, ThemeIcon, Title,} from "@mantine/core";
import {IconBookmark, IconEdit, IconHistory, IconLogout, IconUser} from "@tabler/icons-react";

import {AuthContext} from "../contexts/AuthContext";
import {formatDateTime} from "../utils/formatters";
import FavoriteWords from "../components/profile/FavoriteWords";
import ActivityHistory from "../components/profile/ActivityHistory";
import AppLayout from "../components/layout/AppLayout";

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
            <Container size="xl">
                <Grid gutter="xl">
                    <Grid.Col span={{base: 12, md: 4}}>
                        <Card p="xl" radius="md" withBorder shadow="sm">
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
                    </Grid.Col>

                    <Grid.Col span={{base: 12, md: 8}}>
                        <Tabs defaultValue="favorites" radius="md">
                            <Tabs.List mb="md">
                                <Tabs.Tab
                                    value="favorites"
                                    leftSection={
                                        <ThemeIcon color="yellow" variant="light" size="sm">
                                            <IconBookmark size={14}/>
                                        </ThemeIcon>
                                    }
                                >
                                    Favorites
                                </Tabs.Tab>
                                <Tabs.Tab
                                    value="activity"
                                    leftSection={
                                        <ThemeIcon color="blue" variant="light" size="sm">
                                            <IconHistory size={14}/>
                                        </ThemeIcon>
                                    }
                                >
                                    Activity
                                </Tabs.Tab>
                                <Tabs.Tab
                                    value="settings"
                                    leftSection={
                                        <ThemeIcon color="gray" variant="light" size="sm">
                                            <IconUser size={14}/>
                                        </ThemeIcon>
                                    }
                                >
                                    Settings
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="favorites">
                                <FavoriteWords/>
                            </Tabs.Panel>

                            <Tabs.Panel value="activity">
                                <ActivityHistory/>
                            </Tabs.Panel>

                            <Tabs.Panel value="settings">
                                <Card p="xl" radius="md" withBorder>
                                    <Title order={3} mb="md">
                                        Account Settings
                                    </Title>
                                    <Text c="dimmed">
                                        Account settings will be available soon.
                                    </Text>

                                    <Divider my="lg"/>

                                    <Text ta="center" c="dimmed">
                                        More settings options will be added in future updates.
                                    </Text>
                                </Card>
                            </Tabs.Panel>
                        </Tabs>
                    </Grid.Col>
                </Grid>
            </Container>
        </AppLayout>
    );
};

export default ProfilePage;