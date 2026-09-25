/** Compare every reviewed settings H2's reason with the body that owns it.
 *
 * This is a necessary lexical check, not a semantic evidence verdict. A reason
 * can be false even when its words occur in the body, and an absent word can be
 * a valid paraphrase. Only an explicit authority attributed to an H2's own
 * decision, or a measurement available solely in its evidence comment, blocks
 * this command. The remaining candidates and the unchecked population are
 * printed for literal review. No particular heading or evidence target is
 * built into the grammar. */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const docs = path.join(root, "docs", "settings");
const rowPattern = /^\s*(@evidence(?:Exclude)?Review)\s+(\S+)\s+#[a-f\d]{7}\s+(.+)$/;
const decisionTargets = /#(?:declared-basis|source-support|fact-status)$/;
const authorityWords = [
  {
    name: "user",
    row: /사용자 (?:지시|금지|그래프|고정|상층|요구|제작)/,
    body: /사용자|고정 그래프|상층 그래프/,
  },
  { name: "coordinator", row: /조정자/, body: /조정자/ },
  {
    name: "fixed-graph",
    row: /(?:고정|상층) 그래프/,
    body: /(?:고정|상층) 그래프|사용자 그래프/,
  },
  {
    name: "author-choice",
    row: /저작 (?:선택|조건|결정)/,
    body: /저작 (?:선택|조건|결정)|채택|정한다|정했다/,
  },
];

/** Separate H2 body from evidence comments while preserving source locations.
 * @param {string} source */
function sections(source) {
  /** @type {Array<{ anchor:string; line:number; body:string; evidence:string; reviews:Array<{ line:number;target:string;reason:string }> }>} */
  const result = [];
  /** @type {typeof result[number] | undefined} */
  let current;
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
        if (row) current.reviews.push({
          line: index + 1,
          target: row[2],
          reason: row[3],
        });
        else if (/^\s*@evidence/.test(
          comment,
        )) current.evidence += comment + "\n";
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
 * @param {string} text */
function measurements(text) {
  return [
    ...new Set(text.match(/(?<![\w.])(?:[−-]?\d+\.\d+|\d{2,})(?![\w.])/g) ?? []),
  ];
}

/** A split attribution must be attached to the named operation in body prose.
 * Merely mentioning both authorities elsewhere in the H2 does not pay it.
 * @param {string} reason */
function attributions(reason) {
  const found = [];
  for (const clause of reason.split(/[,.;]\s*/)) {
    const match = /(.+?)(?:은|는)\s*(조정자|사용자)\s*(?:인계|지시|금지|요구)/.exec(
      clause,
    );
    if (!match) continue;
    for (const subject of match[1].split("·")) {
      const terms = subject.match(/[가-힣]{2,}/g) ?? [];
      if (terms.length) found.push({
        authority: match[2],
        subject: subject.trim(),
        terms: terms.map((word) => word.slice(0, 2)),
      });
    }
  }
  return found;
}

/** @param {ReturnType<typeof sections>[number]} section */
function inspect(section) {
  const findings = [];
  const codeCandidates = [];
  const exclusiveCandidates = [];
  const unmeasuredCandidates = [];
  let measuredRows = 0;
  let authorityRows = 0;
  let exclusiveRows = 0;
  let otherRows = 0;
  for (const row of section.reviews) {
    const numbers = measurements(row.reason);
    if (numbers.length) measuredRows++;
    if (!numbers.length && !decisionTargets.test(row.target) && !/[^\s]+만\s/.test(row.reason)) {
      otherRows++;
      unmeasuredCandidates.push({ line: row.line, target: row.target, reason: row.reason });
    }
    for (const value of numbers) {
      if (section.body.includes(value)) continue;
      findings.push({
        line: row.line,
        target: row.target,
        kind: section.evidence.includes(value)
          ? "measurement-in-evidence-only"
          : "measurement-outside-host",
        value,
      });
    }
    if (/[^\s]+만\s/.test(row.reason)) {
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
          kind: section.evidence.match(authority.row)
            ? "authority-in-evidence-only"
            : "authority-outside-host",
          value: authority.name,
        });
    }
    const sentences = section.body.split(/(?<=다\.)\s+|\n+/);
    for (const claim of attributions(row.reason)) {
      if (!sentences.some(
        (sentence) => sentence.includes(claim.authority) && claim.terms.some((term) => sentence.includes(term)),
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

/** @param {Array<{ name:string;source:string }>} files */
function audit(files) {
  const report = { files: files.length, h2: 0, reviewRows: 0, measuredRows: 0, authorityRows: 0, exclusiveRows: 0, otherRows: 0,
    codeCandidates: /** @type {Array<{ file:string;anchor:string;line:number;target:string;value:string }>} */ ([]),
    exclusiveCandidates: /** @type {Array<{ file:string;anchor:string;line:number;target:string;reason:string }>} */ ([]),
    unmeasuredCandidates: /** @type {Array<{ file:string;anchor:string;line:number;target:string;reason:string }>} */ ([]),
    findings: /** @type {Array<{ file:string;anchor:string;line:number;target:string;kind:string;value:string }>} */ ([]) };
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

if (require.main === module) {
  const files = fs.readdirSync(docs).filter((name) => name.endsWith(".md"))
    .map((name) => ({ name, source: fs.readFileSync(path.join(docs, name), "utf8") }));
  const report = audit(files);
  console.log(JSON.stringify({ ...report, failures: report.findings.length }));
  if (!report.reviewRows || report.findings.length || report.otherRows) process.exitCode = 1;
}
module.exports = { sections, measurements, attributions, inspect, audit };
