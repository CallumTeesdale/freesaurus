import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Group,
  Loader,
  Popover,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";

import { useSearchWords } from "@/hooks/useThesaurusQueries";

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
      5,
      undefined,
      debouncedQuery.length >= 2
  );

  const results = data?.hits || [];

  const showResults = debouncedQuery.length >= 2 && results.length > 0;

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

  return (
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 400 }}>
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
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  onFocus={() => {
                    if (showResults) {
                      setOpened(true);
                    }
                  }}
                  onClick={() => {
                    if (showResults) {
                      setOpened(true);
                    }
                  }}
                  rightSection={
                    isLoading ? <Loader size="xs" /> : <IconSearch size={16} color={theme.colors.blue[6]} />
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
                      pointerEvents: "none",
                    },
                  })}
              />
            </Box>
          </Popover.Target>

          <Popover.Dropdown>
            <ScrollArea.Autosize mah={300}>
              <Stack gap="xs">
                {results.length > 0 ? (
                    results.map((result) => (
                        <UnstyledButton
                            key={result.id}
                            onClick={() => handleSelectWord(result.word)}
                            py="xs"
                            px="sm"
                            style={(theme) => ({
                              borderRadius: theme.radius.sm,
                              "&:hover": {
                                backgroundColor: theme.colors.gray[0],
                              },
                            })}
                        >
                          <Group>
                            <Box>
                              <Text fw={500}>{result.word}</Text>
                              {result.pos.length > 0 && (
                                  <Text size="xs" c="dimmed">
                                    {result.pos.join(", ")}
                                  </Text>
                              )}
                            </Box>
                          </Group>
                        </UnstyledButton>
                    ))
                ) : (
                    <Text c="dimmed" ta="center" size="sm" py="sm">
                      {isLoading ? "Searching..." : "No results found"}
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