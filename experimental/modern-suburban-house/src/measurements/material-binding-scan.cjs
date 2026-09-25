/** Inverse material census. Reads every authored material H2, including prose
 * outside its first binding sentence. It reports every lower-case code token
 * and the design H2s that actually declare that face id. It intentionally
 * refuses to infer a maker merely from a nearby Markdown link. */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const docs = path.join(root, "docs");
/** @param {string} name */
const read = (name) => fs.readFileSync(path.join(docs, name), "utf8");
/** @param {string} source */
const sections = (source) => {
  const result = [];
  for (const part of source.split(/^## /m).slice(1)) {
    const end = part.indexOf("\n");
    const heading = part.slice(0, end);
    const anchor = /\{#([^}]+)\}/.exec(heading)?.[1];
    if (!anchor) throw new Error(`H2 without anchor: ${heading}`);
    result.push({ anchor, body: part.slice(end + 1).replace(/<!--[\s\S]*?-->/g, "") });
  }
  return result;
};
const account = read("accounts/models/surface-ownership.md");
const hostAccount = read("accounts/models/material-host-census.md");
const modelIds = new Map();
const modelBodies = new Map();
for (const file of fs.readdirSync(path.join(docs, "models")).filter((name) => name.endsWith(".md"))) {
  for (const { anchor, body } of sections(read(`models/${file}`))) modelBodies.set(`${file}#${anchor}`, body);
}
if (process.argv.includes("--mutate-garden-casing")) {
  const key = "02-exterior-doors.md#garden-door-pair";
  modelBodies.set(key, modelBodies.get(key).replaceAll("`casing`", "").replaceAll("`exterior-trim`", ""));
}
for (const line of account.split(/\r?\n/)) {
  const match = /^\| \[[^\]]+\]\(\.\.\/\.\.\/models\/([^#)]+)#([^)]+)\) \| ([^|]*) \| ([^|]*) \|/.exec(line);
  if (match && match[3].includes("src/models/")) modelIds.set(`${match[1]}#${match[2]}`, new Set([...match[4].matchAll(/`([a-z0-9-]+)`/g)].map((x) => x[1])));
}
// A face name sometimes lives in a separate surface H2. Require its physical
// H2 to describe the named part and a dimension, rather than accepting only
// the surface table. These aliases are reviewed prose, not inferred geometry.
/** @type {Record<string, RegExp>} */
const semanticPart = {
  frame: /창틀|frame/,
  mullion: /세로.*(?:칸|부재)|mullion/,
  muntin: /살대/,
  sash: /sash|창짝/,
  glass: /유리/,
  jamb: /문설주|jamb/,
  "leaf-exterior": /문짝/,
  "leaf-interior": /문짝/,
  "leaf-edge": /문짝/,
  leaf: /문짝/,
  "leaf-panel": /패널/,
  handle: /손잡이/,
  rail: /트랙|레일/,
  "casing-a": /문선|casing/,
  "casing-b": /문선|casing/,
  "jamb-a": /문설주|jamb/,
  "jamb-b": /문설주|jamb/,
  "jamb-core": /문설주|jamb/,
  baluster: /난간살|baluster/,
  hinge: /경첩|hinge/,
};
/** @param {string} model @param {string} id */
const bodyWitness = (model, id) => {
  const body = modelBodies.get(model) ?? "";
  return /\d+(?:\.\d+)?\s*m|\d+\s*×/.test(body) &&
    (body.includes(`\`${id}\``) || (semanticPart[id]?.test(body) ?? false));
};
const files = ["00-material-frame.md", "01-exterior.md", "02-interior-shell.md", "03-furnishings.md"];
const results = [];
for (const file of files) {
  for (const { anchor, body } of sections(read(`materials/${file}`))) {
    const accountLine = hostAccount.split(/\r?\n/).find((line) => line.startsWith(`| [${anchor}](../../materials/${file}#${anchor}) |`)) ?? "";
    const modelLinks = [...new Set([...`${body}\n${accountLine}`.matchAll(/\]\((?:\.\.\/)?\.\.\/models\/([^#)]+)#([^)]+)\)/g)].map((m) => `${m[1]}#${m[2]}`))];
    const spaceLinks = [...new Set([...body.matchAll(/\]\(\.\.\/spaces\/([^#)]+)#([^)]+)\)/g)].map((m) => `${m[1]}#${m[2]}`))];
    const ids = [...new Set([...body.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]))].sort((a, b) => a.localeCompare(b));
    for (const id of ids) {
      // An account id alone is not a maker: the linked physical H2 must name
      // the face in its own prose. This caught the unbuilt garden-door casing.
      const declaredLinks = modelLinks.filter((model) => modelIds.get(model)?.has(id));
      const owners = declaredLinks.filter((model) => bodyWitness(model, id));
      const missingWitness = declaredLinks.filter((model) => !bodyWitness(model, id));
      const declaredAnywhere = [...modelIds].filter(([, set]) => set.has(id)).map(([model]) => model);
      const mask = id === "grout" && /(?:별도|독립).*(?:geometry|face id).*(?:없|요구하지 않)/s.test(body);
      results.push({ material: `${file}#${anchor}`, id, owners, missingWitness, spaceLinks, declaredAnywhere, mask });
    }
    if (ids.length === 0) results.push({ material: `${file}#${anchor}`, id: "(no face token)", owners: [], spaceLinks, declaredAnywhere: [], mask: false });
  }
}
const unowned = results.filter((row) => row.id !== "(no face token)" && !row.mask && row.owners.length === 0 && row.spaceLinks.length === 0);
const missingModelWitness = results.filter((row) => row.id !== "(no face token)" && !row.mask && row.owners.length === 0 && row.spaceLinks.length === 0 && row.declaredAnywhere.length);
const falseLinkedMakers = results.flatMap((row) => (row.missingWitness ?? []).map((model) => `${row.material} :: ${row.id} :: ${model}`));
const summary = { materialH2: files.flatMap((file) => sections(read(`materials/${file}`))).length, tokenRows: results.length, modelResolved: results.filter((row) => row.owners.length).length, spaceCandidates: results.filter((row) => !row.owners.length && row.spaceLinks.length).length, masks: results.filter((row) => row.mask).length, unowned: unowned.length, falseLinkedMakers: falseLinkedMakers.length };
const ledgerFile = path.join(docs, "accounts/models/material-face-ledger.md");
/** @param {string} kind @param {string} id */
const link = (kind, id) => `[${id}](../../${kind}/${id})`;
const table = [
  "| material H2 | face id 또는 응답 | 만드는 설계 owner | 본문 증거 |",
  "|---|---|---|---|",
  ...results.map((row) => {
    const owner = row.mask ? link("materials", "02-interior-shell.md#tile-grout") + " (UV 마스크, 독립 면 없음)"
      : row.owners.length ? row.owners.map((id) => link("models", id)).join(", ")
      : row.spaceLinks.length ? row.spaceLinks.map((id) => link("spaces", id)).join(", ")
      : row.id === "(no face token)" ? "[H2별 부재군 계정](material-host-census.md#material-host-census) (면 id 없음)"
      : "UNOWNED";
    const proof = row.mask ? "독립 면 없는 UV 마스크" : row.owners.length
      ? row.owners.map((id) => modelBodies.get(id).includes(`\`${row.id}\``) ? "face id·치수" : "부재 이름·치수").join(", ")
      : row.spaceLinks.length ? "spaces 부재 후보; host 계정에서 대조" : "face id 없음; host 계정에서 대조";
    return `| ${link("materials", row.material)} | ${row.id === "(no face token)" ? "면 id 없음" : `\`${row.id}\``} | ${owner} | ${proof} |`;
  }),
].join("\n");
const document = `# 재료 결합 면에서 출발한 설계 owner 전수\n\n## 모든 material H2의 명명 면 역대조 {#material-face-ledger}\n<!--\n@evidence contracts/surface-ownership.md#whole-surface-owner 네 재료 문서의 모든 H2 본문에서 명명된 소문자 면 토큰을 생산자가 재생성하고 실제 모델 face 계정과 교차한다. UV 줄눈 마스크는 독립 메시가 없음을 별도 응답으로 남긴다. 이것은 설계 owner 계정이며 아직 없는 modelSources/materialSources 메시 결속은 unverified다.\n-->\n\n이 목록은 \`node src/measurements/material-binding-scan.cjs --check\`가 재료 H2 본문 49개와 [모델 face 계정](surface-ownership.md#model-surface-ownership)을 다시 읽어 대조한다. face id를 쓰지 않고 물리 부재를 부르는 H2는 [부재군 역대조](material-host-census.md#material-host-census)가 받는다. owner가 여러 개면 같은 id가 각각의 원형에서 만들어지는 것이며, 서로 한 면을 중복 생성한다는 뜻이 아니다. 표의 본문 증거는 해당 물리 원형 H2의 면 id 또는 검토한 동의어와 치수에서 산출한다. 모델 원형이 아직 구현되지 않아 실제 메시 결속은 unverified다.\n\n${table}\n`;
if (process.argv.includes("--write")) fs.writeFileSync(ledgerFile, document);
else if (process.argv.includes("--check")) {
  const observed = fs.readFileSync(ledgerFile, "utf8").replace(/\r\n/g, "\n");
  const check = process.argv.includes("--mutate-drop-first") ? observed.replace(/^\| \[.*\n/m, "") : observed;
  if (check !== document) {
    console.error("material face ledger differs from current producer output", JSON.stringify(summary));
    for (const row of falseLinkedMakers) console.error(`NO BODY WITNESS ${row}`);
    process.exitCode = 1;
  }
  else console.log(JSON.stringify(summary));
}
else if (process.argv.includes("--json")) console.log(JSON.stringify({ summary, results, unowned, falseLinkedMakers }, null, 2));
else {
  console.log(`material H2 ${summary.materialH2}; token rows ${summary.tokenRows}; model resolved ${summary.modelResolved}; spaces candidate ${summary.spaceCandidates}; unowned ${summary.unowned}`);
  for (const row of unowned) console.log(`UNOWNED ${row.material} :: ${row.id} (declared elsewhere: ${row.declaredAnywhere.join(", ") || "none"})`);
  for (const row of falseLinkedMakers) console.log(`NO BODY WITNESS ${row}`);
}
if (unowned.length || missingModelWitness.length || falseLinkedMakers.length) process.exitCode = 1;
