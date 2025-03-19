import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Anchor,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAt, IconLock } from "@tabler/icons-react";

import { AuthContext } from "../../contexts/AuthContext";
import { validateLoginForm } from "../../utils/validators";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(value)) return "Invalid email format";
        return null;
      },
      password: (value) => {
        if (!value) return "Password is required";
        return null;
      },
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    const validation = validateLoginForm(values.email, values.password);

    if (!validation.valid) {
      Object.entries(validation.errors).forEach(([field, error]) => {
        form.setFieldError(field as keyof LoginFormValues, error);
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await login(values.email, values.password);

      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size="sm">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="md">
          Welcome back to FreeSaurus
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Enter your credentials to access your account
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              withAsterisk
              label="Email"
              placeholder="your@email.com"
              leftSection={<IconAt size={16} />}
              {...form.getInputProps("email")}
            />

            <PasswordInput
              withAsterisk
              label="Password"
              placeholder="Your password"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps("password")}
            />
          </Stack>

          <Group justify="space-between" mt="md">
            <Anchor component={Link} to="/register" size="sm">
              Don't have an account? Register
            </Anchor>
            <Button type="submit" loading={isSubmitting}>
              Login
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default LoginForm;
