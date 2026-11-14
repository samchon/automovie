import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicPose } from "../conic/AutoMovieHumanConicPose";
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
 * table is local to that course already (`AutoMovieHumanConicLoft.axis`), so `place` carries it untouched. Where a pose changes a course's
 * joint angles, the family is carried by `AutoMovieHumanConicPose`: its turns keep their set-backs, its stations are mapped and its chart
 * takes the roll its joints' twists ask for, each an exact no-op at the reference pose.
 */
export namespace AutoMovieHumanF1Placement {
  /** A pose: a joint's rotation `A_parent^T A_child` by its segment's name, or undefined to keep its reference rotation. */
  export type IPose = (name: string) => F.M3 | undefined;

  /** Every segment's frame in the figure's frame, by name. */
  export type IFrames = ReadonlyMap<string, F.IFrame>;

  /** The frames of the reference pose: the chain at its own rotations. */
  export const REFERENCE: IFrames = F.world(T.CHAIN, (): undefined => undefined);

  /**
   * The rigid parts of the tree: the ear and the nose stand on the head and the breast on the thorax. They are not joints: a rigid
   * part's rotation says how the part stands on its parent and is a constant of the body, at every pose.
   */
  export const RIGID: readonly string[] = ["ear", "nose", "breast"];

  /**
   * The articulated joints, each by the segment it moves: the shoulder (`humerus`), the elbow (`forearm`), the wrist (`hand`), every
   * finger's and the thumb's three joints, the hip (`femur`), the knee (`tibia`), the ankle (`foot`) and every toe's two. The pelvis is
   * the root, and the thorax and the head stand on it without a joint for now (the trunk is one family on one straight course).
   */
  export const ARTICULATED: readonly string[] = [
    "humerus", "forearm", "hand",
    ...["index", "middle", "ring", "pinky"].flatMap((finger: string): string[] => ["proximal", "middle", "distal"].map((bone: string): string => finger + "." + bone)),
    "thumb.metacarpal", "thumb.proximal", "thumb.distal",
    "femur", "tibia", "foot",
    ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].flatMap((toe: string): string[] => ["proximal", "distal"].map((bone: string): string => toe + "." + bone)),
  ];

  /**
   * The neutral pose: every articulated joint (`ARTICULATED`) at the identity, its segment's axes parallel to its parent's. The root,
   * the trunk's frames and the rigid parts (`RIGID`) keep their reference rotations, since none of them is a joint's angle.
   */
  export const NEUTRAL: IPose = (name: string): F.M3 | undefined => (ARTICULATED.includes(name) ? F.IDENTITY : undefined);
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
   * The segment each straight run of a family's course lies on, run `k` between centres `k` and `k + 1`: the bone that ends at the run's
   * far centre, which is that centre's segment, or that segment's parent when the centre is the segment's own origin (the elbow centre
   * ends the humerus's run and is the forearm's origin).
   */
  export function runs(family: string): string[] {
    const names: string[] | undefined = T.COURSES[family];
    if (names === undefined) throw new Error("f1 has no course for " + family);
    return names.slice(1).map((name: string): string => {
      const far: T.IPlaced = T.POINTS[name]!;
      const parent: string | null = T.CHAIN.find((joint: F.IJoint): boolean => joint.name === far.frame)?.parent ?? null;
      return far.local.every((x: number): boolean => x === 0) && parent !== null ? parent : far.frame;
    });
  }

  /**
   * A family placed at a pose: its `centres`, its `up` and each relief's `axis` and `turn` read from the table through the posed frames,
   * by the family's and the reliefs' own names, and every other field as given. A family derived from a stored one (other tips, a phase
   * rule) keeps its name and is placed the same; a twin is the reflection of the placed family, never placed itself. A family whose
   * course has another count of centres than the table names for it was laid on another course and is refused.
   */
  export function place(family: AutoMovieHumanConicLoft.IFamily, at: IFrames = REFERENCE): AutoMovieHumanConicLoft.IFamily {
    return repose(family, at).family;
  }

  /**
   * `place` with the map of the family's stations from the reference pose to the pose, null where it is the identity: a station
   * constant read along a posed family (where a band lands, where a face ends) goes through it.
   *
   * @param family A stored family, or one derived from it that keeps its name, course and stations.
   */
  export function repose(family: AutoMovieHumanConicLoft.IFamily, at: IFrames = REFERENCE): { family: AutoMovieHumanConicLoft.IFamily; station: ((station: number) => number) | null } {
    const centres: F.V3[] = course(family.name, at);
    if (centres.length !== family.centres.length) throw new Error("f1's table names " + centres.length + " centres for " + family.name + ", whose course has " + family.centres.length);
    const segments: string[] = runs(family.name);
    const carried = (run: number, d: F.V3): F.V3 => F.toWorldDirection(frame(segments[run]!, at), F.toLocalDirection(frame(segments[run]!), d));
    const posed: { family: AutoMovieHumanConicLoft.IFamily; station: ((station: number) => number) | null } = AutoMovieHumanConicPose.repose(family, centres, direction(family.name + ".up", at), carried);
    return {
      station: posed.station,
      family: {
        ...posed.family,
        ...(posed.family.reliefs === undefined
          ? {}
          : {
              reliefs: posed.family.reliefs.map((relief: NonNullable<AutoMovieHumanConicLoft.IFamily["reliefs"]>[number]): NonNullable<AutoMovieHumanConicLoft.IFamily["reliefs"]>[number] => ({
              ...relief,
              axis: direction(relief.name + ".axis", at),
                ...(relief.turn === undefined ? {} : { turn: direction(relief.name + ".turn", at) }),
              })),
            }),
      },
    };
  }
}
