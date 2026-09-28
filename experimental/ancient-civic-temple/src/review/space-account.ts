/**
 * docs/accounts/spaces/core-common.md#proportion의 본문 분량 표를 docs/spaces의 실제
 * 전집합에서 생성한다. HTML 주석·제목 줄·공백을 제외하는 self-check의 기존 단위를
 * 공유하고, 빠진 문서나 새 문서를 조용히 표 밖에 두지 않는다.
 */

export interface SpaceDocumentMeasure {
  path: string;
  body: number;
  headings: number;
}

export const spaceDocumentBodyLength = (source: string): number => [...source
  .replace(/<!--[\s\S]*?-->/g, "")
  .split("\n").filter((line) => !line.startsWith("#")).join("")
  .replace(/\s/g, "")].length;

const groups: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["building·storey", ["building.md", "storey.md"]],
  ["openings·junctions·circulation", ["openings.md", "junctions.md", "circulation.md"]],
  ["남·북·서·동 입면", ["facades/south.md", "facades/north.md", "facades/west.md", "facades/east.md"]],
  ["현관·중정·주랑", ["rooms/entrance.md", "rooms/courtyard.md", "rooms/colonnade.md"]],
  ["제실·봉헌실", ["rooms/sanctuary.md", "rooms/offering.md"]],
  ["관리실·기록실·보관실·마당", ["rooms/administration.md", "rooms/records.md", "rooms/storage.md", "rooms/service-yard.md"]],
  ["assembly·sanctuary·west·east·porch·colonnade roof", ["roofs/assembly.md", "roofs/sanctuary.md", "roofs/west.md", "roofs/east.md", "roofs/porch.md", "roofs/colonnade.md"]],
  ["ownership·observations", ["ownership.md", "observations.md"]],
  ["site", ["site.md"]],
];

/** 모든 문서가 정확히 한 표 행에 들어간 Markdown 본문 행. */
export const spaceAccountRows = (measures: readonly SpaceDocumentMeasure[]): string[] => {
  const byPath = new Map(measures.map((measure) => [measure.path, measure]));
  if (byPath.size !== measures.length) throw new Error("spaces 분량 계측에 중복 경로가 있습니다.");
  const used = new Set<string>();
  const rows = groups.map(([role, paths]) => {
    const members = paths.map((path) => {
      const measure = byPath.get(path);
      if (measure === undefined) throw new Error(`spaces 분량 표에 필요한 ${path}가 없습니다.`);
      if (used.has(path)) throw new Error(`spaces 분량 표가 ${path}를 중복 선택했습니다.`);
      used.add(path);
      return measure;
    });
    return `| ${role} | ${members.length}/${members.reduce((sum, member) => sum + member.headings, 0)} | ${members.map((member) => member.body).join("·")} |`;
  });
  const extras = [...byPath.keys()].filter((path) => !used.has(path));
  if (extras.length > 0) throw new Error(`spaces 분량 표에 없는 문서: ${extras.join(", ")}`);
  return rows;
};

/** 현재 account의 각 행이 계측 산출물과 같은지 모두 검사한다. */
export const spaceAccountMismatches = (account: string, rows: readonly string[]): string[] => {
  const lines = account.replace(/\r\n/g, "\n").split("\n");
  const header = lines.indexOf("| 역할 | 파일/H2 | 파일별 본문 문자 수 |");
  if (header < 0 || lines[header + 1] !== "| --- | --- | --- |") return [...rows];
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
