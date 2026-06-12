import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

// Flat config (ESLint 9+). Mirrors the standard Vite + React setup:
// core recommended rules plus the React hooks rules. Formatting is
// Prettier's job (see root .prettierrc), so no stylistic rules here.
export default [
  { ignores: ["dist", ".vite", "node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Core no-unused-vars doesn't count JSX usage, so component imports
      // (<Header />, <App />) get false-flagged. Ignoring capitalized names
      // is the same convention the official Vite React template uses.
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
];
