/**
 * Parse and canonicalize the free-view URL variables of the Human page and PNG URLs.
 *
 * Variables, all optional:
 *
 * - `az=<deg>`, `el=<deg>`: camera direction; azimuth from +X toward +Z,
 *   elevation toward +Y in [-90, 90]. `view=+x|-x|+y|-y|+z|-z` is a shorthand
 *   naming the axis the camera sits on and cannot be combined with `az`/`el`.
 *   A `+` in a query string decodes to a space, so ` x` reads as `+x`.
 * - `target=x,y,z`: look-at point in mm in the generated model's registered frame.
 * - `dist=<mm>`: camera distance from the target; absent fits the region.
 * - `ortho=1`: orthographic projection, so a section seen along its normal
 *   keeps its true shape.
 * - `isolate=1`: draw only the `curves` selection and the skin it shapes.
 * - `fit=selection`: frame the selection's bounds instead of the camera's region.
 * - `garment=0`: hide the garment parts (`human.garment.`), so the bare body
 *   can be inspected; `garment=1` or absent shows them, the default because
 *   every image shown outside development wears them.
 *
 * The canonical text lists the present variables in fixed key order with
 * numbers in shortest round-trip form, so every spelling of one view has one
 * frame-cache key. Malformed values throw; the HTTP owner answers 400.
 *
 * @param read Getter for one raw URL variable, such as `URLSearchParams.get`.
 * @returns The canonical text (empty for the default view) and the parsed value.
 *
 * @evidence contracts/common.md#principled-implementation Each variable is parsed by an explicit grammar and range check, the shorthand maps to exact azimuth/elevation pairs, and canonical text uses a fixed key order and Number's round-trip formatting.
 * @evidence contracts/common.md#clear-and-simple-design One pure function shared by the HTTP plugin, the session's frame identity, the worker and the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown shorthand, out-of-range angles, non-positive distances, garment values other than 0 or 1 and conflicting direction variables throw instead of being ignored.
 * @evidence contracts/common.md#meaningful-documentation States every variable, unit, frame, the `+` decoding pitfall and the canonical form.
 * @evidence contracts/performance.md#efficient-algorithms Constant work over at most nine variables.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical text lets the frame cache reuse a capture across spellings of one view.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export function normalizeHumanView(read: (name: string) => string | null): {
  text: string;
  value: normalizeHumanView.IView;
} {
  const number: (name: string) => number | undefined = (
    name: string,
  ): number | undefined => {
    const raw: string | null = read(name);
    if (raw === null || raw.trim() === "") return undefined;
    const parsed: number = Number(raw);
    if (!Number.isFinite(parsed))
      throw new Error("Human view variable " + name + " is not a number");
    return parsed;
  };
  const flag: (name: string) => boolean = (name: string): boolean => {
    const raw: string | null = read(name);
    if (raw === null || raw === "" || raw === "0") return false;
    if (raw === "1") return true;
    throw new Error("Human view variable " + name + " must be 0 or 1");
  };

  const value: normalizeHumanView.IView = {
    isolate: flag("isolate"),
    ortho: flag("ortho"),
    fit: null,
    garment: true,
  };

  // Direction: the shorthand or explicit angles, never both.
  const shorthand: string | null = read("view");
  const azimuth: number | undefined = number("az");
  const elevation: number | undefined = number("el");
  if (shorthand !== null && shorthand !== "") {
    if (azimuth !== undefined || elevation !== undefined)
      throw new Error("Human view= cannot be combined with az or el");
    const axis: string = shorthand.trim().replace(/^(?=[xyz]$)/, "+");
    const table: Record<string, [number, number]> = {
      "+x": [0, 0],
      "-x": [180, 0],
      "+z": [90, 0],
      "-z": [-90, 0],
      "+y": [0, 90],
      "-y": [0, -90],
    };
    if (!Object.hasOwn(table, axis))
      throw new Error("Human view= must be one of +x -x +y -y +z -z");
    [value.az, value.el] = table[axis]!;
  } else if (azimuth !== undefined || elevation !== undefined) {
    value.az = azimuth ?? 0;
    value.el = elevation ?? 0;
  }
  if (value.el !== undefined && Math.abs(value.el) > 90)
    throw new Error("Human view elevation must lie in [-90, 90]");

  const target: string | null = read("target");
  if (target !== null && target !== "") {
    const parts: number[] = target.split(",").map(Number);
    if (parts.length !== 3 || !parts.every(Number.isFinite))
      throw new Error("Human view target must be x,y,z in mm");
    value.target = parts as [number, number, number];
  }
  const distance: number | undefined = number("dist");
  if (distance !== undefined) {
    if (!(distance > 0)) throw new Error("Human view dist must be positive");
    value.dist = distance;
  }
  const garment: string | null = read("garment");
  if (garment !== null && garment !== "" && garment !== "1") {
    if (garment !== "0") throw new Error("Human view garment must be 0 or 1");
    value.garment = false;
  }
  const fit: string | null = read("fit");
  if (fit !== null && fit !== "") {
    if (fit !== "selection")
      throw new Error("Human view fit must be selection");
    value.fit = "selection";
  }

  // Fixed key order; absent and default values are omitted.
  const entries: string[] = [];
  if (value.az !== undefined) entries.push("az=" + String(value.az));
  if (value.el !== undefined) entries.push("el=" + String(value.el));
  if (value.target !== undefined)
    entries.push("target=" + value.target.map(String).join(","));
  if (value.dist !== undefined) entries.push("dist=" + String(value.dist));
  if (value.ortho) entries.push("ortho=1");
  if (value.isolate) entries.push("isolate=1");
  if (value.fit !== null) entries.push("fit=" + value.fit);
  if (!value.garment) entries.push("garment=0");
  return { text: entries.join("&"), value };
}

/**
 * Types of the free-view variables.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors the parsed variables with their units.
 * @evidence contracts/common.md#clear-and-simple-design Groups the parsed view type with its parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional fields stay absent rather than defaulted, so a named camera keeps its own direction and region.
 * @evidence contracts/common.md#meaningful-documentation Each field states its unit and frame.
 * @evidence contracts/performance.md#efficient-algorithms Types only.
 * @evidence contracts/performance.md#reuse-equivalent-work One record serves page, worker and capture.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Types only.
 */
export namespace normalizeHumanView {
  /** Parsed free-view variables; absent fields keep the named camera's own value. */
  export interface IView {
    /** Azimuth in degrees from +X toward +Z. */
    az?: number;

    /** Elevation in degrees toward +Y. */
    el?: number;

    /** Look-at point in mm, registered frame of the generated model. */
    target?: [number, number, number];

    /** Camera distance from the target in mm. */
    dist?: number;

    /** Orthographic projection. */
    ortho: boolean;

    /** Draw only the curve selection and the skin it shapes. */
    isolate: boolean;

    /** Show the garment parts. */
    garment: boolean;

    /** Frame the selection's bounds. */
    fit: "selection" | null;
  }
}
