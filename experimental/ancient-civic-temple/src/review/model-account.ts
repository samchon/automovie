import { createHash } from "node:crypto";

/**
 * docs/accounts/models/core-common.md#proportion의 분량 표를 docs/models 전집합에서
 * 생성한다. 기존 모델 계정은 제목을 포함하고 HTML 주석과 공백만 제외해 세었다.
 */
export interface ModelDocumentMeasure {
  path: string;
  body: number;
  headings: number;
}

export interface ModelSectionMeasure { path: string; title: string; body: number }

/** The same comment/whitespace measure, partitioned at every H2 for prose rank checks. */
export const modelSectionMeasures = (documents: readonly { path: string; source: string }[]): ModelSectionMeasure[] =>
  documents.flatMap(({ path, source }) => source.replace(/\r\n/g, "\n").split(/^## /m).slice(1).map((section) => {
    const title = section.split("\n", 1)[0]!.replace(/ \{#[^}]+\}$/, "");
    return { path, title, body: modelDocumentBodyLength(`## ${section}`) };
  })).sort((a, b) => b.body - a.body || a.path.localeCompare(b.path) || a.title.localeCompare(b.title));

export const modelDocumentBodyLength = (source: string): number => [...source
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\s/g, "")].length;

const modelFiles = [
  "fixtures.md", "entablature.md", "openings.md", "wares.md",
  "landscape.md", "scale.md", "columns.md", "cladding.md",
] as const;

/** 파일이 하나도 빠지거나 중복되지 않은 모델 분량 Markdown 행. */
export const modelAccountRows = (measures: readonly ModelDocumentMeasure[]): string[] => {
  const byPath = new Map(measures.map((measure) => [measure.path, measure]));
  if (byPath.size !== measures.length) throw new Error("models 분량 계측에 중복 경로가 있습니다.");
  const rows = modelFiles.map((path) => {
    const measure = byPath.get(path);
    if (measure === undefined) throw new Error(`models 분량 표에 필요한 ${path}가 없습니다.`);
    return `| ${path} | ${measure.headings} | ${measure.body} |`;
  });
  const extras = [...byPath.keys()].filter((path) => !modelFiles.includes(path as typeof modelFiles[number]));
  if (extras.length > 0) throw new Error(`models 분량 표에 없는 문서: ${extras.join(", ")}`);
  return [...rows, `| 합계 | ${measures.reduce((sum, measure) => sum + measure.headings, 0)} | ${measures.reduce((sum, measure) => sum + measure.body, 0)} |`];
};

/** 현재 계정 표와 생성된 모든 행의 불일치를 돌려준다. */
export const modelAccountMismatches = (account: string, rows: readonly string[]): string[] => {
  const lines = account.replace(/\r\n/g, "\n").split("\n");
  const header = lines.indexOf("| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |");
  if (header < 0 || lines[header + 1] !== "| --- | ---: | ---: |") return [...rows];
  const actual: string[] = [];
  for (const line of lines.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    actual.push(line);
  }
  return [
    ...rows.filter((row, i) => actual[i] !== row),
    ...actual.slice(rows.length).map((row) => `unexpected: ${row}`),
  ];
};

export const modelInputHeader = "| 모델 H2 | part | 본문 문자 수 | 본문 SHA-256 |";

/**
 * Independent Korean construction nouns expected before each H2's part declaration.
 * This covers all 33 geometry H2s, so dropping a part from the declaration while
 * leaving its designed geometry behind fails instead of silently shrinking the index.
 * A changed design must revise its H2 and this audit together.
 */
const geometryNounsByPart: Record<string, Record<string, string>> = {
  "cladding#roof-tile": { tegula: "평기와", imbrex: "둥근기와" },
  "cladding#ridge-tile": { ridge: "덮개" },
  "columns#colonnade-column": { plinth: "기단", base: "받침", shaft: "몸통", capital: "주두" },
  "columns#porch-column": { plinth: "기단", base: "받침", shaft: "몸통", capital: "주두" },
  "entablature#colonnade-beam": { timber: "목재" },
  "entablature#rafter": { timber: "서까래" },
  "entablature#porch-entablature": { beam: "보는", cornice: "코니스", "raking-trim": "경사 트림" },
  "entablature#sanctuary-truss": { "tie-beam": "평보", principal: "경사재", "king-post": "가운데 기둥", strut: "버팀재" },
  "entablature#ceiling-joist": { timber: "목재 보" },
  "openings#door-frame": { lining: "안감", surround: "테" },
  "openings#double-door-leaf": { frame: "선대", panel: "판은", plate: "받침판", pin: "연결 핀", ring: "고리", hinge: "경첩" },
  "openings#single-door-leaf": { board: "널 다섯", batten: "가로 띠", strap: "쇠 띠", pin: "연결 핀", ring: "고리" },
  "openings#window-frame": { lining: "안감", surround: "테" },
  "fixtures#fountain": { step: "받침단", rim: "테두리", "basin-inner": "안쪽 바닥", water: "물면", ripple: "파문", nozzle: "노즐", jet: "물줄기" },
  "fixtures#altar": { step: "석단", top: "상판", support: "받침" },
  "fixtures#niche": { plinth: "받침", body: "몸체", recess: "오목한 칸", cap: "머리판" },
  "fixtures#lampstand": { foot: "원판", stem: "줄기", knop: "마디", dish: "접시" },
  "fixtures#offering-table": { top: "상판", trestle: "다리받침" },
  "fixtures#display-shelf": { side: "측판", board: "선반 판" },
  "fixtures#desk": { top: "상판", leg: "다리", stretcher: "가로 지지재" },
  "fixtures#stool": { seat: "좌판", leg: "다리", stretcher: "가로 지지재" },
  "fixtures#scroll-shelf": { frame: "측판", divider: "칸막이" },
  "fixtures#chest": { body: "몸체", lid: "뚜껑", hasp: "걸쇠", strap: "띠는" },
  "wares#storage-jar": { body: "바깥 윤곽", handle: "손잡이" },
  "wares#carry-jar": { body: "바깥 윤곽", handle: "손잡이" },
  "wares#small-vessel": { body: "바깥 윤곽", handle: "손잡이" },
  "wares#offering-bowl": { bowl: "껍질" },
  "wares#basket": { wall: "벽은", rim: "테두리", floor: "안쪽 바닥" },
  "wares#scroll": { sheet: "종이", tie: "끈" },
  "landscape#cypress": { trunk: "줄기", crown: "수관" },
  "landscape#broad-tree": { trunk: "줄기", branch: "가지", crown: "수관" },
  "landscape#grass-tuft": { blade: "잎" },
  "landscape#neighbor-house": { wall: "벽", plinth: "기단 띠", roof: "지붕", recess: "문·창 자리" },
};

/** Cross-check every construction noun against the exported face owner inventory. */
export const modelPartNounMismatches = (documents: readonly { path: string; source: string }[]): string[] => {
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const { path, source } of documents) for (const section of source.replace(/\r\n/g, "\n").split(/(?=^## )/m).filter((item) => item.startsWith("## "))) {
    const anchor = section.match(/^## .+ \{#([^}]+)\}/)?.[1];
    if (!anchor) throw new Error(`모델 H2 anchor가 없습니다: ${path}`);
    const key = `${path.replace(/\.md$/, "")}#${anchor}`;
    if (path === "scale.md") continue;
    seen.add(key);
    const nouns = geometryNounsByPart[key];
    if (!nouns) { missing.push(`${key}: no independent noun mapping`); continue; }
    const prose = section.replace(/<!--[\s\S]*?-->/g, "").split("part와 표면은")[0] ?? "";
    const declared = section.replace(/<!--[\s\S]*?-->/g, "").split("part와 표면은")[1]?.split("다.")[0] ?? "";
    const parts = [...declared.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
    for (const [part, noun] of Object.entries(nouns)) {
      if (!prose.includes(noun)) missing.push(`${key}: construction noun ${noun} for ${part} absent`);
      if (!parts.includes(part)) missing.push(`${key}: ${noun} has no ${part} surface`);
    }
    for (const part of parts) if (!(part in nouns)) missing.push(`${key}: declared ${part} has no independent construction noun`);
  }
  for (const key of Object.keys(geometryNounsByPart)) if (!seen.has(key)) missing.push(`${key}: audited H2 absent`);
  return missing;
};

/**
 * Produce a part-by-part source-input index from the H2 body itself. The table
 * deliberately has no manually maintained "remaining decisions: 0" column:
 * exact prose changes change the generated row and are reviewed at the owner.
 */
export const modelSourceInputRows = (documents: readonly { path: string; source: string }[]): string[] =>
  documents.flatMap(({ path, source }) => source.replace(/\r\n/g, "\n").split(/(?=^## )/m).filter((section) => section.startsWith("## ")).flatMap((section) => {
    const anchor = section.match(/^## .+ \{#([^}]+)\}/)?.[1];
    if (anchor === undefined) throw new Error(`모델 H2 anchor가 없습니다: ${path}`);
    const body = section.replace(/^## [^\n]+\n?/, "").replace(/<!--[\s\S]*?-->/g, "").trim();
    const partLine = body.split("\n").find((line) => line.includes("part와 표면은"));
    const partClause = partLine?.split("part와 표면은")[1]?.split("다.")[0] ?? "";
    const parts = [...partClause.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
    if (parts.length === 0 && path !== "scale.md") throw new Error(`모델 part 선언이 없습니다: ${path}#${anchor}`);
    const geometry = body.replace(/\s+/g, " ");
    if (geometry.length === 0) throw new Error(`모델 본문이 없습니다: ${path}#${anchor}`);
    const digest = createHash("sha256").update(geometry).digest("hex");
    return (parts.length > 0 ? [...new Set(parts)] : ["공통 규칙"]).map((part) =>
      `| [${path.replace(/\.md$/, "")}/${anchor}](../../models/${path}#${anchor}) | \`${part}\` | ${[...geometry].length} | \`${digest}\` |`);
  }));

/** Verify every generated row, including changed values in an unchanged H2 list. */
export const modelSourceInputMismatches = (account: string, expected: readonly string[]): string[] => {
  const lines = account.replace(/\r\n/g, "\n").split("\n");
  const header = lines.indexOf(modelInputHeader);
  if (header < 0 || lines[header + 1] !== "| --- | --- | ---: | --- |") return ["model input table header missing"];
  const actual: string[] = [];
  for (const line of lines.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    actual.push(line);
  }
  return [
    ...expected.filter((row, i) => actual[i] !== row).map((row) => `stale: ${row.slice(0, 100)}`),
    ...actual.slice(expected.length).map((row) => `unexpected: ${row.slice(0, 100)}`),
  ];
};
