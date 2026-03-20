"use client";

import JSZip from "jszip";
import { useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedFile {
  path: string;   // e.g. "sections/HeroSection.tsx" or "app/about/page.tsx"
  content: string;
}

interface DownloadButtonProps {
  files: GeneratedFile[];
}

// ─── Path mapper ──────────────────────────────────────────────────────────────
// Normalises whatever path your pipeline emits into the correct src/app/… tree.

function mapPath(raw: string): string {
  const p = raw.replace(/^\//, ""); // strip leading slash

  // Already fully qualified
  if (p.startsWith("src/")) return p;

  // sections/Foo.tsx  →  src/app/sections/Foo.tsx
  if (p.startsWith("sections/")) return `src/app/${p}`;

  // components/Foo.tsx  →  src/app/components/Foo.tsx
  if (p.startsWith("components/")) return `src/app/${p}`;

  // app/about/page.tsx  →  src/app/about/page.tsx
  if (p.startsWith("app/")) return `src/${p}`;

  // page.tsx / about/page.tsx  →  src/app/page.tsx / src/app/about/page.tsx
  return `src/app/${p}`;
}

// ─── Next.js boilerplate scaffold ─────────────────────────────────────────────

const SCAFFOLD: Record<string, string> = {
  "package.json": JSON.stringify(
    {
      name: "generated-site",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "14.2.5",
        react: "^18",
        "react-dom": "^18",
        "framer-motion": "^11.0.0",
        "lucide-react": "^0.400.0",
        clsx: "^2.1.0",
      },
      devDependencies: {
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        autoprefixer: "^10.0.1",
        eslint: "^8",
        "eslint-config-next": "14.2.5",
        postcss: "^8",
        tailwindcss: "^3.4.1",
        typescript: "^5",
      },
    },
    null,
    2
  ),

  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  ),

  "next.config.js": `/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
`,

  "tailwind.config.ts": `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
`,

  // Object syntax required by Next.js 14 — array syntax breaks postcss
  "postcss.config.js": `/** @type {import('postcss').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
module.exports = config;
`,

  ".eslintrc.json": JSON.stringify({ extends: "next/core-web-vitals" }, null, 2),

  ".gitignore": `.DS_Store
node_modules
/.pnp
.pnp.js
/build
/.next/
/out/
next-env.d.ts
*.tsbuildinfo
.env*.local
`,

  "src/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
`,

  "src/app/layout.tsx": `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Generated Site",
  description: "AI-generated Next.js site",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
`,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DownloadButton({ files }: DownloadButtonProps) {
  const isEmpty = files.length === 0;

  const downloadFiles = useCallback(async () => {
    if (isEmpty) return;

    const zip = new JSZip();
    const root = zip.folder("generated-site")!;

    // 1. Scaffold files
    Object.entries(SCAFFOLD).forEach(([path, content]) => {
      root.file(path, content);
    });

    // 2. Generated files — mapped to correct Next.js paths
    files.forEach((f) => {
      root.file(mapPath(f.path), f.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-site.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [files, isEmpty]);

  return (
    <button
      type="button"
      onClick={downloadFiles}
      disabled={isEmpty}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        fontSize: 12,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 500,
        borderRadius: 2,
        border: `1px solid ${isEmpty ? "var(--border-main)" : "var(--green)"}`,
        cursor: isEmpty ? "not-allowed" : "pointer",
        background: "transparent",
        color: isEmpty ? "var(--text3)" : "var(--green)",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isEmpty ? "no files" : `export next.js (${files.length})`}
    </button>
  );
}
