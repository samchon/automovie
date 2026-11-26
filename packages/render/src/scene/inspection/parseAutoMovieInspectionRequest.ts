import type {
  AutoMovieInspectionShade,
  IAutoMovieInspectionColorAssignment,
  IAutoMovieInspectionRequest,
  IAutoMovieSectionPlane,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readInspectionNumber } from "./internal/readInspectionNumber.js";
import { readInspectionVector } from "./internal/readInspectionVector.js";

/**
 * Stroke width in output pixels when none is asked: three, which stays visible
 * when a still is reduced into a contact-sheet cell.
 */
const STROKE: number = 3;

/**
 * Seconds a trail reaches before and after the drawn second when none is asked:
 * one, which shows where a movement comes from and goes within a typical
 * action.
 */
const REACH: number = 1;

/**
 * Trail samples per second when none is asked: five, the lower end of the five
 * to ten stills per second the capture skill reads a movement at.
 */
const TICKS: number = 5;

/** Whether a text names a shade, narrowing it to the shade it names. */
const isShade: (text: string) => text is AutoMovieInspectionShade = (
  text: string,
): text is AutoMovieInspectionShade => SHADE_NAMES.has(text);

/** Every shade, keyed so the compiler refuses a list that misses one. */
const SHADES: Record<AutoMovieInspectionShade, true> = {
  beauty: true,
  depth: true,
  mask: true,
  normal: true,
  outline: true,
  pose: true,
  albedo: true,
  graphics: true,
  clay: true,
  faces: true,
};

/** The shade names, for membership checks. */
const SHADE_NAMES: ReadonlySet<string> = new Set(Object.keys(SHADES));

/**
 * Read an inspection request from named text values, the form both a page
 * address and a command line supply.
 *
 * `read` returns the text of a key, or null or undefined when the key is
 * absent. A key that is present without a value reads as the empty string,
 * which turns a switch on. `AUTO_MOVIE_INSPECTION_KEYS` lists every key read,
 * and `formatAutoMovieInspectionRequest` writes a request back as these
 * values.
 *
 * | Key             | Text                                                                                                                                                                     | Absent             |
 * | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
 * | `parts`, `hide` | Path patterns separated by commas                                                                                                                                        | No pattern         |
 * | `shade`         | `beauty`, `depth`, `mask`, `normal`, `outline`, `pose`, `albedo`, `clay` or `faces`                                                                                      | `beauty`           |
 * | `surface`       | A switch                                                                                                                                                                 | On                 |
 * | `marks`         | Kind patterns separated by commas, such as `curve/section,defect`                                                                                                        | No mark            |
 * | `sliver`        | A positive aspect limit                                                                                                                                                  | No sliver measured |
 * | `section`       | `x:0.2` cuts away everything beyond x = 0.2 m, `-x:0.2` everything before it, likewise `y` and `z`; or `px,py,pz:nx,ny,nz`, a point in metres and the direction cut away | No cut             |
 * | `xray`          | A switch                                                                                                                                                                 | Off                |
 * | `stroke`        | A positive width in output pixels                                                                                                                                        | 3                  |
 * | `label`         | Path patterns separated by commas                                                                                                                                        | No label           |
 * | `color`         | `pattern=rrggbb` pairs separated by commas, such as `hero/arm=ff8800,curve/section=00ff00`                                                                               | No colour          |
 * | `trail`         | Path patterns of the objects whose travel is drawn, separated by commas                                                                                                  | No trail           |
 * | `reach`         | Seconds a trail samples before and after the drawn second, positive                                                                                                      | 1                  |
 * | `ticks`         | Trail samples per second, positive                                                                                                                                       | 5                  |
 *
 * A switch is on for the empty string, `1` or `true` and off for `0` or
 * `false`. Any other text, an unknown shade or a number out of range throws an
 * `Error` that names the key, the text and what is accepted. Mark kinds are not
 * checked here, because their producers own them; `applyAutoMovieInspection`
 * refuses a kind pattern that matches no kind it is given.
 *
 * ```ts
 * const request = parseAutoMovieInspectionRequest((key) =>
 *   url.searchParams.get(key),
 * );
 * ```
 */
export function parseAutoMovieInspectionRequest(
  read: (key: string) => string | null | undefined,
): IAutoMovieInspectionRequest {
  const shade: string = read("shade") ?? "beauty";
  if (!isShade(shade))
    throw new Error(
      `Inspection shade "${shade}" is not one of ${Object.keys(SHADES).join(", ")}`,
    );
  return {
    parts: list(read("parts")),
    hide: list(read("hide")),
    shade,
    surface: flag("surface", read("surface"), true),
    marks: list(read("marks")),
    sliver: positive("sliver", read("sliver")),
    section: section(read("section")),
    xray: flag("xray", read("xray"), false),
    stroke: positive("stroke", read("stroke")) ?? STROKE,
    label: list(read("label")),
    color: colors(read("color")),
    trail: list(read("trail")),
    reach: positive("reach", read("reach")) ?? REACH,
    ticks: positive("ticks", read("ticks")) ?? TICKS,
  };
}

/** The non-empty items of a comma-separated text. */
function list(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(",")
    .map((item: string): string => item.trim())
    .filter((item: string): boolean => item !== "");
}

/** The `pattern=rrggbb` pairs of a comma-separated text. */
function colors(
  text: string | null | undefined,
): IAutoMovieInspectionColorAssignment[] {
  return list(text).map((item: string): IAutoMovieInspectionColorAssignment => {
    const pair: RegExpExecArray | null = /^(.+)=([0-9a-fA-F]{6})$/u.exec(item);
    if (pair === null)
      throw new Error(`Inspection color "${item}" is not pattern=rrggbb`);
    return { pattern: pair[1]!.trim(), color: Number.parseInt(pair[2]!, 16) };
  });
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
  const value: number | null = readInspectionNumber(text);
  if (value === null || !(value > 0))
    throw new Error(`Inspection ${key} "${text}" is not a positive number`);
  return value;
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
    const offset: number | null = readInspectionNumber(halves[1]!);
    if (offset === null) return refuse();
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
  const point: IAutoMovieVector3 | null = readInspectionVector(halves[0]!);
  const normal: IAutoMovieVector3 | null = readInspectionVector(halves[1]!);
  if (
    point === null ||
    normal === null ||
    (normal.x === 0 && normal.y === 0 && normal.z === 0)
  )
    return refuse();
  return { point, normal };
}
