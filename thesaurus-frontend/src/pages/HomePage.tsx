import {useContext, useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {
    Avatar,
    Box,
    Burger,
    Button,
    Container,
    Divider,
    Drawer,
    Flex,
    Group,
    Menu,
    rem,
    Stack,
    Text,
    Title,
    UnstyledButton,
    useMantineTheme,
} from "@mantine/core";
import {useDisclosure, useMediaQuery} from "@mantine/hooks";
import {
    IconChevronDown,
    IconHome,
    IconLogin,
    IconLogout,
    IconSearch,
    IconSettings,
    IconUser,
    IconUserPlus,
} from "@tabler/icons-react";

import {AuthContext} from "../contexts/AuthContext";
import SearchBar from "../components/thesaurus/SearchBar";

const AppHeader = () => {
    const {user, isAuthenticated, logout} = useContext(AuthContext);
    const navigate = useNavigate();
    const [drawerOpened, {open: openDrawer, close: closeDrawer}] = useDisclosure(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const location = useLocation();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
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
                } else if (isMobile && !isHomePage) {
                    setSearchVisible(true);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobile, isHomePage]);

    const handleNavigation = (path: string) => {
        navigate(path);
        closeDrawer();
    };

    const handleLogout = () => {
        logout();
        navigate("/");
        closeDrawer();
    };

    const toggleSearch = () => {
        setSearchVisible(!searchVisible);
    };

    return (
        <>
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

                    {/* Desktop search bar */}
                    {!isHomePage && (
                        <Group ml="xl" gap="xl" visibleFrom="sm" style={{flex: 1, justifyContent: 'center'}}>
                            <SearchBar/>
                        </Group>
                    )}

                    {isMobile && !isHomePage && !searchVisible && (
                        <UnstyledButton onClick={toggleSearch} mr="sm">
                            <IconSearch size={24} color={isHomePage ? "white" : theme.colors.gray[7]}/>
                        </UnstyledButton>
                    )}

                    <Group>
                        {isAuthenticated ? (
                            <Box hiddenFrom="sm">
                                <Avatar size={34} color="blue" radius="xl">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </Avatar>
                            </Box>
                        ) : null}

                        {/* Desktop auth buttons/user menu */}
                        {isAuthenticated ? (
                            <Menu shadow="md" width={200} position="bottom-end">
                                <Menu.Target>
                                    <UnstyledButton visibleFrom="sm">
                                        <Group gap="xs">
                                            <Avatar size={34} color="blue" radius="xl">
                                                {user?.name?.charAt(0).toUpperCase() || "U"}
                                            </Avatar>
                                            <Box style={{flex: 1}}>
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
                            <Group visibleFrom="sm">
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

                        {/* Mobile hamburger menu */}
                        <Burger
                            opened={drawerOpened}
                            onClick={openDrawer}
                            size="sm"
                            hiddenFrom="sm"
                            color={isHomePage ? "white" : undefined}
                        />
                    </Group>
                </Flex>
            </Container>

            {isMobile && !isHomePage && searchVisible && (
                <Box px="md" py="xs"
                     style={{backgroundColor: theme.white, borderBottom: `1px solid ${theme.colors.gray[2]}`}}>
                    <Flex align="center">
                        <Box style={{flex: 1}}>
                            <SearchBar/>
                        </Box>
                        <UnstyledButton onClick={toggleSearch} ml="xs">
                            <Text c="dimmed" size="sm">Close</Text>
                        </UnstyledButton>
                    </Flex>
                </Box>
            )}

            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                title="Menu"
                padding="lg"
                size="xs"
                position="right"
                zIndex={1000}
            >
                <Stack gap="lg">
                    {isAuthenticated && (
                        <Box>
                            <Group mb="md">
                                <Avatar size={40} color="blue" radius="xl">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </Avatar>
                                <Box>
                                    <Text fw={500}>{user?.name}</Text>
                                    <Text size="xs" c="dimmed">{user?.email}</Text>
                                </Box>
                            </Group>
                            <Divider mb="md"/>
                        </Box>
                    )}

                    <UnstyledButton
                        onClick={() => handleNavigation("/")}
                        py="sm"
                    >
                        <Group>
                            <IconHome size={20}/>
                            <Text>Home</Text>
                        </Group>
                    </UnstyledButton>

                    {isAuthenticated ? (
                        <>
                            <UnstyledButton
                                onClick={() => handleNavigation("/profile")}
                                py="sm"
                            >
                                <Group>
                                    <IconUser size={20}/>
                                    <Text>Profile</Text>
                                </Group>
                            </UnstyledButton>

                            <UnstyledButton
                                onClick={() => handleNavigation("/settings")}
                                py="sm"
                            >
                                <Group>
                                    <IconSettings size={20}/>
                                    <Text>Settings</Text>
                                </Group>
                            </UnstyledButton>

                            <Divider/>

                            <UnstyledButton
                                onClick={handleLogout}
                                py="sm"
                                c="red"
                            >
                                <Group>
                                    <IconLogout size={20}/>
                                    <Text>Logout</Text>
                                </Group>
                            </UnstyledButton>
                        </>
                    ) : (
                        <>
                            <UnstyledButton
                                onClick={() => handleNavigation("/login")}
                                py="sm"
                            >
                                <Group>
                                    <IconLogin size={20}/>
                                    <Text>Login</Text>
                                </Group>
                            </UnstyledButton>

                            <UnstyledButton
                                onClick={() => handleNavigation("/register")}
                                py="sm"
                            >
                                <Group>
                                    <IconUserPlus size={20}/>
                                    <Text>Register</Text>
                                </Group>
                            </UnstyledButton>
                        </>
                    )}
                </Stack>
            </Drawer>
        </>
    );
};

export default AppHeader;