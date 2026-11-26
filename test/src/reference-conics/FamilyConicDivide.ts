import { AutoMovieHumanLandmarkSurface } from "@automovie/human";
import { AutoMovieHumanF1Divide } from "@automovie/human/capture";

import { FamilyConicLoop } from "./FamilyConicLoop";
import type { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicThumbRoot } from "./FamilyConicThumbRoot";

/**
 * Every surface that divides f1's skin between two neighbouring parts, read on the reference's own joints.
 *
 * A fit keeps, for each part, the skin on its own side of every surface it shares with a neighbour, and closes its sections past the
 * surface by a closure that is no observation (`FamilyConicBody.ts`, `opening` with `around`). Two neighbours therefore fit no skin
 * twice and leave none out, provided both read the same surface with opposite signs, and the figure's tree joins them on that same
 * surface. The rules are the Human package's (`AutoMovieHumanF1Divide`, which states each); this module only hands them the
 * reference's joint centres under the fit's part names, so the fit and the tree read one declaration. `FamilyConicBody.ts --divides`
 * counts on the reference's vertices the skin two neighbours both keep and the skin neither keeps
 * (`packages/human/docs/techniques/joints-one-shot.md`, The hypotheses).
 */
export namespace FamilyConicDivide {
  type V = R.V;

  /** One dividing surface (`AutoMovieHumanF1Divide.ISurface`). */
  export type ISurface = AutoMovieHumanF1Divide.ISurface;

  /** A parent's section plane where its children part from it (`AutoMovieHumanF1Divide.IEnd`). */
  export type IEnd = AutoMovieHumanF1Divide.IEnd;

  /** How near the shoulder joint the armscye's surface divides, mm. */
  export const ARMSCYE_MM: number = AutoMovieHumanF1Divide.ARMSCYE_MM;

  /** The fingers in their row's order, from the little one, by their joints' names in the reference. */
  export const FINGERS: readonly string[] = ["pinky", "ring", "middle", "index"];

  /** The toes in their row's order, from the little one, by their joints' names in the reference. */
  export const TOES: readonly string[] = ["littletoe", "ringtoe", "middletoe", "indextoe", "bigtoe"];

  /** A digit's part name in `FamilyConicBody.ts`. */
  export const part = (digit: string): string =>
    FINGERS.includes(digit) || digit === "thumb" ? "finger." + digit : "toe." + ({ littletoe: "little", ringtoe: "ring", middletoe: "middle", indextoe: "index", bigtoe: "big" } as Record<string, string>)[digit]!;

  /**
   * Every dividing surface of the stored side, on the reference.
   *
   * @param source The reference: its joint centres.
   * @param armscye The armscye's landmark surface on the reference's skin.
   * @param foot The trunk's foot, mm of height: its family's first station on its course.
   * @param ends The arm's section plane at its end, and the hand's and the leg's where their digits part from them: a point and the course's direction.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Every rule is `AutoMovieHumanF1Divide.create`'s; this function names the reference's joints that enter each.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of joints and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate is read off a fit or a render; a missing joint is refused by name; the sole's normal is the floor's, the reference standing on it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work besides the caller's landmark surface.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The landmark surface is built once and passed in by the caller that also clips by it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the package's closures.
   * @evidence contracts/development/common.md#meaningful-documentation States what each argument is read for.
   */
  export function build(source: R.ISource, armscye: FamilyConicLoop.ILoop, foot: number, ends: { hand: IEnd; foot: IEnd; wrist: IEnd }): ISurface[] {
    const joint = (name: string): V => {
      const p: V | undefined = source.joints.get(name);
      if (p === undefined) throw new Error("divide: the reference has no joint " + name);
      return p;
    };
    const digit = (name: string): AutoMovieHumanF1Divide.IDigit => ({ part: part(name), first: joint(name + "_01_r"), second: joint(name + "_02_r") });
    // The thumb's root: the landmark surface through its four landmarks on the reference's skin about its metacarpophalangeal centre,
    // its far side toward the thumb's next joint. It divides skin inside the ball about that centre that holds its landmarks and,
    // past it, inside the tube about the thumb's course that the landmarks' ring spans.
    const root: FamilyConicThumbRoot.IRoot = FamilyConicThumbRoot.read(source);
    const landmarks: V[] = root.landmarks.map(([name, p]: [string, V | null]): V => {
      if (p === null) throw new Error("divide: the thumb root's landmark " + name + " met no skin");
      return p;
    });
    const thumbRoot: AutoMovieHumanLandmarkSurface.ISurface = AutoMovieHumanLandmarkSurface.create(root.centre, landmarks, root.toward);
    // A landmark's distance from the line a part's course starts along: the root ring's radius about the course, which bounds the
    // part's own skin about it.
    const off = (p: readonly number[], a: V, b: V): number => {
      const e: V = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const t: number = ((p[0]! - a[0]) * e[0] + (p[1]! - a[1]) * e[1] + (p[2]! - a[2]) * e[2]) / (e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
      return Math.hypot(p[0]! - a[0] - t * e[0], p[1]! - a[1] - t * e[1], p[2]! - a[2] - t * e[2]);
    };
    const armCourse: V[] = [joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r")];
    return AutoMovieHumanF1Divide.create({
      armscye: { side: armscye.side, centre: armCourse[0]!, reach: ARMSCYE_MM, course: armCourse, tube: Math.max(...armscye.landmarks.map((p: number[]): number => off(p, armCourse[0]!, armCourse[1]!))), part: "arm" },
      wrist: joint("hand_r"),
      thumb: { side: thumbRoot.side, centre: root.centre, reach: Math.max(...landmarks.map((p: V): number => Math.hypot(p[0] - root.centre[0], p[1] - root.centre[1], p[2] - root.centre[2]))), course: [root.centre, root.toward], tube: Math.max(...landmarks.map((p: V): number => off(p, root.centre, root.toward))), part: part("thumb") },
      fingers: FINGERS.map(digit),
      toes: TOES.map(digit),
      sole: [0, 1, 0],
      hip: joint("thigh_r"),
      foot,
      ends,
      parts: { trunk: "trunk", arm: "arm", hand: "hand", leg: "leg", twin: "leg.mirror" },
    });
  }

  /** How far a point stands outside a part's own skin, mm, positive outside (`AutoMovieHumanF1Divide.outside`). */
  export const outside: (surfaces: readonly ISurface[], name: string) => (p: V) => number = AutoMovieHumanF1Divide.outside;
}
