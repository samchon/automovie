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
const modelIds = new Map();
const ruleIds = new Set();
/** @type {Map<string, string>} */
const modelBodies = new Map();
for (const file of fs.readdirSync(path.join(docs, "models")).filter((name) => name.endsWith(".md"))) {
  for (const { anchor, body } of sections(read(`models/${file}`))) modelBodies.set(`${file}#${anchor}`, body);
}
if (process.argv.includes("--mutate-garden-casing")) {
  const key = "02-exterior-doors.md#garden-door-pair";
  const source = modelBodies.get(key);
  if (!source) throw new Error(`Missing model H2 ${key}`);
  modelBodies.set(key, source.replaceAll("`casing`", "").replaceAll("`exterior-trim`", ""));
}
for (const line of account.split(/\r?\n/)) {
  const match = /^\| \[[^\]]+\]\(\.\.\/\.\.\/models\/([^#)]+)#([^)]+)\) \| ([^|]*) \| ([^|]*) \|/.exec(line);
  if (match && match[3].includes("src/models/")) modelIds.set(`${match[1]}#${match[2]}`, new Set([...match[4].matchAll(/`([a-z0-9-]+)`/g)].map((x) => x[1])));
  if (match && match[3].includes("규칙")) ruleIds.add(`${match[1]}#${match[2]}`);
}
/** A token in one numeric paragraph is only a link candidate, not proof that
 * this particular face has a position, size, UV or nonoverlapping occupancy.
 * The exhaustive face audit reports the unresolved physical definitions.
 * @param {string} model @param {string} id */
const bodyWitness = (model, id) => {
  const body = modelBodies.get(model) ?? "";
  return body.split(/\n\s*\n/).some((paragraph) => {
    if (!paragraph.includes(`\`${id}\``)) return false;
    if (/^(?:재질 경계|표면 id|면 id|face id|id 목록)/.test(paragraph.trim())) return false;
    if (!/\d+(?:\.\d+)?\s*m|\[[−+\-.\d,\s]+\]\s*m|\d+\s*×/.test(paragraph)) return false;
    return /(?:X|Y|Z|U|V)\s*=\s*\[|길이|폭|높이|두께|지름|깊이|간격|옆판|몸통/.test(paragraph);
  });
};
const files = ["00-material-frame.md", "01-exterior.md", "02-interior-shell.md", "03-furnishings.md"];
/** Binding prose is the part of a material H2 that actually assigns its finish.
 * Later texture and contrast prose may mention a face without binding it. */
/** @param {string} body @param {string} currentAnchor */
const bindingProse = (body, currentAnchor) => {
  // Count affirmative assignments sentence by sentence. A material H2 often
  // names another finish in the following sentence ("X는 [다른 재료]를 받는다").
  // Reading the whole paragraph attributes X to both finishes.
  const sentences = body.replace(/\r\n/g, "\n").split(/(?<=다\.)\s+|\n\s*\n/);
  const assignments = sentences.filter((sentence) => {
    if (!/`[a-z][a-z0-9-]*`/.test(sentence)) return false;
    if (/아니라|받지 않는다|결합하지 않는다|별도 재료|분리한다/.test(sentence)) return false;
    // A sentence sending its named face to another material is not an
    // assignment by this H2, even though it says that face "받는다".
    const otherFinish = [...sentence.matchAll(/\]\((?:(?:\.\.\/materials\/)?([0-3][0-9]-[^#)]+\.md))?#([^)]*)\)/g)]
      .some((match) => match[1] || match[2] !== currentAnchor);
    if (otherFinish) return false;
    return /결합 면은|결합 대상은|결합 owner는|결합한다|결속한다|배정한다|(?:받는다|칠한다|도장한다)/.test(sentence);
  });
  return assignments.length ? assignments.join("\n\n") : "";
};
/** @param {string} prose @param {string} id */
const bindingHosts = (prose, id) => {
  /** @type {string[]} */
  let pending = [];
  /** @type {string[]} */
  const linked = [];
  let sinceFace = false;
  const event = /\[([^\]]+)\]\((\.\.\/models\/[^)]+|\.\.\/spaces\/[^)]+|[^)]*materials\/[^)]+|0[0-3]-[^)]*\.md#[^)]+)\)|`([a-z][a-z0-9-]*)`/g;
  for (const match of prose.matchAll(event)) {
    if (match[2]) {
      if (sinceFace) pending = [];
      sinceFace = false;
      if (match[2].startsWith("../models/") || match[2].startsWith("../spaces/")) pending.push(match[2].slice(3));
      else pending = [];
      continue;
    }
    if (match[3] !== id) {
      sinceFace = true;
      continue;
    }
    const after = prose.slice((match.index ?? 0) + match[0].length);
    // "`casing`은 [다른 재료]" is a contrast, not this material's binding.
    if (/^은\s*\[[^\]]+\]\((?:[^)]*materials\/|0[0-3]-[^)]*\.md#)/.test(after)) continue;
    linked.push(...pending);
    sinceFace = true;
  }
  return [...new Set(linked)];
};
const results = [];
const explicitInvalid = [];
const tableInvalid = [];
const unlinkedAssignments = [];
for (const file of files) {
  for (const { anchor, body } of sections(read(`materials/${file}`))) {
    if (file === "03-furnishings.md" && anchor === "minor-prop-partitions") {
      for (const line of body.split(/\r?\n/).filter((value) => value.startsWith("| ["))) {
        const [, hosts, faceCell] = line.split("|");
        if (!faceCell) continue;
        const hostNames = [...hosts.matchAll(/\]\(\.\.\/models\/([^#)]+)#([^)]+)\)/g)].map((match) => `${match[1]}#${match[2]}`);
        const faceNames = [...faceCell.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((match) => match[1]);
        for (const host of hostNames) for (const face of faceNames)
          if (!modelIds.get(host)?.has(face) || !bodyWitness(host, face))
            tableInvalid.push(`${file}#${anchor} :: ${host} :: ${face}`);
      }
    }
    // A direct "[host]의 `face` ... 받는다" assignment may occur after the
    // first binding paragraph. It must have a physical maker somewhere in
    // the cited model file; a room link in this material H2 cannot rescue it.
    for (const claim of body.matchAll(/\[[^\]]+\]\(\.\.\/models\/([^#)]+)#[^)]+\)의\s*`([a-z][a-z0-9-]*)`[^.\n]*(?:받는다|결합한다|칠한다|도장한다)/g)) {
      const maker = [...modelIds].some(([model, ids]) => model.startsWith(`${claim[1]}#`) && ids.has(claim[2]) && bodyWitness(model, claim[2]));
      if (!maker) explicitInvalid.push(`${file}#${anchor} :: ${claim[1]} :: ${claim[2]}`);
    }
    const prose = bindingProse(body, anchor);
    for (const sentence of prose.split(/\n\n/).filter(Boolean)) {
      const faceTokens = [...new Set([...sentence.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]))];
      if (faceTokens.length && !/\]\(\.\.\/(?:models|spaces)\//.test(sentence))
        unlinkedAssignments.push(`${file}#${anchor} :: ${faceTokens.join(",")} :: ${sentence.slice(0, 130)}`);
    }
    const spaceLinks = [...new Set([...body.matchAll(/\]\(\.\.\/spaces\/([^#)]+)#([^)]+)\)/g)].map((m) => `${m[1]}#${m[2]}`))];
    const ids = [...new Set([...prose.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]))].sort((a, b) => a.localeCompare(b));
    // A material can own a UV response without any separate mesh face. Keep
    // this as a separate answer, never as a missing model owner.
    const maskOnly = /독립[^.\n]*geometry와 `([a-z][a-z0-9-]*)` face id는 없다/.exec(body)?.[1];
    if (maskOnly && !ids.includes(maskOnly)) ids.push(maskOnly);
    for (const id of ids) {
      // An account id alone is not a maker: the linked physical H2 must name
      // the face in its own prose. This caught the unbuilt garden-door casing.
      const boundHosts = [...new Set(prose.split(/\n\n/).filter((sentence) => sentence.includes(`\`${id}\``))
        .flatMap((sentence) => bindingHosts(sentence, id)))];
      const boundModels = boundHosts.filter((host) => host.startsWith("models/")).map((host) => host.slice(7));
      const boundSpaces = boundHosts.filter((host) => host.startsWith("spaces/")).map((host) => host.slice(7));
      const citedMakers = boundModels.flatMap((model) => modelIds.get(model)?.has(id) ? [model]
        : ruleIds.has(model) ? [...modelIds.keys()].filter((maker) => maker.startsWith(`${model.split("#")[0]}#`) && modelIds.get(maker)?.has(id)) : []);
      const declaredLinks = [...new Set(citedMakers)];
      const owners = declaredLinks.filter((model) => bodyWitness(model, id));
      const missingWitness = declaredLinks.filter((model) => !bodyWitness(model, id));
      const declaredAnywhere = [...modelIds].filter(([, set]) => set.has(id)).map(([model]) => model);
      const mask = id === maskOnly;
      results.push({ material: `${file}#${anchor}`, id, owners, missingWitness, spaceLinks: boundSpaces.length ? boundSpaces : spaceLinks, declaredAnywhere, mask });
    }
    if (ids.length === 0) results.push({ material: `${file}#${anchor}`, id: "(no face token)", owners: [], spaceLinks, declaredAnywhere: [], mask: false });
  }
}
const unowned = results.filter((row) => row.id !== "(no face token)" && !row.mask && row.owners.length === 0 && row.spaceLinks.length === 0);
const missingModelWitness = results.filter((row) => row.id !== "(no face token)" && !row.mask && row.owners.length === 0 && row.spaceLinks.length === 0 && row.declaredAnywhere.length);
const falseLinkedMakers = results.flatMap((row) => (row.missingWitness ?? []).map((model) => `${row.material} :: ${row.id} :: ${model}`));
const allModelPairs = [...modelIds].flatMap(([model, ids]) => [...ids].map((id) => ({ model, id, witnessed: bodyWitness(model, id) })));
const summary = { materialH2: files.flatMap((file) => sections(read(`materials/${file}`))).length, tokenRows: results.length, modelResolved: results.filter((row) => row.owners.length).length, spaceCandidates: results.filter((row) => !row.owners.length && row.spaceLinks.length).length, masks: results.filter((row) => row.mask).length, unowned: unowned.length, unlinkedAssignments: unlinkedAssignments.length, falseLinkedMakers: falseLinkedMakers.length, invalidExplicitClaims: explicitInvalid.length, invalidTableClaims: tableInvalid.length, modelPairs: allModelPairs.length, unwitnessedModelPairs: allModelPairs.filter((row) => !row.witnessed).length };
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
      : row.declaredAnywhere.length ? "UNVERIFIED (면 이름만 계정에 있음)" : "UNOWNED";
    const proof = row.mask ? "독립 면 없는 UV 마스크" : row.owners.length
      ? row.owners.map(() => "면 id·숫자 단락 후보; 위치·크기·UV 별도 검토").join(", ")
      : row.spaceLinks.length ? "spaces 부재 후보; host 계정에서 대조"
      : row.declaredAnywhere.length ? "부재 위치·크기·UV 확인 필요" : "face id 없음; host 계정에서 대조";
    return `| ${link("materials", row.material)} | ${row.id === "(no face token)" ? "면 id 없음" : `\`${row.id}\``} | ${owner} | ${proof} |`;
  }),
].join("\n");
const document = `# 재료 결합 면에서 출발한 설계 owner 전수\n\n## 모든 material H2의 명명 면 역대조 {#material-face-ledger}\n<!--\n@evidence contracts/model-material-face-audit.md#model-material-face-audit 네 재료 문서의 모든 H2를 읽고 긍정 결합 문장이 있으면 그 모든 문장의 면 토큰을, 없으면 해당 H2 본문의 면 토큰을 재생성하여 모델 face 계정과 교차한다. 결합 문장에 이름 붙은 다른 재료의 면은 제외한다. UV 줄눈 마스크는 독립 메시가 없음을 별도 응답으로 남긴다. 이 표의 숫자 단락 적중은 물리 제작의 검증이 아니며 별도 면별 대조가 필요하다. 아직 없는 modelSources/materialSources 메시 결속은 unverified다.\n-->\n\n이 목록은 \`node src/measurements/material-binding-scan.cjs --check\`가 재료 H2 본문 49개와 [모델 face 계정](surface-ownership.md#model-surface-ownership)을 다시 읽어 대조한다. 결합 문장이 있는 H2에서는 모든 긍정 결합 문장을, 없는 H2에서는 본문 전체의 면 토큰을 센다. face id를 쓰지 않고 물리 부재를 부르는 H2는 [부재군 역대조](material-host-census.md#material-host-census)가 받는다. owner가 여러 개면 같은 id가 각각의 원형에서 만들어지는 것이며, 서로 한 면을 중복 생성한다는 뜻이 아니다. 표의 '단락 후보'는 같은 H2에 면 이름과 숫자가 함께 있다는 구문 대조일 뿐이다. 그 숫자가 같은 부재의 위치·크기·UV를 정하는지와 이웃 고체와 겹치지 않는지는 [면별 검토 후보 생산자](../../../src/measurements/face-witness-audit.cjs) 및 별도 기하 대조에서 확인해야 한다. 실제 메시 결속은 modelSources 이전에 unverified다.\n\n${table}\n`;
if (process.argv.includes("--write")) fs.writeFileSync(ledgerFile, document);
else if (process.argv.includes("--check")) {
  const observed = fs.readFileSync(ledgerFile, "utf8").replace(/\r\n/g, "\n");
  const check = process.argv.includes("--mutate-drop-first") ? observed.replace(/^\| \[.*\n/m, "") : observed;
  if (check !== document) {
    console.error("material face ledger differs from current producer output", JSON.stringify(summary));
    for (const row of falseLinkedMakers) console.error(`NO BODY WITNESS ${row}`);
    process.exitCode = 1;
  }
  else {
    console.log(JSON.stringify(summary));
    for (const row of unowned) console.error(`${row.declaredAnywhere.length ? "UNVERIFIED MAKER" : "UNOWNED"} ${row.material} :: ${row.id}`);
    for (const row of falseLinkedMakers) console.error(`NO NUMERIC PARAGRAPH CANDIDATE ${row}`);
    for (const row of allModelPairs.filter((pair) => !pair.witnessed))
      console.error(`MODEL FACE NEEDS REVIEW ${row.model} :: ${row.id}`);
  }
}
else if (process.argv.includes("--all-model-pairs")) console.log(JSON.stringify({ count: allModelPairs.length, unwitnessed: allModelPairs.filter((row) => !row.witnessed) }, null, 2));
else if (process.argv.includes("--json")) console.log(JSON.stringify({ summary, results, unowned, unlinkedAssignments, falseLinkedMakers, explicitInvalid, tableInvalid }, null, 2));
else {
  console.log(`material H2 ${summary.materialH2}; token rows ${summary.tokenRows}; model resolved ${summary.modelResolved}; spaces candidate ${summary.spaceCandidates}; unowned ${summary.unowned}`);
  for (const row of unowned) console.log(`UNOWNED ${row.material} :: ${row.id} (declared elsewhere: ${row.declaredAnywhere.join(", ") || "none"})`);
  for (const row of falseLinkedMakers) console.log(`NO BODY WITNESS ${row}`);
}
for (const claim of explicitInvalid) console.error(`INVALID EXPLICIT FACE CLAIM ${claim}`);
for (const claim of tableInvalid) console.error(`INVALID TABLE FACE CLAIM ${claim}`);
if (unowned.length || unlinkedAssignments.length || missingModelWitness.length || falseLinkedMakers.length || summary.unwitnessedModelPairs || explicitInvalid.length || tableInvalid.length) process.exitCode = 1;
