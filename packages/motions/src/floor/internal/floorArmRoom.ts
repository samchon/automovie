import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditLimits } from "../../audit/internal/AutoMovieMotionHumanAuditLimits";
import { HumanArmClearance } from "../../posture/internal/HumanArmClearance";
import { HumanArmObstacleBones } from "../../posture/internal/HumanArmObstacleBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * The trunk as a constraint on a floor law's way between two of its postures.
 * Arm angles blended between two postures can carry a forearm through the body
 * deeper than either end holds it: rolling from the back onto a side, the lower
 * elbow bends before the shoulder has brought the arm forward, and the forearm
 * passes through the belly; the same happens lowering into prone and into a
 * cross-legged seat. A person lets that elbow out instead. So an arm whose room
 * (`HumanArmClearance.room`) exceeds the ends' room blended by the same weight
 * takes the least turn at the shoulder and the elbow that brings it back within
 * it (`HumanArmClearance.cleared`); an arm no deeper than its ends is left as
 * blended.
 */
export namespace floorArmRoom {
  /*
   * Prepare the clearance of one floor law's key-to-key blends.
   *
   * Each blend's two keys and evenly spaced blends between them are read here,
   * as many as `samples` shows keep any dip between two readings within the
   * audit's self-penetration allowance; a blend whose arms stay within their
   * allowance at every one of those is left exactly as blended, so only a blend
   * that carries an arm through the body pays a posture resolve per query.
   * Parameter body: The body.
   * Parameter keys: Each blend's posture at a weight, in the law's key order.
   * Parameter read: An exact FK reader for this preparation.
   * Parameter project: The body's projection.
   * Returns: The blend at a weight with its arms kept within the keys' blended
   * room.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    keys: readonly ((weight: number) => IAutoMovieMotionHumanPosture)[],
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ): (
    index: number,
    weight: number,
    keyed: (weight: number) => IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture {
    const reached: readonly IJointReach[] = reaches(body);
    const allowed = (ends: IPrepareAllowedEnds, w: number): Rooms => ({
      left: ends.from.left + (ends.to.left - ends.from.left) * w,
      right: ends.from.right + (ends.to.right - ends.from.right) * w,
    });
    const blends: readonly IPrepareBlendsItem[] = keys.map(
      (
        keyed: (weight: number) => IAutoMovieMotionHumanPosture,
      ): IPrepareBlend => {
        const ends: IPrepareEnds = {
          from: rooms(body, posed(body, keyed(0), read, project)),
          to: rooms(body, posed(body, keyed(1), read, project)),
        };
        const count: number = samples(reached, keyed(0), keyed(1));
        let flagged: boolean = false;
        for (let i: number = 1; i < count && !flagged; i++) {
          const w: number = i / count;
          const at: Rooms = rooms(body, posed(body, keyed(w), read, project));
          const limit: Rooms = allowed(ends, w);
          flagged = at.left > limit.left || at.right > limit.right;
        }
        return { ...ends, flagged };
      },
    );
    return (index, weight, keyed, read, project) => {
      const posture: IAutoMovieMotionHumanPosture = keyed(weight);
      if (!(weight > 0 && weight < 1)) return posture;
      const blend: IPrepareBlend = blends[index]!;
      return blend.flagged
        ? cleared(body, posture, allowed(blend, weight), read, project)
        : posture;
    };
  }

  /*
   * The evenly spaced shares of a blend between two postures a reading keeps
   * every arm within the audit's self-penetration allowance between
   * (`samples`): never fewer than `SCAN`.
   * Parameter body: The body's physical profile, whose rest segments and joints
   * give each joint's reach.
   * Parameter from: The blend's first posture.
   * Parameter to: Its last.
   * Returns: The count of intervals.
   */
  export function count(
    body: Pick<IAutoMovieMotionHumanBody, "profile">,
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
  ): number {
    return samples(reaches(body), from, to);
  }
}

/*
 * The fewest shares of a key-to-key blend read once to find whether any arm
 * leaves its room.
 */
const SCAN: number = 16;
/*
 * The shares a blend's scan reads, enough that no arm can sink, between two of
 * them, more than the audit's self-penetration allowance
 * (`AutoMovieMotionHumanAuditLimits.tangle`, 10 mm) deeper into the trunk, a
 * thigh or the other arm than it lies at the nearer one; never fewer than
 * `SCAN`.
 *
 * A floor law blends its keys linearly in clinical joint angles
 * (`prepareHumanShapeBlend`) and carries the whole body rigidly, which moves
 * nothing against itself. Over the whole blend a joint turns by at most the sum
 * of its three angle differences, and its turn moves a point it carries,
 * relative to every point it does not, no faster than that turn times the
 * point's distance from the joint. That distance never exceeds the joint's
 * reach: the sum of the joint-to-joint lengths down the chain to the farthest
 * arm or obstacle collider it carries, plus that collider's extent from its own
 * joint, the same in every pose. So the depth of any arm collider in any
 * obstacle changes, per unit of blend weight, by at most the sum over the
 * joints of turn times reach, `L`, and between readings 1/N apart a dip is at
 * most L/(2N) deeper than the shallower reading around it: N is the least count
 * that keeps that within the allowance.
 */
function samples(
  reached: readonly IJointReach[],
  from: IAutoMovieMotionHumanPosture,
  to: IAutoMovieMotionHumanPosture,
): number {
  let rate: number = 0;
  const fromAngles: Readonly<Record<string, JointAngles | undefined>> =
    from.joints;
  const toAngles: Readonly<Record<string, JointAngles | undefined>> = to.joints;
  for (const { bone, reach } of reached) {
    const a: JointAngles = fromAngles[bone] ?? ZERO;
    const b: JointAngles = toAngles[bone] ?? ZERO;
    rate +=
      (((Math.abs(a[0] - b[0]) +
        Math.abs(a[1] - b[1]) +
        Math.abs(a[2] - b[2])) *
        Math.PI) /
        180) *
      reach;
  }
  return Math.max(
    SCAN,
    Math.ceil(rate / (2 * AutoMovieMotionHumanAuditLimits.tangle)),
  );
}

/*
 * The angles of a joint a posture leaves out.
 */
const ZERO: readonly [0, 0, 0] = [0, 0, 0];

/*
 * The colliders the arm room reads: the trunk, the thighs and both arms.
 */
const READ: ReadonlySet<string> = new Set<string>([
  ...HumanArmObstacleBones.TRUNK,
  "leftUpperLeg",
  "rightUpperLeg",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
]);

/*
 * Read a body's joint reaches from its profile at rest: for each joint that
 * carries some but not all of the read colliders, the longest chain length from
 * it to a read collider's farthest bound, metres.
 */
function reaches(
  body: Pick<IAutoMovieMotionHumanBody, "profile">,
): IJointReach[] {
  const profile: IAutoMovieMotionHumanBody["profile"] = body.profile;
  const pose = (bone: string): IAutoMovieRigidTransform =>
    profile.segments.find((segment): boolean => segment.bone === bone)!.neutral;
  const anchor = (bone: string): IAutoMovieVector3 => {
    const joint = profile.joints.find(
      (candidate): boolean => candidate.child === bone,
    )!;
    return Vector3.add(
      pose(bone).position,
      Quaternion.rotateVector(pose(bone).rotation, joint.childFrame.position),
    );
  };
  // A segment's own reach: the farthest corner of its colliders' bounds
  // from its joint.
  const extent = (bone: string): number => {
    const from: IAutoMovieVector3 = anchor(bone);
    let out: number = 0;
    for (const shape of profile.segments.find(
      (segment): boolean => segment.bone === bone,
    )!.shapes) {
      const box = AutoMovieEnginePhysics.physicalShapeBounds(pose(bone), shape);
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z])
            out = Math.max(out, Vector3.distance(from, { x, y, z }));
    }
    return out;
  };
  // The reach of the joint into `bone`: its read collider's extent and,
  // through each child joint, the length to it plus that joint's reach.
  const memo: Map<string, number> = new Map();
  const reach = (bone: string): number => {
    const cached: number | undefined = memo.get(bone);
    if (cached !== undefined) return cached;
    let out: number = READ.has(bone) ? extent(bone) : 0;
    for (const joint of profile.joints) {
      if (joint.parent !== bone) continue;
      const below: number = reach(joint.child);
      if (below > 0)
        out = Math.max(
          out,
          Vector3.distance(anchor(bone), anchor(joint.child)) + below,
        );
    }
    memo.set(bone, out);
    return out;
  };
  const carried = (bone: string): number =>
    [...READ].filter((read: string): boolean => {
      for (let at: string | undefined = read; at !== undefined; )
        if (at === bone) return true;
        else
          at = profile.joints.find(
            (joint): boolean => joint.child === at,
          )?.parent;
      return false;
    }).length;
  const out: IJointReach[] = [];
  for (const joint of profile.joints) {
    const count: number = carried(joint.child);
    if (count === 0 || count === READ.size) continue;
    out.push({
      bone: joint.child,
      reach: reach(joint.child),
    });
  }
  return out;
}

/*
 * The posture with each arm kept within its allowed room.
 */
function cleared(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  allowed: Readonly<Rooms>,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMovieMotionHumanPosture {
  let pose: IAutoMoviePose = posed(body, posture, read, project);
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
  let turnedAny: boolean = false;
  for (const side of ["left", "right"] as const) {
    const blended: IAutoMovieMotionHumanArmClearance.IArm = arm(pose, side);
    if (HumanArmClearance.room(body, pose, side, blended) <= allowed[side])
      continue;
    const turned: IAutoMovieMotionHumanArmClearance.IArm =
      HumanArmClearance.cleared(body, pose, side, blended, allowed[side]);
    joints[`${side}UpperArm`] = turned.upper;
    joints[`${side}LowerArm`] = turned.lower;
    turnedAny = true;
    pose = HumanArmClearance.posed(pose, side, turned);
  }
  return turnedAny ? { ...posture, joints } : posture;
}

/*
 * The room each arm of a resolved pose lacks, degrees.
 */
function rooms(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose): Rooms {
  return {
    left: HumanArmClearance.room(body, pose, "left", arm(pose, "left")),
    right: HumanArmClearance.room(body, pose, "right", arm(pose, "right")),
  };
}

/*
 * The pose a posture resolves to.
 */
function posed(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMoviePose {
  return resolveHumanPosture.seeded(
    body,
    posture,
    undefined,
    undefined,
    read,
    undefined,
    project,
  ).pose;
}

/*
 * An arm's clinical angles as a resolved pose displays them.
 */
function arm(
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanArmClearance.IArm {
  const angles = (bone: string): readonly [number, number, number] => {
    const joint: IAutoMoviePose["joints"][number] | undefined =
      pose.joints.find(
        (candidate: IAutoMoviePose["joints"][number]): boolean =>
          candidate.bone === bone,
      );
    return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
  };
  return {
    upper: angles(`${side}UpperArm`),
    lower: angles(`${side}LowerArm`),
    hand: angles(`${side}Hand`),
  };
}

/*
 * Arm rooms by side, degrees.
 */
type Rooms = Record<AutoMovieHumanSide, number>;

/*
 * The record of `IPrepareEnds`'s site.
 */
type IPrepareEnds = { from: Rooms; to: Rooms };

/*
 * The record of `IPrepareBlend`'s site.
 */
type IPrepareBlend = { from: Rooms; to: Rooms; flagged: boolean };
/*
 * The record of `IPrepareAllowedEnds`'s site.
 */
type IPrepareAllowedEnds = { from: Rooms; to: Rooms };

/*
 * The record of `IPrepareBlendsItem`'s site.
 */
type IPrepareBlendsItem = { from: Rooms; to: Rooms; flagged: boolean };

/*
 * A joint's three clinical angles, degrees.
 */
type JointAngles = readonly [number, number, number];

/*
 * A profile joint's furthest carried collider.
 */
interface IJointReach {
  /*
   * The child bone's declared profile identity.
   */
  bone: string;

  /*
   * The maximum carried distance from the joint, metres.
   */
  reach: number;
}
