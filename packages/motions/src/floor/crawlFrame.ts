import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareCrawlPalms } from "./prepareCrawlPalms";

/** The alternatives of `ArmReadersEntryEntry`'s site. */
type ArmReadersEntryEntry = "upper" | "lower" | "hand";

/** The record of `IOverResult`'s site. */
type IOverResult = { point: IAutoMovieVector3; hike: number };

/**
 * The pieces the crawls on the hands share: where a wrist stands over its flat
 * palm, the palms laid on their floor points, a body tilted forward by a pitch
 * with its pelvis turned about the spine's axis, the root that puts the hip
 * joints' middle at a place, the arms carried in joint space, the hips over two
 * knees, and the search for the pitch that brings the shoulders to their place;
 * the feet are `crawlFeet`'s.
 */
export namespace crawlFrame {
  /**
   * The chest's share of the turn that levels the shoulders over a hiked
   * pelvis; the lumbar spine takes the rest (as
   * `AutoMovieMotionHumanTrunk.CHEST`).
   */
  export const CHEST: number = 0.6;

  /**
   * The most a crawl's trunk is pitched in a search, degrees: past horizontal,
   * beyond any body on its hands.
   */
  export const PITCH: number = 120;

  /**
   * The halvings of a pitch search: `PITCH` to under a ten-thousandth of a
   * degree.
   */
  export const HALVINGS: number = 24;

  /**
   * The trunk's pitch at which a reading of the body stops holding, sought
   * between upright and `PITCH`.
   *
   * @param short Whether the shoulders still fall short of their place at a
   *   pitch, degrees; true at upright and false past the place.
   * @returns The pitch, degrees.
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
   */
  export function wrists(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
    forward: IAutoMovieVector3,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> {
    const wrist = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
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
   * A posture with both palms laid flat on floor points: each hand shaped flat
   * and its arm's goal the one that puts the palm on its point facing up, the
   * fingers along the heading.
   *
   * @param body The body.
   * @param posture The posture whose trunk the arms hang from.
   * @param palm Each palm's floor point, world metres.
   * @param forward The heading's unit vector.
   * @returns The posture with the two arm goals and the flat hands.
   */
  export function laid(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    palm: (side: AutoMovieHumanSide) => IAutoMovieVector3,
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
   */
  export function prepareLaid(
    body: IAutoMovieMotionHumanBody,
    forward: IAutoMovieVector3,
  ): ReturnType<typeof prepareCrawlPalms> {
    return prepareCrawlPalms(body, forward, FLAT);
  }

  /**
   * Write the crawl's flat fingers without constructing palm goals. This serves
   * descent phases whose joint-space arm writer replaces both goals
   * immediately, while retaining the laid posture's finger fallback.
   *
   * @param posture The current kneeling posture with its leg goals.
   * @returns A new posture and joint map, with all other fields preserved.
   */
  export function flatHands(
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    return {
      ...posture,
      joints: { ...posture.joints, ...FLAT.left, ...FLAT.right },
    };
  }

  /**
   * A posture with both arms written by their joints, carried in joint space
   * from held angles toward others by a share, each hand shaped flat with them
   * (`HumanHand.shape`), and the arms' goals removed.
   *
   * @param body The body.
   * @param posture The posture.
   * @param held Each arm's angles at share 0.
   * @param toward Each arm's angles at share 1.
   * @param share The share, in [0, 1].
   * @returns The posture.
   */
  export function armed(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    held: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>,
    toward: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    return writeArms(body, posture, held, toward, share);
  }

  /**
   * Prepare the descent's fixed arm-angle endpoints. Body/angles remain
   * unchanged while the current trunk, finger fallbacks and share vary.
   */
  export function prepareArmed(
    body: IAutoMovieMotionHumanBody,
    held: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>,
    toward: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ) => IAutoMovieMotionHumanPosture {
    const arm: (side: AutoMovieHumanSide) => IArmReaders["left"] = (
      side: AutoMovieHumanSide,
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
    return (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
    ): IAutoMovieMotionHumanPosture =>
      writeArms(body, posture, held, toward, share, readers);
  }

  /**
   * Fixed clinical pairs use their numerical owner; changing pairs share one
   * synchronous metadata pass.
   */
  function writeArms(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    held: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>,
    toward: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>,
    share: number,
    prepared?: IArmReaders,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
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
      Object.assign(joints, prepareHumanShapeBlend(was, flat)(share));
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }

  /**
   * The body tilted forward by a pitch at a share of the way down, its pelvis
   * turned about the spine's axis and the spine and the chest turning it back,
   * the arms hanging as the body's relaxed arms (`stand.relaxed`).
   *
   * @param body The body.
   * @param yaw The heading, degrees about +Y.
   * @param share The share of the way down, 0 standing and 1 on the hands.
   * @param degrees The whole body's forward pitch on the hands, degrees.
   * @param hike The pelvis's turn about the spine's axis, degrees; positive
   *   lifts the left hip.
   * @param neck The neck's flexion on the hands, degrees; negative lifts the
   *   gaze.
   * @returns The posture at the origin, with no limb goal.
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
   * The hips over two knees: each hip joint a thigh from its knee, at its place
   * along the heading from a level point, so their middle is the pelvis's
   * height and their difference its turn about the spine's axis.
   *
   * @param thigh The thigh's length, metres.
   * @param level The hips' middle on the floor, world metres.
   * @param forward The heading's unit vector.
   * @param knees Each knee joint, world metres.
   * @param ahead How far each hip joint lies before the level point, metres
   *   along the heading.
   * @param separation The hip joints' distance, metres.
   * @param pitch The trunk's pitch, degrees.
   * @returns The hips' middle, world metres, and the pelvis's turn, degrees,
   *   positive lifting the left hip.
   */
  export function over(
    thigh: number,
    level: IAutoMovieVector3,
    forward: IAutoMovieVector3,
    knees: Record<AutoMovieHumanSide, IAutoMovieVector3>,
    ahead: Record<AutoMovieHumanSide, number>,
    separation: number,
    pitch: number,
  ): IOverResult {
    const height = (side: AutoMovieHumanSide): number => {
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
   */
  export function rootFor(
    body: IAutoMovieMotionHumanBody,
    tilted: IAutoMovieMotionHumanPosture,
    hips: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const joints = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      humanPostureHeading(tilted),
      tilted.joints.hips,
    );
    return Vector3.subtract(hips, Vector3.lerp(joints.left, joints.right, 0.5));
  }

  /** Side-only flat clinical shapes are immutable inputs to both palm writers. */
  const FLAT: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
  > = {
    left: HumanHand.shape("left", "flat"),
    right: HumanHand.shape("right", "flat"),
  };

  /**
   * The same deterministic digit order is used when reading held finger
   * endpoints.
   */
  const FLAT_BONES: Readonly<
    Record<AutoMovieHumanSide, readonly AutoMovieHumanoidBone[]>
  > = {
    left: Object.keys(FLAT.left) as AutoMovieHumanoidBone[],
    right: Object.keys(FLAT.right) as AutoMovieHumanoidBone[],
  };

  /** Six arm-joint fixed-endpoint readers owned by one descent plan. */
  type IArmReaders = Record<
    AutoMovieHumanSide,
    Record<ArmReadersEntryEntry, ReturnType<typeof blendHumanJoint.between>>
  >;
}
