import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Flex,
  Group,
  Paper,
  Skeleton,
  Tabs,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
  rem,
  ThemeIcon,
  Avatar,
  Alert,
} from "@mantine/core";
import {
  IconBookmark,
  IconCopy,
  IconVolume,
  IconAlertCircle,
  IconInfoCircle,
  IconBook,
  IconExchange,
  IconArrowsRightLeft,
  IconArrowUp,
  IconArrowDown,
  IconArrowsHorizontal,
  IconMessageCircle2,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { RelationType } from "@/types";
import WordDefinition from "./WordDefinition";
import WordExamples from "./WordExamples";
import { formatPOS } from "@/utils/formatters.ts";
import StaggeredRelatedWords from "@/components/thesaurus/StaggeredRelatedWords.tsx";
import { useAllRelations } from "@/hooks/useThesaurusQueries";
import { useEffect } from "react";
import { isFavorite, addToFavorites, removeFromFavorites } from "@/utils/userDataDb";

interface WordDetailProps {
  word: string;
}

const WordDetail = ({ word }: WordDetailProps) => {
  const [activeTab, setActiveTab] = useState<string | null>("definition");
  const [favoriteStatus, setFavoriteStatus] = useState(false);
  const theme = useMantineTheme();

  const {
    data: wordData,
    isLoading,
    isError,
    error
  } = useAllRelations(word);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const status = await isFavorite(word);
        setFavoriteStatus(status);
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    };

    checkFavoriteStatus();
  }, [word]);

  const tabs = [
    {
      value: "definition",
      label: "Definition",
      icon: <IconBook size={16} />,
      color: "blue",
      count: (wordData?.definitions?.length || 0)
    },
    {
      value: "synonyms",
      label: "Synonyms",
      icon: <IconExchange size={16} />,
      color: "green",
      count: (wordData?.synonyms?.length || 0)
    },
    {
      value: "antonyms",
      label: "Antonyms",
      icon: <IconArrowsRightLeft size={16} />,
      color: "red",
      count: (wordData?.antonyms?.length || 0)
    },
    {
      value: "broader",
      label: "Broader",
      icon: <IconArrowUp size={16} />,
      color: "teal",
      count: (wordData?.broader_terms?.length || 0)
    },
    {
      value: "narrower",
      label: "Narrower",
      icon: <IconArrowDown size={16} />,
      color: "orange",
      count: (wordData?.narrower_terms?.length || 0)
    },
    {
      value: "related",
      label: "Related",
      icon: <IconArrowsHorizontal size={16} />,
      color: "grape",
      count: (wordData?.related_terms?.length || 0)
    },
    {
      value: "examples",
      label: "Examples",
      icon: <IconMessageCircle2 size={16} />,
      color: "indigo",
      count: (wordData?.examples?.length || 0)
    }
  ];

  const handleCopyWord = () => {
    if (wordData) {
      navigator.clipboard.writeText(wordData.word);
      notifications.show({
        title: "Copied!",
        message: `"${wordData.word}" copied to clipboard`,
        color: "green",
      });
    }
  };

  const handleSpeak = () => {
    if (wordData && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(wordData.word);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (favoriteStatus) {
        await removeFromFavorites(word);
      } else {
        await addToFavorites(word);
      }

      setFavoriteStatus(!favoriteStatus);

      notifications.show({
        title: favoriteStatus ? "Removed from favorites" : "Added to favorites",
        message: `"${word}" has been ${favoriteStatus ? "removed from" : "added to"} your favorites`,
        color: favoriteStatus ? "blue" : "yellow",
      });
    } catch (err) {
      console.error("Error toggling favorite:", err);
      notifications.show({
        title: "Error",
        message: "Failed to update favorites. Please try again.",
        color: "red",
      });
    }
  };

  if (isLoading) {
    return (
        <Box>
          <Paper p="lg" radius="md" withBorder mb="lg" shadow="sm">
            <Skeleton height={60} width="60%" mb="lg" />
            <Group>
              <Skeleton height={24} width={60} radius="xl" />
              <Skeleton height={24} width={80} radius="xl" />
            </Group>
          </Paper>
          <Skeleton height={50} radius="md" mb="lg" />
          <Skeleton height={300} radius="md" />
        </Box>
    );
  }

  if (isError) {
    return (
        <Alert
            icon={<IconAlertCircle size={16} />}
            title="Word Not Found"
            color="red"
            variant="filled"
            radius="md"
        >
          <Text c="white">{(error as Error)?.message || "Failed to load word data"}</Text>
          <Text c="white" mt="xs" size="sm">
            Please try a different word or check your spelling.
          </Text>
        </Alert>
    );
  }

  if (!wordData) {
    return (
        <Alert
            icon={<IconInfoCircle size={16} />}
            title="No Data Found"
            color="blue"
            variant="light"
            radius="md"
        >
          <Text>No data found for "{word}"</Text>
          <Text c="dimmed" size="sm" mt="xs">
            Please try a different word or check your spelling.
          </Text>
        </Alert>
    );
  }


  const posColor = wordData.pos.length > 0
      ? getPosColor(wordData.pos[0])
      : theme.colors.blue[6];

  const headerGradient = `linear-gradient(to right, ${posColor} 0%, ${posColor}90 100%)`;

  return (
      <Box>
        <Paper
            p="xl"
            radius="md"
            withBorder
            mb="lg"
            shadow="sm"
            style={{
              position: 'relative',
              overflow: 'hidden',
            }}
        >
          <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: rem(6),
                background: headerGradient,
              }}
          />

          <Flex justify="space-between" align="center">
            <Box mt={6}>
              <Group align="center" mb="xs">
                <Title order={1}>{wordData.word}</Title>
                <Group>
                  <Tooltip label="Copy word">
                    <ActionIcon
                        variant="subtle"
                        onClick={handleCopyWord}
                        radius="xl"
                        size="lg"
                    >
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Pronounce word">
                    <ActionIcon
                        variant="subtle"
                        onClick={handleSpeak}
                        radius="xl"
                        size="lg"
                    >
                      <IconVolume size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={favoriteStatus ? "Remove from favorites" : "Add to favorites"}>
                    <ActionIcon
                        variant="subtle"
                        onClick={handleToggleFavorite}
                        radius="xl"
                        size="lg"
                        color={favoriteStatus ? "yellow" : "gray"}
                    >
                      <IconBookmark
                          size={18}
                          fill={favoriteStatus ? "currentColor" : "none"}
                      />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              <Group mt="sm" gap="xs">
                {wordData.pos.map((pos) => (
                    <Badge
                        key={pos}
                        size="lg"
                        radius="sm"
                        color={getPosBadgeColor(pos)}
                        variant="filled"
                    >
                      {formatPOS(pos)}
                    </Badge>
                ))}
              </Group>
            </Box>

            <Avatar
                size={80}
                radius="xl"
                color={getPosBadgeColor(wordData.pos[0] || 'n')}
                style={{
                  fontWeight: 'bold',
                  fontSize: rem(36),
                  border: `${rem(3)} solid ${theme.white}`,
                  boxShadow: theme.shadows.sm
                }}
            >
              {wordData.word.charAt(0).toUpperCase()}
            </Avatar>
          </Flex>
        </Paper>

        <Tabs
            value={activeTab}
            onChange={setActiveTab}
            radius="md"
            variant="pills"
        >
          <Tabs.List mb="lg">
            {tabs.map((tab) => (
                <Tabs.Tab
                    key={tab.value}
                    value={tab.value}
                    leftSection={
                      <ThemeIcon size="sm" variant="light" color={tab.color}>
                        {tab.icon}
                      </ThemeIcon>
                    }
                    rightSection={
                      tab.count > 0 ? (
                          <Badge
                              size="sm"
                              radius="xl"
                              variant="filled"
                              p={5}
                              color={tab.color}
                          >
                            {tab.count}
                          </Badge>
                      ) : null
                    }
                >
                  {tab.label}
                </Tabs.Tab>
            ))}
          </Tabs.List>

          <Card withBorder p="lg" radius="md" shadow="sm">
            <Tabs.Panel value="definition" pt="xs">
              <WordDefinition definitions={wordData.definitions} />
            </Tabs.Panel>

            <Tabs.Panel value="synonyms" pt="xs">
              <StaggeredRelatedWords
                  words={wordData.synonyms}
                  relationType={RelationType.Synonym}
                  originalWord={wordData.word}
              />
            </Tabs.Panel>

            <Tabs.Panel value="antonyms" pt="xs">
              <StaggeredRelatedWords
                  words={wordData.antonyms}
                  relationType={RelationType.Antonym}
                  originalWord={wordData.word}
              />
            </Tabs.Panel>

            <Tabs.Panel value="broader" pt="xs">
              <StaggeredRelatedWords
                  words={wordData.broader_terms}
                  relationType={RelationType.BroaderTerm}
                  originalWord={wordData.word}
              />
            </Tabs.Panel>

            <Tabs.Panel value="narrower" pt="xs">
              <StaggeredRelatedWords
                  words={wordData.narrower_terms}
                  relationType={RelationType.NarrowerTerm}
                  originalWord={wordData.word}
              />
            </Tabs.Panel>

            <Tabs.Panel value="related" pt="xs">
              <StaggeredRelatedWords
                  words={wordData.related_terms}
                  relationType={RelationType.RelatedTerm}
                  originalWord={wordData.word}
              />
            </Tabs.Panel>

            <Tabs.Panel value="examples" pt="xs">
              <WordExamples examples={wordData.examples} word={wordData.word} />
            </Tabs.Panel>
          </Card>
        </Tabs>
      </Box>
  );
};

const getPosBadgeColor = (pos: string): string => {
  const posColorMap: Record<string, string> = {
    n: "blue",
    v: "green",
    adj: "violet",
    adv: "teal",
    prep: "orange",
    conj: "pink",
    pron: "cyan",
    interj: "red",
    det: "indigo",
  };

  return posColorMap[pos.toLowerCase()] || "gray";
};

const getPosColor = (pos: string): string => {
  const theme = useMantineTheme();
  const colorName = getPosBadgeColor(pos);
  return theme.colors[colorName][6];
};

export default WordDetail;