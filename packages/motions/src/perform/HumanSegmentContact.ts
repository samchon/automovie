import { Quaternion, Vector3, rotationBetween, solveTwoBoneIK } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * The late contact pass of a pose table read (`HumanSegmentTable`): the
 * hands and feet that bear on something keep their place on it after the
 * joints are interpolated, by the analytic two-bone IK an animation runtime
 * runs after sampling its clip.
 *
 * A bearing end is a foot or a hand an open contact window of the action or
 * of an overlay running over it plants, pivots, grips, bears or lays on its
 * support, or a hand that carries a prop an earlier action left held. Its
 * site is fixed in its support's frame: the world for the ground or a prop
 * nobody of this person holds, the holding hand for a prop the other hand
 * holds, the person's own bone for a window on the person's own body, the
 * chest for a carried prop. The site at a second is the end's frame in the
 * support's frame at the interval's two knots, the exact poses, carried by
 * line and slerp between them (constant for a contact that holds, the hold's
 * own weight where a hold fades), placed by the support's frame on the
 * interpolated pose.
 *
 * The IK keeps the interpolated pose's swivel as its pole: the middle joint
 * turns about its own flexion axis until the chain spans the site's distance
 * by the law of cosines (`solveTwoBoneIK`), the upper joint swings the end
 * onto the site along the shortest arc (`rotationBetween`), and the end
 * joint takes the site's rotation; each joint's rotation is lowered to its
 * clinical angles through the body's codec.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which ends bear, where their sites come from and the IK's three steps.
 * @evidence contracts/development/design.md#principled-representation An end's support is a bone of the person or the world; its site is the knots' relative frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `supports` reads the contacts open at a second and `laid` places the ends, both for `HumanSegmentTable`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A site is only ever a knot's exact relation carried between knots; no goal of its own is invented.
 */
export namespace HumanSegmentContact {
  /** A bearing end and the bone its site is fixed in; `null` is the world. */
  export interface ISupport {
    /** The bearing end. */
    end: End;

    /** The support's bone, or `null` for the world. */
    on: AutoMovieHumanoidBone | null;
  }

  /** The ends a contact window can bear on. */
  export type End = "leftFoot" | "rightFoot" | "leftHand" | "rightHand";

  /**
   * The bearing ends of a person at a second, the ends that bear on another
   * end after it.
   *
   * @param person The person.
   * @param segment The action shown at the second.
   * @param seconds Film seconds.
   * @returns The supports, in the order they are laid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what bears and the order.
   * @evidence contracts/development/implementation.md#principled-implementation The action's and running overlays' open windows of bearing kinds on the four ends, then the carried holds (`HumanSegmentCarry.borne`), which ride the chest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over windows, one over holds, one order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A window on another person's body, or a hand gripping the prop it holds itself, is not laid: its site moves with what this person does not own, or with the hand itself.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(W + H) for W windows and H holds.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading of plans at one second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array; retains nothing.
   */
  export function supports(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
  ): ISupport[] {
    const found: Map<End, AutoMovieHumanoidBone | null> = new Map();
    const sources: IAutoMovieMotionHumanSegment[] = [segment];
    for (const overlay of person.overlays)
      if (overlay.entryTime <= seconds && seconds <= overlay.end) sources.push(overlay);
    for (const source of sources) {
      const share: number = (seconds - source.start) / source.plan.duration;
      for (const window of source.plan.contacts) {
        if (!(window.from <= share && share <= window.to) || !isEnd(window.part) || !BEARING.has(window.kind)) continue;
        const on: AutoMovieHumanoidBone | null | undefined = support(person, sources, window, window.part, seconds);
        if (on !== undefined) found.set(window.part, on);
      }
    }
    for (const held of HumanSegmentCarry.borne(person, segment, seconds)) found.set(`${held.side}Hand`, "chest");
    const out: ISupport[] = [...found].map(([end, on]: [End, AutoMovieHumanoidBone | null]): ISupport => ({ end, on }));
    return out.sort((x: ISupport, y: ISupport): number => rank(x) - rank(y));
  }

  /**
   * Lay each bearing end on its site.
   *
   * @param body The body.
   * @param pose The interpolated pose.
   * @param supports The bearing ends (`supports`).
   * @param from The earlier knot's world bones.
   * @param to The later knot's world bones.
   * @param u The share of the interval, in [0, 1].
   * @param prepared The evaluation's preparation (its rig reader).
   * @returns The pose with every bearing end on its site.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The site is the knots' relative frame carried between them and placed by the support on this pose; the analytic two-bone IK lays the end there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative frame, one demanded FK and one closed-form solve an end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A degenerate chain or a missing bone leaves the end as interpolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per end, one FK of its chain's ancestors and a constant number of rotations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each end reads the pose its predecessors left.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh pose; retains nothing.
   */
  export function laid(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    supports: readonly ISupport[],
    from: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    to: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    u: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose {
    for (const { end, on } of supports) {
      const chain: readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone, AutoMovieHumanoidBone] = CHAINS[end];
      const a: IFrame | undefined = relative(from, on, end);
      const b: IFrame | undefined = relative(to, on, end);
      if (a === undefined || b === undefined) continue;
      const parent: AutoMovieHumanoidBone | null = body.bones.get(chain[0])?.parent ?? null;
      const demand: Set<AutoMovieHumanoidBone> = new Set(chain);
      if (parent !== null) demand.add(parent);
      if (on !== null) demand.add(on);
      const now: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose, prepared.resolution(), demand);
      const frame: IFrame | undefined = on === null ? WORLD : frameOf(now.get(on));
      if (frame === undefined) continue;
      const position: IAutoMovieVector3 = Vector3.lerp(a.position, b.position, u);
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(a.rotation, b.rotation, u);
      pose = solved(body, pose, now, chain, parent, {
        position: Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, position)),
        rotation: Quaternion.normalize(Quaternion.multiply(frame.rotation, rotation)),
      });
    }
    return pose;
  }

  /** A world or relative frame. */
  interface IFrame {
    position: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
  }

  const WORLD: IFrame = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } };

  /** The kinds of window whose end keeps its place on its support. */
  const BEARING: ReadonlySet<IAutoMovieMotionHumanContactWindow["kind"]> = new Set(["plant", "pivot", "grip", "bear", "lie"]);

  /** Each end's chain: its upper bone, its middle bone and the end itself. */
  const CHAINS: Readonly<Record<End, readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone, AutoMovieHumanoidBone]>> = {
    leftFoot: ["leftUpperLeg", "leftLowerLeg", "leftFoot"],
    rightFoot: ["rightUpperLeg", "rightLowerLeg", "rightFoot"],
    leftHand: ["leftUpperArm", "leftLowerArm", "leftHand"],
    rightHand: ["rightUpperArm", "rightLowerArm", "rightHand"],
  };

  function isEnd(part: IAutoMovieMotionHumanContactWindow["part"]): part is End {
    return part in CHAINS;
  }

  /** Supports fixed in the world or the body come first, ends fixed on another end after it. */
  function rank(support: ISupport): number {
    return support.on !== null && support.on in CHAINS ? 1 : 0;
  }

  /** The bone a window's site is fixed in; undefined where it is not laid. */
  function support(
    person: IAutoMovieMotionHumanSegment.IPerson,
    sources: readonly IAutoMovieMotionHumanSegment[],
    window: IAutoMovieMotionHumanContactWindow,
    end: End,
    seconds: number,
  ): AutoMovieHumanoidBone | null | undefined {
    const on: IAutoMovieMotionHumanContactWindow.Support = window.support;
    if (on.kind === "ground") return null;
    if (on.kind === "person")
      return on.subject === person.performer.subject && "bone" in on && !CHAINS[end].includes(on.bone) ? on.bone : undefined;
    const holder: "left" | "right" | undefined = holding(person, sources, on.subject, seconds);
    if (holder === undefined) return null;
    const hand: End = `${holder}Hand`;
    return hand === end ? undefined : hand;
  }

  /** The hand of this person holding a prop at a second, if any. */
  function holding(
    person: IAutoMovieMotionHumanSegment.IPerson,
    sources: readonly IAutoMovieMotionHumanSegment[],
    prop: string,
    seconds: number,
  ): "left" | "right" | undefined {
    for (const source of sources)
      for (const hold of source.plan.holds ?? [])
        if (hold.prop === prop && source.start + hold.from * source.plan.duration <= seconds) return hold.side;
    for (const held of person.holds)
      if (held.prop === prop && held.from <= seconds && seconds < held.until) return held.side;
    return undefined;
  }

  /** An end's frame in its support's frame on a knot's bones. */
  function relative(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    on: AutoMovieHumanoidBone | null,
    end: End,
  ): IFrame | undefined {
    const placed: IFrame | undefined = frameOf(bones.get(end));
    const frame: IFrame | undefined = on === null ? WORLD : frameOf(bones.get(on));
    if (placed === undefined || frame === undefined) return undefined;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation);
    return {
      position: Quaternion.rotateVector(inverse, Vector3.subtract(placed.position, frame.position)),
      rotation: Quaternion.normalize(Quaternion.multiply(inverse, placed.rotation)),
    };
  }

  function frameOf(bone: IAutoMovieResolvedBone | undefined): IFrame | undefined {
    return bone === undefined ? undefined : { position: bone.worldPosition, rotation: bone.worldRotation };
  }

  /** The analytic two-bone solve: the middle joint's flexion spans the distance, the upper joint swings the end onto the site, the end takes its rotation. */
  function solved(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    now: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    [upper, middle, end]: readonly [AutoMovieHumanoidBone, AutoMovieHumanoidBone, AutoMovieHumanoidBone],
    parent: AutoMovieHumanoidBone | null,
    site: IFrame,
  ): IAutoMoviePose {
    const u: IAutoMovieResolvedBone | undefined = now.get(upper);
    const m: IAutoMovieResolvedBone | undefined = now.get(middle);
    const e: IAutoMovieResolvedBone | undefined = now.get(end);
    const above: IAutoMovieQuaternion | undefined = parent === null
      ? (pose.root?.rotation ?? WORLD.rotation)
      : now.get(parent)?.worldRotation;
    const restUpper: IAutoMovieTransform | undefined = body.bones.get(upper)?.rest;
    const restMiddle: IAutoMovieTransform | undefined = body.bones.get(middle)?.rest;
    const restEnd: IAutoMovieTransform | undefined = body.bones.get(end)?.rest;
    if (u === undefined || m === undefined || e === undefined || above === undefined ||
      restUpper === undefined || restMiddle === undefined || restEnd === undefined) return pose;
    const a: number = Vector3.distance(u.worldPosition, m.worldPosition);
    const b: number = Vector3.distance(m.worldPosition, e.worldPosition);
    const reach: number = Vector3.distance(u.worldPosition, site.position);
    if (!(a > 1e-9 && b > 1e-9 && reach > 1e-9)) return pose;
    const bend: number = solveTwoBoneIK(a, b, reach).bend;
    const spanned: number = Math.min(a + b, Math.max(Math.abs(a - b), reach));
    const interior: number = degrees(
      Vector3.subtract(u.worldPosition, m.worldPosition),
      Vector3.subtract(e.worldPosition, m.worldPosition),
    );
    const joint: IAutoMovieJointPose | undefined = pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === middle);
    const angles: [number, number, number] = [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    const turn = (flexion: number): ITurn => {
      const world: IAutoMovieQuaternion = Quaternion.multiply(u.worldRotation,
        Quaternion.multiply(restMiddle.rotation, body.codec.rotation(middle, [flexion, angles[1], angles[2]])));
      return { flexion, world, end: Vector3.add(m.worldPosition, Quaternion.rotateVector(world, restEnd.translation)) };
    };
    // Which way the flexion opens the chain is the rig's own convention:
    // both are read and the one that spans the distance is kept.
    const opened: ITurn = turn(angles[0] + (bend - interior));
    const folded: ITurn = turn(angles[0] - (bend - interior));
    const error = (c: ITurn): number => Math.abs(Vector3.distance(u.worldPosition, c.end) - spanned);
    const knee: ITurn = error(opened) <= error(folded) ? opened : folded;
    const swing: IAutoMovieQuaternion = rotationBetween(
      Vector3.subtract(knee.end, u.worldPosition),
      Vector3.subtract(site.position, u.worldPosition),
    );
    const upperWorld: IAutoMovieQuaternion = Quaternion.multiply(swing, u.worldRotation);
    const middleWorld: IAutoMovieQuaternion = Quaternion.multiply(swing, knee.world);
    const local = (frame: IAutoMovieQuaternion, rest: IAutoMovieQuaternion, world: IAutoMovieQuaternion): IAutoMovieQuaternion =>
      Quaternion.normalize(Quaternion.multiply(Quaternion.inverse(Quaternion.multiply(frame, rest)), world));
    const upperAngles: [number, number, number] = body.codec.angles(upper, local(above, restUpper.rotation, upperWorld));
    const endAngles: [number, number, number] = body.codec.angles(end, local(middleWorld, restEnd.rotation, site.rotation));
    const placed: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map([
      [upper, { bone: upper, flexion: upperAngles[0], abduction: upperAngles[1], twist: upperAngles[2] }],
      [middle, { bone: middle, flexion: knee.flexion, abduction: joint?.abduction ?? null, twist: joint?.twist ?? null }],
      [end, { bone: end, flexion: endAngles[0], abduction: endAngles[1], twist: endAngles[2] }],
    ]);
    const joints: IAutoMovieJointPose[] = pose.joints.map((j: IAutoMovieJointPose): IAutoMovieJointPose => {
      const replaced: IAutoMovieJointPose | undefined = placed.get(j.bone);
      placed.delete(j.bone);
      return replaced ?? j;
    });
    joints.push(...placed.values());
    return { ...pose, joints };
  }

  /** The middle joint at one flexion: its world rotation and where it puts the end joint. */
  interface ITurn {
    flexion: number;
    world: IAutoMovieQuaternion;
    end: IAutoMovieVector3;
  }

  /** The angle between two vectors, degrees. */
  function degrees(x: IAutoMovieVector3, y: IAutoMovieVector3): number {
    return (Math.atan2(Vector3.length(Vector3.cross(x, y)), Vector3.dot(x, y)) * 180) / Math.PI;
  }
}
