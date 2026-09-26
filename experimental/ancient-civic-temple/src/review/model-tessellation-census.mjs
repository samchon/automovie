/**
 * Checks the curved construction vocabulary in every authored model H2 before
 * modelSources can turn it into meshes. This reads the design, not a copied
 * count table: a new curved H2 or another plate, pin, shell, or woven band must
 * carry its own segment rule. Rectangular pieces need no circular segments.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../../docs/models/", import.meta.url);
const curved = /원판|원통|원환|원뿔대|타원체|베지어|반원통|반타원|곡면|파문/;
const segments = /\d+(?:×\d+)?분할|\d+정점|\d+등분|\d+개 삼각형/;

/** Circular rows are specified by count, pitch and a first centre. The face
 * normal is the datum for an outward offset, not the cylinder's vertex radius.
 * @param {string} body
 * @returns {string[]}
 */
export const circularRepetitionFailures = (body) => {
  const failures = [];
  for (const row of body.matchAll(/(\d+)개의\s+([가-힣 ]{2,16})은\s+둘레를 따라 중심각\s+([\d.]+)°마다/g)) {
    const [, countText, noun, pitchText] = row;
    const count = Number(countText), pitch = Number(pitchText);
    const first = body.match(new RegExp(`k번째 ${noun.trim()}\\(k=0\\.\\.(\\d+)\\)의 시작각은 θ₀=([\\d.]+)°이고 중심각은 θ\\(k\\)=([\\d.]+)°\\+([\\d.]+)°k`));
    if (!first) { failures.push(`${noun.trim()}: circular repeat has no first centre`); continue; }
    const [, lastText, phaseText, repeatedPhaseText, repeatedPitchText] = first;
    const phase = Number(phaseText);
    if (Number(lastText) !== count - 1 || Math.abs(count * pitch - 360) > 1e-8 ||
        Math.abs(Number(repeatedPhaseText) - phase) > 1e-8 ||
        Math.abs(Number(repeatedPitchText) - pitch) > 1e-8)
      failures.push(`${noun.trim()}: count, pitch and start formula disagree`);
    if (!/안쪽 면은 (?:해당 )?[^.\n]+? 면과 같은 평면/.test(body) ||
        !/바깥 면은 (?:그|해당) 면의 바깥 법선 방향으로 [\d.]+m 나온다/.test(body))
      failures.push(`${noun.trim()}: outward offset lacks a host face datum`);
    if (body.includes("벽 면의 가운데") && Math.abs(phase - pitch / 2) > 1e-8)
      failures.push(`${noun.trim()}: a face-centred row needs a half-pitch phase`);
  }
  return failures;
};

/** @param {string} body @returns {string[]} */
export const polygonPhaseFailures = (body) => {
  const failures = [];
  if (/받침판\([^)]*둘레 (\d+)분할 원판\)/.test(body)) {
    const plate = body.match(/받침판[^\n]*?둘레 (\d+)분할 원판/);
    const phase = body.match(/받침판 (\d+)각형은 0번 꼭짓점이 \+X이고 (\d+)번 꼭짓점이 \+Y다/);
    if (!plate || !phase || Number(plate[1]) !== Number(phase[1]) ||
        Number(phase[2]) * 4 !== Number(phase[1]))
      failures.push("round plate pin-side polygon phase is missing or inconsistent");
  }
  return failures;
};

/** @param {string} source @returns {{id:string,body:string}[]} */
export const modelSections = (source) => source.replace(/\r\n/g, "\n").split(/^## /m).slice(1).map((section) => {
  const anchor = section.match(/\{#([^}]+)\}/)?.[1];
  if (!anchor) throw new Error("model H2 has no anchor");
  return { id: anchor, body: section.replace(/<!--[\s\S]*?-->/g, "").split("\n").slice(1).join("\n") };
});

/**
 * A rule must belong to the same curved primitive family. Counts on a ring
 * cannot silently supply a newly added plate or connecting pin. A shell's
 * woven bands share its circular grid but still declare that grid themselves.
 * @param {string} id @param {string} body
 * @returns {string[]}
 */
export const tessellationFailures = (id, body) => {
  const failures = [];
  const sentences = body.split(/(?<=다\.)\s+/);
  /** @param {(sentence:string)=>boolean} predicate */
  const has = (predicate) => sentences.some(predicate);
  const construction = sentences.filter((sentence) => !/실패다|검토 판|건물 관찰|이미지 /.test(sentence));
  if (construction.some((sentence) => curved.test(sentence) && /반지름|지름|두께|높이|곡선|단면/.test(sentence)) && !segments.test(body))
    failures.push(`${id}: curved construction has no segment count`);
  /** @type {[string,RegExp,RegExp][]} */
  const rules = [
    ["round plate", /받침판\([^)]*반지름/, /받침판.*분할/],
    ["connecting pin", /반지름 [\d.]+m의 연결 핀|연결 핀.*반지름/, /연결 핀.*분할/],
    ["tapered shell", /원통 껍질.*반지름/, /원통 껍질.*분할/],
  ];
  for (const [name, trigger, rule] of rules)
    if (has((sentence) => trigger.test(sentence)) && !has((sentence) => rule.test(sentence)))
      failures.push(`${id}: ${name} has no own circumference division`);
  if (has((sentence) => /바닥.*원판/.test(sentence)) &&
    !has((sentence) => /두 원판은 각각 둘레 \d+분할/.test(sentence)) &&
    !(has((sentence) => /두 원판은 각각 \d+개 삼각형/.test(sentence)) && /둘레 \d+분할/.test(body)) &&
    !has((sentence) => /바닥.*원판.*둘레 \d+분할/.test(sentence) && !/두 원판/.test(body)) &&
    !/바닥.*원판[^\n]*각각의 원주는 \d+분할/.test(body))
    failures.push(`${id}: circular floor has no own circumference division`);
  failures.push(...curvedPartFailures(id, body));
  if (/원통 껍질/.test(body)) {
    if (/가로 띠/.test(body) && !has((sentence) => /가로 띠.*분할/.test(sentence)))
      failures.push(`${id}: curved horizontal bands have no circumference division`);
    if (/세로 살/.test(body) && !has((sentence) => /세로 살.*Y=[\d.]+~[\d.]+m/.test(sentence)))
      failures.push(`${id}: vertical slats have no height interval`);
  }
  failures.push(...circularRepetitionFailures(body).map((failure) => `${id}: ${failure}`));
  failures.push(...polygonPhaseFailures(body).map((failure) => `${id}: ${failure}`));
  return failures;
};

/** A division on one curved part cannot supply another curved part in the same H2.
 * Part aliases come from the authored part mapping; no fixed list of objects is used.
 * @param {string} id @param {string} body @returns {string[]}
 */
export const curvedPartFailures = (id, body) => {
  /** @type {string[]} */
  const failures = [];
  const mapping = body.match(/^부재 대응: (.+)$/m)?.[1];
  if (!mapping) return failures;
  const sentences = body.split(/(?<=다\.)\s+|\n+/);
  for (const [, part, label] of mapping.matchAll(/`([^`]+)`=([^;.]+)/g)) {
    const noun = label.trim();
    if (!noun || noun.includes(" ")) continue;
    const geometry = sentences.filter((sentence) => sentence.includes(noun) && /원판|원통|원환|원뿔대|타원체|반타원|곡면|파문/.test(sentence) && /반지름|지름|원형|원주|단면/.test(sentence));
    if (!geometry.length) continue;
    const explicit = sentences.some((sentence) => sentence.includes(noun) && segments.test(sentence));
    const global = sentences.some((sentence) => /(?:원형 부재|원형 면|타원체|각 회전체|세 회전체)는?[^.\n]*\d+(?:×\d+)?분할/.test(sentence));
    if (!explicit && !global) failures.push(`${id}: curved part ${part} (${noun}) has no own division`);
  }
  return failures;
};

/** @returns {{sections:number,curved:number,failures:string[]}} */
export const checkModelTessellation = () => {
  const failures = [];
  let sections = 0;
  let curvedSections = 0;
  const files = readdirSync(root).filter((file) => file.endsWith(".md") && file !== "scale.md")
    .sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    const source = readFileSync(new URL(file, root), "utf8");
    for (const section of modelSections(source)) {
      sections++;
      if (curved.test(section.body)) curvedSections++;
      failures.push(...tessellationFailures(`${file.slice(0, -3)}#${section.id}`, section.body));
    }
  }
  console.log(`model tessellation census: ${sections} H2, ${curvedSections} with curved vocabulary, ${failures.length} unresolved`);
  for (const failure of failures) console.error(failure);
  return { sections, curved: curvedSections, failures };
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  process.exitCode = checkModelTessellation().failures.length ? 1 : 0;
