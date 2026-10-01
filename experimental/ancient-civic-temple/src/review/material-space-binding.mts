/**
 * Compare the authored material assignment with every space surface emitted
 * by the current environment. The model-part table has its own census.
 */

const rowsAfter = (source: string, heading: string) => {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => line === heading);
  if (start < 0 || !lines[start + 1]?.startsWith("| ---")) return null;
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith("|")) break;
    rows.push(line.split("|").slice(1, -1).map((cell) => cell.trim()));
  }
  return rows;
};

export const materialSpaceBindingCensus = (emittedIds: readonly string[], spaceDesign: string, keyDesign: string) => {
    const failures: string[] = [];
  const keyRows = rowsAfter(keyDesign, "| 결속 키 | 반복 길이 U·V (m) | 비트맵 부재 시 단색 fallback |");
  const keys = new Set((keyRows ?? []).map((row) => /^`([^`]+)`$/.exec(row[0] ?? "")?.[1]).filter(Boolean));
  if (keys.size === 0) failures.push("재료 결속 키 표가 비었습니다.");
  const rows = rowsAfter(spaceDesign, "| 방출 공간 표면 ID | 결속 키 |");
  if (rows === null || rows.length === 0) failures.push("공간 표면 결속 표가 비었습니다.");
  const assigned = new Map();
  for (const cells of rows ?? []) {
    const ids = [...(cells[0] ?? "").matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    const rest = (cells[0] ?? "").replace(/`[^`]+`/g, "").replace(/[\s,]/g, "");
    const key = /^`([^`]+)`$/.exec(cells[1] ?? "")?.[1];
    if (cells.length !== 2 || ids.length === 0 || rest !== "" || !keys.has(key)) {
      failures.push(`잘못된 공간 재료 행: ${cells.join(" | ")}`);
      continue;
    }
    for (const id of ids) {
      if (!id.startsWith("surface.")) failures.push(`공간 표면 주소가 아닙니다: ${id}`);
      if (assigned.has(id)) failures.push(`중복 재료 결속: ${id}`);
      else assigned.set(id, key);
    }
  }
  const emitted = new Set(emittedIds);
  if (emitted.size === 0) failures.push("방출 공간 표면이 비었습니다.");
  for (const id of emitted) if (!assigned.has(id)) failures.push(`재료 결속 누락: ${id}`);
  for (const id of assigned.keys()) if (!emitted.has(id)) failures.push(`방출되지 않은 표면 결속: ${id}`);
  return { emitted: emitted.size, assigned: assigned.size, rows: rows?.length ?? 0, failures };
};
