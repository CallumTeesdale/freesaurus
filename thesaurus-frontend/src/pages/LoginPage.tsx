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
  Divider,
  ThemeIcon,
  useMantineTheme,
  Box,
  Checkbox,
  Center,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconAt,
  IconLock,
  IconBrandGoogle,
  IconBrandFacebook,
  IconLogin,
  IconArrowRight
} from "@tabler/icons-react";

import { AuthContext } from "../contexts/AuthContext";
import { validateLoginForm } from "../utils/validators";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useMantineTheme();

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false
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
                gradient={{ from: theme.colors.blue[6], to: theme.colors.indigo[5] }}
            >
              <IconLogin size={30} />
            </ThemeIcon>
          </Center>

          <Title order={2} ta="center" mb="sm">
            Welcome back
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb="lg">
            Enter your credentials to access your FreeSaurus account
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                  withAsterisk
                  label="Email"
                  placeholder="your@email.com"
                  leftSection={<IconAt size={16} />}
                  radius="md"
                  size="md"
                  {...form.getInputProps("email")}
              />

              <PasswordInput
                  withAsterisk
                  label="Password"
                  placeholder="Your password"
                  leftSection={<IconLock size={16} />}
                  radius="md"
                  size="md"
                  {...form.getInputProps("password")}
              />

              <Group mt="xs">
                <Checkbox
                    label="Remember me"
                    {...form.getInputProps("rememberMe", { type: "checkbox" })}
                />
                <Anchor component={Link} to="/forgot-password" size="sm">
                  Forgot password?
                </Anchor>
              </Group>
            </Stack>

            <Button
                type="submit"
                fullWidth
                mt="xl"
                radius="md"
                size="md"
                loading={isSubmitting}
                rightSection={<IconArrowRight size={16} />}
                gradient={{ from: theme.colors.blue[6], to: theme.colors.indigo[5] }}
                variant="gradient"
            >
              Sign in
            </Button>
          </form>

          <Divider
              label="Or continue with"
              labelPosition="center"
              my="lg"
          />

          <Group grow mb="md" mt="md">
            <Button
                leftSection={<IconBrandGoogle size={16} />}
                variant="default"
                radius="md"
            >
              Google
            </Button>
            <Button
                leftSection={<IconBrandFacebook size={16} />}
                variant="default"
                radius="md"
            >
              Facebook
            </Button>
          </Group>

          <Text ta="center" mt="md">
            Don't have an account?{" "}
            <Anchor component={Link} to="/register" fw={700}>
              Sign up
            </Anchor>
          </Text>
        </Paper>
      </Container>
  );
};

export default LoginForm;