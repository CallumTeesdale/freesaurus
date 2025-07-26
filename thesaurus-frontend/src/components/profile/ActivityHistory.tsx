import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ActionIcon, Badge, Card, Group, Loader, Paper, Stack, Text, ThemeIcon, Timeline, Title} from '@mantine/core';
import {
    IconBookmark,
    IconClock,
    IconExternalLink,
    IconEye,
    IconHistory,
    IconLogin,
    IconLogout,
    IconSearch,
    IconUserPlus
} from '@tabler/icons-react';

import {formatDate, formatTime} from '../../utils/formatters';
import {Activity} from '../../types/activity.types';
import {getActivities} from '../../api/activityApi';

const ActivityHistory = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const data = await getActivities(20, 0);
                setActivities(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to load activity history');
                console.error('Error loading activities:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'search':
                return <IconSearch size={16}/>;
            case 'view_word':
                return <IconEye size={16}/>;
            case 'add_favorite':
                return <IconBookmark size={16}/>;
            case 'remove_favorite':
                return <IconBookmark size={16}/>;
            case 'login':
                return <IconLogin size={16}/>;
            case 'logout':
                return <IconLogout size={16}/>;
            case 'register':
                return <IconUserPlus size={16}/>;
            default:
                return <IconClock size={16}/>;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'search':
                return 'blue';
            case 'view_word':
                return 'green';
            case 'add_favorite':
                return 'yellow';
            case 'remove_favorite':
                return 'orange';
            case 'login':
                return 'indigo';
            case 'logout':
                return 'gray';
            case 'register':
                return 'violet';
            default:
                return 'gray';
        }
    };

    const getActivityTitle = (activity: Activity) => {
        switch (activity.activity_type) {
            case 'search':
                return 'Searched';
            case 'view_word':
                return 'Viewed word';
            case 'add_favorite':
                return 'Added to favorites';
            case 'remove_favorite':
                return 'Removed from favorites';
            case 'login':
                return 'Logged in';
            case 'logout':
                return 'Logged out';
            case 'register':
                return 'Registered';
            default:
                return 'Activity';
        }
    };

    const handleWordClick = (word: string) => {
        navigate(`/word/${encodeURIComponent(word)}`);
    };

    if (loading) {
        return (
            <Stack align="center" py="xl">
                <Loader size="md"/>
                <Text size="sm" c="dimmed">Loading your activity history...</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Paper p="md" radius="md" withBorder>
                <Text c="red">{error}</Text>
            </Paper>
        );
    }

    if (activities.length === 0) {
        return (
            <Paper p="xl" radius="md" withBorder>
                <Stack align="center">
                    <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                        <IconHistory size={28}/>
                    </ThemeIcon>
                    <Title order={3}>No activity yet</Title>
                    <Text c="dimmed" ta="center">
                        Your activity history will appear here as you use FreeSaurus.
                    </Text>
                </Stack>
            </Paper>
        );
    }

    return (
        <Card withBorder radius="md" p="md">
            <Title order={3} mb="lg">Recent Activity</Title>
            <Timeline active={activities.length - 1} bulletSize={24} lineWidth={2}>
                {activities.map((activity) => (
                    <Timeline.Item
                        key={activity.id}
                        bullet={
                            <ThemeIcon
                                size={22}
                                radius="xl"
                                color={getActivityColor(activity.activity_type)}
                            >
                                {getActivityIcon(activity.activity_type)}
                            </ThemeIcon>
                        }
                        title={
                            <Group>
                                <Text fw={500}>{getActivityTitle(activity)}</Text>
                                {activity.word && (
                                    <Badge color={getActivityColor(activity.activity_type)}>
                                        {activity.word}
                                    </Badge>
                                )}
                            </Group>
                        }
                    >
                        <Text size="xs" c="dimmed" mt={4}>
                            {formatDate(activity.created_at)} at {formatTime(activity.created_at)}
                        </Text>

                        {activity.word && (
                            <Group mt="xs">
                                <ActionIcon
                                    size="sm"
                                    variant="light"
                                    color={getActivityColor(activity.activity_type)}
                                    onClick={() => handleWordClick(activity.word!)}
                                >
                                    <IconExternalLink size={14}/>
                                </ActionIcon>
                                <Text size="sm">View "{activity.word}"</Text>
                            </Group>
                        )}
                    </Timeline.Item>
                ))}
            </Timeline>
        </Card>
    );
};

export default ActivityHistory;