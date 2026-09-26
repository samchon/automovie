/** Replace one measured Markdown table while retaining every other account sentence. */
export const replaceMeasuredTable = (source: string, header: string, rows: readonly string[]): string => {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const start = lines.indexOf(header);
  if (start < 0 || lines.indexOf(header, start + 1) >= 0) throw new Error(`계정 표 제목이 하나가 아닙니다: ${header}`);
  if (lines[start + 1]?.startsWith("| ---") !== true) throw new Error(`계정 표 구분선이 없습니다: ${header}`);
  let end = start + 2;
  while (lines[end]?.startsWith("|") === true) end++;
  if (end === start + 2) throw new Error(`계정 표 본문이 없습니다: ${header}`);
  lines.splice(start + 2, end - start - 2, ...rows);
  return lines.join(newline);
};
