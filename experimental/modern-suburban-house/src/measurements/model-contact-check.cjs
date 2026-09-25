/** Census model contact prose and check every expression in the supported
 * numeric grammar. The corpus is every authored model H2 body, not a list of
 * remembered defects. A parsed box or equality is only a necessary condition
 * for physical contact. Contact sentences with no proved relationship remain
 * failures, explicitly counted until geometry or a derived witness pays them.
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
    result.push({ anchor, body: chunk.replace(/<!--[\s\S]*?-->/g, "") });
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

/** @param {Array<{ name:string;source:string }>} files */
function audit(files) {
  const result = { files: files.length, h2: 0, contactSentences: 0, checkedContactSentences: 0,
    uncheckedContactSentences: 0, numericIntervals: 0, arithmeticEqualities: 0, angularEqualities: 0,
    angularReservations: 0, clippedSlopes: 0,
    directedIntervals: 0, unparsedBracketPairs: 0, failures: /** @type {string[]} */ ([]) };
  for (const file of files) for (const section of sections(file.source)) {
    result.h2++;
    const label = `${file.name}#${section.anchor}`;
    const body = section.body;
    const sentences = body.split(/(?<=다\.)\s+|\n+/).filter(Boolean);
    for (const [index, sentence] of sentences.entries()) {
      if (!contact.test(sentence)) continue;
      result.contactSentences++;
      const floor = floorContact(sentence);
      if (floor === null) {
        result.uncheckedContactSentences++;
        result.failures.push(`${label} sentence ${index + 1}: contact outside the measured relation grammar: ${sentence.trim().slice(0, 160)}`);
      }
      else {
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
      result.failures.push(`${label}: bracket pair outside the numeric interval grammar: ${bracket[0]}`);
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
      const ceiling = /Y≥([+−-]?\d+(?:\.\d+)?)/.exec(body);
      if (slope && offset && ceiling) {
        result.clippedSlopes++;
        const top = numeric(slope[1]) + numeric(slope[2]) * (numeric(cutoff[1]) + numeric(slope[3])) / numeric(slope[4]) + numeric(offset[1]);
        if (Math.abs(top - numeric(ceiling[1])) > 0.001)
          result.failures.push(
            `${label}: clipped slope ends at ${top}, ceiling starts at ${ceiling[1]}`,
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
  const files = fs.readdirSync(models).filter((name) => name.endsWith(".md"))
    .map((name) => ({ name, source: fs.readFileSync(path.join(models, name), "utf8") }));
  const result = audit(files);
  console.log(
    JSON.stringify({ ...result, failureCount: result.failures.length }),
  );
  if (result.failures.length) process.exitCode = 1;
}
module.exports = { arithmetic, sections, floorContact, audit };
