import { ReactNode } from "react";
import { Box, Center, Loader, Stack, Text } from "@mantine/core";

interface LoadingOverlayProps {
  loading: boolean;
  children: ReactNode;
  text?: string;
  fullPage?: boolean;
  minHeight?: number | string;
}

const LoadingOverlay = ({
  loading,
  children,
  text = "Loading...",
  fullPage = false,
  minHeight = 200,
}: LoadingOverlayProps) => {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <Box
      pos="relative"
      mih={minHeight}
      style={{ height: fullPage ? "100vh" : "auto" }}
    >
      <Center style={{ height: "100%" }}>
        <Stack align="center">
          <Loader size="lg" />
          {text && (
            <Text size="sm" c="dimmed" ta="center">
              {text}
            </Text>
          )}
        </Stack>
      </Center>
    </Box>
  );
};

export default LoadingOverlay;
