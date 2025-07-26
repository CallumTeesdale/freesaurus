import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ActionIcon, Card, Group, List, Loader, Paper, Stack, Text, ThemeIcon, Title} from '@mantine/core';
import {IconBookmark, IconExternalLink, IconTrash} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {Favorite, getFavorites, removeFavorite} from '@/api/favoritesApi.ts';

const FavoriteWords = () => {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                setLoading(true);
                const data = await getFavorites();
                setFavorites(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to load favorites');
                console.error('Error loading favorites:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const handleRemoveFavorite = async (word: string) => {
        try {
            await removeFavorite(word);
            setFavorites(favorites.filter((fav) => fav.word !== word));

            notifications.show({
                title: 'Favorite removed',
                message: `"${word}" has been removed from your favorites`,
                color: 'blue',
            });
        } catch (err: any) {
            notifications.show({
                title: 'Error',
                message: 'Failed to remove favorite',
                color: 'red',
            });
        }
    };

    const handleViewWord = (word: string) => {
        navigate(`/word/${encodeURIComponent(word)}`);
    };

    if (loading) {
        return (
            <Stack align="center" py="xl">
                <Loader size="md"/>
                <Text size="sm" c="dimmed">Loading your favorites...</Text>
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

    if (favorites.length === 0) {
        return (
            <Paper p="xl" radius="md" withBorder>
                <Stack align="center">
                    <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                        <IconBookmark size={28}/>
                    </ThemeIcon>
                    <Title order={3}>No favorites yet</Title>
                    <Text c="dimmed" ta="center">
                        Start adding words to your favorites by clicking the bookmark icon when viewing a word.
                    </Text>
                </Stack>
            </Paper>
        );
    }

    return (
        <Card withBorder radius="md" p="md">
            <Title order={3} mb="lg">Your Favorites</Title>
            <List spacing="sm">
                {favorites.map((favorite) => (
                    <List.Item
                        key={favorite.id}
                        icon={
                            <ThemeIcon color="blue" size={24} radius="xl">
                                <IconBookmark size={16}/>
                            </ThemeIcon>
                        }
                    >
                        <Group>
                            <Text fw={500}>{favorite.word}</Text>
                            <Group>
                                <ActionIcon
                                    size="sm"
                                    radius="xl"
                                    variant="light"
                                    onClick={() => handleViewWord(favorite.word)}
                                >
                                    <IconExternalLink size={16}/>
                                </ActionIcon>
                                <ActionIcon
                                    size="sm"
                                    radius="xl"
                                    color="red"
                                    variant="light"
                                    onClick={() => handleRemoveFavorite(favorite.word)}
                                >
                                    <IconTrash size={16}/>
                                </ActionIcon>
                            </Group>
                        </Group>
                    </List.Item>
                ))}
            </List>
        </Card>
    );
};

export default FavoriteWords;