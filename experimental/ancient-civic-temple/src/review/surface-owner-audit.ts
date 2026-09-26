/** Compare every emitted surface owner with the authored ownership table. */
export const auditSurfaceOwners = (
  markdown: string,
  emitted: readonly { owner: string; ids: readonly string[] }[],
): { rows: number; declared: number; emitted: number; failures: string[] } => {
  const heading = markdown.indexOf(
    "## 입면·방·층·지붕의 소유 지도 {#surface-map}",
  );
  const nextHeading = markdown.indexOf("\n## ", heading + 1);
  const body = heading < 0
    ? ""
    : markdown.slice(heading, nextHeading < 0 ? undefined : nextHeading);
  const lines = body.split(/\r?\n/);
  const header = lines.findIndex(
    (line) => line.startsWith("| 완결 표면/역할 |") && line.includes("| 방출 owner |"),
  );
  const failures: string[] = [];
  if (header < 0) failures.push(
    "ownership.md#surface-map에 방출 owner 표가 없습니다.",
  );
  const declared = new Set<string>();
  let rows = 0;
  for (const line of header < 0 ? [] : lines.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    rows++;
    const columns = line.split("|").slice(1, -1).map((item) => item.trim());
    if (columns.length !== 4 || !columns[1]?.includes("](") || !columns[2]?.startsWith("src/spaces/")) {
      failures.push(`소유 표 ${rows}행의 owner 주소 형식이 잘못됐습니다.`);
      continue;
    }
    const owner = /^`([^`]+)`$/.exec(columns[3] ?? "")?.[1];
    if (!owner) {
      if (!columns[3]?.startsWith("없음(")) failures.push(`소유 표 ${rows}행에 방출 owner가 없습니다.`);
      continue;
    }
    if (declared.has(owner)) failures.push(`소유 표에서 ${owner}가 중복됐습니다.`);
    declared.add(owner);
  }
  if (rows === 0) failures.push("소유 표의 본문 행이 없습니다.");
  const actual = new Set<string>();
  for (const row of emitted) {
    if (actual.has(row.owner)) failures.push(`방출 owner ${row.owner}가 중복됐습니다.`);
    actual.add(row.owner);
    if (row.ids.length === 0) failures.push(
      `방출 owner ${row.owner}의 표면이 비었습니다.`,
    );
  }
  for (const owner of actual) if (!declared.has(owner)) failures.push(`방출 owner ${owner}가 표에 없습니다.`);
  for (const owner of declared) if (!actual.has(owner)) failures.push(`표의 owner ${owner}가 방출되지 않았습니다.`);
  return { rows, declared: declared.size, emitted: emitted.length, failures };
};
