/** Census model contact prose and check every expression in the supported
 * numeric grammar. The corpus is every authored model H2 body, not a list of
 * remembered defects. A parsed box or equality is only a necessary condition
 * for physical contact. Contact sentences outside the grammar are counted as
 * unverified candidates; only contradicted parsed relationships fail here.
 * All positions use the authored local X/Y/Z frame in metres. */
const fs = require("node:fs");
const path = require("node:path");

const models = path.resolve(__dirname, "../../docs/models");
const decimal = "[+−-]?(?:\\d+\\.\\d+|\\d+)";
const interval = new RegExp(
  `\\[\\s*(${decimal})\\s*,\\s*(${decimal})\\s*\\]`,
  "g",
);
const equality = /([A-Za-z][A-Za-z0-9]*)=([+−\d.×*/()\s-]+)=([+−-]?\d+(?:\.\d+)?)/g;
const angular = /(\d+(?:\.\d+)?)×sin\(π\/(\d+)\)=(\d+(?:\.\d+)?)/g;
const contact = /닿|접한|접하|접촉|맞대|맞닿|붙는|붙인|붙어|만난|만나|끝난|끝나|종단|얹|걸린|걸쳐|받친|받치|겹치지|겹침|공유 부피|부피를 복제|관통|파고|올라타|지나간|지나며|이어 가|이어진|깔리/;

/** @param {string} text */
const numeric = (text) => Number(text.replaceAll("−", "-"));

/** Evaluate only numeric arithmetic. Document variables remain outside the
 * grammar and are counted as unverified instead of substituted by constants.
 * @param {string} source */
function arithmetic(source) {
  const expression = source.replaceAll("−", "-").replaceAll("×", "*").replaceAll(
    /\s+/g,
    "",
  );
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+*/-]/g) ?? [];
  if (tokens.join("") !== expression) return null;
  let index = 0;
  /** @returns {number} */
  const factor = () => {
    const token = tokens[index++];
    if (token === "+") return factor();
    if (token === "-") return -factor();
    if (token === "(") {
      const value = sum();
      if (tokens[index++] !== ")") throw Error("unclosed expression");
      return value;
    }
    if (!token || !/^\d/.test(token)) throw Error("missing numeric operand");
    return Number(token);
  };
  /** @returns {number} */
  const product = () => {
    let value = factor();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const operator = tokens[index++];
      const right = factor();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };
  /** @returns {number} */
  const sum = () => {
    let value = product();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      const right = product();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };
  try {
    const result = sum();
    return index === tokens.length && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/** @param {string} source */
function sections(source) {
  const result = [];
  for (const chunk of source.split(/^## /m).slice(1)) {
    const anchor = /\{#([^}]+)\}/.exec(chunk.split("\n", 1)[0])?.[1];
    if (!anchor) throw Error("Model H2 lacks an anchor");
    result.push({
      anchor,
      raw: chunk,
      body: chunk.replace(/<!--[\s\S]*?-->/g, ""),
    });
  }
  return result;
}

/** @param {string} sentence */
function floorContact(sentence) {
  if (!/바닥에 (?:닿|접)/.test(sentence)) return null;
  const spans = [
    ...sentence.matchAll(/Y=\[\s*([+−-]?\d+(?:\.\d+)?)\s*,\s*([+−-]?\d+(?:\.\d+)?)\s*\]/g),
  ];
  if (!spans.length) return null;
  return spans.some((span) => Math.abs(numeric(span[1])) < 1e-8);
}

/** Check measurable relationships that can be contradicted without changing
 * the part names or the number of contact sentences.
 * @param {string} body @param {string} label */
function relationshipFailures(body, label) {
  const failures = [];
  const depth = /몸통 깊이는\s*(\d+(?:\.\d+)?)\s*m이고/;
  const front = /전면에서\s*(\d+(?:\.\d+)?)\s*m 안에/;
  const envelope = /외곽 깊이\s*(\d+(?:\.\d+)?)\s*m/;
  const casing = /좌우 세로 판은[^\n]*?Y=\[\s*([+−-]?\d+(?:\.\d+)?)/;
  const partialRecess = /Z=\[\s*([+−-]?\d+(?:\.\d+)?)\s*,\s*([+−-]?\d+(?:\.\d+)?)\s*\]\s*m만[^\n]*?홈/;
  const fullRecess = /전체 깊이 Z=\[\s*([+−-]?\d+(?:\.\d+)?)\s*,\s*([+−-]?\d+(?:\.\d+)?)\s*\]\s*m를[^\n]*?홈/;
  for (const line of body.split(/\n+/)) {
    const bodyDepth = depth.exec(line);
    const frontDepth = front.exec(line);
    const outerDepth = envelope.exec(line);
    if (bodyDepth && frontDepth && outerDepth &&
      numeric(bodyDepth[1]) + numeric(frontDepth[1]) > numeric(outerDepth[1]) + 1e-8)
      failures.push(
        `${label}: body and front hardware exceed the declared depth envelope`,
      );

    const legs = casing.exec(line);
    if (legs && line.includes("문턱판은 개구부 폭 안에서만") && Math.abs(numeric(legs[1])) > 1e-8)
      failures.push(
        `${label}: casing legs outside the threshold footprint do not reach the finished floor`,
      );

    const only = partialRecess.exec(line);
    const whole = fullRecess.exec(line);
    if (only && whole && (Math.abs(numeric(only[1]) - numeric(whole[1])) > 1e-8 ||
      Math.abs(numeric(only[2]) - numeric(whole[2])) > 1e-8))
      failures.push(
        `${label}: an only-partial recess also claims the full depth`,
      );

    // These checks compare a stated contact or clearance with the numbers in
    // that same design sentence. They do not depend on a particular model id.
    const floorGap = /Y=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\][^\n]*?바닥 Y=([+−-]?\d+(?:\.\d+)?) m에서 아랫면을 ([+−-]?\d+(?:\.\d+)?) m 띄운/.exec(
      line,
    );
    if (floorGap && Math.abs(numeric(floorGap[1]) - numeric(floorGap[3]) - numeric(floorGap[4])) > 1e-8)
      failures.push(`${label}: lower face contradicts its floor clearance`);

    const cylinderContact = /축은 X=([+−-]?\d+(?:\.\d+)?)[^\n]*?반지름 ([+−-]?\d+(?:\.\d+)?)[^\n]*?\+X 끝 X=([+−-]?\d+(?:\.\d+)?)/.exec(
      line,
    );
    if (cylinderContact && Math.abs(numeric(cylinderContact[1]) + numeric(cylinderContact[2]) - numeric(cylinderContact[3])) > 1e-8)
      failures.push(
        `${label}: cylinder end does not touch its claimed +X plane`,
      );

    const floorStart = /세로 판[^\n]*?Y=\[([+−-]?\d+(?:\.\d+)?),[+−-]?\d+(?:\.\d+)?\][^\n]*?세로 판은[^\n]*?완성면(?: 위)? Y=([+−-]?\d+(?:\.\d+)?)에서 시작/.exec(
      line,
    );
    if (floorStart && Math.abs(numeric(floorStart[1]) - numeric(floorStart[2])) > 1e-8)
      failures.push(
        `${label}: trim foot differs from its claimed finished-surface start`,
      );

    const inwardHinge = /날씨 면은 Z=([+−-]?\d+(?:\.\d+)?)(?: m)?, 실내 면은 Z=([+−-]?\d+(?:\.\d+)?)[^\n]*?경첩 축은[^\n]*?(?:실내|날씨) 면 Z=([+−-]?\d+(?:\.\d+)?)[^\n]*?안쪽으로 90°/.exec(
      line,
    );
    if (inwardHinge && Math.abs(numeric(inwardHinge[2]) - numeric(inwardHinge[3])) > 1e-8)
      failures.push(
        `${label}: inward hinge axis is not on the interior leaf face`,
      );

    const guide = /수직 구간 중심 X=([+−-]?\d+(?:\.\d+)?)·([+−-]?\d+(?:\.\d+)?) m와 단면 폭 ([+−-]?\d+(?:\.\d+)?) m는 각각[^\n]*?X=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]·\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\] m 안에 있고, 닫힌 문짝 X=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\] m와 양쪽 모두 최소 ([+−-]?\d+(?:\.\d+)?) m/.exec(
      line,
    );
    if (guide) {
      const [, left, right, width, bandL0, bandL1, bandR0, bandR1, panelL, panelR, clearance] = guide.map(
        numeric,
      );
      const half = width / 2;
      if (left - half < bandL0 - 1e-8 || left + half > bandL1 + 1e-8 ||
        right - half < bandR0 - 1e-8 || right + half > bandR1 + 1e-8 ||
        panelL - (left + half) < clearance - 1e-8 ||
        (right - half) - panelR < clearance - 1e-8)
        failures.push(
          `${label}: guide sections violate their cited bands or panel clearance`,
        );
    }

    const belowClaim = line.indexOf("고체 Y<");
    const symbolicFloor = belowClaim < 0
      ? undefined
      : [...line.slice(0, belowClaim).matchAll(/Y=\[([A-Za-z]\w*)([+−-]\d+(?:\.\d+)?)?,\s*\1(?:[+−-]\d+(?:\.\d+)?)?\]/g)].at(
          -1,
        );
    if (symbolicFloor && line.includes(`고체 Y<${symbolicFloor[1]}`) &&
      symbolicFloor[2] && numeric(symbolicFloor[2]) < -1e-8)
      failures.push(
        `${label}: plate intrudes below its claimed opening bottom`,
      );
  }
  if (/경사 측판/.test(body) && /이 원형이 만든다/.test(body) && !/Y=[^\n]*?\b[ZX]\b/.test(body))
    failures.push(
      `${label}: owned sloped plate has no coordinate slope equation`,
    );

  // A door casing and its leaves are siblings. Compare their measured closed
  // boxes rather than accepting a prose assertion that the opening is clear.
  const casingLine = body.split(/\n+/).find(
    (line) => line.includes("`casing`") && line.includes("왼쪽·오른쪽 세로 판은"),
  );
  const leafLine = body.split(/\n+/).find(
    (line) => line.includes("`leaf`") && line.includes("앞 문짝 X=") && line.includes("뒤 문짝 X="),
  );
  if (casingLine && leafLine) {
    const casingX = /세로 판은 X=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]·\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]/.exec(
      casingLine,
    );
    const casingZ = /Z=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]/.exec(
      casingLine,
    );
    const casingY = /Y=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]/.exec(
      casingLine,
    );
    const leaves = [
      ...leafLine.matchAll(/문짝 X=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]·Z=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]/g),
    ];
    const leafY = /Y=\[([+−-]?\d+(?:\.\d+)?),([+−-]?\d+(?:\.\d+)?)\]/.exec(
      leafLine,
    );
    if (casingX && casingZ && casingY && leaves.length === 2 && leafY) {
      /** @param {string} a @param {string} b @param {string} c @param {string} d */
      const positive = (a, b, c, d) => Math.min(numeric(b), numeric(d)) - Math.max(numeric(a), numeric(c)) > 1e-8;
      for (const [x0, x1] of [
        [casingX[1], casingX[2]],
        [casingX[3], casingX[4]],
      ])
        for (const leaf of leaves)
          if (positive(x0, x1, leaf[1], leaf[2]) &&
            positive(casingZ[1], casingZ[2], leaf[3], leaf[4]) &&
            positive(casingY[1], casingY[2], leafY[1], leafY[2]))
            failures.push(
              `${label}: casing and closed leaf share positive volume`,
            );
    }
  }
  return failures;
}

/** @param {string} raw @param {string} body @param {(target:string)=>string|null} resolveParent @param {string} label */
function linkedSideWallFailures(raw, body, resolveParent, label) {
  const failures = [];
  let assertions = 0;
  const targets = [...raw.matchAll(/^@evidence spaces\/([^\s#]+)#([^\s]+)/gm)]
    .map((m) => `spaces/${m[1]}#${m[2]}`);
  const parents = targets.map(resolveParent).filter((value) => value !== null);
  const parentSpans = parents.flatMap((parent) =>
    [...parent.matchAll(/몸통 예약은[^\n]*?Z\s*=\s*\[\s*([+−-]?\d+(?:\.\d+)?)\s*,\s*([+−-]?\d+(?:\.\d+)?)\s*\]/g)]
      .map((m) => [numeric(m[1]), numeric(m[2])]));
  for (const line of body.split(/\n+/)) {
    if (!/측벽의 안쪽 면[^\n]*?맞대/.test(line)) continue;
    const spans = [...line.matchAll(/Z=\[\s*([+−-]?\d+(?:\.\d+)?)\s*,\s*([+−-]?\d+(?:\.\d+)?)\s*\]/g)]
      .map((m) => [numeric(m[1]), numeric(m[2])]);
    for (const span of spans) {
      assertions++;
      if (!parentSpans.some(
        (parent) => Math.abs(span[0] - parent[0]) < 1e-8 && Math.abs(span[1] - parent[1]) < 1e-8,
      ))
        failures.push(
          `${label}: a claimed side-wall end does not meet a cited body boundary Z=${span}`,
        );
    }
  }
  return { assertions, failures };
}

/** Evidence numbers cannot certify a decision that the host body never makes.
 * This is a necessary literal support check, not a semantic review. */
/** @param {string} raw @param {string} body @param {string} label */
function evidenceNumberFailures(raw, body, label) {
  const claims = [...raw.matchAll(/^@evidence (?:principles\/core\/common\.md#substantive-completion|principles\/design\/models\.md#spatial-convention)[^\n]*/gm)]
    .flatMap((line) => [...line[0].matchAll(/(?<![A-Za-z0-9])\d+\.\d+/g)].map((m) => m[0]));
  const missing = [...new Set(claims)].filter((value) => !body.includes(value));
  return { claims: claims.length, failures: missing.map((value) =>
    `${label}: evidence numeric claim ${value} is absent from its host body`) };
}

/** @param {Array<{ name:string;source:string }>} files @param {((target:string)=>string|null)|null} [resolveParent] */
function audit(files, resolveParent = null) {
  const result = { files: files.length, h2: 0, contactSentences: 0, checkedContactSentences: 0,
    uncheckedContactSentences: 0, numericIntervals: 0, arithmeticEqualities: 0, angularEqualities: 0,
    angularReservations: 0, clippedSlopes: 0, linkedSideWallAssertions: 0,
    evidenceNumericClaims: 0,
    directedIntervals: 0, unparsedBracketPairs: 0, failures: /** @type {string[]} */ ([]) };
  for (const file of files) for (const section of sections(file.source)) {
    result.h2++;
    const label = `${file.name}#${section.anchor}`;
    const body = section.body;
    result.failures.push(...relationshipFailures(body, label));
    const numericSupport = evidenceNumberFailures(section.raw, body, label);
    result.evidenceNumericClaims += numericSupport.claims;
    result.failures.push(...numericSupport.failures);
    if (resolveParent !== null) {
      const linked = linkedSideWallFailures(
        section.raw,
        body,
        resolveParent,
        label,
      );
      result.linkedSideWallAssertions += linked.assertions;
      result.failures.push(...linked.failures);
    }
    const sentences = body.split(/(?<=다\.)\s+|\n+/).filter(Boolean);
    for (const [index, sentence] of sentences.entries()) {
      if (!contact.test(sentence)) continue;
      result.contactSentences++;
      const floor = floorContact(sentence);
      if (floor === null) {
        result.uncheckedContactSentences++;
      } else {
        result.checkedContactSentences++;
        if (!floor) result.failures.push(
          `${label} sentence ${index + 1}: floor contact has no Y interval reaching zero`,
        );
      }
    }
    const brackets = [...body.matchAll(/\[[^\[\]\n]*,[^\[\]\n]*\]/g)];
    const parsedIntervals = [...body.matchAll(interval)];
    const fullInterval = new RegExp(`^${interval.source}$`);
    for (const bracket of brackets) if (!fullInterval.test(bracket[0])) {
      result.unparsedBracketPairs++;
    }
    for (const match of parsedIntervals) {
      result.numericIntervals++;
      if (numeric(match[1]) > numeric(match[2]) + 1e-8) {
        const before = body.lastIndexOf("다.", match.index);
        const after = body.indexOf("다.", match.index);
        const sentence = body.slice(
          before < 0 ? 0 : before + 2,
          after < 0 ? body.length : after + 2,
        );
        if (/경로|중심선|이동|시작.*끝|이어진/.test(
          sentence,
        )) result.directedIntervals++;
        else result.failures.push(
          `${label}: reversed occupancy interval ${match[0]}`,
        );
      }
    }
    for (const match of body.matchAll(equality)) {
      const calculated = arithmetic(match[2]);
      if (calculated === null) continue;
      result.arithmeticEqualities++;
      if (Math.abs(calculated - numeric(match[3])) > 0.001)
        result.failures.push(
          `${label}: ${match[1]} expression gives ${calculated}, stated ${match[3]}`,
        );
    }
    for (const match of body.matchAll(angular)) {
      result.angularEqualities++;
      const calculated = numeric(match[1]) * Math.sin(Math.PI / numeric(match[2]));
      if (Math.abs(calculated - numeric(match[3])) > 0.001)
        result.failures.push(
          `${label}: angular expression gives ${calculated}, stated ${match[3]}`,
        );
      const end = body.indexOf("다.", match.index);
      const sentence = body.slice(match.index, end < 0 ? body.length : end + 2);
      const reservation = /(\d+(?:\.\d+)?)\s*m\s*예약/.exec(sentence);
      if (reservation) {
        result.angularReservations++;
        if (calculated > numeric(reservation[1]) + 1e-8)
          result.failures.push(
            `${label}: angular motion ${calculated} exceeds reservation ${reservation[1]}`,
          );
      }
    }
    const cutoff = /Xc=[^=\n]*=([+−-]?\d+(?:\.\d+)?)/.exec(body);
    if (cutoff) {
      const slope = /Y=([+−-]?\d+(?:\.\d+)?)\+([+−-]?\d+(?:\.\d+)?)×\(X\+([+−-]?\d+(?:\.\d+)?)\)\/([+−-]?\d+(?:\.\d+)?)/.exec(
        body,
      );
      const offset = /위 모서리는 그 값\+([+−-]?\d+(?:\.\d+)?)/.exec(body);
      const parentHeights = resolveParent === null ? [] : [...section.raw.matchAll(/^@evidence (spaces\/[^\s]+)/gm)]
        .flatMap((match) => [...(resolveParent(match[1]) ?? "").matchAll(/Y\s*=\s*\[\s*([+−-]?\d+(?:\.\d+)?)\s*,\s*([+−-]?\d+(?:\.\d+)?)\s*\]/g)]
          .flatMap((span) => [numeric(span[1]), numeric(span[2])]));
      const localBoundary = /Y≥([+−-]?\d+(?:\.\d+)?)/.exec(body);
      if (slope && offset && (parentHeights.length || localBoundary)) {
        result.clippedSlopes++;
        const top = numeric(slope[1]) + numeric(slope[2]) * (numeric(cutoff[1]) + numeric(slope[3])) / numeric(slope[4]) + numeric(offset[1]);
        const boundaries = parentHeights.length
          ? parentHeights
          : localBoundary
            ? [numeric(localBoundary[1])]
            : [];
        if (!boundaries.some((height) => Math.abs(top - height) <= 0.001))
          result.failures.push(
            `${label}: clipped slope ends at ${top}, away from its cited space boundaries`,
          );
      } else result.failures.push(
        `${label}: cutoff has no measurable slope and ceiling relationship`,
      );
    }
  }
  if (!result.contactSentences) result.failures.push(
    "No model contact sentences found",
  );
  return result;
}

if (require.main === module) {
  const docs = path.resolve(models, "..");
  /** @param {string} target */
  const resolveParent = (target) => {
    const [relative, anchor] = target.split("#");
    const filename = path.resolve(docs, relative);
    if (!filename.startsWith(path.join(docs, "spaces") + path.sep) || !fs.existsSync(filename)) return null;
    return sections(fs.readFileSync(filename, "utf8")).find((section) => section.anchor === anchor)?.body ?? null;
  };
  const files = fs.readdirSync(models).filter((name) => name.endsWith(".md"))
    .map((name) => ({ name, source: fs.readFileSync(path.join(models, name), "utf8") }));
  const result = audit(files, resolveParent);
  console.log(
    JSON.stringify({ ...result, failureCount: result.failures.length }),
  );
  if (result.failures.length) process.exitCode = 1;
}
module.exports = { arithmetic, sections, floorContact, relationshipFailures, linkedSideWallFailures, evidenceNumberFailures, audit };
