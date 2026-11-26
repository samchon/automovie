import type {
  IAutoMovieInspectionFocus,
  IAutoMovieInspectionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readInspectionNumber } from "./readInspectionNumber.js";
import { readInspectionVector } from "./readInspectionVector.js";

/** The accepted forms, quoted in every refusal. */
const FORMS: string =
  "film; x,y,z:tx,ty,tz in metres, followed by any of @ortho=<metres per pixel> or @up=x,y,z; or a name such as front, followed by any of @ortho, @follow, @focus=<pattern> or @flagged";

/**
 * Read one inspection view from its text, the form a page address, a command
 * line and a capture plan all write.
 *
 * | Text                         | View                                                                                                                |
 * | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
 * | `film`                       | The subject's own delivery camera, unchanged                                                                        |
 * | `x,y,z:tx,ty,tz`             | A fixed camera at the first point looking at the second, in world metres, with the subject's lens and world `+Y` up |
 * | `x,y,z:tx,ty,tz@ortho=<m>`   | The same fixed camera, orthographic, `<m>` metres of world per picture pixel                                        |
 * | `x,y,z:tx,ty,tz@up=ux,uy,uz` | The same fixed camera with that up direction, such as a camera looking straight down                                |
 * | `<name>`                     | A subject's own view of that name, or a named viewpoint such as `front` fitted to what is drawn                     |
 * | `<name>@ortho`               | The same fit with an orthographic camera                                                                            |
 * | `<name>@follow`              | The same fit made at each drawn second alone instead of over every second a capture plans                           |
 * | `<name>@focus=<pattern>`     | The same fit framing only the drawn objects and marks the path pattern selects                                      |
 * | `<name>@flagged`             | The same fit framing only the drawn flagged marks                                                                   |
 *
 * Switches may be combined in any order, such as
 * `three-quarter@ortho@focus=hero/torso` or
 * `0,1,4:0,1,0@ortho=0.004@up=0,0,-1`. A name holds no `@`, `:`, `;`, `,` or
 * space. Whether a name exists is decided by `resolveAutoMovieInspectionView`,
 * which knows the subject.
 *
 * It throws an `Error` that names the text and lists the accepted forms for
 * empty text, coordinates that are not two finite triples or that coincide, a
 * switch on `film`, a switch a form does not take (a fit's switches on a fixed
 * camera, `@up` or a valued `@ortho` on a name, a bare `@ortho` on a fixed
 * camera), an unknown or repeated switch, a scale that is not a positive
 * number, an up direction that is not a finite non-zero triple or lies along
 * the line of sight, an empty focus pattern, and a focus pattern beside
 * `@flagged`.
 *
 * ```ts
 * const view = parseAutoMovieInspectionView("front@ortho");
 * ```
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
    const position: IAutoMovieVector3 | null =
      halves.length === 2 ? readInspectionVector(halves[0]!) : null;
    const target: IAutoMovieVector3 | null =
      halves.length === 2 ? readInspectionVector(halves[1]!) : null;
    if (position === null || target === null)
      return refuse("is not two finite triples");
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
        const scale: number | null = readInspectionNumber(value);
        if (scale === null || !(scale > 0))
          return refuse(
            `has @ortho=${value}, which is not a positive number of metres per pixel`,
          );
        metresPerPixel = scale;
      } else if (key === "up" && written.startsWith("up=")) {
        const direction: IAutoMovieVector3 | null = readInspectionVector(value);
        if (direction === null)
          return refuse(`has @up=${value}, which is not a finite triple`);
        up = direction;
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
  let focus: IAutoMovieInspectionFocus | null = null;
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
