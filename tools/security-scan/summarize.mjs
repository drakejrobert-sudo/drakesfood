import { appendFileSync, readFileSync } from 'node:fs';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error('missing or invalid JSON report');
  }
}

const npmSeverities = ['info', 'low', 'moderate', 'high', 'critical'];
const terraformSeverities = ['UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function readAudit(path, status, scope) {
  if (status !== '0' && status !== '1') {
    throw new Error(`${scope} audit did not complete`);
  }

  const report = readJson(path);
  const counts = report?.metadata?.vulnerabilities;
  const findings = report?.vulnerabilities;
  if (report?.error || report?.auditReportVersion !== 2 || !Number.isInteger(counts?.total) ||
      !findings || typeof findings !== 'object' || Array.isArray(findings)) {
    throw new Error(`${scope} audit returned an invalid report or a registry error`);
  }

  const packages = Object.values(findings);
  if (counts.total !== packages.length || (status === '0') !== (counts.total === 0) ||
      packages.some((finding) => !finding || typeof finding.name !== 'string' ||
        !npmSeverities.includes(finding.severity) || !Array.isArray(finding.via) ||
        !Array.isArray(finding.nodes) || finding.nodes.length === 0 ||
        finding.nodes.some((modulePath) => typeof modulePath !== 'string'))) {
    throw new Error(`${scope} audit returned inconsistent findings`);
  }

  return packages;
}

function cell(value) {
  return String(value)
    .replace(/[^\p{L}\p{N} ._@/:[\](){}=+,"'-]/gu, ' ')
    .replace(/[\[\]]/g, '\\$&');
}

function npmSection(title, packages) {
  const lines = [`### ${title} (${packages.length})`, ''];
  if (packages.length === 0) {
    return [...lines, 'No findings.', ''];
  }

  lines.push('| Package | Severity | Advisory IDs or affected dependencies |', '| --- | --- | --- |');
  for (const finding of packages) {
    const advisories = finding.via.map((reference) => {
      if (typeof reference === 'string') {
        return reference;
      }
      const identifier = reference?.url?.match(/(?:GHSA-[\w-]+|CVE-\d+-\d+)$/i)?.[0];
      return identifier ?? `npm advisory ${reference?.source ?? 'ID unavailable'}`;
    });
    lines.push(`| ${cell(finding.name)} | ${finding.severity} | ${cell(advisories.join(', '))} |`);
  }
  return [...lines, ''];
}

function npmSummary(fullPath, fullStatus, prodPath, prodStatus) {
  const full = readAudit(fullPath, fullStatus, 'Full lockfile');
  const production = readAudit(prodPath, prodStatus, 'Production dependency');
  const productionNodes = new Set(production.flatMap((finding) => finding.nodes));
  const development = full.filter((finding) => finding.nodes.some((path) => !productionNodes.has(path)));

  return [
    `Full lockfile audit reported ${full.length} affected package entries.`,
    '',
    ...npmSection('Production dependency findings', production),
    ...npmSection('Development and build dependency findings', development),
  ];
}

function terraformSummary(path, status) {
  if (status !== '0') {
    throw new Error('Trivy could not complete the configuration scan');
  }

  const report = readJson(path);
  if (report?.SchemaVersion !== 2 || !Array.isArray(report.Results) || report.Results.length === 0 ||
      report.Results.some(({ Type, MisconfSummary }) =>
        Type !== 'terraform' || !Number.isInteger(MisconfSummary?.Successes) ||
        !Number.isInteger(MisconfSummary?.Failures))) {
    throw new Error('Trivy returned an invalid or empty Terraform report');
  }

  const lines = ['| Rule | Severity | Resource | File |', '| --- | --- | --- | --- |'];
  for (const result of report.Results) {
    const findings = result.Misconfigurations ?? [];
    if (!Array.isArray(findings) || findings.length !== result.MisconfSummary.Failures) {
      throw new Error('Trivy returned inconsistent Terraform findings');
    }
    for (const finding of findings) {
      if (!finding || typeof finding.ID !== 'string' || !terraformSeverities.includes(finding.Severity) ||
          typeof result.Target !== 'string' || result.Target.startsWith('/') ||
          result.Target.split('/').includes('..')) {
        throw new Error('Trivy returned an invalid Terraform finding');
      }
      lines.push(`| ${cell(finding.ID)} | ${finding.Severity} | ${cell(finding.CauseMetadata?.Resource ?? 'Unspecified')} | ${cell(`infra/${result.Target}`)} |`);
    }
  }
  return lines.length === 2 ? ['No findings.'] : [`${lines.length - 2} findings.`, '', ...lines];
}

function workflowSummary(path, status) {
  if (status !== '0') {
    throw new Error('zizmor could not complete the workflow scan');
  }

  const report = readJson(path);
  if (!Array.isArray(report)) {
    throw new Error('zizmor returned an invalid workflow report');
  }

  const rows = [];
  for (const finding of report) {
    const rule = finding?.ident;
    const severity = finding?.determinations?.severity;
    if (typeof rule !== 'string' || !/^[a-z0-9-]+$/.test(rule) ||
        !['Informational', 'Low', 'Medium', 'High', 'Unknown'].includes(severity) ||
        !Array.isArray(finding.locations)) {
      throw new Error('zizmor returned an invalid workflow finding');
    }
    const primary = finding.locations.find((location) => location?.symbolic?.kind === 'Primary');
    const file = primary?.symbolic?.key?.Local?.verbatim_path;
    const row = primary?.concrete?.location?.start_point?.row;
    if (typeof file !== 'string' || !/^\.github\/workflows\/[\w.-]+\.ya?ml$/.test(file) ||
        !Number.isInteger(row) || row < 0) {
      throw new Error('zizmor returned an invalid workflow location');
    }
    rows.push(`| ${rule} | ${severity} | ${file}:${row + 1} |`);
  }

  return rows.length === 0
    ? ['No findings.']
    : [`${rows.length} findings.`, '', '| Rule | Severity | Location |', '| --- | --- | --- |', ...rows];
}

const scanners = {
  npm: { title: 'npm dependency audit', run: npmSummary },
  terraform: { title: 'OpenTofu configuration scan', run: terraformSummary },
  workflows: { title: 'GitHub Actions workflow scan', run: workflowSummary },
};
const [scanner, ...args] = process.argv.slice(2);
const check = Object.hasOwn(scanners, scanner) ? scanners[scanner] : undefined;
const title = check?.title ?? 'Security scan';
let summary;
try {
  if (!check) {
    throw new Error('unknown scanner');
  }
  const lines = check.run(...args);
  summary = [...lines, '', 'Advisory results for repository maintainer review.'].join('\n');
} catch (error) {
  // Keep raw diagnostics out of GitHub summaries and logs.
  summary = `Scanner error: ${error instanceof Error && error.constructor === Error ? error.message : 'unexpected report format'}.`;
  console.error(summary);
  process.exitCode = 1;
}

const markdown = `## ${title}\n\n${summary}\n`;
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
} else {
  process.stdout.write(markdown);
}
