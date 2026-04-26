export const authAppearance = {
  variables: {
    colorPrimary: "#2d8472",
    colorBackground: "#fffdf4",
    colorText: "#111a20",
    colorTextSecondary: "#65727b",
    colorNeutral: "#65727b",
    borderRadius: "16px",
    fontFamily: "Geist, Avenir Next, ui-sans-serif, system-ui, sans-serif",
    fontWeight: {
      normal: 520,
      medium: 680,
      bold: 820
    }
  },
  elements: {
    rootBox: "authClerkRoot",
    cardBox: "authClerkCard",
    card: "authClerkInner",
    headerTitle: "authClerkTitle",
    headerSubtitle: "authClerkSubtitle",
    formButtonPrimary: "authClerkButton",
    socialButtonsBlockButton: "authClerkSocialButton",
    formFieldInput: "authClerkInput",
    footerActionLink: "authClerkLink"
  }
} as const;
