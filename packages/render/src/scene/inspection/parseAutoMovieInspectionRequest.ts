import type { IAutoMovieSectionPlane } from "@automovie/engine";

import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/** Stroke width in output pixels when none is asked: three, which stays visible when a still is reduced into a contact-sheet cell. */
const STROKE: number = 3;

/** Every shade, keyed so the compiler refuses a list that misses one. */
const SHADES: Record<IAutoMovieInspectionRequest.Shade, true> = {
  beauty: true,
  depth: true,
  mask: true,
  normal: true,
  outline: true,
  pose: true,
  clay: true,
  faces: true,
};

/**
 * Read an inspection request from named text values, the form both a page address and a command line supply.
 *
 * `read` returns the text of a key, or null or undefined when the key is absent. A key that is present without a value reads as the empty string, which turns a switch on. `AUTO_MOVIE_INSPECTION_KEYS` lists every key read, and `formatAutoMovieInspectionRequest` writes a request back as these values.
 *
 * | Key | Text | Absent |
 * | --- | --- | --- |
 * | `parts`, `hide` | Path patterns separated by commas | No pattern |
 * | `shade` | `beauty`, `depth`, `mask`, `normal`, `outline`, `pose`, `clay` or `faces` | `beauty` |
 * | `surface` | A switch | On |
 * | `marks` | Kind patterns separated by commas, such as `curve/section,defect` | No mark |
 * | `sliver` | A positive aspect limit | No sliver measured |
 * | `section` | `x:0.2` cuts away everything beyond x = 0.2 m, `-x:0.2` everything before it, likewise `y` and `z`; or `px,py,pz:nx,ny,nz`, a point in metres and the direction cut away | No cut |
 * | `xray` | A switch | Off |
 * | `stroke` | A positive width in output pixels | 3 |
 *
 * A switch is on for the empty string, `1` or `true` and off for `0` or `false`. Any other text, an unknown shade or a number out of range throws an `Error` that names the key, the text and what is accepted. Mark kinds are not checked here, because their producers own them; `applyAutoMovieInspection` refuses a kind pattern that matches no kind it is given.
 *
 * ```ts
 * const request = parseAutoMovieInspectionRequest((key) => url.searchParams.get(key));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every key with its accepted text and its absent value, states the switch rule, what a refusal reports and where kinds are checked instead.
 * @evidence contracts/development/implementation.md#principled-implementation Each key is read once through the caller's reader and admitted against the type's own members, so the returned record is complete and every value in it is one the request type allows.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One record literal with one helper per value form: pattern list, switch, positive number and cut.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreadable text throws instead of falling back to the absent value, and the shade table is a record keyed by the request's union, so a shade added there fails compilation here until it is listed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the length of the text read.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each key is read and parsed once per call and nothing is computed twice.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call keeps nothing: the reader is used and dropped, and the returned record is the caller's.
 */
export function parseAutoMovieInspectionRequest(
  read: (key: string) => string | null | undefined,
): IAutoMovieInspectionRequest {
  const shade: string = read("shade") ?? "beauty";
  if (!Object.hasOwn(SHADES, shade))
    throw new Error(
      `Inspection shade "${shade}" is not one of ${Object.keys(SHADES).join(", ")}`,
    );
  return {
    parts: list(read("parts")),
    hide: list(read("hide")),
    shade: shade as IAutoMovieInspectionRequest.Shade,
    surface: flag("surface", read("surface"), true),
    marks: list(read("marks")),
    sliver: positive("sliver", read("sliver")),
    section: section(read("section")),
    xray: flag("xray", read("xray"), false),
    stroke: positive("stroke", read("stroke")) ?? STROKE,
  };
}

/** The non-empty items of a comma-separated text. */
function list(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(",")
    .map((item: string): string => item.trim())
    .filter((item: string): boolean => item !== "");
}

/** A switch: on for the empty string, `1` or `true`, off for `0` or `false`. */
function flag(
  key: string,
  text: string | null | undefined,
  absent: boolean,
): boolean {
  if (text === null || text === undefined) return absent;
  if (text === "" || text === "1" || text === "true") return true;
  if (text === "0" || text === "false") return false;
  throw new Error(`Inspection ${key} "${text}" is not 1, true, 0 or false`);
}

/** A positive finite number, or null when the key is absent. */
function positive(key: string, text: string | null | undefined): number | null {
  if (text === null || text === undefined) return null;
  const value: number = finite(text);
  if (!(value > 0))
    throw new Error(`Inspection ${key} "${text}" is not a positive number`);
  return value;
}

/** The number a text spells, NaN for blank or malformed text. */
function finite(text: string): number {
  const value: number = text.trim() === "" ? Number.NaN : Number(text);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** The cut a text spells, in either of its two forms. */
function section(
  text: string | null | undefined,
): IAutoMovieSectionPlane | null {
  if (text === null || text === undefined) return null;
  const refuse: () => never = (): never => {
    throw new Error(
      `Inspection section "${text}" is neither an axis cut such as y:1.2 or -x:0 nor px,py,pz:nx,ny,nz with a direction that is not zero`,
    );
  };
  const halves: string[] = text.split(":");
  if (halves.length !== 2) return refuse();

  // Axis form: the sign names the side that is cut away.
  const axis: RegExpExecArray | null = /^([+-]?)([xyz])$/.exec(
    halves[0]!.trim(),
  );
  if (axis !== null) {
    const offset: number = finite(halves[1]!);
    if (Number.isNaN(offset)) return refuse();
    const sign: number = axis[1] === "-" ? -1 : 1;
    return {
      point: {
        x: axis[2] === "x" ? offset : 0,
        y: axis[2] === "y" ? offset : 0,
        z: axis[2] === "z" ? offset : 0,
      },
      normal: {
        x: axis[2] === "x" ? sign : 0,
        y: axis[2] === "y" ? sign : 0,
        z: axis[2] === "z" ? sign : 0,
      },
    };
  }

  // General form: a point and the direction cut away.
  const [point, normal]: number[][] = halves.map((half: string): number[] =>
    half.split(",").map(finite),
  );
  if (
    point!.length !== 3 ||
    normal!.length !== 3 ||
    [...point!, ...normal!].some(Number.isNaN) ||
    normal!.every((component: number): boolean => component === 0)
  )
    return refuse();
  return {
    point: { x: point![0]!, y: point![1]!, z: point![2]! },
    normal: { x: normal![0]!, y: normal![1]!, z: normal![2]! },
  };
}
