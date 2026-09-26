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

export interface ModelSectionMeasure {
  path: string;
  title: string;
  body: number;
}

/** The same comment/whitespace measure, partitioned at every H2 for prose rank checks. */
export const modelSectionMeasures = (documents: readonly { path: string; source: string }[]): ModelSectionMeasure[] =>
  documents.flatMap(({ path, source }) => source.replace(/\r\n/g, "\n").split(/^## /m).slice(1).map((section) => {
    const title = section.split("\n", 1)[0]!.replace(/ \{#[^}]+\}$/, "");
    return { path, title, body: modelDocumentBodyLength(`## ${section}`) };
  })).sort((a, b) => b.body - a.body || a.path.localeCompare(b.path) || a.title.localeCompare(b.title));

export const modelDocumentBodyLength = (source: string): number => [...source
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\s/g, "")].length;

/** 파일이 하나도 빠지거나 중복되지 않은 모델 분량 Markdown 행. */
export const modelAccountRows = (measures: readonly ModelDocumentMeasure[]): string[] => {
  const byPath = new Map(measures.map((measure) => [measure.path, measure]));
  if (byPath.size !== measures.length) throw new Error(
    "models 분량 계측에 중복 경로가 있습니다.",
  );
  if (byPath.size === 0) throw new Error("models 분량 계측 모집단이 비었습니다.");
  const rows = [...byPath.keys()].sort((a, b) => a.localeCompare(b)).map((path) => {
    const measure = byPath.get(path)!;
    return `| ${path} | ${measure.headings} | ${measure.body} |`;
  });
  return [
    ...rows,
    `| 합계 | ${measures.reduce((sum, measure) => sum + measure.headings, 0)} | ${measures.reduce((sum, measure) => sum + measure.body, 0)} |`,
  ];
};

/** 현재 계정 표와 생성된 모든 행의 불일치를 돌려준다. */
export const modelAccountMismatches = (account: string, rows: readonly string[]): string[] => {
  const lines = account.replace(/\r\n/g, "\n").split("\n");
  const header = lines.indexOf(
    "| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |",
  );
  if (header < 0 || lines[header + 1] !== "| --- | ---: | ---: |") return [
    ...rows,
  ];
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
 * The authored H2 owns its part-to-construction-noun address. This grammar
 * checks every geometry H2, including later prototypes, without an ID list.
 * A per-part coordinate table, when present, must cover exactly those parts
 * and its union must equal the H2 occupancy box.
 */
export const modelPartNounMismatches = (documents: readonly { path: string; source: string }[]): string[] => {
  const missing: string[] = [];
  for (const { path, source } of documents) for (const section of source.replace(/\r\n/g, "\n").split(/(?=^## )/m).filter(
    (item) => item.startsWith("## "),
  )) {
    const anchor = section.match(/^## .+ \{#([^}]+)\}/)?.[1];
    if (!anchor) throw new Error(`모델 H2 anchor가 없습니다: ${path}`);
    if (path === "scale.md") continue;
    const key = `${path.replace(/\.md$/, "")}#${anchor}`;
    const body = section.replace(/<!--[\s\S]*?-->/g, "");
    const mapping = body.match(/^부재 대응: ([^\n]+)$/m)?.[1];
    const declaration = body.match(/part와 표면은([^\n]*)/)?.[1]?.split(
      "다.",
    )[0];
    if (!mapping || !declaration) {
      missing.push(`${key}: part address or declaration absent`);
      continue; }
    const associations = [...mapping.matchAll(/`([^`]+)`=([^;.]+)/g)].map(
      (match) => ({ part: match[1]!, noun: match[2]!.trim() }),
    );
    const parts = [...declaration.matchAll(/`([^`]+)`/g)].map(
      (match) => match[1]!,
    );
    if (associations.length === 0 || new Set(associations.map((row) => row.part)).size !== associations.length)
      missing.push(`${key}: duplicate or empty part address`);
    const prose = body.split("부재 대응:")[0] ?? "";
    for (const { part, noun } of associations) {
      if (!prose.includes(noun)) missing.push(`${key}: construction noun ${noun} for ${part} absent`);
      if (!parts.includes(part)) missing.push(`${key}: ${noun} has no ${part} surface`);
    }
    for (const part of parts) if (!associations.some(
      (row) => row.part === part,
    ))
      missing.push(`${key}: declared ${part} has no construction noun`);
    if (!/원점/.test(body) || !/(?:X=|Y=|Z=|폭|높이)/.test(body) || !/검토 판/.test(body))
      missing.push(`${key}: origin, coordinate or neutral review missing`);

    if (!/^\| part \| X \| Y \| Z \|$/m.test(body)) continue;
    const rows = [
      ...body.matchAll(/^\| `([^`]+)` \| ([^\n]+) \| ([^\n]+) \| ([^\n]+) \|$/gm),
    ];
    const tableParts = rows.map((row) => row[1]!);
    const spatialSignatures = rows.map((row) => row.slice(2, 5).join("|"));
    if (new Set(spatialSignatures).size !== rows.length)
      missing.push(
        `${key}: distinct parts occupy identical coordinate intervals`,
      );
    if (new Set(tableParts).size !== rows.length ||
        parts.some((part) => !tableParts.includes(part)) || tableParts.some((part) => !parts.includes(part)))
      missing.push(`${key}: coordinate part table differs from declared parts`);
    /** @type {[number, number][]} */
    const envelope: [number, number][] = [
      [Infinity, -Infinity],
      [Infinity, -Infinity],
      [Infinity, -Infinity],
    ];
    for (const row of rows) for (let axis = 0; axis < 3; axis++) {
      const cell = row[axis + 2]!;
      const letter = "XYZ"[axis]!;
      const spans = [
        ...cell.matchAll(new RegExp(`${letter}=([+−-]?\\d+(?:\\.\\d+)?)~([+−-]?\\d+(?:\\.\\d+)?)m`, "g")),
      ];
      if (spans.length === 0) {
        missing.push(`${key}: ${row[1]} ${letter} coordinate absent`);
        continue; }
      for (const span of spans) {
        const lo = Number(span[1]!.replace("−", "-")), hi = Number(span[2]!.replace("−", "-"));
        if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo >= hi)
          missing.push(`${key}: ${row[1]} ${letter} interval invalid`);
        envelope[axis]![0] = Math.min(envelope[axis]![0], lo);
        envelope[axis]![1] = Math.max(envelope[axis]![1], hi);
      }
    }
    const box = body.match(
      /점유 상자는 (?:약 )?(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)m/,
    );
    if (!box) {
      missing.push(`${key}: numeric occupancy box absent for coordinate table`);
      continue; }
    const dimensions = [Number(box[1]), Number(box[2]), Number(box[3])];
    if (envelope.some(
      ([lo, hi], axis) => Math.abs(hi - lo - dimensions[axis]!) > 1e-6,
    ))
      missing.push(`${key}: coordinate union disagrees with occupancy box`);
    if (/원점은[^.\n]{0,80}중심/.test(body) && Math.abs(envelope[0]![0] + envelope[0]![1]) > 1e-6)
      missing.push(
        `${key}: X occupancy no longer straddles its centred origin`,
      );
    if (/원점은[^.\n]{0,80}(?:바닥|아래면|지면)/.test(body) && Math.abs(envelope[1]![0]) > 1e-6)
      missing.push(`${key}: floor datum no longer meets Y=0`);
  }
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
  if (header < 0 || lines[header + 1] !== "| --- | --- | ---: | --- |") return [
    "model input table header missing",
  ];
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
