import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Placing as T } from "./AutoMovieHumanF1Placing";

/**
 * f1's placing read at a pose: the stored local tables (`AutoMovieHumanF1Placing`) mapped through the chain of segment frames into the
 * figure's frame.
 *
 * A pose is one rotation per joint (`AutoMovieHumanSegmentFrame.world`); a joint the pose leaves undefined keeps its reference rotation,
 * so no pose at all is the reference pose, the pose f1 was traced in. A point of the table is `o + A q` in its segment's posed frame and a
 * direction `A q`, so a rotation of a joint moves every datum of the segments past it rigidly and leaves every stored value as it was.
 *
 * A family is placed by three kinds of field and no other: its course's `centres`, each a datum of the segment it stands in; its `up`, a
 * direction of its course's first segment; and each relief's `axis` and `turn`, directions of the segment its window lies on. Its section
 * table is local to that course already (`AutoMovieHumanConicLoft.axis`), so `place` returns it untouched.
 */
export namespace AutoMovieHumanF1Placement {
  /** A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation. */
  export type IPose = (name: string) => F.M3 | undefined;

  /** Every segment's frame in the figure's frame, by name. */
  export type IFrames = ReadonlyMap<string, F.IFrame>;

  /** The frames of the reference pose: the chain at its own rotations. */
  export const REFERENCE: IFrames = F.world(T.CHAIN, (): undefined => undefined);

  /** The frames of a pose; absent, the reference pose. */
  export function frames(pose?: IPose): IFrames {
    return pose === undefined ? REFERENCE : F.world(T.CHAIN, pose);
  }

  /** One segment's frame; a name the tree lacks is refused. */
  export function frame(name: string, at: IFrames = REFERENCE): F.IFrame {
    const found: F.IFrame | undefined = at.get(name);
    if (found === undefined) throw new Error("f1 has no segment " + name);
    return found;
  }

  /** A stored point in the figure's frame, mm: `o + A q` in its segment's frame. */
  export function point(name: string, at: IFrames = REFERENCE): F.V3 {
    const placed: T.IPlaced | undefined = T.POINTS[name];
    if (placed === undefined) throw new Error("f1 has no point " + name);
    return F.toWorld(frame(placed.frame, at), placed.local);
  }

  /** A stored polyline in the figure's frame: the points `<name>.0`, `<name>.1` and so on. */
  export function points(name: string, at: IFrames = REFERENCE): F.V3[] {
    const out: F.V3[] = [];
    while (T.POINTS[name + "." + out.length] !== undefined) out.push(point(name + "." + out.length, at));
    if (out.length === 0) throw new Error("f1 has no polyline " + name);
    return out;
  }

  /** A stored direction in the figure's frame: `A q` in its segment's frame. */
  export function direction(name: string, at: IFrames = REFERENCE): F.V3 {
    const placed: T.IPlaced | undefined = T.DIRECTIONS[name];
    if (placed === undefined) throw new Error("f1 has no direction " + name);
    return F.toWorldDirection(frame(placed.frame, at), placed.local);
  }

  /** A family's course in the figure's frame: the centres `AutoMovieHumanF1Placing.COURSES` names for it. */
  export function course(family: string, at: IFrames = REFERENCE): F.V3[] {
    const names: string[] | undefined = T.COURSES[family];
    if (names === undefined) throw new Error("f1 has no course for " + family);
    return names.map((name: string): F.V3 => point(name, at));
  }

  /**
   * A family placed at a pose: its `centres`, its `up` and each relief's `axis` and `turn` read from the table through the posed frames,
   * by the family's and the reliefs' own names, and every other field as given. A family derived from a stored one (other tips, a phase
   * rule) keeps its name and is placed the same; a twin is the reflection of the placed family, never placed itself. A family whose
   * course has another count of centres than the table names for it was laid on another course and is refused.
   */
  export function place(family: AutoMovieHumanConicLoft.IFamily, at: IFrames = REFERENCE): AutoMovieHumanConicLoft.IFamily {
    const centres: F.V3[] = course(family.name, at);
    if (centres.length !== family.centres.length) throw new Error("f1's table names " + centres.length + " centres for " + family.name + ", whose course has " + family.centres.length);
    return {
      ...family,
      centres,
      up: direction(family.name + ".up", at),
      ...(family.reliefs === undefined
        ? {}
        : {
            reliefs: family.reliefs.map((relief: NonNullable<AutoMovieHumanConicLoft.IFamily["reliefs"]>[number]): NonNullable<AutoMovieHumanConicLoft.IFamily["reliefs"]>[number] => ({
              ...relief,
              axis: direction(relief.name + ".axis", at),
              ...(relief.turn === undefined ? {} : { turn: direction(relief.name + ".turn", at) }),
            })),
          }),
    };
  }
}
