import {useContext, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {
    Anchor,
    Box,
    Button,
    Center,
    Container,
    Divider,
    Group,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
    useMantineTheme,
} from "@mantine/core";
import {useForm} from "@mantine/form";
import {
    IconArrowRight,
    IconAt,
    IconBrandFacebook,
    IconBrandGoogle,
    IconLock,
    IconUser,
    IconUserPlus
} from "@tabler/icons-react";

import {AuthContext} from "../contexts/AuthContext";
import {validateRegistrationForm} from "../utils/validators";

interface RegisterFormValues {
    name: string;
    email: string;
    password: string;
}

const RegisterPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {register, isAuthenticated} = useContext(AuthContext);
    const navigate = useNavigate();
    const theme = useMantineTheme();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/", {replace: true});
        }
    }, [isAuthenticated, navigate]);

    const form = useForm<RegisterFormValues>({
        initialValues: {
            name: "",
            email: "",
            password: "",
        },
        validate: {
            name: (value) => {
                if (!value) return "Name is required";
                if (value.length < 2) return "Name must be at least 2 characters long";
                return null;
            },
            email: (value) => {
                if (!value) return "Email is required";
                if (!/^\S+@\S+\.\S+$/.test(value)) return "Invalid email format";
                return null;
            },
            password: (value) => {
                if (!value) return "Password is required";
                if (value.length < 6)
                    return "Password must be at least 6 characters long";
                if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
                    return "Password must include at least one letter and one number";
                }
                return null;
            },
        },
    });

    const handleSubmit = async (values: RegisterFormValues) => {
        const validation = validateRegistrationForm(
            values.name,
            values.email,
            values.password,
        );

        if (!validation.valid) {
            Object.entries(validation.errors).forEach(([field, error]) => {
                form.setFieldError(field as keyof RegisterFormValues, error);
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await register(values.name, values.email, values.password);
            navigate("/");
        } catch (error: any) {
            console.error("Registration error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container size="sm">
            <Paper
                radius="md"
                p="xl"
                withBorder
                shadow="md"
                style={{
                    background: "white",
                    overflow: "hidden",
                    position: "relative"
                }}
            >
                <Box
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 6,
                        background: `linear-gradient(90deg, ${theme.colors.blue[6]} 0%, ${theme.colors.indigo[5]} 100%)`
                    }}
                />

                <Center mb="xl">
                    <ThemeIcon
                        size={60}
                        radius="xl"
                        variant="gradient"
                        gradient={{from: theme.colors.blue[6], to: theme.colors.indigo[5]}}
                    >
                        <IconUserPlus size={30}/>
                    </ThemeIcon>
                </Center>

                <Title order={2} ta="center" mb="sm">
                    Create your account
                </Title>
                <Text c="dimmed" size="sm" ta="center" mb="lg">
                    Join FreeSaurus to track your progress and save your favorite words
                </Text>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        <TextInput
                            withAsterisk
                            label="Name"
                            placeholder="Your name"
                            leftSection={<IconUser size={16}/>}
                            radius="md"
                            size="md"
                            {...form.getInputProps("name")}
                        />

                        <TextInput
                            withAsterisk
                            label="Email"
                            placeholder="your@email.com"
                            leftSection={<IconAt size={16}/>}
                            radius="md"
                            size="md"
                            {...form.getInputProps("email")}
                        />

                        <PasswordInput
                            withAsterisk
                            label="Password"
                            placeholder="Your password"
                            description="Password must be at least 6 characters with at least one letter and one number"
                            leftSection={<IconLock size={16}/>}
                            radius="md"
                            size="md"
                            {...form.getInputProps("password")}
                        />
                    </Stack>

                    <Button
                        type="submit"
                        fullWidth
                        mt="xl"
                        radius="md"
                        size="md"
                        loading={isSubmitting}
                        rightSection={<IconArrowRight size={16}/>}
                        gradient={{from: theme.colors.blue[6], to: theme.colors.indigo[5]}}
                        variant="gradient"
                    >
                        Create account
                    </Button>
                </form>

                <Divider
                    label="Or continue with"
                    labelPosition="center"
                    my="lg"
                />

                <Group grow mb="md" mt="md">
                    <Button
                        leftSection={<IconBrandGoogle size={16}/>}
                        variant="default"
                        radius="md"
                    >
                        Google
                    </Button>
                    <Button
                        leftSection={<IconBrandFacebook size={16}/>}
                        variant="default"
                        radius="md"
                    >
                        Facebook
                    </Button>
                </Group>

                <Text ta="center" mt="md">
                    Already have an account?{" "}
                    <Anchor component={Link} to="/login" fw={700}>
                        Sign in
                    </Anchor>
                </Text>
            </Paper>
        </Container>
    );
};

export default RegisterPage;