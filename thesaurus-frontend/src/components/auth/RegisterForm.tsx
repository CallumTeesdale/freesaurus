import {useContext, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {Anchor, Button, Container, Group, Paper, PasswordInput, Stack, Text, TextInput, Title,} from "@mantine/core";
import {useForm} from "@mantine/form";
import {IconAt, IconLock, IconUser} from "@tabler/icons-react";

import {AuthContext} from "../../contexts/AuthContext";
import {validateRegistrationForm} from "../../utils/validators";

interface RegisterFormValues {
    name: string;
    email: string;
    password: string;
}

const RegisterForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {register} = useContext(AuthContext);
    const navigate = useNavigate();

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
            <Paper radius="md" p="xl" withBorder>
                <Title order={2} ta="center" mb="md">
                    Create your FreeSaurus account
                </Title>
                <Text c="dimmed" size="sm" ta="center" mb="xl">
                    Fill in your details to get started
                </Text>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        <TextInput
                            withAsterisk
                            label="Name"
                            placeholder="Your name"
                            leftSection={<IconUser size={16}/>}
                            {...form.getInputProps("name")}
                        />

                        <TextInput
                            withAsterisk
                            label="Email"
                            placeholder="your@email.com"
                            leftSection={<IconAt size={16}/>}
                            {...form.getInputProps("email")}
                        />

                        <PasswordInput
                            withAsterisk
                            label="Password"
                            placeholder="Your password"
                            description="Password must be at least 6 characters with at least one letter and one number"
                            leftSection={<IconLock size={16}/>}
                            {...form.getInputProps("password")}
                        />
                    </Stack>

                    <Group justify="space-between" mt="xl">
                        <Anchor component={Link} to="/login" size="sm">
                            Already have an account? Login
                        </Anchor>
                        <Button type="submit" loading={isSubmitting}>
                            Register
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
};

export default RegisterForm;
