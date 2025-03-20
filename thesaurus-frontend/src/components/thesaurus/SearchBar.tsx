import React, {useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    Badge,
    Box,
    Group,
    Highlight,
    Loader,
    Popover,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    UnstyledButton,
    useMantineTheme,
} from "@mantine/core";
import {useDebouncedValue} from "@mantine/hooks";
import {IconSearch} from "@tabler/icons-react";

import {useSearchWords} from "@/hooks/useThesaurusQueries";
import {formatPOS} from "@/utils/formatters";

const SearchBar = () => {
    const [query, setQuery] = useState("");
    const [debouncedQuery] = useDebouncedValue(query, 300);
    const [opened, setOpened] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const theme = useMantineTheme();

    const {
        data,
        isLoading
    } = useSearchWords(
        debouncedQuery,
        0,
        8,
        undefined,
        debouncedQuery.length >= 2
    );

    const results = data?.hits || [];
    const totalResults = data?.total || 0;

    const showResults = debouncedQuery.length >= 2;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/word/${encodeURIComponent(query.trim())}`);
            setQuery("");
            setOpened(false);
        }
    };

    const handleSelectWord = (word: string) => {
        navigate(`/word/${encodeURIComponent(word)}`);
        setQuery("");
        setOpened(false);
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

    return (
        <form onSubmit={handleSubmit} style={{width: "100%", maxWidth: 400}}>
            <Popover
                opened={opened && showResults}
                width="target"
                position="bottom"
                shadow="md"
                onClose={() => setOpened(false)}
            >
                <Popover.Target>
                    <Box>
                        <TextInput
                            ref={inputRef}
                            placeholder="Search for a word..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.currentTarget.value);
                                if (e.currentTarget.value.length >= 2) {
                                    setOpened(true);
                                } else {
                                    setOpened(false);
                                }
                            }}
                            onFocus={() => {
                                if (debouncedQuery.length >= 2) {
                                    setOpened(true);
                                }
                            }}
                            onClick={() => {
                                if (debouncedQuery.length >= 2) {
                                    setOpened(true);
                                }
                            }}
                            rightSection={
                                isLoading ?
                                    <Loader size="xs"/> :
                                    <Group gap="xs">
                                        {totalResults > 0 && debouncedQuery.length >= 2 && (
                                            <Badge size="sm" radius="xl" variant="light" color="blue">
                                                {totalResults}
                                            </Badge>
                                        )}
                                        <IconSearch size={16} color={theme.colors.blue[6]}/>
                                    </Group>
                            }
                            aria-label="Search for words"
                            size="md"
                            radius="xl"
                            styles={(theme) => ({
                                input: {
                                    background: "rgba(240, 243, 255, 0.8)",
                                    borderColor: "transparent",
                                    transition: "all 0.2s ease",
                                    "&:focus": {
                                        borderColor: theme.colors.blue[5],
                                        background: theme.white,
                                    },
                                },
                                rightSection: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingRight: theme.spacing.xs,
                                    pointerEvents: 'none',
                                },
                            })}
                        />
                    </Box>
                </Popover.Target>

                <Popover.Dropdown>
                    <ScrollArea.Autosize mah={350}>
                        <Stack gap="xs">
                            {results.length > 0 ? (
                                <>
                                    <Text size="xs" c="dimmed" ta="right">
                                        Found {totalResults} results
                                    </Text>
                                    {results.map((result) => (
                                        <UnstyledButton
                                            key={result.id}
                                            onClick={() => handleSelectWord(result.word)}
                                            py="xs"
                                            px="sm"
                                            style={(theme) => ({
                                                borderRadius: theme.radius.sm,
                                                transition: 'background-color 0.2s',
                                                "&:hover": {
                                                    backgroundColor: theme.colors.gray[0],
                                                },
                                            })}
                                        >
                                            <Group>
                                                <Box style={{flex: 1}}>
                                                    <Highlight highlight={query} size="md" fw={500}>
                                                        {result.word}
                                                    </Highlight>

                                                    {result.definitions.length > 0 && (
                                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                                            {result.definitions[0]}
                                                        </Text>
                                                    )}
                                                </Box>
                                                <Group gap="xs">
                                                    {result.pos.slice(0, 2).map((pos, index) => (
                                                        <Badge
                                                            key={index}
                                                            size="xs"
                                                            color={getPosBadgeColor(pos)}
                                                            variant="light"
                                                        >
                                                            {formatPOS(pos)}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                            </Group>
                                        </UnstyledButton>
                                    ))}
                                    {totalResults > results.length && (
                                        <UnstyledButton
                                            onClick={() => handleSelectWord(query)}
                                            py="xs"
                                            px="sm"
                                            style={(theme) => ({
                                                borderRadius: theme.radius.sm,
                                                backgroundColor: theme.colors.blue[0],
                                                textAlign: 'center',
                                                "&:hover": {
                                                    backgroundColor: theme.colors.blue[1],
                                                },
                                            })}
                                        >
                                            <Text c="blue" size="sm">
                                                See all {totalResults} results for "{query}"
                                            </Text>
                                        </UnstyledButton>
                                    )}
                                </>
                            ) : (
                                <Text c="dimmed" ta="center" size="sm" py="sm">
                                    {isLoading ? "Searching..." : debouncedQuery.length >= 2 ? "No results found" : "Type to search"}
                                </Text>
                            )}
                        </Stack>
                    </ScrollArea.Autosize>
                </Popover.Dropdown>
            </Popover>
        </form>
    );
};

export default SearchBar;