import {useContext, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {
    Avatar,
    Box,
    Burger,
    Button,
    Container,
    Flex,
    Group,
    Menu,
    rem,
    Text,
    Title,
    UnstyledButton,
} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {IconChevronDown, IconLogout, IconSettings, IconUser,} from "@tabler/icons-react";

import {AuthContext} from "../../contexts/AuthContext";
import SearchBar from "../thesaurus/SearchBar";
import {checkPlatform} from "@/utils/platform.ts";

const AppHeader = () => {
    const {user, isAuthenticated, logout} = useContext(AuthContext);
    const navigate = useNavigate();
    const [opened, {toggle}] = useDisclosure(false);
    const platform = checkPlatform();
    const isMobile = platform === "ios" || platform === "android";
    const location = useLocation();

    const isHomePage = location.pathname === "/";

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();

                const searchInput = document.querySelector('input[placeholder*="Search for a word"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <Container fluid h={60} px="md">
            <Flex h="100%" align="center" justify="space-between">
                <Group>
                    {!isHomePage ? (
                        <UnstyledButton component={Link} to="/">
                            <Title
                                order={3}
                                style={(theme) => ({
                                    fontWeight: 800,
                                    letterSpacing: "-0.5px",
                                    fontSize: "1.5rem",
                                    background: `linear-gradient(45deg, ${theme.colors.blue[7]} 0%, ${theme.colors.indigo[5]} 100%)`,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent"
                                })}
                            >
                                FreeSaurus
                            </Title>
                        </UnstyledButton>
                    ) : (
                        <Box w={120}></Box>
                    )}
                </Group>

                {!isMobile && !isHomePage && (
                    <Group ml="xl" gap="xl" visibleFrom="sm">
                        <SearchBar/>
                    </Group>
                )}

                <Group>
                    {isAuthenticated ? (
                        <Menu shadow="md" width={200} position="bottom-end">
                            <Menu.Target>
                                <UnstyledButton>
                                    <Group gap="xs">
                                        <Avatar size={34} color="blue" radius="xl">
                                            {user?.name?.charAt(0).toUpperCase() || "U"}
                                        </Avatar>
                                        <Box style={{flex: 1}} visibleFrom="sm">
                                            <Text size="sm" fw={500} c={isHomePage ? "white" : undefined}>
                                                {user?.name}
                                            </Text>
                                        </Box>
                                        <IconChevronDown
                                            size={rem(16)}
                                            stroke={1.5}
                                            color={isHomePage ? "white" : undefined}
                                        />
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item
                                    leftSection={<IconUser size={14}/>}
                                    onClick={() => handleNavigation("/profile")}
                                >
                                    Profile
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconSettings size={14}/>}
                                    onClick={() => handleNavigation("/settings")}
                                >
                                    Settings
                                </Menu.Item>
                                <Menu.Divider/>
                                <Menu.Item
                                    leftSection={<IconLogout size={14}/>}
                                    onClick={handleLogout}
                                    color="red"
                                >
                                    Logout
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    ) : (
                        <Group>
                            <Button
                                variant={isHomePage ? "white" : "light"}
                                radius="xl"
                                onClick={() => handleNavigation("/login")}
                            >
                                Login
                            </Button>
                            <Button
                                radius="xl"
                                color={isHomePage ? "white" : undefined}
                                variant={isHomePage ? "outline" : "filled"}
                                onClick={() => handleNavigation("/register")}
                            >
                                Register
                            </Button>
                        </Group>
                    )}

                    {isMobile && (
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            size="sm"
                            hiddenFrom="sm"
                            color={isHomePage ? "white" : undefined}
                        />
                    )}
                </Group>
            </Flex>
        </Container>
    );
};

export default AppHeader;