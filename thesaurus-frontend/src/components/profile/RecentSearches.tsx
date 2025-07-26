import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ActionIcon, Card, Group, Loader, Stack, Text, ThemeIcon} from '@mantine/core';
import {IconExternalLink, IconHistory, IconSearch} from '@tabler/icons-react';

import {getRecentWords} from '@/api/activityApi.ts';

const RecentSearches = () => {
    const [words, setWords] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecentWords = async () => {
            try {
                setLoading(true);
                const data = await getRecentWords(10);
                setWords(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to load recent searches');
                console.error('Error loading recent words:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentWords();
    }, []);

    const handleWordClick = (word: string) => {
        navigate(`/word/${encodeURIComponent(word)}`);
    };

    if (loading) {
        return (
            <Stack align="center" py="md">
                <Loader size="sm"/>
                <Text size="sm" c="dimmed">Loading recent searches...</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Text size="sm" c="red">{error}</Text>
        );
    }

    if (words.length === 0) {
        return (
            <Text c="dimmed" size="sm">No recent searches yet.</Text>
        );
    }

    return (
        <Card withBorder radius="md" p="md">
            <Group mb="md">
                <Group>
                    <ThemeIcon size="md" radius="xl" color="blue" variant="light">
                        <IconHistory size={16}/>
                    </ThemeIcon>
                    <Text fw={500}>Recently Viewed Words</Text>
                </Group>
            </Group>

            <Stack>
                {words.map((word, index) => (
                    <Group key={`${word}-${index}`}>
                        <Group>
                            <ThemeIcon size="xs" radius="xl" color="gray" variant="light">
                                <IconSearch size={12}/>
                            </ThemeIcon>
                            <Text size="sm">{word}</Text>
                        </Group>
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => handleWordClick(word)}
                        >
                            <IconExternalLink size={16}/>
                        </ActionIcon>
                    </Group>
                ))}
            </Stack>
        </Card>
    );
};

export default RecentSearches;