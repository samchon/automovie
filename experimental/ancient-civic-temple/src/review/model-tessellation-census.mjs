/**
 * Checks the curved construction vocabulary in every authored model H2 before
 * modelSources can turn it into meshes. This reads the design, not a copied
 * count table: a new curved H2 or another plate, pin, shell, or woven band must
 * carry its own segment rule. Rectangular pieces need no circular segments.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../../docs/models/", import.meta.url);
const files = ["columns", "entablature", "openings", "cladding", "fixtures", "wares", "landscape"];
const curved = /원판|원통|원환|원뿔대|타원체|베지어|반원통|반타원|곡면|파문/;
const segments = /\d+(?:×\d+)?분할|\d+정점|\d+등분|\d+개 삼각형/;

/** @param {string} source @returns {{id:string,body:string}[]} */
export const modelSections = (source) => source.replace(/\r\n/g, "\n").split(/^## /m).slice(1).map((section) => {
  const anchor = section.match(/\{#([^}]+)\}/)?.[1];
  if (!anchor) throw new Error("model H2 has no anchor");
  return { id: anchor, body: section.replace(/<!--[\s\S]*?-->/g, "").split("\n").slice(1).join(" ") };
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
    ["circular floor", /바닥.*원판/, /바닥.*원판.*(?:분할|개 삼각형)/],
  ];
  for (const [name, trigger, rule] of rules)
    if (has((sentence) => trigger.test(sentence)) && !has((sentence) => rule.test(sentence)))
      failures.push(`${id}: ${name} has no own circumference division`);
  if (/원통 껍질/.test(body)) {
    if (/가로 띠/.test(body) && !has((sentence) => /가로 띠.*분할/.test(sentence)))
      failures.push(`${id}: curved horizontal bands have no circumference division`);
    if (/세로 살/.test(body) && !has((sentence) => /세로 살.*Y=[\d.]+~[\d.]+m/.test(sentence)))
      failures.push(`${id}: vertical slats have no height interval`);
  }
  return failures;
};

/** @returns {{sections:number,curved:number,failures:string[]}} */
export const checkModelTessellation = () => {
  const failures = [];
  let sections = 0;
  let curvedSections = 0;
  for (const file of files) {
    const source = readFileSync(new URL(file + ".md", root), "utf8");
    for (const section of modelSections(source)) {
      sections++;
      if (curved.test(section.body)) curvedSections++;
      failures.push(...tessellationFailures(`${file}#${section.id}`, section.body));
    }
  }
  console.log(`model tessellation census: ${sections} H2, ${curvedSections} with curved vocabulary, ${failures.length} unresolved`);
  for (const failure of failures) console.error(failure);
  return { sections, curved: curvedSections, failures };
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  process.exitCode = checkModelTessellation().failures.length ? 1 : 0;
