import fs from "node:fs";
import path from "node:path";

const VERSION = "2026-05-22";
const MARKER = `AI_CONTEXT_VERSION: ${VERSION}`;
const ROOT = process.cwd();
const sourceDir = path.join(ROOT, ".ai-source");

const required = [
  ".ai-source/project.md",
  ".ai-source/architecture.md",
  ".ai-source/coding-standards.md",
  ".ai-source/testing.md",
  ".ai-source/security.md",
  ".ai-source/workflows/plan-first.md",
  ".ai-source/workflows/implement-issue.md",
  ".ai-source/workflows/review-pr.md",
  ".ai-source/workflows/create-github-issue.md",
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
  ".github/instructions/project.instructions.md",
  ".github/instructions/testing.instructions.md",
  ".github/prompts/plan-issue.prompt.md",
  ".github/prompts/implement-issue.prompt.md",
  ".github/prompts/review-pr.prompt.md",
  ".github/prompts/create-github-issue.prompt.md",
  ".agents/skills",
  ".claude/skills",
  "scripts/ai-sync-context.mjs",
  "scripts/ai-doctor.mjs",
];
const generated = ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md"];
const legacyAliases = ["copilot-instructions.md", "GEMINI.md"];
const failures = [];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function readSourceJson(rel, fallback) {
  const file = path.join(sourceDir, rel);
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function listSourceSkillNames() {
  const dir = path.join(sourceDir, "skills");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

const configuredLegacyAliases = readSourceJson("legacy-aliases.json", []);
for (const rel of configuredLegacyAliases) {
  if (!required.includes(rel)) required.push(rel);
}

for (const rel of required) {
  if (!exists(rel)) failures.push(`missing ${rel}`);
}

const extraDir = path.join(sourceDir, "github-instructions");
if (fs.existsSync(extraDir)) {
  for (const file of fs.readdirSync(extraDir).sort()) {
    if (file.endsWith(".instructions.md") && !exists(path.join(".github/instructions", file))) {
      failures.push(`missing .github/instructions/${file}`);
    }
  }
}

for (const rel of [...generated, ...legacyAliases.filter(exists), ...configuredLegacyAliases]) {
  if (exists(rel) && !read(rel).includes(MARKER)) failures.push(`missing marker in ${rel}`);
}

for (const name of listSourceSkillNames()) {
  if (!exists(path.join(".agents/skills", name, "SKILL.md"))) failures.push(`missing .agents skill ${name}`);
  if (!exists(path.join(".claude/skills", name, "SKILL.md"))) failures.push(`missing .claude skill ${name}`);
}

if (!listSourceSkillNames().length) failures.push("no .ai-source skill found");

if (failures.length) {
  console.error(`AI context doctor failed for ${path.basename(ROOT)}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`AI context doctor passed for ${path.basename(ROOT)} (${MARKER})`);
