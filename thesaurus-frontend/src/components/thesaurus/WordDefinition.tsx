import { List, Paper, Stack, Text, Title } from "@mantine/core";

interface WordDefinitionProps {
  definitions: string[];
}

const WordDefinition = ({ definitions }: WordDefinitionProps) => {
  if (!definitions || definitions.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed" ta="center">
          No definitions available.
        </Text>
      </Paper>
    );
  }

  return (
    <Stack>
      <Title order={4} mb="xs">
        Definitions
      </Title>
      <List spacing="md">
        {definitions.map((definition, index) => (
          <List.Item key={index}>
            <Text>{definition}</Text>
          </List.Item>
        ))}
      </List>
    </Stack>
  );
};

export default WordDefinition;
