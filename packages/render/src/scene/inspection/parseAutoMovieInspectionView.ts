import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieInspectionView } from "./IAutoMovieInspectionView.js";

/** The accepted forms, quoted in every refusal. */
const FORMS: string =
  "film; x,y,z:tx,ty,tz in metres, followed by any of @ortho=<metres per pixel> or @up=x,y,z; or a name such as front, followed by any of @ortho, @follow, @focus=<pattern> or @flagged";

/**
 * Read one inspection view from its text, the form a page address, a command line and a capture plan all write.
 *
 * | Text | View |
 * | --- | --- |
 * | `film` | The subject's own delivery camera, unchanged |
 * | `x,y,z:tx,ty,tz` | A fixed camera at the first point looking at the second, in world metres, with the subject's lens and world `+Y` up |
 * | `x,y,z:tx,ty,tz@ortho=<m>` | The same fixed camera, orthographic, `<m>` metres of world per picture pixel |
 * | `x,y,z:tx,ty,tz@up=ux,uy,uz` | The same fixed camera with that up direction, such as a camera looking straight down |
 * | `<name>` | A subject's own view of that name, or a named viewpoint such as `front` fitted to what is drawn |
 * | `<name>@ortho` | The same fit with an orthographic camera |
 * | `<name>@follow` | The same fit made at each drawn second alone instead of over every second a capture plans |
 * | `<name>@focus=<pattern>` | The same fit framing only the drawn objects and marks the path pattern selects |
 * | `<name>@flagged` | The same fit framing only the drawn flagged marks |
 *
 * Switches may be combined in any order, such as `three-quarter@ortho@focus=hero/torso` or `0,1,4:0,1,0@ortho=0.004@up=0,0,-1`. A name holds no `@`, `:`, `;`, `,` or space. Whether a name exists is decided by `resolveAutoMovieInspectionView`, which knows the subject.
 *
 * It throws an `Error` that names the text and lists the accepted forms for empty text, coordinates that are not two finite triples or that coincide, a switch on `film`, a switch a form does not take (a fit's switches on a fixed camera, `@up` or a valued `@ortho` on a name, a bare `@ortho` on a fixed camera), an unknown or repeated switch, a scale that is not a positive number, an up direction that is not a finite non-zero triple or lies along the line of sight, an empty focus pattern, and a focus pattern beside `@flagged`.
 *
 * ```ts
 * const view = parseAutoMovieInspectionView("front@ortho");
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every form with what it views, states how switches combine, which characters a name excludes and why names are not checked here, and lists every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A colon occurs only in the fixed form and `@` only before a switch, so the form is decided by those two characters alone, and every host that splits a list of views on `;` leaves each view's text whole. A fixed camera's switches carry exactly what a recorded camera holds beyond its two points, its orthographic scale and its roll, so any recorded camera can be written back.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three branches, film, fixed and named, each with one loop over its own switches.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreadable text throws instead of falling back to the film camera, and a switch that a form cannot honour is refused instead of ignored.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the length of the text.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one text.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and keeps nothing.
 */
export function parseAutoMovieInspectionView(
  text: string,
): IAutoMovieInspectionView {
  const refuse: (problem: string) => never = (problem: string): never => {
    throw new Error(`Inspection view "${text}" ${problem}; a view is ${FORMS}`);
  };
  if (text.trim() === "") return refuse("is empty");
  if (text === "film") return { type: "film" };
  const [head, ...switches]: string[] = text.split("@");
  const seen: Set<string> = new Set<string>();
  const once: (written: string) => string = (written: string): string => {
    const key: string = written.split("=")[0]!;
    if (seen.has(key)) return refuse(`repeats the switch @${key}`);
    seen.add(key);
    return key;
  };

  // Fixed: two triples, then the scale and the up direction a recorded camera may need.
  if (head!.includes(":")) {
    const halves: string[] = head!.split(":");
    const points: number[][] = halves.map(triple);
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
    const sight: IAutoMovieVector3 = {
      x: target.x - position.x,
      y: target.y - position.y,
      z: target.z - position.z,
    };
    if (sight.x === 0 && sight.y === 0 && sight.z === 0)
      return refuse("looks from its own target");
    let metresPerPixel: number | null = null;
    let up: IAutoMovieVector3 | null = null;
    for (const written of switches) {
      const key: string = once(written);
      const value: string = written.slice(key.length + 1);
      if (key === "ortho") {
        if (!written.startsWith("ortho="))
          return refuse(
            "is a fixed camera, whose @ortho states its metres per pixel as @ortho=<m>",
          );
        const scale: number = value.trim() === "" ? Number.NaN : Number(value);
        if (!(Number.isFinite(scale) && scale > 0))
          return refuse(
            `has @ortho=${value}, which is not a positive number of metres per pixel`,
          );
        metresPerPixel = scale;
      } else if (key === "up" && written.startsWith("up=")) {
        const direction: number[] = triple(value);
        if (direction.length !== 3 || !direction.every(Number.isFinite))
          return refuse(`has @up=${value}, which is not a finite triple`);
        up = vector(direction);
        const cross: number = Math.hypot(
          up.y * sight.z - up.z * sight.y,
          up.z * sight.x - up.x * sight.z,
          up.x * sight.y - up.y * sight.x,
        );
        if (
          !(
            cross >
            1e-12 *
              Math.hypot(up.x, up.y, up.z) *
              Math.hypot(sight.x, sight.y, sight.z)
          )
        )
          return refuse(
            `has @up=${value}, which is zero or lies along the line of sight`,
          );
      } else return refuse(`is a fixed camera, which takes no @${written}`);
    }
    return { type: "fixed", position, target, metresPerPixel, up };
  }

  // Named: a name, then the switches of a fit.
  if (!/^[^@:;,\s]+$/u.test(head!)) return refuse("does not start with a name");
  if (head === "film")
    return refuse("is the film camera, which takes no switch");
  let orthographic: boolean = false;
  let follow: boolean = false;
  let focus: IAutoMovieInspectionView.IFocus | null = null;
  for (const written of switches) {
    const key: string = once(written);
    if (
      (key === "focus" && seen.has("flagged")) ||
      (key === "flagged" && seen.has("focus"))
    )
      return refuse(`contradicts its focus with @${written}`);
    if (written === "ortho") orthographic = true;
    else if (written === "follow") follow = true;
    else if (written === "flagged") focus = { type: "flagged" };
    else if (written.startsWith("focus=")) {
      const pattern: string = written.slice("focus=".length);
      if (pattern === "") return refuse("has an empty focus pattern");
      focus = { type: "pattern", pattern };
    } else
      return refuse(
        `has the switch @${written}, which a named view does not take`,
      );
  }
  return { type: "named", name: head!, orthographic, follow, focus };
}

/** The numbers of a comma-separated triple, NaN for a blank one. */
function triple(text: string): number[] {
  return text
    .split(",")
    .map((value: string): number =>
      value.trim() === "" ? Number.NaN : Number(value),
    );
}

/** A vector from a triple. */
function vector(triple: number[]): IAutoMovieVector3 {
  return { x: triple[0]!, y: triple[1]!, z: triple[2]! };
}
