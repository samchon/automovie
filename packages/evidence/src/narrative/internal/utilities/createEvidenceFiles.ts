/**
 * Mirrors selected manuscript files under detached construction evidence.
 *
 * @evidence contracts/common.md#principled-implementation Each body-relative selector is placed under detached construction files or units according to its host symbol, preserving a leading exclusion marker around the qualified selector.
 * @evidence contracts/common.md#clear-and-simple-design One selector transform serves factory ownership and package claim builders, so detached file/H2 evidence use the same carrier layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Files and units are explicit native host distinctions; negative selectors keep their original exclusion semantics instead of widening coverage.
 * @evidence contracts/common.md#meaningful-documentation The comment states the detached construction mirror, and the typed symbol input selects the documented file-versus-unit carrier.
 * @evidence contracts/performance.md#efficient-algorithms For n selectors with total text length p, one mapping pass costs O(n + p) text work and allocates n qualified strings; manuscript contents are not read.
 * @evidence contracts/performance.md#reuse-equivalent-work Carrier selection is computed once for the map and the transformation is shared by all claim builders; fresh arrays prevent callers from mutating another claim selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The mapped array is returned to its config owner and scales with selector text; no filesystem handle, task or process-wide selector cache is retained.
 */
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
