import { useNavigate, useParams } from "react-router-dom";
import { Anchor, Box, Breadcrumbs, Button, Text } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

import AppLayout from "../components/layout/AppLayout";
import AnimatedWordDetail from "@/components/thesaurus/AnimatedWordDetail.tsx";

const WordPage = () => {
  const { word } = useParams<{ word: string }>();
  const navigate = useNavigate();

  if (!word) {
    return (
      <AppLayout>
        <Text c="red">No word specified!</Text>
        <Button
          onClick={() => navigate("/")}
          leftSection={<IconArrowLeft size={16} />}
        >
          Go Home
        </Button>
      </AppLayout>
    );
  }

  const items = [
    { title: "Home", href: "/" },
    { title: word, href: "#" },
  ];

  return (
    <AppLayout>
      <Box mb="xl">
        <Breadcrumbs>
          {items.map((item, index) => (
            <Anchor
              key={index}
              href={item.href}
              underline="hover"
              onClick={(e) => {
                if (item.href !== "#") {
                  e.preventDefault();
                  navigate(item.href);
                }
              }}
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>
      </Box>

      <AnimatedWordDetail word={word} />

      <Button
        mt="xl"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => navigate(-1)}
      >
        Go Back
      </Button>
    </AppLayout>
  );
};

export default WordPage;
