import {
  DEFAULT_HUMANOID_ROM,
  bracketedRoot,
  minimumJerk,
  preparePoseResolution,
  smoothMinimum,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareWalkReachSwing } from "./prepareWalkReachSwing";
import type { walkFoot } from "./walkFoot";
import { walkHipTwist } from "./walkHipTwist";
import { walkLeg } from "./walkLeg";
import { walkReachFeet } from "./walkReachFeet";
import { walkReachShort } from "./walkReachShort";
import { walkReachStance } from "./walkReachStance";

/** The alternatives of `EXTENSIONBone`'s site. */
type EXTENSIONBone = "leftUpperLeg" | "rightUpperLeg";

/** The alternatives of `GroundCompleted`'s site. */
type GroundCompleted = "feet" | "contacts";

/** The record of `IGroundPlaceOut`'s site. */
type IGroundPlaceOut = { end: walkFoot.IEnd; contact: IAutoMovieVector3 };

/** The record of `IGroundPlaceKnown`'s site. */
type IGroundPlaceKnown = { end: walkFoot.IEnd; contact: IAutoMovieVector3 };

/** The record of `IReadEntryEntry`'s site. */
type IReadEntryEntry = { end: walkFoot.IEnd; contact: IAutoMovieVector3 };

/** The record of `IGroundTilt`'s site. */
type IGroundTilt = {
  rotation: IAutoMovieQuaternion;
  hips: Record<AutoMovieHumanSide, IAutoMovieVector3>;
};

/** The alternatives of `TurnResult`'s site. */
type TurnResult = "yaw" | "pivots";

/** The alternatives of `Pelvis`'s site. */
type Pelvis = "yaw" | "pivots";

/**
 * Makes every foot goal of a stepping gait reachable on the actual pelvis, the
 * footskate cleanup of Kovar, Schreiner and Gleicher (2002): the contacts are
 * enforced by IK, and the root moves so the IK can meet them.
 *
 * `ground` settles the pelvis against the stances. It lowers the root until
 * each stance's ankle is reached with the knee at least `walkReachShort.KNEE`
 * degrees bent and turns the pelvis no further than `TWIST` from each stance's
 * foot (`pelvis`). Each foot claims a lowering (`short`), signed, so a leg with
 * slack claims less than none. A swinging foot claims through the stance it
 * left or the stance it lands in, its claim fading out over the first `FADE` of
 * its swing and in over the last on a minimum-jerk weight (Flash and Hogan
 * 1985), unless the caller names its claim, as a walk does over the second half
 * of a swing (`walkDescent`). The two feet's claims and none at all join in a
 * smooth maximum `CLAIM` wide (the engine's `smoothMinimum`, negated), which
 * never lowers less than either asks, so the pelvis is continuous with its rate
 * through every contact event and where a leg runs out of slack. The stances
 * are placed against the lowered hips, which changes what they claim, so the
 * lowering is the one whose stances claim exactly it, found between none and
 * the first claim by the engine's `bracketedRoot`. Each stance is held by
 * `walkReachStance`: a shank leaning toward the ankle's dorsal limit raises its
 * heel about its ball (`walkLeg.heelRise`, from `walkLeg.ROCKER` of room on),
 * or lowers its toes about its heel in the heel rocker; a thigh that would
 * trail more than `walkReachStance.TRAIL` raises it further; and a foot pivots
 * on its toe pad by the pelvis's turn beyond `TWIST`, in proportion to its
 * heel's rise up to `HEEL_UP`, the pivot of a stepping turn. The hip joints are
 * read from the pelvis posed by the root, the heading and the pelvis joint, so
 * its rotation and list count.
 *
 * `swing` then holds a swinging foot inside the leg's reach, the hip's
 * extension, the hip's rotation and the ankle's range under that pelvis, and
 * off the floor. A turning pelvis can leave a stance outside them (a trailing
 * foot far behind or aside of its hip at toe-off), so a walk passes the swing's
 * share and the clamps come in over its first `FADE` and go over its last, the
 * swing leaving and joining its stances where they stand.
 */
export namespace walkReach {
  /**
   * The share of a swing over which its foot's claim on the pelvis fades out
   * after toe-off and in before heel strike (provisional).
   */
  export const FADE: number = 0.25;

  /**
   * The difference, metres, under which the claims on the root's height blend
   * (provisional); a foot that asks nothing claims this much less than none, so
   * it leaves the blend alone.
   */
  export const CLAIM: number = 0.01;

  /** A pelvis turned toward its stances, before it is lowered. */
  export interface IPelvis {
    /** The heading, degrees. */
    yaw: number;

    /** Each foot's pivot turn on its toe pad, degrees. */
    pivots: Record<AutoMovieHumanSide, number>;

    /** The hip joints, world metres. */
    hips: Record<AutoMovieHumanSide, IAutoMovieVector3>;
  }

  /** A requested heading, or the pelvis already evaluated at the same stance. */
  type PlannedPelvis = number | IPelvis;

  /** The pelvis settled against the stances. */
  export interface IGround {
    /** The heading, degrees. */
    yaw: number;

    /** The lowered root, world metres. */
    root: IAutoMovieVector3;

    /** The hip joints under that root, world metres. */
    hips: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /** Each foot's stance as reached. */
    feet: Record<AutoMovieHumanSide, walkFoot.IEnd>;

    /** Each stance's contact point in its foot's frame. */
    contacts: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /**
     * The pelvis's world rotation, where the caller tilts it from upright under
     * its heading (a trunk tipped about the hips,
     * `AutoMovieMotionHumanLean.pivot`), the hip joints then the tilted ones;
     * upright when absent.
     */
    pelvis?: IAutoMovieQuaternion;
  }

  /**
   * A scheduled foot's claim on the pelvis.
   *
   * @param foot The foot.
   * @returns 1 in stance, fading to 0 in mid-swing.
   */
  export function weight(
    foot: IAutoMovieMotionHumanWalkFoot.IScheduled,
  ): number {
    if (foot.swing === undefined) return 1;
    const u: number = foot.swing.u;
    return u < 0.5
      ? 1 - minimumJerk.share(Math.min(1, u / FADE))
      : minimumJerk.share(Math.max(0, (u - (1 - FADE)) / FADE));
  }

  /**
   * The lowering a leg asks of the root at the knee floor
   * (`walkReachShort.short`).
   */
  export const short: typeof walkReachShort.short = walkReachShort.short;

  /** Prepare the fixed body's lowering claims (`walkReachShort.prepare`). */
  export const prepareShort: typeof walkReachShort.prepare =
    walkReachShort.prepare;

  /**
   * Turn the pelvis toward its stances: no further than `TWIST` from each
   * claiming foot, a foot with its heel up taking the rest as a pivot turn;
   * feet turned further apart than that, in a stepping turn, hold it between
   * them, each by its claim.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param planned The unconstrained heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot as scheduled.
   * @param resolution Optional exact FK reader borrowed from this synchronous
   *   descent construction; the returned points never retain it.
   * @returns The heading, the pivots and the hip joints under that root.
   */
  export function pelvis(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>
    >,
    resolution?: ReturnType<typeof preparePoseResolution>,
  ): IPelvis {
    const { yaw, pivots }: Pick<IPelvis, Pelvis> = turn(planned, feet);
    return {
      yaw,
      pivots,
      hips: hipJoints(
        body,
        root,
        humanPostureHeading({ yaw, pitch: 0, roll: 0 }),
        hips,
        resolution,
      ),
    };
  }

  /**
   * Read the pelvis heading and stance pivots before any root or hip placement.
   *
   * @param planned The unconstrained heading, degrees.
   * @param feet Each actual scheduled foot and its swing share.
   * @returns The same heading and toe-pad pivots used by pelvis, in degrees.
   */
  export function turn(
    planned: number,
    feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>
    >,
  ): Pick<IPelvis, TurnResult> {
    const pivots: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
    let yaw: number = planned;
    // Each claiming foot's band: its pivoted heading, near the planned one,
    // give or take `TWIST` over its claim.
    type IBand = { centre: number; half: number };
    const bands: IBand[] = [];
    for (const side of SIDES) {
      const w: number = weight(feet[side]);
      if (w <= 0) continue;
      const rotation: IAutoMovieQuaternion = feet[side].placement.rotation;
      const direction: ReturnType<typeof HumanFoot.headingPitch> =
        HumanFoot.headingPitch(rotation);
      const heading: number = direction.heading;
      pivots[side] = pivot(planned, direction);
      bands.push({
        centre: planned + wrapDegrees(heading + pivots[side] - planned),
        half: TWIST / w,
      });
      const turned: number = wrapDegrees(yaw - (heading + pivots[side]));
      if (Math.abs(turned) > TWIST / w)
        yaw -= turned - (Math.sign(turned) * TWIST) / w;
    }
    // Disjoint stance bands hold the pelvis at the nearest heading in their gap.
    if (bands.length === 2) {
      const a: IBand =
        bands[0]!.centre <= bands[1]!.centre ? bands[0]! : bands[1]!;
      const b: IBand = a === bands[0] ? bands[1]! : bands[0]!;
      const upper: number = a.centre + a.half;
      const lower: number = b.centre - b.half;
      if (upper < lower) yaw = Math.min(lower, Math.max(upper, planned));
    }
    return { yaw, pivots };
  }

  /**
   * One scheduled foot's toe pivot, in degrees. Contact classification only
   * needs this foot, whereas pelvis heading depends on both stance bands.
   */
  export function footPivot(
    planned: number,
    foot: IAutoMovieMotionHumanWalkFoot.IScheduled,
  ): number {
    return weight(foot) > 0
      ? pivot(planned, HumanFoot.headingPitch(foot.placement.rotation))
      : 0;
  }

  /** The requested toe rotation after consuming the available hip twist. */
  function pivot(
    planned: number,
    direction: ReturnType<typeof HumanFoot.headingPitch>,
  ): number {
    const off: number = wrapDegrees(planned - direction.heading);
    const excess: number =
      Math.abs(off) > TWIST ? off - Math.sign(off) * TWIST : 0;
    return excess * Math.min(1, Math.max(0, -direction.pitch / HEEL_UP));
  }

  /**
   * Settle the pelvis against the stances.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param planned The unconstrained heading in degrees or the pelvis already
   *   evaluated at this stance.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot as scheduled.
   * @param claims The lowering a foot claims in place of its faded stance's,
   *   metres.
   * @param rocker The room under which a stance's heel begins to rise, degrees;
   *   `walkLeg.ROCKER` when absent. A gait gives less while it starts and
   *   stops: a foot that is not stepping keeps its heel down until its ankle
   *   can bend no further.
   * @param resolution Optional exact FK loan from this synchronous person
   *   observation; only the actual hip read borrows it.
   * @param tilt The pelvis's tilt from upright under its settled heading, given
   *   the unlowered root, that heading and the upright hip joints
   *   (`walkReachHeld.tilt`): its world rotation and the hip joints it carries.
   *   A caller that shows the pelvis tilted (a trunk tipped about the hips)
   *   gives it, so the lowering is settled on the hip joints as shown; upright
   *   when absent.
   * @param dorsal Each planted foot's dorsal limit, degrees, by the weight it
   *   bears (`walkLeg.dorsal`); an unloaded foot's for a side absent.
   * @param step The hip's largest vertical step a frame of the caller's planned
   *   course, metres, which eases each leg's reach over a soft band
   *   (`walkReachShort.prepare`); a hard reach when absent.
   * @returns The pelvis and each stance as reached.
   */
  export function ground(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    planned: PlannedPelvis,
    hips: readonly [number, number, number],
    feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>
    >,
    claims: Readonly<Partial<Record<AutoMovieHumanSide, number>>> = {},
    rocker: number = walkLeg.ROCKER,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    tilt?: (
      root: IAutoMovieVector3,
      yaw: number,
      joints: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
    ) => IGroundTilt,
    dorsal: Readonly<Partial<Record<AutoMovieHumanSide, number>>> = {},
    step?: number,
  ): IGround {
    const {
      yaw,
      pivots,
      hips: upright,
    }: IPelvis = typeof planned === "number"
      ? pelvis(
          body,
          root,
          planned,
          hips,
          feet,
          resolution === undefined
            ? undefined
            : prepareHumanPoseResolution.read(resolution),
        )
      : planned;

    // The tilted hip joints translate uniformly with the lowering.
    const tilted: ReturnType<NonNullable<typeof tilt>> | undefined = tilt?.(
      root,
      yaw,
      upright,
    );
    const joints: Record<AutoMovieHumanSide, IAutoMovieVector3> =
      tilted?.hips ?? upright;
    const hip: (side: AutoMovieHumanSide, drop: number) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
      drop: number,
    ): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = joints[side];
      return { x: p.x, y: p.y - drop, z: p.z };
    };
    const weights: Record<AutoMovieHumanSide, number> = {
      left: weight(feet.left),
      right: weight(feet.right),
    };
    let short: ReturnType<typeof prepareShort> | undefined;
    const bearing: Record<AutoMovieHumanSide, boolean> = {
      left: claims.left === undefined && weights.left > 0,
      right: claims.right === undefined && weights.right > 0,
    };
    let share: Record<AutoMovieHumanSide, number> = {
      left: bearing.left ? 1 : 0,
      right: bearing.right ? 1 : 0,
    };
    const placed: IGround["feet"] = {} as IGround["feet"];
    const contacts: IGround["contacts"] = {} as IGround["contacts"];
    const readers: Partial<
      Record<AutoMovieHumanSide, ReturnType<typeof walkReachStance.prepare>>
    > = {};
    const read: Record<AutoMovieHumanSide, Map<number, IReadEntryEntry>> = {
      left: new Map(),
      right: new Map(),
    };
    const place: (
      drop: number,
      inactive?: boolean,
      requested?: AutoMovieHumanSide,
    ) => void = (
      drop: number,
      inactive: boolean = false,
      requested?: AutoMovieHumanSide,
    ): void => {
      for (const side of SIDES) {
        if (requested !== undefined && side !== requested) continue;
        // A named swing claim, or a foot with no stance weight, does not
        // read its stance during the root solve. Place it only at the final
        // root, where the caller may need the returned endpoint.
        if (bearing[side] === inactive) continue;
        if (!inactive && !(share[side] > 0)) continue;
        // A bearing stance's reading is its hip's alone, so a lowering asked again (drop 0 under each fading mask) takes it.
        const known: IGroundPlaceKnown | undefined = inactive
          ? undefined
          : read[side].get(drop);
        const out: IGroundPlaceOut =
          known ??
          (readers[side] ??= walkReachStance.prepare(
            body,
            side,
            feet[side],
            yaw,
            pivots[side],
            rocker,
            dorsal[side],
          ))(hip(side, drop));
        if (!inactive && known === undefined) read[side].set(drop, out);
        placed[side] = out.end;
        contacts[side] = out.contact;
      }
    };
    // A foot claims its stance's lowering, or `CLAIM` under none when it
    // has no share in the lowering being solved.
    const claim: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => {
      const named: number | undefined = claims[side];
      if (named !== undefined) return named;
      if (!(share[side] > 0)) return -CLAIM;
      if (short === undefined) short = prepareShort(body, step);
      return short(joints[side], placed[side].ankle);
    };
    const lowering: () => number = (): number =>
      -smoothMinimum(
        smoothMinimum(-claim("left"), -claim("right"), CLAIM),
        0,
        CLAIM,
      );
    // The lowering is the one that asks for itself: the stances placed against
    // the hips it lowers claim exactly it. Lower hips raise a stance's heel
    // and its claim falls, so what a lowering leaves unclaimed changes sign
    // once between none and the first claim. Under the unlowered hips a
    // stretched leg stands at its straight knee, where the shank's lean turns
    // on a square root; the lowering that asks for itself keeps every knee
    // bent, so none of that reaches the root.
    const asked: (drop: number) => number = (drop: number): number => {
      place(drop);
      return lowering();
    };
    const settle: () => number = (): number => {
      const first: number = asked(0);
      if (!(first > 0)) return 0;
      // Without a participating stance, neither claim depends on drop.
      if (share.left === 0 && share.right === 0) return first;
      // Hips lowered by the first claim claim no more than it, so `high` is
      // already the bracket's upper end; the doublings guard a claim that
      // rises with the lowering, as a stance the heel cannot relieve may.
      let high: number = first;
      let over: number = asked(high) - high;
      for (let k: number = 0; k < DOUBLINGS && over > 0; k++) {
        high *= 2;
        over = asked(high) - high;
      }
      if (over >= 0) return high;
      return bracketedRoot(
        (d: number): number => {
          if (d === 0) return first;
          if (d === high) return over;
          return asked(d) - d;
        },
        0,
        high,
        FINE,
      );
    };

    // A fading foot's weight is its share of the settled lowering, not a
    // factor on its claim: a stance trades its heel's rise for the hips'
    // lowering one for one, so over that trade a claim follows the lowering
    // at a slope of one and a factor a little under one on it would carry
    // the fixed point from one end of the trade to the other at once. The
    // lowering with the foot's whole claim and the lowering without it are
    // each well placed, and the weight runs between the two, continuous in
    // the weight by construction and theirs at its two ends.
    const fading: AutoMovieHumanSide[] = SIDES.filter(
      (side: AutoMovieHumanSide): boolean => bearing[side] && weights[side] < 1,
    );
    let drop: number = 0;
    for (let mask: number = 0; mask < 1 << fading.length; mask++) {
      let part: number = 1;
      share = { left: bearing.left ? 1 : 0, right: bearing.right ? 1 : 0 };
      fading.forEach((side: AutoMovieHumanSide, i: number): void => {
        const kept: boolean = (mask & (1 << i)) !== 0;
        share[side] = kept ? 1 : 0;
        part *= kept ? weights[side] : 1 - weights[side];
      });
      drop += part * settle();
    }
    share = { left: bearing.left ? 1 : 0, right: bearing.right ? 1 : 0 };
    place(drop);
    const completed: Pick<IGround, GroundCompleted> = walkReachFeet(
      { feet: placed, contacts },
      bearing,
      (side: AutoMovieHumanSide): void => place(drop, true, side),
    );
    return {
      yaw,
      root: { ...root, y: root.y - drop },
      hips: { left: hip("left", drop), right: hip("right", drop) },
      ...completed,
      ...(tilted === undefined ? {} : { pelvis: tilted.rotation }),
    };
  }
  /**
   * Hold a swinging foot inside its leg's ranges under a settled pelvis: the
   * ankle within reach and no further behind the hip than a thigh `EXTENSION`
   * degrees back and the knee's bend carry it (an ankle past that turns forward
   * onto that boundary at the same hip-to-ankle distance and knee angle), the
   * heading within `TWIST` of the pelvis, the pitch inside the ankle's range,
   * and neither toe nor heel nearer the floor than the swing carried them.
   *
   * @param body The body.
   * @param side The foot.
   * @param settled The pelvis.
   * @param foot The swinging foot.
   * @param share The share of the swing, when the caller's stances may stand
   *   outside these ranges (a foot rolled onto its edge, a stance far behind
   *   the hip): the ranges then come in over the first `FADE` of the swing and
   *   go over its last, so the swing leaves and joins its stances where they
   *   stand. Held throughout when absent.
   * @returns The foot as reached.
   */
  export function swing(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    settled: IGround,
    foot: IAutoMovieMotionHumanWalkFoot.IFoot,
    share?: number,
  ): walkFoot.IEnd {
    return prepareSwing(body, side)(settled, foot, share);
  }

  /**
   * Prepare fixed body and foot geometry for repeated swing-range reads.
   *
   * @param body The action's unchanged body.
   * @param side The swinging foot.
   * @returns This law's same swing constraints with its fixed bounds prepared.
   */
  export function prepareSwing(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): ReturnType<typeof prepareWalkReachSwing> {
    return prepareWalkReachSwing(body, side, {
      knee: walkReachShort.KNEE,
      extension: EXTENSION,
      side: SIDE,
      twist: TWIST,
      fade: FADE,
    });
  }
  /** Both feet. */
  export const SIDES: readonly ["left", "right"] = ["left", "right"];

  /**
   * The width, metres, to which the root's lowering is solved: a nanometre,
   * under which its error adds less than a micrometre per second to a rate read
   * over a frame.
   */
  const FINE: number = 1e-9;

  /**
   * The largest extension, degrees, of a leg's thigh, swinging or planted: the
   * hip's extension in the range table (`DEFAULT_HUMANOID_ROM`, 30° on either
   * hip, the lesser taken), kept inside by the margin a foot keeps inside its
   * ankle's range (`walkLeg.ANKLE`); the ankle trails further by the knee's
   * bend.
   */
  export const EXTENSION: number =
    Math.min(
      ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
        (bone: EXTENSIONBone): number => {
          const flexion: IAutoMovieAngleRange | null | undefined =
            DEFAULT_HUMANOID_ROM[bone]?.flexion;
          if (flexion === null || flexion === undefined)
            throw new Error(
              `The range-of-motion table gives ${bone} no flexion`,
            );
          return -flexion.min;
        },
      ),
    ) - walkLeg.ANKLE;

  /**
   * The furthest a swinging leg's line leans to the side of its foot, degrees:
   * the ankle's inversion and eversion (`walkReachStance.SIDE`), the same bound
   * a stance stands inside, so a swing joins its stances where they are.
   */
  const SIDE: number = walkReachStance.SIDE;

  /**
   * The largest heading, degrees, a foot may keep from the pelvis: the hip's
   * own internal and external rotation (`DEFAULT_HUMANOID_ROM`, 45° either way,
   * `walkHipTwist`); a turn that asks more is taken by spinning on the ball of
   * the foot (a spin turn, Hase and Stein 1999).
   */
  export const TWIST: number = walkHipTwist(DEFAULT_HUMANOID_ROM);

  /**
   * A cap on the doublings of the root's bracket past the first claim, a guard
   * and not a tolerance: claims that do not rise as the hips lower never enter
   * the loop (see `ground`), and 2⁸ = 256 times the first claim bounds the
   * guard's cost; a claim still over its lowering after them takes the
   * bracket's end as its lowering.
   */
  const DOUBLINGS: number = 8;

  /**
   * Pitch, degrees toes-down, at which a planted foot's heel is far enough up
   * to take the whole pivot turn on its toe pad (provisional).
   */
  const HEEL_UP: number = 30;
}
