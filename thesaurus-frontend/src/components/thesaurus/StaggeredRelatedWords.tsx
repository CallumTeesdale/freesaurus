import {useNavigate} from "react-router-dom";
import {motion} from "framer-motion";
import {
    ActionIcon,
    Badge,
    Box,
    Card,
    Flex,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
    useMantineTheme,
} from "@mantine/core";
import {
    IconArrowDown,
    IconArrowRight,
    IconArrowsExchange,
    IconArrowsHorizontal,
    IconArrowUp,
    IconChevronRight,
    IconCopy,
    IconInfoCircle,
} from "@tabler/icons-react";

import {RelationType, relationTypes} from "@/types";
import {notifications} from "@mantine/notifications";

interface RelatedWordsProps {
    words: string[];
    relationType: RelationType;
    originalWord: string;
}

const containerVariants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: {opacity: 0, y: 20, scale: 0.9},
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 17
        }
    },
    hover: {
        scale: 1.05,
        boxShadow: "0px 5px 10px rgba(0,0,0,0.1)"
    }
};

const StaggeredRelatedWords = ({
                                   words,
                                   relationType,
                                   originalWord,
                               }: RelatedWordsProps) => {
    const navigate = useNavigate();
    const relationInfo = relationTypes[relationType];
    const theme = useMantineTheme();

    const getRelationIcon = (type: RelationType) => {
        switch (type) {
            case RelationType.Synonym:
                return <IconArrowsExchange size={16}/>;
            case RelationType.Antonym:
                return <IconArrowRight size={16}/>;
            case RelationType.BroaderTerm:
                return <IconArrowUp size={16}/>;
            case RelationType.NarrowerTerm:
                return <IconArrowDown size={16}/>;
            case RelationType.RelatedTerm:
                return <IconArrowsHorizontal size={16}/>;
            default:
                return <IconChevronRight size={16}/>;
        }
    };

    const handleWordClick = (word: string) => {
        navigate(`/word/${encodeURIComponent(word)}`);
    };

    const handleCopyWord = (word: string) => {
        navigator.clipboard.writeText(word);
        notifications.show({
            title: "Copied!",
            message: `"${word}" copied to clipboard`,
            color: "green",
        });
    };

    const getRelationDescription = (type: RelationType): string => {
        switch (type) {
            case RelationType.Synonym:
                return "Words with the same or nearly the same meaning.";
            case RelationType.Antonym:
                return "Words with opposite meanings.";
            case RelationType.BroaderTerm:
                return "More general terms that encompass this word.";
            case RelationType.NarrowerTerm:
                return "More specific terms related to this word.";
            case RelationType.RelatedTerm:
                return "Terms semantically related to this word.";
            default:
                return "";
        }
    };

    if (!words || words.length === 0) {
        return (
            <Paper withBorder p="xl" radius="md">
                <Flex align="center" gap="md" mb="md">
                    <ThemeIcon size="lg" radius="md" color={relationInfo.color} variant="light">
                        {getRelationIcon(relationType)}
                    </ThemeIcon>
                    <Text fw={500} fz="lg">No {relationInfo.displayName.toLowerCase()} found</Text>
                </Flex>
                <Text c="dimmed">
                    No {relationInfo.displayName.toLowerCase()} were found for "{originalWord}".
                </Text>
            </Paper>
        );
    }

    return (
        <Stack>
            <Box>
                <Flex justify="space-between" align="center" mb="md">
                    <Group gap="md">
                        <ThemeIcon size="lg" radius="md" color={relationInfo.color}>
                            {getRelationIcon(relationType)}
                        </ThemeIcon>
                        <Title order={4}>{relationInfo.displayName}</Title>
                    </Group>
                    <Tooltip label={`${words.length} ${relationInfo.displayName.toLowerCase()}`}>
                        <Badge
                            color={relationInfo.color}
                            size="lg"
                            radius="xl"
                            variant="filled"
                        >
                            {words.length}
                        </Badge>
                    </Tooltip>
                </Flex>

                <Tooltip
                    label={getRelationDescription(relationType)}
                    position="bottom"
                    withArrow
                >
                    <Text c="dimmed" size="sm" mb="lg" display="inline-block">
                        <Group gap={6}>
                            <IconInfoCircle size={14}/>
                            <span>What are {relationInfo.displayName.toLowerCase()}?</span>
                        </Group>
                    </Text>
                </Tooltip>
            </Box>

            <Card p="lg" withBorder radius="md" shadow="sm">
                <Box>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Flex wrap="wrap" gap="md">
                            {words.map((word) => (
                                <motion.div
                                    key={word}
                                    variants={itemVariants}
                                    whileHover="hover"
                                >
                                    <Card
                                        padding="xs"
                                        radius="md"
                                        withBorder
                                        style={{
                                            borderColor: theme.colors[relationInfo.color][3],
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Flex align="center" gap="xs">
                                            <Box
                                                style={{
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                }}
                                                onClick={() => handleWordClick(word)}
                                            >
                                                <Text fw={500}>{word}</Text>
                                            </Box>
                                            <Tooltip label="Copy word">
                                                <ActionIcon
                                                    variant="subtle"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyWord(word);
                                                    }}
                                                >
                                                    <IconCopy size={14}/>
                                                </ActionIcon>
                                            </Tooltip>
                                        </Flex>
                                    </Card>
                                </motion.div>
                            ))}
                        </Flex>
                    </motion.div>
                </Box>
            </Card>
        </Stack>
    );
};

export default StaggeredRelatedWords;