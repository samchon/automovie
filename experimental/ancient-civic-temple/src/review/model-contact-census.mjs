import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The prose is the population. A new contact sentence cannot disappear behind
// a hand-maintained count: it needs its own entry and a named measured relation.
const modelRoot = new URL("../../docs/models/", import.meta.url);
const files = ["scale", "columns", "entablature", "openings", "cladding", "fixtures", "wares", "landscape"];
const contactWord = /닿|접한|접하|접촉|맞닿|얹|붙|받친|받치|겹쳐|겹친|잇는다|이어진다|이어지|만난|만나/;
const supplementalWord = /지지|연결|관통|침범|뚫|고정|중복/;
/** @typedef {{id: string, sentence: string}} Claim */
/** @param {boolean} supplemental @returns {Claim[]} */
export const modelContactClaims = (supplemental = false) => {
  /** @type {Claim[]} */
  const claims = [];
  for (const file of files) {
    const source = readFileSync(new URL(file + ".md", modelRoot), "utf8").replace(/\r\n/g, "\n");
    for (const section of source.split(/^## /m).slice(1)) {
      const anchor = section.match(/\{#([^}]+)\}/)?.[1];
      assert.ok(anchor, `missing H2 anchor in ${file}`);
      const body = section.replace(/<!--[\s\S]*?-->/g, "").split("\n").slice(1).join(" ");
      const sentences = body.split(/(?<=다\.)\s+/).filter((sentence) => supplemental
        ? supplementalWord.test(sentence) && !contactWord.test(sentence) : contactWord.test(sentence));
      sentences.forEach((sentence, index) => claims.push({ id: `${file}#${anchor}${supplemental ? ":supplemental" : ""}:${index + 1}`, sentence }));
    }
  }
  return claims;
};

// An entry is an exact substantive phrase followed by a PASS label emitted by
// model-design-arithmetic.mjs, or an explicit non-geometry classification.
// PASS labels have executable assertions on parsed source numbers, not counts.
/** @type {Record<string, [string, string][]>} */
const decisions = {
  "scale#reference-scale": [["시작 접선에", "non-contact: UV seam construction"]],
  "scale#model-review-board": [["이 판은", "non-contact: review-board responsibility"]],
  "columns#colonnade-column": [
    ["전체 높이 h는", "colonnade capital supports beam underside"],
    ["source는 반올림한", "non-contact: instruction to consume the exact formula"],
    ["기단이 바닥에", "colonnade base and capital contact their hosts"],
    ["원통 하나로", "non-contact: stated failure condition, not a positive joint"],
  ],
  "columns#porch-column": [["주두 판 윗면은", "porch capital supports stone beam underside"]],
  "entablature#colonnade-beam": [
    ["이것을 보 윗면으로", "rafter touches slab and beam"],
    ["보 아랫면은", "colonnade capital supports beam underside"],
    ["아랫면 중 기둥", "colonnade beam ends abut without overlap"],
    ["검토 판에서는", "non-contact: future visual review question"],
    ["기둥 위 공백", "non-contact: failure conditions for the measured joint"],
  ],
  "entablature#rafter": [
    ["주랑 외쪽 지붕", "rafter slope and wall termination"],
    ["주랑·동측 박공의", "rafter back cut reaches wall"],
    ["각 절단면은", "sanctuary rafters touch wall and slab"],
    ["양 내부 서까래의", "sanctuary rafter tips meet at ridge"],
    ["윗면은 지붕", "rafter touches slab and beam"],
  ],
  "entablature#porch-entablature": [
    ["이미지 01에서", "non-contact: reference observation"],
    ["보는 길이 3.30m", "porch capital supports stone beam underside"],
    ["보 윗면 Y=3.50m", "porch beam touches gable and returns"],
    ["지붕 하부와 닿는", "porch trim tips meet at ridge"],
    ["아랫선은", "porch trim tips meet at ridge"],
    ["보 윗면은", "porch beam touches gable and returns"],
    ["건물 관찰에서는", "non-contact: future visual review question"],
  ],
  "entablature#sanctuary-truss": [["평보의 두", "truss touches wall and roof underside"]],
  "entablature#ceiling-joist": [
    ["윗면 Y=3.10m", "ceiling joist touches the boarding underside"],
    ["part와 표면은", "ceiling joist ends meet the walls"],
  ],
  "openings#door-frame": [
    ["안감 바깥면과", "door lining touches void and trim wall"],
    ["벽면에 붙인", "non-contact: stated failure conditions"],
  ],
  "openings#double-door-leaf": [
    ["맞닿는 선대", "double leaf ring and plate placement"],
    ["손잡이와 받침판", "double plate, pin, rail connected"],
    ["받침판의 반지름", "double plate, pin, rail connected"],
    ["반지름 0.006m의", "double ring to upper pin"],
    ["핀 축의 받침판", "double plate, pin, rail connected"],
    ["앞핀은 Z=", "double front and back pin contact"],
    ["건물 관찰에서는", "non-contact: door opening pose is an instances observation"],
  ],
  "openings#single-door-leaf": [
    ["연직 폭 0.04m", "single steel straps have both axes and face contact"],
    ["각 핀의 끝은", "single ring to upper pin"],
  ],
  "openings#window-frame": [["안감 바깥면과", "window surround touches wall around clear opening"]],
  "cladding#roof-tile": [
    ["Z=0.08~0.52m의", "tegula raised thickness"],
    ["같은 줄의 위", "tegula raised lower to preceding upper"],
    ["Z=0.08~0.44m에서", "tile feet land on ribs without overlap"],
    ["끝 0.08m는", "tile overhang retains positive support"],
    ["껍질은 Z=", "tile row end meets next unit"],
    ["평기와의 뒤쪽", "tegula slab and row contact"],
    ["둥근기와의 열린", "tile feet land on ribs without overlap"],
    ["instances는 각", "tile cap clearance bound"],
    ["박공 용마루에서", "ridge cap contacts both roof tiles and clears coping"],
  ],
  "cladding#ridge-tile": [
    ["앞쪽 0.05m", "ridge nose meets preceding shell"],
    ["내부 이음에", "non-contact: topology instruction about omitting duplicate caps"],
    ["양쪽 경사의", "ridge cap contacts both roof tiles and clears coping"],
    ["아랫 가장자리", "ridge foot to flat tile at 19 degrees"],
    ["용마루 없이", "non-contact: stated failure conditions"],
  ],
  "fixtures#fountain": [
    ["중심선에서", "ripple ends touch water plane"],
    ["받침단 아랫면", "fountain step touches courtyard floor"],
  ],
  "fixtures#altar": [["받침 윗면", "altar support and step planes touch"]],
  "fixtures#niche": [
    ["벽에 붙는", "niche back face touches sanctuary wall"],
    ["꼭대기에는", "niche cap touches body"],
    ["뒷면은", "niche back face touches sanctuary wall"],
  ],
  "fixtures#lampstand": [["줄기는 반지름", "lamp stem top supports dish bottom"]],
  "fixtures#offering-table": [
    ["받침 윗면은", "offering trestles touch top underside"],
    ["상판 윗면은", "non-contact: surfaces reserved for later instance placement"],
  ],
  "fixtures#chest": [
    ["아래 구간은", "chest lower hasp touches body"],
    ["윗 구간은", "chest upper hasp touches lid"],
    ["각 구간은", "chest hasp joints meet without penetration"],
    ["각 띠는 몸체", "chest hinge crosses lid gap and touches both faces"],
    ["몸체 쪽 띠는", "chest hinge reaches lid top"],
    ["각 띠는 맞닿는", "chest corner straps hug body edges"],
  ],
  "wares#storage-jar": [["원환은 주환", "storage handle intersects shoulder surface"]],
  "wares#carry-jar": [
    ["[도기와 봉헌", "non-contact: reference observation"],
    ["목과 어깨를", "carry handle endpoints intersect vessel profile"],
  ],
  "wares#small-vessel": [["한쪽 +X의", "small vessel handle endpoints intersect profile"]],
  "wares#basket": [["테두리는 중심선", "basket rim touches wall top"]],
  "wares#scroll": [
    ["한 개의 묶음", "three-roll tie touches paper"],
    ["세 개 묶음은", "three-roll cylinders mutually tangent"],
    ["세 모서리의", "three-roll tie contacts all cylinders"],
    ["양쪽 짧은 변", "open scroll roll touches sheet top edge"],
  ],
  "landscape#cypress": [
    ["줄기·가지 덩어리", "non-contact: review-distance silhouette criterion"],
    ["줄기는 반지름", "cypress masses overlap trunk and neighbors"],
  ],
  "scale#articulation-map:supplemental": [["궤 뚜껑은", "non-contact: temporal behavior and ownership boundary"]],
  "scale#model-review-board:supplemental": [["조명은 건물", "non-contact: review-board light setting"]],
  "entablature#rafter:supplemental": [
    ["제실 양쪽의", "sanctuary rafter pair stops at both faces of the side wall"],
    ["서까래 없이", "non-contact: stated failure conditions"],
  ],
  "entablature#sanctuary-truss:supplemental": [
    ["평보는 길이", "truss touches wall and roof underside"],
    ["검토 판에서", "non-contact: future visual review question"],
    ["벽을 뚫는", "non-contact: stated failure conditions"],
  ],
  "entablature#ceiling-joist:supplemental": [["널판에서", "non-contact: stated failure conditions"]],
  "openings#door-frame:supplemental": [["안감은 세", "door lining touches void and trim wall"]],
  "openings#double-door-leaf:supplemental": [["판 하나로", "non-contact: stated failure conditions"]],
  "openings#single-door-leaf:supplemental": [["앞·뒤 연결 핀은", "single pins touch panel and rings on both sides"]],
  "cladding#roof-tile:supplemental": [["평판 위 무늬", "non-contact: stated failure conditions"]],
  "cladding#ridge-tile:supplemental": [["고정된 0.06m", "non-contact: construction rule rejecting a copied stop distance"]],
  "fixtures#fountain:supplemental": [["파문 안쪽", "fountain ripple clears nozzle pedestal"]],
  "fixtures#altar:supplemental": [["받침은 양옆", "altar support gap remains open"]],
  "fixtures#niche:supplemental": [["칸 없는", "non-contact: stated failure conditions"]],
  "fixtures#desk:supplemental": [
    ["[책상과 좌석]", "non-contact: reference observation"],
    ["네 다리 중심", "desk braces connect all four legs"],
    ["검토 판에서", "non-contact: future visual review question"],
  ],
  "fixtures#stool:supplemental": [["네 다리 중심을", "stool braces connect all four legs"]],
  "fixtures#chest:supplemental": [
    ["이미지 05의", "non-contact: reference and static-state decision"],
    ["연결 구간은", "chest hasp joints meet without penetration"],
  ],
  "wares#storage-jar:supplemental": [
    ["회전체 바깥", "non-contact: ordered exterior profile construction"],
    ["입 안쪽은", "storage neck wall"],
  ],
  "wares#carry-jar:supplemental": [
    ["바깥 윤곽은", "non-contact: ordered exterior profile construction"],
    ["입 안쪽은", "carry-jar neck wall"],
  ],
  "wares#small-vessel:supplemental": [
    ["바깥 윤곽은", "non-contact: ordered exterior profile construction"],
    ["입 안쪽은", "small-vessel neck wall"],
  ],
  "wares#offering-bowl:supplemental": [["회전 단면의 안쪽", "offering bowl explicit profile"]],
  "landscape#neighbor-house:supplemental": [
    ["양 끝 다락이", "neighbor gable end remains closed"],
    ["문·창 자리는", "neighbor recess retains a backing wall"],
    ["신전보다 높은", "non-contact: stated failure conditions"],
  ],
};

/** @param {Claim[]} claims @param {string[]} passLines @param {Record<string, [string,string][]>} decisionsBySection */
export const auditContactClaims = (claims, passLines, decisionsBySection) => {
  /** @type {string[]} */
  const failures = [];
  let measured = 0;
  let classified = 0;
  const seen = new Set();
  for (const claim of claims) {
    const split = claim.id.lastIndexOf(":");
    const section = claim.id.slice(0, split);
    const ordinal = claim.id.slice(split + 1);
    const decision = decisionsBySection[section]?.[Number(ordinal) - 1];
    if (!decision) { failures.push(`${claim.id}: no decision: ${claim.sentence}`); continue; }
    const [phrase, check] = decision;
    if (!claim.sentence.includes(phrase)) { failures.push(`${claim.id}: expected phrase ${phrase} no longer matches`); continue; }
    if (check.startsWith("non-contact: ")) classified++;
    else if (passLines.some((line) => line === `PASS ${check}` || line.startsWith(`PASS ${check} `))) measured++;
    else failures.push(`${claim.id}: missing arithmetic PASS ${check}`);
    seen.add(claim.id);
  }
  for (const [section, rows] of Object.entries(decisionsBySection)) {
    rows.forEach((_, index) => {
      const id = `${section}:${index + 1}`;
      if (!seen.has(id)) failures.push(`${id}: decision has no source sentence`);
    });
  }
  return { measured, classified, failures };
};

/** @param {string} output */
export const checkModelContactCensus = (output) => {
  const passLines = output.split(/\r?\n/).filter((line) => line.startsWith("PASS "));
  const claims = [...modelContactClaims(), ...modelContactClaims(true)];
  const result = auditContactClaims(claims, passLines, decisions);
  console.log(`model contact census: ${claims.length} lexical sentences, ${result.measured} measured, ${result.classified} classified non-contact, ${result.failures.length} unresolved`);
  for (const failure of result.failures) console.error(failure);
  return result.failures;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = execFileSync(process.execPath, [fileURLToPath(new URL("./model-design-arithmetic.mjs", import.meta.url))], { encoding: "utf8" });
  process.stdout.write(output);
  process.exitCode = checkModelContactCensus(output).length > 0 ? 1 : 0;
}
