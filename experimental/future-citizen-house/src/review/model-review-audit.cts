// Read model acknowledgement and exclusion reasons against their containing H2
// bodies. Repeated reasons for one target and missing face addresses are alarms;
// the author's literal inspection decides whether the relationship is sound.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

type ReasonRow = { line: number; key: string; prose: string };
type Unit = { file: string; anchor: string; reasons: ReasonRow[]; body: string[]; parts: Set<string> };

function units(file: string, contents: string) {
    const first: Unit = {
    file,
    anchor: "(file)",
    reasons: [],
    body: [],
    parts: new Set(),
  };
    const result: Unit[] = [first];
  let unit = first;
  let inComment = false;
  for (const [index, line] of contents.split(/\r?\n/).entries()) {
    const heading = line.match(/^## .*\{#([^}]+)\}$/);
    if (heading) {
      unit = {
        file,
        anchor: heading[1],
        reasons: [],
        body: [],
        parts: new Set(),
      };
      result.push(unit);
    }
    if (line.trim() === "<!--") inComment = true;
    if (!inComment) {
      unit.body.push(line);
      const inventory = line.match(/^@inventory\s+[^:]+:\s*(.*)$/);
      if (inventory)
        for (const part of inventory[1].split(/,\s*/)) unit.parts.add(part);
      const part = line.match(/^\|\s*@part\s*\|[^|]*\|\s*([^| ]+)/);
      if (part) unit.parts.add(part[1]);
    }
    const ack = line.match(/^@evidence(Exclude)?\s+(\S+)\s+(.+)$/);
    if (ack)
      unit.reasons.push({
        line: index + 1,
        key: `${ack[1] || ""}:${ack[2]}`,
        prose: ack[3],
      });
    if (line.trim() === "-->") inComment = false;
  }
  return result;
}

function faceTokens(prose: string, parts: Set<string>) {
  const found = [];
  for (const token of prose.match(
    /[A-Za-z][A-Za-z0-9-]*\/[A-Za-z][A-Za-z0-9-*]*(?:\/[A-Za-z][A-Za-z0-9-*]*)*/g,
  ) || []) {
    const [part, ...faces] = token.split("/");
    if (
      part === "body" ||
      parts.has(part) ||
      (part.endsWith("-*") &&
        [...parts].some((member) => member.startsWith(part.slice(0, -1))))
    )
      for (const face of faces) found.push(`${part}/${face}`);
  }
  return found;
}

function bodyFaces(unit: ReturnType<typeof units>[number]) {
  const found = new Set();
  for (const line of unit.body) {
    for (const token of line.match(
      /[A-Za-z][A-Za-z0-9-]*\/[A-Za-z][A-Za-z0-9-*]*(?:\/[A-Za-z][A-Za-z0-9-*]*)*/g,
    ) || []) {
      const [part, ...faces] = token.split("/");
      if (
        part === "body" ||
        unit.parts.has(part) ||
        (part.endsWith("-*") &&
          [...unit.parts].some((member) =>
            member.startsWith(part.slice(0, -1)),
          ))
      )
        for (const face of faces) found.add(`${part}/${face}`);
    }
  }
  return found;
}

function audit(hosts: ReturnType<typeof units>, mode: "duplicates"|"faces") {
  const errors = [];
  let reasons = 0;
  let addresses = 0;
    const seen: Map<string, string> = new Map();
  for (const unit of hosts)
    for (const reason of unit.reasons) {
      reasons++;
      const at = `${unit.file}#${unit.anchor}:${reason.line}`;
      if (mode === "duplicates") {
        const identity = `${reason.key}\n${reason.prose}`;
        if (seen.has(identity))
          errors.push(`${at}: repeated reason from ${seen.get(identity)}`);
        else seen.set(identity, at);
        continue;
      }
      const available = bodyFaces(unit);
      for (const token of faceTokens(reason.prose, unit.parts)) {
        addresses++;
        if (!available.has(token))
          errors.push(`${at}: ${token} absent from H2 body`);
      }
    }
  if (reasons === 0)
    errors.push("no acknowledgement or exclusion reasons found");
  if (mode === "faces" && addresses === 0)
    errors.push("no model face addresses found in reasons");
  return { reasons, addresses, errors };
}

if (
  process.argv.includes("--fixture-duplicates") ||
  process.argv.includes("--fixture-faces")
) {
    const fixture = (reason: string, face: string) =>
    units(
      "fixture.md",
      `## First {#first}\n<!--\n@evidence settings/a.md#x ${reason}\n-->\n@inventory state: body\nThe body/outer surface is exposed.\n## Second {#second}\n<!--\n@evidence settings/a.md#x ${face}\n-->\n@inventory state: body\nThe body/outer surface is exposed.`,
    );
  const duplicates = process.argv.includes("--fixture-duplicates");
  const mode = duplicates ? "duplicates" : "faces";
  const green = audit(
    fixture(
      "A storage destination exists.",
      "The `body/outer` surface is exposed.",
    ),
    mode,
  );
  const red = audit(
    fixture(
      "A storage destination exists.",
      duplicates
        ? "A storage destination exists."
        : "The `body/inner` surface is exposed.",
    ),
    mode,
  );
  if (green.errors.length || red.errors.length !== 1)
    throw Error(
      `${mode} fixture did not separate green/red: ${JSON.stringify({ green, red })}`,
    );
  const excluded = audit(
    units(
      "excluded.md",
      "## Excluded {#excluded}\n<!--\n@evidenceExclude settings/a.md#x No host owns this state.\n-->",
    ),
    "duplicates",
  );
  const differentTargets = audit(
    units(
      "targets.md",
      "## Targets {#targets}\n<!--\n@evidence settings/a.md#x The state is fixed.\n@evidence settings/b.md#x The state is fixed.\n-->",
    ),
    "duplicates",
  );
  const empty = audit(units("empty.md", "## Empty {#empty}"), mode);
  if (
    excluded.reasons !== 1 ||
    excluded.errors.length ||
    differentTargets.errors.length ||
    empty.errors.length !== (duplicates ? 1 : 2)
  )
    throw Error(
      `${mode} fixture lost exclusion, target identity, or empty-population checks`,
    );
  console.log(
    `model review ${mode} fixture: green 0, mutation red ${red.errors.length}`,
  );
} else {
  const mode = process.argv.includes("--faces") ? "faces" : "duplicates";
  const files = fs
    .readdirSync(path.join(root, "docs/models"))
    .filter((name) => /^\d{3}-.+\.md$/.test(name));
  const extra =
    mode === "duplicates"
      ? [
          "docs/accounts/models/legacy-fitout.md",
          "docs/contracts/model-fitout-handoff.md",
        ]
      : [];
  const hosts = [
    ...files.map((name) => `docs/models/${name}`),
    ...extra,
  ].flatMap((file) =>
    units(file, fs.readFileSync(path.join(root, file), "utf8")),
  );
  const result = audit(hosts, mode);
  for (const error of result.errors) console.error(error);
  console.log(
    `model evidence ${mode}: ${result.reasons} reasons, ${result.addresses} face tokens, ${result.errors.length} errors`,
  );
  if (result.errors.length) process.exitCode = 1;
}
