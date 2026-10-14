import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";

/**
 * Expand independent review axes into their Cartesian product in declaration order. Every cell carries a complete admitted address and a human label. Subjects and body states resolve against the supplied published identities; mesh admission belongs to the display hook that receives the resulting cell. The bounded product prevents accidental unbounded captures on a resident GPU.
 *
 * @evidence contracts/common.md#principled-implementation Ordered review axes expand into complete addresses re-admitted by the shared parser, with subject/state names checked against supplied documents.
 * @evidence contracts/common.md#clear-and-simple-design An incremental Cartesian product joins each canonical address and human label, leaving mesh admission downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported/repeated axes, unknown documents and products above 512 cells refuse before unbounded capture admission.
 * @evidence contracts/common.md#meaningful-documentation The comment defines order, published identity authority, mesh ownership and bounded review products.
 * @evidence contracts/performance.md#efficient-algorithms Expansion follows admitted cells times axis/address work; current document membership uses a linear list scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Cells derive from their preceding canonical address but remain distinct requested observations rather than interchangeable completed images.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most 512 accepted planned cells remain and no GPU request, PNG surface or source hold is acquired.
 */
export function planHumanViewerSheet(
  base: HumanViewerAddress,
  axes: string,
  documents: readonly string[],
): { address: HumanViewerAddress; label: string }[] {
  type Cell = { address: HumanViewerAddress; label: string };
  let cells: Cell[] = [{ address: base, label: "" }];
  const seen: Set<string> = new Set();
  for (const axis of axes.split(";")) {
    const separator: number = axis.indexOf(":");
    const name: string = axis.slice(0, separator);
    const text: string = axis.slice(separator + 1);
    if (separator < 1 || text === "" || seen.has(name))
      throw new Error("Malformed or repeated review axis");
    seen.add(name);
    if (!["view", "pass", "part", "subject", "state"].includes(name))
      throw new Error("Unsupported review axis: " + name);
    const values: readonly string[] =
      text === "*" && name === "subject"
        ? documents.filter((id: string): boolean => !id.startsWith("body:"))
        : text.split(",");
    if (values.length === 0 || values.some((value: string): boolean => value.trim() === ""))
      throw new Error("An axis requires values");
    if (cells.length * values.length > 512)
      throw new Error("A sheet may contain at most 512 cells");
    cells = cells.flatMap((cell: Cell): Cell[] =>
      values.map((value: string): Cell => {
        const fields: URLSearchParams = new URLSearchParams(
          serializeHumanViewerAddress(cell.address),
        );
        if (name === "subject" || name === "state") {
          const id: string = name === "state" ? "body:" + value : value;
          if (!documents.includes(id))
            throw new Error("Unknown sheet document: " + id);
          fields.set("doc", id);
        } else if (name === "part") {
          if (value === "assembled") fields.delete("parts");
          else fields.set("parts", value);
        } else fields.set(name, value);
        return {
          address: parseHumanViewerAddress(fields.toString()),
          label:
            cell.label + (cell.label === "" ? "" : " • ") + name + ":" + value,
        };
      }),
    );
  }
  return cells;
}
