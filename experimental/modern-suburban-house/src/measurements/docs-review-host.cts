import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
const docs = path.join(root, "docs", "settings");
const rowPattern = /^\s*(@evidence(?:Exclude)?)\s+(\S+)\s+(.+)$/;
const decisionTargets = /#(?:declared-basis|source-support|fact-status)$/;
const authorityWords = [
  {
    name: "user",
    row: /\buser (?:instruction|prohibition|graph|fixed|upper|requirement|production)/,
    body: /\buser|fixed graph|upper graph/,
  },
  { name: "coordinator", row: /coordinator/, body: /coordinator/ },
  {
    name: "fixed-graph",
    row: /(?:fixed|upper) graph/,
    body: /(?:fixed|upper) graph|user graph/,
  },
  {
    name: "author-choice",
    row: /authoring (?:choice|condition|decision)/,
    body: /authoring (?:choice|condition|decision)|adopt|\bsets?\b|\bdecides?\b/,
  },
];
/** An exclusive ("only") or contrastive ("but") reason narrows its claim and needs a human read. */
const exclusive = /\b(?:only|but)\b/i;
/** Function words too common to tie an attribution to one body sentence. */
const stopwords = new Set(["with", "from", "that", "this", "into", "then", "also", "each", "them", "they", "their", "while"]);

/** Separate H2 body from evidence comments while preserving source locations.
 * @param  source */
function sections(source: string) {
    const result: Array<{ anchor:string; line:number; body:string; evidence:string; reviews:Array<{ line:number;target:string;reason:string }> }> = [];
    let current: typeof result[number] | undefined;
  let inComment = false;
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const heading = /^## .*\{#([^}]+)\}/.exec(raw);
    if (!inComment && heading) {
      current = { anchor: heading[1], line: index + 1, body: "", evidence: "", reviews: [] };
      result.push(current);
      continue;
    }
    if (!current) continue;
    let remaining = raw;
    while (remaining) {
      if (inComment) {
        const end = remaining.indexOf("-->");
        const comment = end < 0 ? remaining : remaining.slice(0, end);
        const row = rowPattern.exec(comment);
        if (/^\s*@evidence/.test(comment)) current.evidence += comment + "\n";
        if (row) current.reviews.push({
          line: index + 1,
          target: row[2],
          reason: row[3],
        });

        if (end < 0) break;
        inComment = false;
        remaining = remaining.slice(end + 3);
      } else {
        const start = remaining.indexOf("<!--");
        if (start < 0) {
          current.body += remaining + "\n";
          break;
        }
        current.body += remaining.slice(0, start) + "\n";
        inComment = true;
        remaining = remaining.slice(start + 4);
      }
    }
  }
  return result;
}

/** Measurements in a review reason must not be certified solely by its own
 * annotation. One digit labels and file numbers are outside this grammar.
 * @param  text */
function measurements(text: string) {
  return [
    ...new Set(text.match(/(?<![\w.])(?:[−-]?\d+\.\d+|\d{2,})(?![\w.])/g) ?? []),
  ];
}

/** A split attribution must be attached to the named operation in body prose.
 * Merely mentioning both authorities elsewhere in the H2 does not pay it.
 * @param  reason */
function attributions(reason: string) {
  const found = [];
  for (const clause of reason.split(/[,.;]\s*/)) {
    const match = /(.+?)\s+(?:is|are)\s+(?:an?\s+|the\s+)?(coordinator|user)\s+(?:handoff|instruction|prohibition|requirement)/.exec(
      clause,
    );
    if (!match) continue;
    for (const subject of match[1].split("·")) {
      const terms = (subject.match(/[A-Za-z]{4,}/g) ?? [])
        .map((word) => word.toLowerCase())
        .filter((word) => !stopwords.has(word));
      if (terms.length) found.push({
        authority: match[2],
        subject: subject.trim(),
        terms: terms.map((word) => word.slice(0, 4)),
      });
    }
  }
  return found;
}

function inspect(section: ReturnType<typeof sections>[number]) {
  const findings = [];
  const codeCandidates = [];
  const exclusiveCandidates = [];
  const unmeasuredCandidates = [];
  let measuredRows = 0;
  let authorityRows = 0;
  let exclusiveRows = 0;
  let otherRows = 0;
  for (const row of section.reviews) {
    const otherEvidence = section.reviews.filter((candidate) => candidate !== row)
      .map((candidate) => candidate.reason).join("\n");
    const numbers = measurements(row.reason);
    if (numbers.length) measuredRows++;
    if (!numbers.length && !decisionTargets.test(row.target) && !exclusive.test(row.reason)) {
      otherRows++;
      unmeasuredCandidates.push({
        line: row.line,
        target: row.target,
        reason: row.reason,
      });
    }
    for (const value of numbers) {
      if (section.body.includes(value)) continue;
      findings.push({
        line: row.line,
        target: row.target,
        kind: otherEvidence.includes(value)
          ? "measurement-in-evidence-only"
          : "measurement-outside-host",
        value,
      });
    }
    if (exclusive.test(row.reason)) {
      exclusiveRows++;
      exclusiveCandidates.push({
        line: row.line,
        target: row.target,
        reason: row.reason,
      });
    }
    for (const token of new Set(row.reason.match(/\b[A-Z]{2,}\b/g) ?? [])) {
      if (!section.body.includes(token)) codeCandidates.push({
        line: row.line,
        target: row.target,
        value: token,
      });
    }
    if (!decisionTargets.test(row.target)) continue;
    authorityRows++;
    for (const authority of authorityWords) {
      if (authority.row.test(row.reason) && !authority.body.test(section.body))
        findings.push({
          line: row.line,
          target: row.target,
          kind: otherEvidence.match(authority.row)
            ? "authority-in-evidence-only"
            : "authority-outside-host",
          value: authority.name,
        });
    }
    const sentences = section.body.split(/(?<=\.)\s+|\n+/);
    for (const claim of attributions(row.reason)) {
      if (!sentences.some(
        (sentence) => sentence.includes(claim.authority) && claim.terms.some((term) => sentence.toLowerCase().includes(term)),
      ))
        findings.push({
          line: row.line,
          target: row.target,
          kind: "attribution-outside-host-sentence",
          value: `${claim.subject} -> ${claim.authority}`,
        });
    }
  }
  return {
    findings,
    codeCandidates,
    exclusiveCandidates,
    unmeasuredCandidates,
    measuredRows,
    authorityRows,
    exclusiveRows,
    otherRows,
  };
}

function audit(files: Array<{ name:string;source:string }>) {
  const report = { files: files.length, h2: 0, reviewRows: 0, measuredRows: 0, authorityRows: 0, exclusiveRows: 0, otherRows: 0,
    codeCandidates: ([] as Array<{ file:string;anchor:string;line:number;target:string;value:string }>),
    exclusiveCandidates: ([] as Array<{ file:string;anchor:string;line:number;target:string;reason:string }>),
    unmeasuredCandidates: ([] as Array<{ file:string;anchor:string;line:number;target:string;reason:string }>),
    findings: ([] as Array<{ file:string;anchor:string;line:number;target:string;kind:string;value:string }>) };
  for (const file of files) for (const section of sections(file.source)) {
    report.h2++;
    report.reviewRows += section.reviews.length;
    const result = inspect(section);
    report.measuredRows += result.measuredRows;
    report.authorityRows += result.authorityRows;
    report.exclusiveRows += result.exclusiveRows;
    report.otherRows += result.otherRows;
    for (const candidate of result.codeCandidates) report.codeCandidates.push({
      file: file.name,
      anchor: section.anchor,
      ...candidate,
    });
    for (const candidate of result.exclusiveCandidates) report.exclusiveCandidates.push(
      { file: file.name, anchor: section.anchor, ...candidate },
    );
    for (const candidate of result.unmeasuredCandidates) report.unmeasuredCandidates.push(
      { file: file.name, anchor: section.anchor, ...candidate },
    );
    for (const finding of result.findings) report.findings.push({
      file: file.name,
      anchor: section.anchor,
      ...finding,
    });
  }
  return report;
}

/** Only confirmed lexical contradictions and an empty evidence population fail.
 * Candidate rows need a human semantic read; absence of a token is not proof. */
function failureCount(report: ReturnType<typeof audit>) {
  return report.findings.length + Number(report.reviewRows === 0);
}

if (require.main === module) {
  const files = fs.readdirSync(docs).filter((name) => name.endsWith(".md"))
    .map((name) => ({ name, source: fs.readFileSync(path.join(docs, name), "utf8") }));
  const report = audit(files);
  console.log(JSON.stringify({ ...report, failures: failureCount(report) }));
  if (failureCount(report)) process.exitCode = 1;
}
export { sections, measurements, attributions, inspect, audit, failureCount };
