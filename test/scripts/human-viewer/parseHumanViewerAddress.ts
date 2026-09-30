import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * Admit the same fields from a bookmark hash or an HTTP query. Refuse unknown
 * fields and malformed numeric values before touching a resident viewport.
 * Defaults are protocol choices, not anatomical measurements. The caller owns
 * catalogue admission: parsing a document name does not assert it exists.
 *
 * @evidence contracts/common.md#principled-implementation URLSearchParams decoding and finite bounds admit the protocol before display effects.
 * @evidence contracts/common.md#clear-and-simple-design The parser owns defaults and refusals for every transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document-specific cases or geometry mutations occur during parsing.
 * @evidence contracts/common.md#meaningful-documentation States the distinction between syntax admission and catalogue admission.
 */
export function parseHumanViewerAddress(input: string): HumanViewerAddress {
  const fields = new URLSearchParams(input.replace(/^[#?]/, ""));
  const allowed = [
    "doc",
    "parts",
    "view",
    "pass",
    "frame",
    "ao",
    "size",
    "fmt",
    "ref",
    "opacity",
    "pitch",
  ];
  for (const key of fields.keys()) {
    if (!allowed.includes(key))
      throw new Error(`Unknown display field: ${key}`);
    if (fields.getAll(key).length !== 1)
      throw new Error(`Repeated display field: ${key}`);
  }
  const view = fields.get("view") ?? "front";
  const pass = fields.get("pass") ?? "beauty";
  if (
    ![
      "front",
      "left-three-quarter",
      "left",
      "back",
      "right-three-quarter",
      "right",
      "top",
      "bottom",
    ].includes(view)
  )
    throw new Error(`Unknown view: ${view}`);
  if (
    !["beauty", "clay", "normal", "depth", "flat", "wire", "outline"].includes(
      pass,
    )
  )
    throw new Error(`Unknown pass: ${pass}`);
  const number = (
    key: string,
    fallback: number,
    min: number,
    max: number,
  ): number => {
    const text = fields.get(key);
    const value =
      text === null ? fallback : text.trim() === "" ? NaN : Number(text);
    if (!Number.isFinite(value) || value < min || value > max)
      throw new Error(`Invalid ${key}`);
    return value;
  };
  const size = number("size", 900, 32, 2048);
  if (!Number.isInteger(size)) throw new Error("size must be an integer");
  const frameText = fields.get("frame");
  let frame: HumanViewerAddress["frame"] = null;
  if (frameText !== null) {
    const values = frameText
      .split(",")
      .map((text) => (text.trim() === "" ? NaN : Number(text)));
    if (values.length !== 4 || !values.every(Number.isFinite) || values[3] <= 0)
      throw new Error("frame requires a finite centre and positive radius");
    frame = values as NonNullable<typeof frame>;
  }
  const ao = fields.get("ao") ?? "off";
  if (ao !== "off" && ao !== "on") throw new Error("ao must be on or off");
  if (fields.has("fmt") && fields.get("fmt") !== "png")
    throw new Error("Only PNG is supported");
  const ref = fields.get("ref");
  if (ref !== null && !["split", "overlay", "swipe"].includes(ref))
    throw new Error("Unknown reference mode");
  const doc = fields.get("doc") ?? "connected-reference";
  if (doc.trim() === "") throw new Error("doc must name a published document");
  const parts = fields.get("parts");
  if (
    parts !== null &&
    (parts === "" || parts.split(",").some((part) => part.trim() === ""))
  )
    throw new Error("parts must contain mesh names");
  return {
    doc,
    parts: parts === null ? [] : parts.split(","),
    view: view as HumanViewerAddress["view"],
    pitch: number("pitch", 0, -89, 89),
    pass: pass as HumanViewerAddress["pass"],
    frame,
    ao: ao === "on",
    size,
    ref: ref as HumanViewerAddress["ref"],
    opacity: number("opacity", 0.5, 0, 1),
  };
}
