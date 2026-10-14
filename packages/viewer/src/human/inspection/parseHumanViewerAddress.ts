import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import { humanViewerChoices } from "./humanViewerChoices.js";
import { parseHumanViewerLight } from "./parseHumanViewerLight.js";

/**
 * Admit the same fields from a bookmark hash or an HTTP query. Refuse unknown fields and malformed numeric values before touching a resident viewport. Defaults are protocol choices, not anatomical measurements. The caller owns catalogue admission: parsing a document name does not assert it exists. A missing document needs an explicit caller-supplied default; the library does not choose a named example.
 *
 * @evidence contracts/common.md#principled-implementation Unknown/repeated fields, finite bounded numbers and supported protocol choices are admitted before viewport mutation.
 * @evidence contracts/common.md#clear-and-simple-design One query record and numeric helper assemble a complete address using only the explicit caller document fallback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parsed document or mesh text is not catalogue/anatomy admission, and protocol defaults are not invented measurements.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines hash/query parity, pre-viewport refusal and caller ownership of document existence.
 * @evidence contracts/performance.md#efficient-algorithms Field and tuple parsing scale with address text using fixed choice lists, without geometry or catalogue traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Bookmarks and HTTP requests share one parser and therefore the same protocol field admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays and strings belong to the address caller and acquire no viewport or source-window lifetime.
 */
export function parseHumanViewerAddress(
  input: string,
  defaultDocument?: string,
): HumanViewerAddress {
  const fields: URLSearchParams = new URLSearchParams(
    input.replace(/^[#?]/, ""),
  );
  const allowed: readonly string[] = [
    "doc",
    "operation",
    "parts",
    "hide",
    "zoom",
    "view",
    "pass",
    "frame",
    "ao",
    "shadows",
    "light",
    "size",
    "fmt",
    "ref",
    "landmarks",
    "calibrate",
    "opacity",
    "pitch",
    "look",
  ];
  for (const key of fields.keys()) {
    if (!allowed.includes(key))
      throw new Error(`Unknown display field: ${key}`);
    if (fields.getAll(key).length !== 1)
      throw new Error(`Repeated display field: ${key}`);
  }
  const view: string = fields.get("view") ?? "front";
  const operation: string = fields.get("operation") ?? "preview";
  if (operation !== "preview" && operation !== "construct")
    throw new Error("Unknown human operation: " + operation);
  const pass: string = fields.get("pass") ?? "beauty";
  if (!(humanViewerChoices.views as readonly string[]).includes(view))
    throw new Error(`Unknown view: ${view}`);
  if (!(humanViewerChoices.passes as readonly string[]).includes(pass))
    throw new Error(`Unknown pass: ${pass}`);
  const number: (
    key: string,
    fallback: number,
    min: number,
    max: number,
  ) => number = (
    key: string,
    fallback: number,
    min: number,
    max: number,
  ): number => {
    const text: string | null = fields.get(key);
    const value: number =
      text === null ? fallback : text.trim() === "" ? NaN : Number(text);
    if (!Number.isFinite(value) || value < min || value > max)
      throw new Error(`Invalid ${key}`);
    return value;
  };
  const size: number = number("size", 900, 32, 2048);
  if (!Number.isInteger(size)) throw new Error("size must be an integer");
  const frameText: string | null = fields.get("frame");
  let frame: HumanViewerAddress["frame"] = null;
  if (frameText !== null) {
    const values: number[] = frameText
      .split(",")
      .map((text: string): number => (text.trim() === "" ? NaN : Number(text)));
    if (values.length !== 4 || !values.every(Number.isFinite) || values[3] <= 0)
      throw new Error("frame requires a finite centre and positive radius");
    frame = values as NonNullable<typeof frame>;
  }
  const lookText: string | null = fields.get("look");
  let look: HumanViewerAddress["look"] = null;
  if (lookText !== null) {
    const values: number[] = lookText
      .split(",")
      .map((text: string): number => (text.trim() === "" ? NaN : Number(text)));
    if (
      (values.length !== 6 && values.length !== 7) ||
      !values.every(Number.isFinite) ||
      Math.abs(values[0]) > 180 ||
      Math.abs(values[1]) >= 90 ||
      values[2] <= 0 ||
      (values.length === 7 && (values[6] <= 0 || values[6] >= 180))
    )
      throw new Error(
        "look requires yaw, pitch, distance, target x, y, z and an optional field of view",
      );
    look = (values.length === 6 ? [...values, 28] : values) as NonNullable<
      HumanViewerAddress["look"]
    >;
  }
  const ao: string = fields.get("ao") ?? "off";
  if (ao !== "off" && ao !== "on") throw new Error("ao must be on or off");
  const shadows: string = fields.get("shadows") ?? "on";
  if (shadows !== "on" && shadows !== "off")
    throw new Error("shadows must be on or off");
  const landmarks: string = fields.get("landmarks") ?? "off";
  if (landmarks !== "off" && landmarks !== "on")
    throw new Error("landmarks must be on or off");
  const calibrate: string = fields.get("calibrate") ?? "off";
  if (calibrate !== "off" && calibrate !== "on")
    throw new Error("calibrate must be on or off");
  const light: string | null = fields.get("light");
  if (fields.has("fmt") && fields.get("fmt") !== "png")
    throw new Error("Only PNG is supported");
  const ref: string | null = fields.get("ref");
  if (ref !== null && !["split", "overlay", "swipe"].includes(ref))
    throw new Error("Unknown reference mode");
  const doc: string | undefined = fields.get("doc") ?? defaultDocument;
  if (doc === undefined || doc.trim() === "")
    throw new Error("doc must name a published document");
  const parts: string | null = fields.get("parts");
  if (
    parts !== null &&
    (parts === "" ||
      parts.split(",").some((part: string): boolean => part.trim() === ""))
  )
    throw new Error("parts must contain mesh names");
  const hide: string | null = fields.get("hide");
  if (
    hide !== null &&
    (hide === "" ||
      hide.split(",").some((part: string): boolean => part.trim() === ""))
  )
    throw new Error("hide must contain mesh names");
  return {
    doc,
    operation,
    parts: parts === null ? [] : parts.split(","),
    hide: hide === null ? [] : hide.split(","),
    zoom: number("zoom", 1, 0.2, 8),
    view: view as HumanViewerAddress["view"],
    pitch: number("pitch", 0, -89, 89),
    look,
    pass: pass as HumanViewerAddress["pass"],
    frame,
    ao: ao === "on",
    shadows: shadows === "on",
    landmarks: landmarks === "on",
    calibrate: calibrate === "on",
    light: light === null ? null : parseHumanViewerLight(light),
    size,
    ref: ref as HumanViewerAddress["ref"],
    opacity: number("opacity", 0.5, 0, 1),
  };
}
