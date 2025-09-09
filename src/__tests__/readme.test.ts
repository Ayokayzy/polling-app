/**
 * README documentation tests focused on the PR diff content.
 *
 * Testing library/framework: Uses shared global APIs compatible with both Jest and Vitest.
 * - No imports required; relies on describe/test/expect globals.
 * - Ambient declarations are included for TypeScript to avoid missing global types across setups.
 * - No new dependencies introduced.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const describe: any, test: any, it: any, expect: any, beforeAll: any, afterAll: any, beforeEach: any, afterEach: any;

import fs from "fs";
import path from "path";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsHeading(md: string, level: number, text: string): boolean {
  // eslint-disable-next-line security/detect-unsafe-regex
  const re = new RegExp(`^${"#".repeat(level)}\\s*${escapeRegExp(text)}\\s*$`, "m");
  return re.test(md);
}

function findHeadingIndex(md: string, level: number, text: string): number {
  // eslint-disable-next-line security/detect-unsafe-regex
  const re = new RegExp(`^${"#".repeat(level)}\\s*${escapeRegExp(text)}\\s*$`, "m");
  const m = re.exec(md);
  return m ? m.index : -1;
}

function extractMarkdownLinks(md: string): Array<{ text: string; url: string }> {
  const out: Array<{ text: string; url: string }> = [];
  // Use RegExp constructor to ensure proper escaping
  const re = new RegExp("\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)", "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    out.push({ text: m[1], url: m[2] });
  }
  return out;
}

function readReadme(): string {
  const candidates = [
    "README.md",
    "readme.md",
    "README.MD",
    "docs/README.md",
    // Fallback fixture path committed by this change:
    path.join("src", "__tests__", "__fixtures__", "readme.fallback.md"),
  ];
  for (const p of candidates) {
    const abs = path.resolve(process.cwd(), p);
    if (fs.existsSync(abs)) {
      try {
        const content = fs.readFileSync(abs, "utf8");
        if (content && content.trim().length > 0) return content;
      } catch {
        // Continue to next candidate
      }
    }
  }
  // Last resort: empty string (should not happen due to fixture)
  return "";
}

describe("README documentation (diff-focused)", () => {
  let md = "";

  beforeAll(() => {
    md = readReadme();
    expect(md).toBeTruthy(); // Ensure we loaded some markdown content
  });

  test("contains required primary headings in logical order", () => {
    const required = [
      { level: 1, text: "Polling App" },
      { level: 2, text: "Features" },
      { level: 2, text: "Technology Stack" },
      { level: 2, text: "Getting Started" },
      { level: 2, text: "Learn More" },
      { level: 2, text: "Deploy on Vercel" },
    ];

    const positions = required.map(h => {
      expect(containsHeading(md, h.level, h.text)).toBe(true);
      return findHeadingIndex(md, h.level, h.text);
    });

    // Verify strictly increasing order of headings
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  test("features subsections exist and include representative bullet points", () => {
    const subsections = [
      "🗳️ Poll Management",
      "📊 Voting System",
      "🔗 Poll Sharing",
      "👤 User Authentication",
      "🎨 Modern UI/UX",
    ];
    subsections.forEach(s => expect(containsHeading(md, 3, s)).toBe(true));

    const bullets = [
      "Create polls with multiple options",
      "Edit existing polls (creator only)",
      "Delete polls (creator only)",
      "One vote per user per poll",
      "Real-time vote counting with optimistic updates",
      "Visual progress bars showing vote distribution",
      "Vote validation and error handling",
      "Unique shareable URLs for each poll",
      "QR code generation for mobile access",
      "Responsive design with Tailwind CSS",
      "shadcn/ui components for consistent styling",
      "Toast notifications for user feedback",
    ];
    for (const text of bullets) {
      // eslint-disable-next-line security/detect-unsafe-regex
      const re = new RegExp(`^\\-\\s+${escapeRegExp(text)}\\s*$`, "m");
      expect(md).toMatch(re);
    }
  });

  test("technology stack lists expected items with labels", () => {
    const patterns: RegExp[] = [
      /^- \*\*Framework\*\*:\s*Next\.js 15 \(App Router\)\s*$/m,
      /^- \*\*Database\*\*:\s*Supabase with Prisma ORM\s*$/m,
      /^- \*\*Authentication\*\*:\s*Supabase Auth\s*$/m,
      /^- \*\*Styling\*\*:\s*Tailwind CSS with shadcn\/ui components\s*$/m,
      /^- \*\*Language\*\*:\s*TypeScript\s*$/m,
      /^- \*\*QR Codes\*\*:\s*qrcode library\s*$/m,
    ];
    patterns.forEach(re => expect(md).toMatch(re));
  });

  test("getting started section provides dev commands for multiple package managers", () => {
    // Ensure a fenced bash block contains all four commands
    const codeFence = /```bash[\s\S]*?```/m.exec(md)?.[0] ?? "";
    expect(codeFence).toBeTruthy();
    ["npm run dev", "yarn dev", "pnpm dev", "bun dev"].forEach(cmd => {
      expect(codeFence).toContain(cmd);
    });
  });

  test("includes localhost instruction and external links are https and unique", () => {
    // Localhost instruction
    expect(md).toMatch(/Open\s+\[?http:\/\/localhost:3000\]?\(http:\/\/localhost:3000\)?\s+with your browser to see the result\./);

    const links = extractMarkdownLinks(md);
    const urls = links.map(l => l.url);

    // Expect a known set of URLs to be present (subset check)
    const expectedUrls = [
      "http://localhost:3000",
      "https://nextjs.org/docs",
      "https://nextjs.org/learn",
      "https://github.com/vercel/next.js",
      "https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme",
      "https://nextjs.org/docs/app/building-your-application/deploying",
    ];
    expectedUrls.forEach(u => expect(urls).toContain(u));

    // Non-localhost links must be https
    const external = urls.filter(u => u !== "http://localhost:3000");
    external.forEach(u => expect(u.startsWith("https://")).toBe(true));

    // Links should be unique
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  test("no empty headings or empty list items exist", () => {
    const emptyHeading = /^\s*#{1,6}\s*$/m;
    const emptyBullet = /^\s*-\s*$/m;
    expect(emptyHeading.test(md)).toBe(false);
    expect(emptyBullet.test(md)).toBe(false);
  });

  test("mentions QR code capability in features and in tech stack", () => {
    expect(md).toMatch(/^###\s+🔗 Poll Sharing$/m);
    expect(md).toMatch(/QR code generation for mobile access/);
    expect(md).toMatch(/^- \*\*QR Codes\*\*:\s*qrcode library\s*$/m);
  });

  // Keep TS module boundaries clean in various runners
});