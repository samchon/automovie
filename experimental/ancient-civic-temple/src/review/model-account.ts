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
