/**
 * Tests for CodeRabbit YAML configuration.
 *
 * Framework: This suite uses Jest/Vitest style APIs (describe/it/expect).
 * - If the repository uses Jest: these tests run as-is.
 * - If the repository uses Vitest: they also run as-is (compatible API).
 *
 * Note on parsing:
 * - We avoid adding new dependencies. If a YAML parser (js-yaml/yaml) is available in the project,
 *   structural validation will be enabled automatically. Otherwise, we fall back to robust text-based checks.
 */

import fs from "fs";
import path from "path";

let hasYamlParser = false;
let parseYaml: ((src: string) => any) | null = null;

try {
  // Try to use existing YAML parsers without introducing new deps.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const yaml = require("js-yaml");
  parseYaml = (src: string) => yaml.load(src);
  hasYamlParser = true;
} catch (_) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const YAML = require("yaml");
    parseYaml = (src: string) => YAML.parse(src);
    hasYamlParser = true;
  } catch {
    hasYamlParser = false;
  }
}

function readConfigText(): string {
  // Prefer real repo config if present; else use fixture to make tests deterministic.
  const candidates = [
    ".coderabbit.yml",
    ".coderabbit.yaml",
    "coderabbit.yml",
    "coderabbit.yaml",
    "src/__tests__/fixtures/coderabbit.yml",
  ];
  for (const p of candidates) {
    const full = path.resolve(process.cwd(), p);
    if (fs.existsSync(full)) return fs.readFileSync(full, "utf8");
  }
  throw new Error("No CodeRabbit YAML config found in repo or fixtures.");
}

function includesLine(text: string, pattern: RegExp, ctx?: string) {
  const ok = pattern.test(text);
  if (!ok) {
    throw new Error(`Expected to find pattern ${pattern} in ${ctx ?? "config text"}`);
  }
}

describe("CodeRabbit YAML config", () => {
  const text = readConfigText();

  it("uses English language", () => {
    // Anchor to beginning to avoid matching comments; allow extra spaces.
    includesLine(text, /^language:\s*en\s*$/m, "language");
  });

  describe("reviews section", () => {
    it("has profile = chill and request_changes_workflow = true", () => {
      includesLine(text, /^\s*profile:\s*"chill"\s*(#.*)?$/m, "reviews.profile");
      includesLine(text, /^\s*request_changes_workflow:\s*true\s*$/m, "reviews.request_changes_workflow");
    });

    it("enables auto_review and disables drafts", () => {
      includesLine(text, /^\s*auto_review:\s*$/m, "reviews.auto_review");
      includesLine(text, /^\s*enabled:\s*true\s*$/m, "reviews.auto_review.enabled");
      includesLine(text, /^\s*drafts:\s*false\s*$/m, "reviews.auto_review.drafts");
    });

    it("enables security scanning with all expected checks", () => {
      includesLine(text, /^\s*security_scanning:\s*$/m, "reviews.security_scanning");
      includesLine(text, /^\s*enabled:\s*true\s*$/m, "security_scanning.enabled");
      includesLine(text, /^\s*scan_dependencies:\s*true\s*$/m, "security_scanning.scan_dependencies");
      includesLine(text, /^\s*scan_secrets:\s*true\s*$/m, "security_scanning.scan_secrets");
      includesLine(text, /^\s*vulnerability_alerts:\s*true\s*$/m, "security_scanning.vulnerability_alerts");
      includesLine(text, /^\s*sast_enabled:\s*true\s*$/m, "security_scanning.sast_enabled");
    });

    it("enables AI suggestions with all key features present", () => {
      includesLine(text, /^\s*ai_suggestions:\s*$/m, "reviews.ai_suggestions");
      includesLine(text, /^\s*enabled:\s*true\s*$/m, "ai_suggestions.enabled");
      const features = [
        "code_optimization",
        "security_best_practices",
        "performance_improvements",
        "accessibility_enhancements",
        "test_coverage",
      ];
      for (const f of features) {
        includesLine(text, new RegExp(`^\\s*-\\s*${f}\\s*$`, "m"), `ai_suggestions.features: ${f}`);
      }
    });

    it("defines path-based instructions for key directories", () => {
      const paths = [
        'path: "app/**/*.tsx"',
        'path: "app/lib/actions/*.ts"',
        'path: "lib/supabase/*.ts"',
        'path: "app/(auth)/**/*.tsx"',
      ];
      for (const p of paths) {
        const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        includesLine(text, new RegExp("^\\s*" + escaped + "\\s*$", "m"), `path_instructions ${p}`);
      }
      // Spot-check representative guidance bullets
      includesLine(text, /^\s*-\s*Input validation and sanitization\s*$/m, "Server Actions guidance");
      includesLine(text, /^\s*-\s*Accessibility modifiers and ARIA attributes\s*$/m, "Next.js components guidance");
      includesLine(text, /^\s*-\s*Validate database queries\s*$/m, "Database/API guidance");
      includesLine(text, /^\s*-\s*Verify secure password handling\s*$/m, "Auth guidance");
    });

    it("assigns severity categories with expected issue types", () => {
      const critical = ["security_vulnerabilities", "memory_leaks", "authentication_bypass", "data_exposure"];
      const high = ["performance_issues", "security_misconfiguration", "insecure_dependencies"];
      const medium = ["code_style_violations", "accessibility_issues", "type_safety_concerns"];
      const low = ["documentation_missing", "code_duplication", "naming_conventions"];
      for (const item of critical) includesLine(text, new RegExp(`^\\s*-\\s*${item}\\s*$`, "m"), `severity.critical: ${item}`);
      for (const item of high) includesLine(text, new RegExp(`^\\s*-\\s*${item}\\s*$`, "m"), `severity.high: ${item}`);
      for (const item of medium) includesLine(text, new RegExp(`^\\s*-\\s*${item}\\s*$`, "m"), `severity.medium: ${item}`);
      for (const item of low) includesLine(text, new RegExp(`^\\s*-\\s*${item}\\s*$`, "m"), `severity.low: ${item}`);
    });

    it("enables code metrics with expected analyzers", () => {
      includesLine(text, /^\s*code_metrics:\s*$/m, "code_metrics");
      includesLine(text, /^\s*enabled:\s*true\s*$/m, "code_metrics.enabled");
      const metrics = [
        "cyclomatic_complexity",
        "cognitive_complexity",
        "maintainability_index",
        "code_duplication",
        "test_coverage",
      ];
      for (const m of metrics) {
        includesLine(text, new RegExp(`^\\s*-\\s*${m}\\s*$`, "m"), `code_metrics.analyze: ${m}`);
      }
    });
  });

  // Optional structural validations if a YAML parser is present
  (hasYamlParser ? describe : describe.skip)("Structural validation via YAML parser", () => {
    const doc = parseYaml!(text);

    it("has top-level language = 'en'", () => {
      expect(doc.language).toBe("en");
    });

    it("validates boolean flags and nested structures", () => {
      expect(doc.reviews.profile).toBe("chill");
      expect(doc.reviews.request_changes_workflow).toBe(true);
      expect(doc.reviews.auto_review).toEqual({ enabled: true, drafts: false });

      const sec = doc.reviews.security_scanning;
      expect(sec).toMatchObject({
        enabled: true,
        scan_dependencies: true,
        scan_secrets: true,
        vulnerability_alerts: true,
        sast_enabled: true,
      });

      expect(doc.reviews.ai_suggestions.enabled).toBe(true);
      for (const f of [
        "code_optimization",
        "security_best_practices",
        "performance_improvements",
        "accessibility_enhancements",
        "test_coverage",
      ]) {
        expect(doc.reviews.ai_suggestions.features).toContain(f);
      }
    });

    it("validates presence of all path_instructions entries", () => {
      const paths = doc.reviews.path_instructions.map((p: any) => p.path);
      for (const expected of [
        "app/**/*.tsx",
        "app/lib/actions/*.ts",
        "lib/supabase/*.ts",
        "app/(auth)/**/*.tsx",
      ]) {
        expect(paths).toContain(expected);
      }
    });

    it("validates severity categories and entries", () => {
      const sev = doc.reviews.severity;
      expect(sev.critical).toEqual(
        expect.arrayContaining(["security_vulnerabilities", "memory_leaks", "authentication_bypass", "data_exposure"])
      );
      expect(sev.high).toEqual(
        expect.arrayContaining(["performance_issues", "security_misconfiguration", "insecure_dependencies"])
      );
      expect(sev.medium).toEqual(
        expect.arrayContaining(["code_style_violations", "accessibility_issues", "type_safety_concerns"])
      );
      expect(sev.low).toEqual(
        expect.arrayContaining(["documentation_missing", "code_duplication", "naming_conventions"])
      );
    });

    it("validates code_metrics analyzers", () => {
      const cm = doc.reviews.code_metrics;
      expect(cm.enabled).toBe(true);
      for (const m of [
        "cyclomatic_complexity",
        "cognitive_complexity",
        "maintainability_index",
        "code_duplication",
        "test_coverage",
      ]) {
        expect(cm.analyze).toContain(m);
      }
    });
  });
});