import {
    Badge,
    Card,
    Group,
    Paper,
    Stack,
    Text,
    Title,
    ThemeIcon,
    Flex,
    useMantineTheme
} from "@mantine/core";
import { IconMessageCircle, IconQuote } from "@tabler/icons-react";

interface WordExamplesProps {
    examples: string[];
    word: string;
}

const WordExamples = ({ examples, word }: WordExamplesProps) => {
    const theme = useMantineTheme();

    if (!examples || examples.length === 0) {
        return (
            <Paper withBorder p="xl" radius="md">
                <Flex align="center" gap="md" mb="md">
                    <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
                        <IconMessageCircle size={16} />
                    </ThemeIcon>
                    <Text fw={500} fz="lg">No examples available</Text>
                </Flex>
                <Text c="dimmed">
                    No usage examples were found for "{word}".
                </Text>
            </Paper>
        );
    }

    const highlightWord = (text: string) => {
        const regex = new RegExp(`\\b(${word})\\b`, "gi");
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (part.toLowerCase() === word.toLowerCase()) {
                return (
                    <Badge key={index} color="indigo" variant="filled" size="lg" radius="sm">
                        {part}
                    </Badge>
                );
            }
            return part;
        });
    };

    return (
        <Stack>
            <Flex justify="space-between" align="center" mb="md">
                <Group gap="md">
                    <ThemeIcon size="lg" radius="md" color="indigo">
                        <IconMessageCircle size={16} />
                    </ThemeIcon>
                    <Title order={4}>Examples</Title>
                </Group>
                <Badge
                    color="indigo"
                    size="lg"
                    radius="xl"
                    variant="filled"
                >
                    {examples.length}
                </Badge>
            </Flex>

            <Text c="dimmed" size="sm" mb="lg">
                See how "{word}" is used in context with real-world examples.
            </Text>

            <Stack gap="md">
                {examples.map((example, index) => (
                    <Card
                        key={index}
                        withBorder
                        padding="lg"
                        radius="md"
                        shadow="sm"
                        style={{
                            borderLeftWidth: 4,
                            borderLeftColor: theme.colors.indigo[5],
                        }}
                    >
                        <Flex gap="md" align="flex-start">
                            <ThemeIcon
                                size="lg"
                                radius="xl"
                                color="indigo"
                                variant="light"
                                style={{ flexShrink: 0 }}
                            >
                                <IconQuote size={18} />
                            </ThemeIcon>
                            <Text size="md" lh={1.6}>{highlightWord(example)}</Text>
                        </Flex>
                    </Card>
                ))}
            </Stack>
        </Stack>
    );
};

export default WordExamples;