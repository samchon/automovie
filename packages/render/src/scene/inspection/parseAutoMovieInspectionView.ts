import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieInspectionView } from "./IAutoMovieInspectionView.js";

/** The accepted forms, quoted in every refusal. */
const FORMS: string =
  "film; x,y,z:tx,ty,tz in metres; or a name such as front, followed by any of @ortho, @focus=<pattern> or @flagged";

/**
 * Read one inspection view from its text, the form a page address, a command line and a capture plan all write.
 *
 * | Text | View |
 * | --- | --- |
 * | `film` | The subject's own delivery camera, unchanged |
 * | `x,y,z:tx,ty,tz` | A fixed camera at the first point looking at the second, in world metres |
 * | `<name>` | A subject's own view of that name, or a named viewpoint such as `front` fitted to what is drawn |
 * | `<name>@ortho` | The same fit with an orthographic camera |
 * | `<name>@focus=<pattern>` | The same fit framing only the drawn objects and marks the path pattern selects |
 * | `<name>@flagged` | The same fit framing only the drawn flagged marks |
 *
 * Switches may be combined in any order, such as `three-quarter@ortho@focus=hero/torso`. A name holds no `@`, `:`, `;`, `,` or space. Whether a name exists is decided by `resolveAutoMovieInspectionView`, which knows the subject.
 *
 * It throws an `Error` that names the text and lists the accepted forms for empty text, coordinates that are not two finite triples or that coincide, a switch on `film` or on a fixed camera, an unknown or repeated switch, an empty focus pattern, and a focus pattern beside `@flagged`.
 *
 * ```ts
 * const view = parseAutoMovieInspectionView("front@ortho");
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every form with what it views, states how switches combine, which characters a name excludes and why names are not checked here, and lists every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A colon occurs only in the fixed form and `@` only before a switch, so the form is decided by those two characters alone, and every host that splits a list of views on `;` or `,` leaves each view's text whole.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three branches, film, fixed and named, then one loop over the switches.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreadable text throws instead of falling back to the film camera, and a switch that a form cannot honour is refused instead of ignored.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the length of the text.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one text.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and keeps nothing.
 */
export function parseAutoMovieInspectionView(
  text: string,
): IAutoMovieInspectionView {
  const refuse: (problem: string) => never = (problem: string): never => {
    throw new Error(
      `Inspection view "${text}" ${problem}; a view is ${FORMS}`,
    );
  };
  if (text.trim() === "") return refuse("is empty");
  if (text === "film") return { type: "film" };

  // Fixed: two triples, and nothing else.
  if (text.includes(":")) {
    if (text.includes("@")) return refuse("is a fixed camera, which takes no switch");
    const points: number[][] = text
      .split(":")
      .map((part: string): number[] =>
        part
          .split(",")
          .map((value: string): number =>
            value.trim() === "" ? Number.NaN : Number(value),
          ),
      );
    if (
      points.length !== 2 ||
      points.some(
        (point: number[]): boolean =>
          point.length !== 3 || !point.every(Number.isFinite),
      )
    )
      return refuse("is not two finite triples");
    const position: IAutoMovieVector3 = vector(points[0]!);
    const target: IAutoMovieVector3 = vector(points[1]!);
    if (
      position.x === target.x &&
      position.y === target.y &&
      position.z === target.z
    )
      return refuse("looks from its own target");
    return { type: "fixed", position, target };
  }

  // Named: a name, then switches.
  const [name, ...switches]: string[] = text.split("@");
  if (name === undefined || !/^[^@:;,\s]+$/u.test(name))
    return refuse("does not start with a name");
  if (name === "film") return refuse("is the film camera, which takes no switch");
  let orthographic: boolean = false;
  let focus: IAutoMovieInspectionView.IFocus | null = null;
  const seen: Set<string> = new Set<string>();
  for (const written of switches) {
    const key: string = written.startsWith("focus=") ? "focus" : written;
    if (seen.has(key) || (key === "focus" && seen.has("flagged")) || (key === "flagged" && seen.has("focus")))
      return refuse(`repeats or contradicts the switch @${written}`);
    seen.add(key);
    if (written === "ortho") orthographic = true;
    else if (written === "flagged") focus = { type: "flagged" };
    else if (key === "focus") {
      const pattern: string = written.slice("focus=".length);
      if (pattern === "") return refuse("has an empty focus pattern");
      focus = { type: "pattern", pattern };
    } else return refuse(`has the unknown switch @${written}`);
  }
  return { type: "named", name, orthographic, focus };
}

/** A vector from a triple. */
function vector(triple: number[]): IAutoMovieVector3 {
  return { x: triple[0]!, y: triple[1]!, z: triple[2]! };
}
