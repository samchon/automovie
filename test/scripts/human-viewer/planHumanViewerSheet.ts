import type { HumanViewerAddress } from "./HumanViewerAddress";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";

/**
 * Expand independent review axes into their Cartesian product in declaration
 * order. Every cell carries a complete admitted address and a human label.
 * Subjects and body states resolve against the supplied published identities;
 * mesh admission belongs to the display hook that receives the resulting cell.
 * The bounded product prevents accidental unbounded captures on a resident GPU.
 *
 * @evidence contracts/common.md#principled-implementation Repeated flatMap forms the ordered Cartesian product, preserving each axis choice in its label.
 * @evidence contracts/common.md#clear-and-simple-design Pure planning precedes rendering; the same address parser owns field admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resolves subjects from the actual inventory rather than a second subject list.
 * @evidence contracts/common.md#meaningful-documentation States axis order, mesh admission and the capture population limit.
 */
export function planHumanViewerSheet(base: HumanViewerAddress, axes: string, documents: readonly string[]):
  { address: HumanViewerAddress; label: string }[] {
  let cells = [{ address: base, label: "" }];
  const seen = new Set<string>();
  for (const axis of axes.split(";")) {
    const separator = axis.indexOf(":");
    const name = axis.slice(0, separator);
    const text = axis.slice(separator + 1);
    if (separator < 1 || text === "" || seen.has(name)) throw new Error("Malformed or repeated review axis");
    seen.add(name);
    if (!["view", "pass", "part", "subject", "state"].includes(name)) throw new Error("Unsupported review axis: " + name);
    const values = text === "*" && name === "subject" ? documents.filter((id) => !id.startsWith("body:")) : text.split(",");
    if (values.length === 0 || values.some((value) => value.trim() === "")) throw new Error("An axis requires values");
    if (cells.length * values.length > 512) throw new Error("A sheet may contain at most 512 cells");
    cells = cells.flatMap((cell) => values.map((value) => {
      const fields = new URLSearchParams(serializeHumanViewerAddress(cell.address));
      if (name === "subject" || name === "state") {
        const id = name === "state" ? "body:" + value : value;
        if (!documents.includes(id)) throw new Error("Unknown sheet document: " + id);
        fields.set("doc", id);
      } else if (name === "part") {
        if (value === "assembled") fields.delete("parts");
        else fields.set("parts", value);
      } else fields.set(name, value);
      return { address: parseHumanViewerAddress(fields.toString()), label: cell.label + (cell.label === "" ? "" : " • ") + name + ":" + value };
    }));
  }
  return cells;
}
