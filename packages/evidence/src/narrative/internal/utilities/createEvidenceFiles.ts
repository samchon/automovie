/** Mirrors selected manuscript files under detached construction evidence. */
export function createEvidenceFiles(
  symbol: "file" | "h2",
  files: string[],
): string[] {
  const carrier: "files" | "units" = symbol === "file" ? "files" : "units";
  return files.map((file: string): string => {
    const excluded: boolean = file.startsWith("!");
    const relative: string = excluded ? file.slice(1) : file;
    const selected: string = `docs/evidence/construction/${carrier}/${relative}`;
    return excluded ? `!${selected}` : selected;
  });
}
