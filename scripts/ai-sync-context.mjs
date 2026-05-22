import fs from "node:fs";
import path from "node:path";

const VERSION = "2026-05-22";
const MARKER = `AI_CONTEXT_VERSION: ${VERSION}`;
const ROOT = process.cwd();
const sourceDir = path.join(ROOT, ".ai-source");

const legacyAliases = [
  {
    rel: "copilot-instructions.md",
    title: "Root Copilot Instructions",
    target: ".github/copilot-instructions.md",
    body: "This root-level file is kept for older tools that look outside `.github/`.",
  },
  {
    rel: "GEMINI.md",
    title: "Gemini Instructions",
    target: "AGENTS.md",
    body: "This file is kept for Gemini-style tools. Use the generated AGENTS.md entry point and `.ai-source` as canonical context.",
  },
];

function read(rel) {
  return fs.readFileSync(path.join(sourceDir, rel), "utf8").trim();
}

function write(rel, body) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body.endsWith("\n") ? body : `${body}\n`);
}

function stripTitle(md) {
  return md.replace(/^# .*\n+/, "").trim();
}

function listDirs(rel) {
  const dir = path.join(sourceDir, rel);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function copySkills(targetRoot) {
  for (const name of listDirs("skills")) {
    const body = fs.readFileSync(path.join(sourceDir, "skills", name, "SKILL.md"), "utf8");
    write(path.join(targetRoot, name, "SKILL.md"), body);
  }
}

function workflowPrompt(name, title) {
  const file = path.join(sourceDir, "workflows", `${name}.md`);
  const body = fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : "";
  return `---\ndescription: ${title}\n---\n\n# ${title}\n\n${MARKER}\nGenerated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.\n\n${stripTitle(body)}\n`;
}

function syncExtraInstructions() {
  const extraDir = path.join(sourceDir, "github-instructions");
  if (!fs.existsSync(extraDir)) return;
  for (const file of fs.readdirSync(extraDir).sort()) {
    if (file.endsWith(".instructions.md")) {
      write(path.join(".github/instructions", file), fs.readFileSync(path.join(extraDir, file), "utf8"));
    }
  }
}

function syncLegacyAliases() {
  for (const alias of legacyAliases) {
    if (!fs.existsSync(path.join(ROOT, alias.rel))) continue;
    write(
      alias.rel,
      `# ${alias.title}\n\n${MARKER}\nGenerated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.\n\n${alias.body}\n\nPrimary generated file: \`${alias.target}\`.\nCanonical source directory: \`.ai-source/\`.\n`
    );
  }
}

const project = read("project.md");
const architecture = read("architecture.md");
const standards = read("coding-standards.md");
const testing = read("testing.md");
const security = read("security.md");

write(
  "AGENTS.md",
  `# Agent Instructions\n\n${MARKER}\nGenerated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.\n\n## Project Overview\n\n${stripTitle(project)}\n\n## Architecture\n\n${stripTitle(architecture)}\n\n## Coding Standards\n\n${stripTitle(standards)}\n\n## Testing\n\n${stripTitle(testing)}\n\n## Security\n\n${stripTitle(security)}\n\n## Deeper Docs\n\n- .ai-source/project.md\n- .ai-source/architecture.md\n- .ai-source/coding-standards.md\n- .ai-source/testing.md\n- .ai-source/security.md\n- .ai-source/workflows/\n- .ai-source/skills/\n`
);

write(
  "CLAUDE.md",
  `# Claude Code Instructions\n\n${MARKER}\nGenerated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.\n\nUse .ai-source as the canonical source of truth. Start with AGENTS.md for a compact generated view, then inspect .ai-source files for deeper project-specific context.\n\n## High-Priority Behavior\n\n${stripTitle(project)}\n\n## Cautions\n\n${stripTitle(security)}\n\n## Verification\n\n${stripTitle(testing)}\n`
);

write(
  ".github/copilot-instructions.md",
  `# GitHub Copilot Instructions\n\n${MARKER}\nGenerated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.\n\nUse AGENTS.md and .ai-source as the canonical project guidance. Follow existing code patterns, keep changes small and reviewable, and run only the relevant checks for the change.\n\n## Repo-Wide Expectations\n\n${stripTitle(standards)}\n\n## Testing and Build\n\n${stripTitle(testing)}\n\n## Project-Specific Behavior\n\n${stripTitle(project)}\n\n## Security and Privacy\n\n${stripTitle(security)}\n`
);

write(
  ".github/instructions/project.instructions.md",
  `---\napplyTo: "**"\n---\n\n# Project Instructions\n\n${MARKER}\nGenerated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.\n\n${stripTitle(project)}\n`
);
write(
  ".github/instructions/testing.instructions.md",
  `---\napplyTo: "**"\n---\n\n# Testing Instructions\n\n${MARKER}\nGenerated from .ai-source. Prefer editing .ai-source files, then run scripts/ai-sync-context.mjs.\n\n${stripTitle(testing)}\n`
);

syncExtraInstructions();

write(".github/prompts/plan-issue.prompt.md", workflowPrompt("plan-first", "Plan an Issue"));
write(".github/prompts/implement-issue.prompt.md", workflowPrompt("implement-issue", "Implement an Issue"));
write(".github/prompts/review-pr.prompt.md", workflowPrompt("review-pr", "Review a Pull Request"));
write(".github/prompts/create-github-issue.prompt.md", workflowPrompt("create-github-issue", "Create a GitHub Issue"));

copySkills(".agents/skills");
copySkills(".claude/skills");
syncLegacyAliases();

console.log(`AI context synced for ${path.basename(ROOT)} (${MARKER})`);
