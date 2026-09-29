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
    result.push({
      anchor,
      body: part.slice(end + 1).replace(/<!--[\s\S]*?-->/g, ""),
    });
  }
  return result;
};
const account = read("accounts/models/surface-ownership.md");
const modelIds = new Map();
const ruleIds = new Set();
/** @type {Map<string, string>} */
const modelBodies = new Map();
for (const file of fs.readdirSync(path.join(docs, "models")).filter((name) =>
  name.endsWith(".md"),
)) {
  for (const { anchor, body } of sections(
    read(`models/${file}`),
  )) modelBodies.set(`${file}#${anchor}`, body);
}
for (const line of account.split(/\r?\n/)) {
  const match = /^\| \[[^\]]+\]\(\.\.\/\.\.\/models\/([^#)]+)#([^)]+)\) \| ([^|]*) \| ([^|]*) \|/.exec(
    line,
  );
  if (match && match[3].includes("src/models/")) modelIds.set(
    `${match[1]}#${match[2]}`,
    new Set([...match[4].matchAll(/`([a-z0-9-]+)`/g)].map((x) => x[1])),
  );
  if (match && match[3].includes("규칙")) ruleIds.add(
    `${match[1]}#${match[2]}`,
  );
}
/** A face binding requires its cited H2 body to name the id. The separate
 * face-witness audit selects ids whose part measurements need manual review.
 * @param {string} model @param {string} id */
const bodyWitness = (model, id) => {
  const body = modelBodies.get(model) ?? "";
  return body.includes(`\`${id}\``);
};
const files = fs.readdirSync(path.join(docs, "materials"))
  .filter((name) => name.endsWith(".md"))
  .sort((a, b) => a.localeCompare(b));
/** Material tables and affirmative clauses can assign a face to another
 * material H2. Resolve the destination before counting that H2's faces. */
/** @type {Map<string, Map<string, Set<string>>>} */
const crossBindings = new Map();
const ambiguousBindingTables = [];
/** @param {string} material @param {string} face @param {string} host */
const crossBind = (material, face, host) => {
  let faces = crossBindings.get(material);
  if (!faces) {
    faces = new Map();
    crossBindings.set(material, faces);
  }
  let hosts = faces.get(face);
  if (!hosts) {
    hosts = new Set();
    faces.set(face, hosts);
  }
  hosts.add(host);
};
for (const file of files) for (const { anchor, body } of sections(
  read(`materials/${file}`),
)) {
  for (const line of body.split(/\r?\n/).filter((value) =>
    /^\|\s*\[/.test(value),
  )) {
    const cells = line.split("|");
    if (cells.length < 4) continue;
    const hosts = [...cells[1].matchAll(/\]\(\.\.\/models\/([^#)]+)#([^)]+)\)/g)]
      .map((match) => `${match[1]}#${match[2]}`);
    const faceGroups = cells[2].split("/").map((group) =>
      [...group.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((match) => match[1]),
    );
    const faces = faceGroups.flat();
    const materialLink = /\]\((?:([0-3][0-9]-[^#)]+\.md))?#([^)]+)\)/g;
    const destinationGroups = cells[3].split("/").map((group) =>
      [...group.matchAll(materialLink)].map(
        (match) => `${match[1] || file}#${match[2]}`,
      ),
    );
    const destinations = destinationGroups.flat();
    if (destinations.length === 1) {
      for (const face of faces) for (const host of hosts) crossBind(
        destinations[0],
        face,
        host,
      );
    } else if (destinationGroups.length === faceGroups.length && faceGroups.length > 1) {
      destinationGroups.forEach((group, index) => {
        for (const destination of group) for (const face of faceGroups[index]) for (const host of hosts)
          crossBind(destination, face, host);
      });
    } else if (/순번별/.test(cells[3]) && destinations.length === hosts.length && faces.length === 1) {
      destinations.forEach((destination, index) =>
        crossBind(destination, faces[0], hosts[index]),
      );
    } else if (/인스턴스별/.test(cells[3]) && hosts.length === 1) {
      for (const destination of destinations) for (const face of faces) crossBind(
        destination,
        face,
        hosts[0],
      );
    } else if (destinations.length > 1 && hosts.length && faces.length) {
      ambiguousBindingTables.push(`${file}#${anchor} :: ${line}`);
    }
  }
  // Clauses of the form "`face`는 [host]·[host]의 금속부" bind every
  // cited host. A following contrast clause must not inherit those links.
  for (const clause of body.split(/(?<=다\.)\s+|,\s*/)) {
    if (/아니라|받지 않는다|결합하지 않는다/.test(clause)) continue;
    const lead = /`([a-z][a-z0-9-]*)`(?:은|는)\s*/.exec(clause);
    if (!lead || !/(?:금속부|마감부|결합부|이다|받는다)/.test(clause.slice(lead.index))) continue;
    const hosts = [...clause.slice(lead.index).matchAll(/\]\(\.\.\/models\/([^#)]+)#([^)]+)\)/g)]
      .map((match) => `${match[1]}#${match[2]}`);
    for (const host of hosts) crossBind(`${file}#${anchor}`, lead[1], host);
  }
  // A material paragraph can send one face to another linked finish in the
  // same clause. Resolve the links and face token, not the Korean copula:
  // both "`face`는 [finish]다" and "`face`는 [finish]를 받는다" assign it.
  for (const clause of body.split(/(?<=다\.)\s+|,\s*/)) {
    if (/아니라|받지 않는다|결합하지 않는다/.test(clause)) continue;
    const hostLinks = [
      ...clause.matchAll(/\]\(\.\.\/models\/([^#)]+)#([^)]+)\)/g),
    ];
    for (const assignment of clause.matchAll(
      /`([a-z][a-z0-9-]*)`(?:은|는)\s*\[[^\]]+\]\((?:(0[0-3]-[^#)]+\.md))?#([^)]+)\)/g,
    )) {
      const destination = `${assignment[2] || file}#${assignment[3]}`;
      const before = hostLinks.filter(
        (host) => (host.index ?? 0) < (assignment.index ?? 0),
      );
      const hosts = before.length
        ? before
        : hostLinks.filter(
            (host) => (host.index ?? 0) > (assignment.index ?? 0),
          );
      for (const host of hosts) crossBind(
        destination,
        assignment[1],
        `${host[1]}#${host[2]}`,
      );
    }
  }
}
/** Binding prose is the part of a material H2 that actually assigns its finish.
 * Later texture and contrast prose may mention a face without binding it. */
/** @param {string} body @param {string} currentAnchor */
const bindingProse = (body, currentAnchor) => {
  // Count affirmative assignments sentence by sentence. A material H2 often
  // names another finish in the following sentence ("X는 [다른 재료]를 받는다").
  // Reading the whole paragraph attributes X to both finishes.
  const sentences = body.replace(/\r\n/g, "\n").split(/(?<=다\.)\s+|\n\s*\n/);
  const assignments = sentences.map((sentence) => {
    const contrast = sentence.search(/(?:이며|이고|,)\s*`[a-z][a-z0-9-]*`(?:·`[a-z][a-z0-9-]*`)*[은는]\s*\[[^\]]+\]\((?:[^)]*materials\/|(?:0[0-3]-[^)]*\.md#))/);
    return contrast < 0 ? sentence : sentence.slice(0, contrast);
  }).filter((sentence) => {
    if (!/`[a-z][a-z0-9-]*`/.test(sentence)) return false;
    if (/아니라|받지 않는다|결합하지 않는다|별도 재료|분리한다/.test(sentence)) return false;
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
      if (match[2].startsWith("../models/") || match[2].startsWith("../spaces/")) pending.push(
        match[2].slice(3),
      );
      else pending = [];
      continue;
    }
    if (match[3] !== id) {
      sinceFace = true;
      continue;
    }
    const after = prose.slice((match.index ?? 0) + match[0].length);
    // "`casing`은 [다른 재료]" is a contrast, not this material's binding.
    if (/^은\s*\[[^\]]+\]\((?:[^)]*materials\/|0[0-3]-[^)]*\.md#)/.test(
      after,
    )) continue;
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
    for (const line of body.split(/\r?\n/).filter((value) =>
      /^\|\s*\[/.test(value),
    )) {
      const [, hosts, faceCell] = line.split("|");
      if (!faceCell) continue;
      const hostNames = [...hosts.matchAll(/\]\(\.\.\/models\/([^#)]+)#([^)]+)\)/g)].map(
        (match) => `${match[1]}#${match[2]}`,
      );
      const faceNames = [...faceCell.matchAll(/`([a-z][a-z0-9-]*)`/g)].map(
        (match) => match[1],
      );
      for (const host of hostNames) for (const face of faceNames)
          if (!modelIds.get(host)?.has(face) || !bodyWitness(host, face))
            tableInvalid.push(`${file}#${anchor} :: ${host} :: ${face}`);
    }
    // A direct "[host]의 `face` ... 받는다" assignment may occur after the
    // first binding paragraph. It must have a physical maker somewhere in
    // the cited model file; a room link in this material H2 cannot rescue it.
    for (const claim of body.matchAll(
      /\[[^\]]+\]\(\.\.\/models\/([^#)]+)#[^)]+\)의\s*`([a-z][a-z0-9-]*)`[^.\n]*(?:받는다|결합한다|칠한다|도장한다)/g,
    )) {
      const maker = [...modelIds].some(
        ([model, ids]) => model.startsWith(`${claim[1]}#`) && ids.has(claim[2]) && bodyWitness(model, claim[2]),
      );
      if (!maker) explicitInvalid.push(
        `${file}#${anchor} :: ${claim[1]} :: ${claim[2]}`,
      );
    }
    const prose = bindingProse(body, anchor);
    for (const sentence of prose.split(/\n\n/).filter(Boolean)) {
      const faceTokens = [
        ...new Set([...sentence.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1])),
      ];
      if (faceTokens.length && !/\]\(\.\.\/(?:models|spaces)\//.test(sentence))
        unlinkedAssignments.push(
          `${file}#${anchor} :: ${faceTokens.join(",")} :: ${sentence.slice(0, 130)}`,
        );
    }
    const spaceLinks = [
      ...new Set([...body.matchAll(/\]\(\.\.\/spaces\/([^#)]+)#([^)]+)\)/g)].map((m) => `${m[1]}#${m[2]}`)),
    ];
    const cross = crossBindings.get(`${file}#${anchor}`) ?? new Map();
    const ids = [...new Set([...prose.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]).concat([...cross.keys()]))].sort(
      (a, b) => a.localeCompare(b),
    );
    // A material can own a UV response without any separate mesh face. Keep
    // this as a separate answer, never as a missing model owner.
    const maskOnly = /독립[^.\n]*geometry와 `([a-z][a-z0-9-]*)` face id는 없다/.exec(
      body,
    )?.[1];
    if (maskOnly && !ids.includes(maskOnly)) ids.push(maskOnly);
    for (const id of ids) {
      // An account id alone is not a maker: the linked physical H2 must name
      // the face in its own prose. This caught the unbuilt garden-door casing.
      const boundHosts = [...new Set(prose.split(/\n\n/).filter((sentence) => sentence.includes(`\`${id}\``))
        .flatMap((sentence) => bindingHosts(sentence, id)).concat([...(cross.get(id) ?? [])].map((host) => `models/${host}`)))];
      const boundModels = boundHosts.filter((host) => host.startsWith("models/")).map(
        (host) => host.slice(7),
      );
      const boundSpaces = boundHosts.filter((host) => host.startsWith("spaces/")).map(
        (host) => host.slice(7),
      );
      const citedMakers = boundModels.flatMap((model) =>
        modelIds.get(model)?.has(id)
          ? [model]
          : ruleIds.has(model)
            ? [...modelIds.keys()].filter(
                (maker) => maker.startsWith(`${model.split("#")[0]}#`) && modelIds.get(maker)?.has(id),
              )
            : [],
      );
      const declaredLinks = [...new Set(citedMakers)];
      const owners = declaredLinks.filter((model) => bodyWitness(model, id));
      const missingWitness = declaredLinks.filter(
        (model) => !bodyWitness(model, id),
      );
      const declaredAnywhere = [...modelIds].filter(([, set]) => set.has(id)).map(
        ([model]) => model,
      );
      const mask = id === maskOnly;
      results.push({
        material: `${file}#${anchor}`,
        id,
        owners,
        missingWitness,
        spaceLinks: boundSpaces.length ? boundSpaces : spaceLinks,
        declaredAnywhere,
        mask,
      });
    }
    if (ids.length === 0) results.push({
      material: `${file}#${anchor}`,
      id: "(no face token)",
      owners: [],
      spaceLinks,
      declaredAnywhere: [],
      mask: false,
    });
  }
}
const unowned = results.filter(
  (row) => row.id !== "(no face token)" && !row.mask && row.owners.length === 0 && row.spaceLinks.length === 0,
);
const missingModelWitness = results.filter(
  (row) => row.id !== "(no face token)" && !row.mask && row.owners.length === 0 && row.spaceLinks.length === 0 && row.declaredAnywhere.length,
);
const falseLinkedMakers = results.flatMap((row) =>
  (row.missingWitness ?? []).map(
    (model) => `${row.material} :: ${row.id} :: ${model}`,
  ),
);
const allModelPairs = [...modelIds].flatMap(([model, ids]) =>
  [...ids].map((id) => ({ model, id, witnessed: bodyWitness(model, id) })),
);
const summary = {
  materialH2: files.flatMap((file) => sections(read(`materials/${file}`))).length,
  tokenRows: results.length,
  modelResolved: results.filter((row) => row.owners.length).length,
  spaceCandidates: results.filter((row) => !row.owners.length && row.spaceLinks.length).length,
  masks: results.filter((row) => row.mask).length,
  unowned: unowned.length,
  unlinkedAssignments: unlinkedAssignments.length,
  falseLinkedMakers: falseLinkedMakers.length,
  invalidExplicitClaims: explicitInvalid.length,
  invalidTableClaims: tableInvalid.length,
  ambiguousBindingTables: ambiguousBindingTables.length,
  modelPairs: allModelPairs.length,
  unwitnessedModelPairs: allModelPairs.filter((row) => !row.witnessed).length,
};
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
      ? row.owners.map(() => "인용 H2 본문에 면 id 명명; 크기·위치·UV 별도 검토").join(", ")
      : row.spaceLinks.length ? "spaces 부재 후보; host 계정에서 대조"
      : row.declaredAnywhere.length ? "부재 위치·크기·UV 확인 필요" : "face id 없음; host 계정에서 대조";
    return `| ${link("materials", row.material)} | ${row.id === "(no face token)" ? "면 id 없음" : `\`${row.id}\``} | ${owner} | ${proof} |`;
  }),
].join("\n");
const existingLedger = fs.readFileSync(ledgerFile, "utf8");
const evidenceLine = existingLedger.split(/\r?\n/).find((line) =>
  line.startsWith(
    "@evidence contracts/model-material-face-audit.md#model-material-face-audit ",
  ),
);
if (!evidenceLine) throw new Error(
  "Material face account lacks its authored evidence reason",
);
const document = `# 재료 결합 면에서 출발한 설계 owner 전수\n\n## 모든 material H2의 명명 면 역대조 {#material-face-ledger}\n<!--\n${evidenceLine}\n-->\n\n이 목록은 \`node src/measurements/material-binding-scan.cjs --check\`가 재료 H2 본문 ${summary.materialH2}개와 [모델 face 계정](surface-ownership.md#model-surface-ownership)을 다시 읽어 대조한다. 각 재료 H2의 긍정 결합 문장과 다른 H2의 표가 이 재료에 배정한 (호스트 H2, face id)를 함께 센다. 긍정 결합 문장이 없는 H2에서는 본문의 면 토큰을 검토 후보로 센다. face id를 쓰지 않고 물리 부재를 부르는 H2는 [부재군 역대조](material-host-census.md#material-host-census)가 받는다. owner가 여러 개면 같은 id가 각각의 원형에서 명명된다는 뜻이며, 서로 한 면을 중복 생성한다는 뜻이 아니다. 표는 인용 H2 본문에 면 id가 명명됐는지만 보증한다. 같은 면의 부재 치수·위치·UV와 이웃 고체 접촉은 [면별 검토 후보 생산자](../../../src/measurements/face-witness-audit.cjs) 및 별도 기하 대조에서 확인해야 한다. 실제 메시 결속은 modelSources 이전에 unverified다.\n\n${table}\n`;
if (process.argv.includes("--write")) fs.writeFileSync(ledgerFile, document);
else if (process.argv.includes("--check")) {
  const observed = fs.readFileSync(ledgerFile, "utf8").replace(/\r\n/g, "\n");
  if (observed !== document) {
    console.error(
      "material face ledger differs from current producer output",
      JSON.stringify(summary),
    );
    for (const row of falseLinkedMakers) console.error(
      `NO BODY WITNESS ${row}`,
    );
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(summary));
    for (const row of unowned) console.error(
      `${row.declaredAnywhere.length ? "UNVERIFIED MAKER" : "UNOWNED"} ${row.material} :: ${row.id}`,
    );
    for (const row of falseLinkedMakers) console.error(
      `NO NUMERIC PARAGRAPH CANDIDATE ${row}`,
    );
    for (const row of allModelPairs.filter((pair) => !pair.witnessed))
      console.error(`MODEL FACE NEEDS REVIEW ${row.model} :: ${row.id}`);
  }
} else if (process.argv.includes("--all-model-pairs")) console.log(
  JSON.stringify(
    {
      count: allModelPairs.length,
      unwitnessed: allModelPairs.filter((row) => !row.witnessed),
    },
    null,
    2,
  ),
);
else if (process.argv.includes("--json")) console.log(
  JSON.stringify(
    {
      summary,
      results,
      unowned,
      unlinkedAssignments,
      falseLinkedMakers,
      explicitInvalid,
      tableInvalid,
      ambiguousBindingTables,
    },
    null,
    2,
  ),
);
else {
  console.log(
    `material H2 ${summary.materialH2}; token rows ${summary.tokenRows}; model resolved ${summary.modelResolved}; spaces candidate ${summary.spaceCandidates}; unowned ${summary.unowned}`,
  );
  for (const row of unowned) console.log(
    `UNOWNED ${row.material} :: ${row.id} (declared elsewhere: ${row.declaredAnywhere.join(", ") || "none"})`,
  );
  for (const row of falseLinkedMakers) console.log(`NO BODY WITNESS ${row}`);
}
for (const claim of explicitInvalid) console.error(
  `INVALID EXPLICIT FACE CLAIM ${claim}`,
);
for (const claim of tableInvalid) console.error(
  `INVALID TABLE FACE CLAIM ${claim}`,
);
if (unowned.length || unlinkedAssignments.length || missingModelWitness.length || falseLinkedMakers.length || summary.unwitnessedModelPairs || explicitInvalid.length || tableInvalid.length) process.exitCode = 1;
if (ambiguousBindingTables.length) process.exitCode = 1;
