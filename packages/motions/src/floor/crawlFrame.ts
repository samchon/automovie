import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { floorEntry } from "./floorEntry";
import { prepareCrawlPalms } from "./prepareCrawlPalms";

/**
 * The pieces the crawls on the hands share: where a wrist stands over its
 * flat palm, the palms laid on their floor points, a body tilted forward by
 * a pitch with its pelvis turned about the spine's axis, the root that
 * puts the hip joints' middle at a place, the arms carried in joint space,
 * the hips over two knees, and the search for the pitch that brings the
 * shoulders to their place; the feet are `crawlFeet`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seven pieces and what each gives.
 * @evidence contracts/development/design.md#principled-representation Pure functions of the body and a posture, shared by the crawl's kinds and its way down.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seven functions, the one share they use and the pitch search's range.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is solved on the body; nothing is a length typed in metres.
 */
export namespace crawlFrame {
  /** The chest's share of the turn that levels the shoulders over a hiked pelvis; the lumbar spine takes the rest (as `AutoMovieMotionHumanTrunk.CHEST`). */
  export const CHEST: number = 0.6;

  /** The most a crawl's trunk is pitched in a search, degrees: past horizontal, beyond any body on its hands. */
  export const PITCH: number = 120;

  /** The halvings of a pitch search: `PITCH` to under a ten-thousandth of a degree. */
  export const HALVINGS: number = 24;

  /**
   * The trunk's pitch at which a reading of the body stops holding, sought
   * between upright and `PITCH`.
   *
   * @param short Whether the shoulders still fall short of their place at a pitch, degrees; true at upright and false past the place.
   * @returns The pitch, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the search, its range and the reading's sense.
   * @evidence contracts/development/implementation.md#principled-implementation Bisection needs only the reading's change of sense over the range, which a trunk pitched toward the floor gives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The range and the halvings are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms `HALVINGS` readings.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The crawl's pitch and the way down's lean are both found by it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pitched(short: (degrees: number) => boolean): number {
    let lo: number = 0;
    let hi: number = PITCH;
    for (let i: number = 0; i < HALVINGS; i++) {
      const mid: number = (lo + hi) / 2;
      if (short(mid)) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /**
   * Each wrist over its flat palm on the floor, in the floor frame of the
   * heading from the palm.
   *
   * @param body The body.
   * @param standing The standing posture the crawl starts from.
   * @param forward The heading's unit vector.
   * @returns Each wrist from its palm, metres in the heading's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The hand owner's identical rigid palm alignment and wrist placement supply only the datum being measured, with the same downward palm normal and forward direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rigid hand placement per side, without constructing an unused elbow hint or arm goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The palm is laid at the origin facing up, so the offset is the hand's alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two constant-cost rigid hand placements once per plan; the unused default elbow-strain searches are not demanded by a wrist-offset reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Callers keep the result for the plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function wrists(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
    forward: IAutoMovieVector3,
  ): Record<"left" | "right", IAutoMovieVector3> {
    const wrist = (side: "left" | "right"): IAutoMovieVector3 =>
      HumanFrame.local(
        { origin: { x: 0, y: 0, z: 0 }, yaw: standing.yaw },
        HumanHand.reach(
          body,
          side,
          "palm",
          {
            point: { x: 0, y: 0, z: 0 },
            normal: Vector3.scale(Vector3.normalize({ x: 0, y: 1, z: 0 }), -1),
            forward,
          },
          "flat",
        ).point,
      );
    return { left: wrist("left"), right: wrist("right") };
  }

  /**
   * A posture with both palms laid flat on floor points: each hand shaped
   * flat and its arm's goal the one that puts the palm on its point facing
   * up, the fingers along the heading.
   *
   * @param body The body.
   * @param posture The posture whose trunk the arms hang from.
   * @param palm Each palm's floor point, world metres.
   * @param forward The heading's unit vector.
   * @returns The posture with the two arm goals and the flat hands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The arm's own palm target and goal place each wrist, as `wrists` does at the origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target and one goal per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two goals per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function laid(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    palm: (side: "left" | "right") => IAutoMovieVector3,
    forward: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    let out: IAutoMovieMotionHumanPosture = posture;
    for (const side of ["left", "right"] as const)
      out = {
        ...out,
        joints: { ...out.joints, ...HumanHand.shape(side, "flat") },
        limbs: {
          ...out.limbs,
          [`${side}Arm`]: AutoMovieMotionHumanArm.goal(
            body,
            side,
            AutoMovieMotionHumanTarget.hand(
              body,
              out,
              side,
              { point: palm(side), normal: { x: 0, y: 1, z: 0 } },
              { surface: "palm", shape: "flat", forward },
            ),
          ),
        },
      };
    return out;
  }

  /**
   * Prepare the two flat-palm target frames for one crawl plan. Only their
   * floor points and the current trunk change; each arm's original default
   * elbow solve still runs on that posture and point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States explicit fixed palm geometry and unchanged elbow searches. Callers must keep current root/trunk/forward unchanged across their same-call palm callbacks; the generic laid facade retains its original callback/read sequence instead of opting into this contract.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the same flat-palm/upward-floor-normal/explicit-forward geometry to prepareCrawlPalms, which shares each actual wrist between its native default bend and final contact-goal owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared two-palm owner preserves ordered left/right writes while keeping surface geometry, actual bend solving and goal assembly with their original owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not substitute a bend preset or cache a pose, elbow solution or time query; each actual target still executes its default bend policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed orientation/offset/contact geometry and flat shapes share across a plan; each current wrist is placed once for its actual bend and contact goal, with both original numerical bend searches retained.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit caller holds body/hand surfaces, flat shape, floor normal and forward fixed for the reader and preserves current trunk scalars across its two palm callbacks. Actual native crawl callers satisfy this source contract; generic callbacks use laid's unprepared original sequence.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns two fixed hand readers until release and borrows the module's two immutable flat shape maps; neither the readers nor those constants retain an evaluated posture, FK workspace or query history.
   */
  export function prepareLaid(
    body: IAutoMovieMotionHumanBody,
    forward: IAutoMovieVector3,
  ): ReturnType<typeof prepareCrawlPalms> {
    return prepareCrawlPalms(body, forward, FLAT);
  }

  /**
   * Write the crawl's flat fingers without constructing palm goals. This
   * serves descent phases whose joint-space arm writer replaces both goals
   * immediately, while retaining the laid posture's finger fallback.
   *
   * @param posture The current kneeling posture with its leg goals.
   * @returns A new posture and joint map, with all other fields preserved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unused-goal consumer, retained finger fallback and new output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Writes the same ordered left/right flat shape maps that prepareLaid writes; joint-space descent arms then apply their original held-finger fallback.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint-map merge exposes the finger shaping separately from the independently demanded palm targets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No actual contact goal or fitted arm is replaced: callers use this only where both original palm goals were overwritten before resolution.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies J current joints plus the thirty fixed digit entries; no unused default elbow search or target goal is constructed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the same two immutable side-only flat maps as the laid-palm owner, while current posture joints and returned maps remain independent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No state is retained by a call; its returned posture owns a fresh joint map and borrows only immutable angle tuples.
   */
  export function flatHands(posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture {
    return {
      ...posture,
      joints: { ...posture.joints, ...FLAT.left, ...FLAT.right },
    };
  }

  /**
   * A posture with both arms written by their joints, carried in joint space
   * from held angles toward others by a share, each hand shaped flat with
   * them (`HumanHand.shape`), and the arms' goals removed.
   *
   * @param body The body.
   * @param posture The posture.
   * @param held Each arm's angles at share 0.
   * @param toward Each arm's angles at share 1.
   * @param share The share, in [0, 1].
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is written and each input.
   * @evidence contracts/development/implementation.md#principled-implementation Free arm movements are smooth in joint space (Soechting and Lacquaniti 1981), so the arm is blended between two sets of angles (`blendHumanJoint`), never re-solved toward a goal that moves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three blended joints and the fingers per arm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fingers start from the held ones, or the posture's where the arm holds none.
   * @evidence contracts/development/implementation.md#efficient-algorithms One lazy O(B) rig index serves the six interior joint blends for B rig bones, with each actual interpolation's existing cost; endpoint shares allocate no metadata reader, and fixed flat shapes/key lists are not rebuilt.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous blendHumanJoint metadata owner serves the six actual arm joints, and the two side-only flat shapes/key lists are shared constants; current endpoints and posture fingers remain per-query.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous joint-metadata reader ends on return or throw; two side-only immutable flat shape maps and key lists are bounded module constants, and no current posture or blended result is retained.
   */
  export function armed(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    held: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
    toward: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    return writeArms(body, posture, held, toward, share);
  }

  /**
   * Prepare the descent's fixed arm-angle endpoints. Body/angles remain
   * unchanged while the current trunk, finger fallbacks and share vary.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/arm endpoints and changing current posture, finger fallback and progress.
   * @evidence contracts/development/implementation.md#principled-implementation The same writeArms owner applies each joint's blendHumanJoint.between rule and the original flat-finger interpolation, then removes the two arm goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Six fixed joint readers precede one current-posture writer shared with armed.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Between retains original endpoint tuples, clipping, NaN and ROM rules; each current finger fallback is read from the supplied posture and no elbow solution or evaluated pose is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each joint's fixed quaternion/chart prerequisites are prepared lazily once instead of per query; every read retains six current interpolations/readbacks plus the existing ordered finger maps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The owning descent keeps body and the held/target clinical tuples unchanged. Only their six bounded numerical preparations persist; current posture fields, fallback fingers and outputs remain independent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One plan owns six bounded between readers until release, with no retained queried share, blended posture, current FK map or solver workspace.
   */
  export function prepareArmed(
    body: IAutoMovieMotionHumanBody,
    held: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
    toward: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
  ): (posture: IAutoMovieMotionHumanPosture, share: number) => IAutoMovieMotionHumanPosture {
    const arm: (side: "left" | "right") => IArmReaders["left"] = (
      side: "left" | "right",
    ): IArmReaders["left"] => ({
      upper: blendHumanJoint.between(
        body,
        `${side}UpperArm`,
        held[side].upper,
        toward[side].upper,
      ),
      lower: blendHumanJoint.between(
        body,
        `${side}LowerArm`,
        held[side].lower,
        toward[side].lower,
      ),
      hand: blendHumanJoint.between(
        body,
        `${side}Hand`,
        held[side].hand,
        toward[side].hand,
      ),
    });
    const readers: IArmReaders = { left: arm("left"), right: arm("right") };
    return (posture: IAutoMovieMotionHumanPosture, share: number): IAutoMovieMotionHumanPosture =>
      writeArms(body, posture, held, toward, share, readers);
  }

  /** Fixed clinical pairs use their numerical owner; changing pairs share one synchronous metadata pass. */
  function writeArms(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    held: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
    toward: Record<"left" | "right", IAutoMovieMotionHumanArmAngles.IAngles>,
    share: number,
    prepared?: IArmReaders,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const blend: ReturnType<typeof blendHumanJoint.prepare> | undefined =
      prepared !== undefined || share <= 0 || share >= 1
        ? undefined
        : blendHumanJoint.prepare(body);
    for (const side of ["left", "right"] as const) {
      const from: IAutoMovieMotionHumanArmAngles.IAngles = held[side];
      const to: IAutoMovieMotionHumanArmAngles.IAngles = toward[side];
      for (const [bone, key] of [
        [`${side}UpperArm`, "upper"],
        [`${side}LowerArm`, "lower"],
        [`${side}Hand`, "hand"],
      ] as const) {
        if (prepared !== undefined) {
          joints[bone] = prepared[side][key](share);
          continue;
        }
        joints[bone] =
          share <= 0
            ? from[key]
            : share >= 1
              ? to[key]
              : blend!(bone, from[key], to[key], share);
      }
      const flat: IAutoMovieMotionHumanPosture["joints"] = FLAT[side];
      const was: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const bone of FLAT_BONES[side]) {
        const held: readonly [number, number, number] | undefined =
          from.fingers?.[bone] ?? posture.joints[bone];
        if (held !== undefined) was[bone] = held;
      }
      Object.assign(joints, floorEntry.blended(was, flat, share));
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }

  /**
   * The body tilted forward by a pitch at a share of the way down, its
   * pelvis turned about the spine's axis and the spine and the chest
   * turning it back, the arms hanging as the body's relaxed arms
   * (`stand.relaxed`).
   *
   * @param body The body.
   * @param yaw The heading, degrees about +Y.
   * @param share The share of the way down, 0 standing and 1 on the hands.
   * @param degrees The whole body's forward pitch on the hands, degrees.
   * @param hike The pelvis's turn about the spine's axis, degrees; positive lifts the left hip.
   * @param neck The neck's flexion on the hands, degrees; negative lifts the gaze.
   * @returns The posture at the origin, with no limb goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and sign.
   * @evidence contracts/development/implementation.md#principled-implementation The spine and the chest share the hike's return by `CHEST`, so the shoulders stay level over the hands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The root is the caller's, from `rootFor`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function posed(
    body: IAutoMovieMotionHumanBody,
    yaw: number,
    share: number,
    degrees: number,
    hike: number,
    neck: number,
  ): IAutoMovieMotionHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw,
      pitch: degrees * share,
      roll: 0,
      joints: {
        ...stand.relaxed(body),
        neck: [neck * share, 0, 0],
        hips: [0, 0, hike],
        spine: [0, 0, -(1 - CHEST) * hike],
        chest: [0, 0, -CHEST * hike],
      },
      limbs: {},
    };
  }

  /**
   * The hips over two knees: each hip joint a thigh from its knee, at its
   * place along the heading from a level point, so their middle is the
   * pelvis's height and their difference its turn about the spine's axis.
   *
   * @param thigh The thigh's length, metres.
   * @param level The hips' middle on the floor, world metres.
   * @param forward The heading's unit vector.
   * @param knees Each knee joint, world metres.
   * @param ahead How far each hip joint lies before the level point, metres along the heading.
   * @param separation The hip joints' distance, metres.
   * @param pitch The trunk's pitch, degrees.
   * @returns The hips' middle, world metres, and the pelvis's turn, degrees, positive lifting the left hip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, each input, its unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Each hip joint's height is the thigh's reach over its knee; a pelvis pitched by the trunk lifts one hip over the other by turning about the spine's axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One height per side and one turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An upright pelvis cannot lift a hip by that turn, so it turns none.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function over(
    thigh: number,
    level: IAutoMovieVector3,
    forward: IAutoMovieVector3,
    knees: Record<"left" | "right", IAutoMovieVector3>,
    ahead: Record<"left" | "right", number>,
    separation: number,
    pitch: number,
  ): { point: IAutoMovieVector3; hike: number } {
    const height = (side: "left" | "right"): number => {
      const along: number =
        Vector3.dot(Vector3.subtract(knees[side], level), forward) -
        ahead[side];
      return (
        knees[side].y + Math.sqrt(Math.max(0, thigh * thigh - along * along))
      );
    };
    const left: number = height("left");
    const right: number = height("right");
    const reach: number = separation * Math.sin((pitch * Math.PI) / 180);
    return {
      point: { ...level, y: (left + right) / 2 },
      hike:
        reach === 0
          ? 0
          : (Math.asin(Math.max(-1, Math.min(1, (left - right) / reach))) *
              180) /
            Math.PI,
    };
  }
  /**
   * The root that puts a tilted posture's hip joints' middle at a place.
   *
   * @param body The body.
   * @param tilted The posture whose heading and pelvis count.
   * @param hips The hip joints' middle, world metres.
   * @returns The root, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the frame.
   * @evidence contracts/development/implementation.md#principled-implementation The hip joints are read off the body at the posture's heading and pelvis, so the root follows from them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hips' own angles count, so a hiked pelvis keeps its middle where asked.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function rootFor(
    body: IAutoMovieMotionHumanBody,
    tilted: IAutoMovieMotionHumanPosture,
    hips: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const joints = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      resolveHumanPosture.heading(tilted),
      tilted.joints.hips,
    );
    return Vector3.subtract(hips, Vector3.lerp(joints.left, joints.right, 0.5));
  }

  /** Side-only flat clinical shapes are immutable inputs to both palm writers. */
  const FLAT: Readonly<Record<"left" | "right", IAutoMovieMotionHumanPosture["joints"]>> = {
    left: HumanHand.shape("left", "flat"),
    right: HumanHand.shape("right", "flat"),
  };

  /** The same deterministic digit order is used when reading held finger endpoints. */
  const FLAT_BONES: Readonly<
    Record<"left" | "right", readonly AutoMovieHumanoidBone[]>
  > = {
    left: Object.keys(FLAT.left) as AutoMovieHumanoidBone[],
    right: Object.keys(FLAT.right) as AutoMovieHumanoidBone[],
  };

  /** Six arm-joint fixed-endpoint readers owned by one descent plan. */
  type IArmReaders = Record<
    "left" | "right",
    Record<
      "upper" | "lower" | "hand",
      ReturnType<typeof blendHumanJoint.between>
    >
  >;
}
