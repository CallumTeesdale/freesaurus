import {createTheme, MantineColorsTuple} from "@mantine/core";

const primary: MantineColorsTuple = [
    "#edf3ff",
    "#dee9fa",
    "#bed5f2",
    "#9abfeb",
    "#7eade5",
    "#6ca1e1",
    "#629adf",
    "#4d89cd",
    "#3a7dc6",
    "#1f6fc0",
];

export const theme = createTheme({
    primaryColor: "primary",
    primaryShade: 6,
    colors: {
        primary,
    },
    fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    headings: {
        fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontWeight: "700",
    },
    defaultRadius: "md",
    components: {
        Button: {
            defaultProps: {
                radius: "md",
            },
        },
        TextInput: {
            defaultProps: {
                radius: "md",
            },
        },
        PasswordInput: {
            defaultProps: {
                radius: "md",
            },
        },
        Card: {
            defaultProps: {
                radius: "md",
            },
        },
    },
});
