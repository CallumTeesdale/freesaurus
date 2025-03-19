import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Flex,
    Kbd,
    Paper,
    Text,
    TextInput,
    Title,
    useMantineTheme,
    Group,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import GradientBackground from "../components/ui/GradientBackground";

const HomePage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/word/${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <Box
            style={{
                position: 'relative',
                height: '100vh',
                width: '100%',
                margin: 0,
                padding: 0,
                overflow: 'hidden'
            }}
        >
            {/* Animated Gradient Background */}
            <GradientBackground
                colorA={theme.colors.blue[7]}
                colorB={theme.colors.indigo[8]}
                colorC={theme.colors.blue[9]}
            />

            {/* Centered content - uses flexbox to center vertically */}
            <Flex
                align="center"
                justify="center"
                direction="column"
                style={{
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 5
                }}
            >
                <Title
                    order={1}
                    style={{
                        fontSize: "clamp(3rem, 10vw, 5rem)",
                        fontWeight: 900,
                        lineHeight: 1.1,
                        textAlign: "center",
                        padding: "0 20px",
                        textShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                        background: "linear-gradient(to right, #ffffff, #e0e0ff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        marginBottom: "2rem",
                    }}
                >
                    FreeSaurus
                </Title>

                <Box w="100%" style={{ maxWidth: "650px", width: "650px", padding: "0 15px" }}>
                    <form onSubmit={handleSearch} style={{ width: "100%" }}>
                        <Paper
                            p={{ base: "xs", sm: "md" }}
                            radius="xl"
                            shadow="xl"
                            w="100%"
                            style={{
                                background: `rgba(255, 255, 255, 0.15)`,
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            <Group align="center" wrap="nowrap">
                                <TextInput
                                    ref={searchInputRef}
                                    placeholder="Search for a word..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                    radius="xl"
                                    leftSection={<IconSearch size={18} color={theme.colors.blue[6]} />}
                                    style={{ flex: 1 }}
                                    styles={{
                                        input: {
                                            background: "rgba(255, 255, 255, 0.9)",
                                            border: "none",
                                            fontSize: "16px",
                                            "&:focus": {
                                                border: "none",
                                                background: "rgba(255, 255, 255, 1)",
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    radius="xl"
                                    gradient={{ from: theme.colors.blue[7], to: theme.colors.indigo[5], deg: 45 }}
                                    variant="gradient"
                                >
                                    Search
                                </Button>
                            </Group>
                        </Paper>
                        <Text ta="center" mt="xs" size="sm" c="rgba(255,255,255,0.9)" fw={500}>
                            Press <Kbd>/</Kbd> anywhere to search
                        </Text>
                    </form>
                </Box>
            </Flex>
        </Box>
    );
};

export default HomePage;