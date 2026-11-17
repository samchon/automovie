import {
  DEFAULT_HUMANOID_ROM,
  bracketedRoot,
  minimumJerk,
  type preparePoseResolution,
  smoothMinimum,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { walkFoot } from "./walkFoot";
import { walkHipTwist } from "./walkHipTwist";
import { prepareWalkReachSwing } from "./prepareWalkReachSwing";
import { walkLeg } from "./walkLeg";
import { walkReachFeet } from "./walkReachFeet";
import { walkReachStance } from "./walkReachStance";

/**
 * Makes every foot goal of a stepping gait reachable on the actual pelvis,
 * the footskate cleanup of Kovar, Schreiner and Gleicher (2002): the contacts
 * are enforced by IK, and the root moves so the IK can meet them.
 *
 * `ground` settles the pelvis against the stances. It lowers the root until
 * each stance's ankle is reached with the knee at least `KNEE` degrees bent
 * and turns the pelvis no further than `TWIST` from each stance's foot
 * (`pelvis`). Each foot claims a lowering (`short`), signed, so a leg with
 * slack claims less than none. A swinging foot claims through the stance it
 * left or the stance it lands in, its claim fading out over the first `FADE`
 * of its swing and in over the last on a minimum-jerk weight (Flash and Hogan
 * 1985), unless the caller names its claim, as a walk does over the second
 * half of a swing (`walkDescent`). The two feet's claims and none at all join
 * in a smooth maximum `CLAIM` wide (the engine's `smoothMinimum`, negated),
 * which never lowers less than either asks, so the pelvis is continuous with
 * its rate through every contact event and where a leg runs out of slack.
 * The stances are placed against the lowered hips, which changes what they
 * claim, so the lowering is the one whose stances claim exactly it, found
 * between none and the first claim by the engine's `bracketedRoot`. Each
 * stance is held by `walkReachStance`: a shank leaning toward the ankle's
 * dorsal limit raises its heel about its ball (`walkLeg.heelRise`, from
 * `walkLeg.ROCKER` of room on), or lowers its toes about its heel in the
 * heel rocker; a thigh that would trail more than `walkReachStance.TRAIL`
 * raises it further; and a foot pivots on its toe pad by the pelvis's turn
 * beyond `TWIST`, in proportion to its heel's rise up to `HEEL_UP`, the
 * pivot of a stepping turn. The hip joints are read from the
 * pelvis posed by the root, the heading and the pelvis joint, so its
 * rotation and list count.
 *
 * `swing` then holds a swinging foot inside the leg's reach, the hip's
 * extension, the hip's rotation and the ankle's range under that pelvis, and
 * off the floor. A swing between two grounded stances starts and ends inside
 * all four, so the clamps act only in between.
 */
export namespace walkReach {
  /** The share of a swing over which its foot's claim on the pelvis fades out after toe-off and in before heel strike (provisional). */
  export const FADE: number = 0.25;

  /** The difference, metres, under which the claims on the root's height blend (provisional); a foot that asks nothing claims this much less than none, so it leaves the blend alone. */
  export const CLAIM: number = 0.01;

  /** A pelvis turned toward its stances, before it is lowered. */
  export interface IPelvis {
    /** The heading, degrees. */
    yaw: number;

    /** Each foot's pivot turn on its toe pad, degrees. */
    pivots: Record<"left" | "right", number>;

    /** The hip joints, world metres. */
    hips: Record<"left" | "right", IAutoMovieVector3>;
  }

  /** The pelvis settled against the stances. */
  export interface IGround {
    /** The heading, degrees. */
    yaw: number;

    /** The lowered root, world metres. */
    root: IAutoMovieVector3;

    /** The hip joints under that root, world metres. */
    hips: Record<"left" | "right", IAutoMovieVector3>;

    /** Each foot's stance as reached. */
    feet: Record<"left" | "right", walkFoot.IEnd>;

    /** Each stance's contact point in its foot's frame. */
    contacts: Record<"left" | "right", IAutoMovieVector3>;

    /** The pelvis's world rotation, where the caller tilts it from upright under its heading (a trunk tipped about the hips, `AutoMovieMotionHumanLean.pivot`), the hip joints then the tilted ones; upright when absent. */
    pelvis?: IAutoMovieQuaternion;
  }

  /**
   * A scheduled foot's claim on the pelvis.
   *
   * @param foot The foot.
   * @returns 1 in stance, fading to 0 in mid-swing.
   */
  export function weight(foot: walkFoot.IScheduled): number {
    if (foot.swing === undefined) return 1;
    const u: number = foot.swing.u;
    return u < 0.5
      ? 1 - minimumJerk.share(Math.min(1, u / FADE))
      : minimumJerk.share(Math.max(0, (u - (1 - FADE)) / FADE));
  }

  /**
   * The lowering a leg asks of the root to reach an ankle with the knee
   * `KNEE` bent (`resolveHumanPosture.short`).
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @returns Metres, negative by the leg's slack and no less than a metre
   *   under none, which claims as little as any slack does.
   */
  export function short(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
  ): number {
    return Math.max(-1, resolveHumanPosture.short(body, hip, ankle, KNEE));
  }

  /**
   * Prepare the fixed body's knee-flexed reach for repeated lowering claims.
   *
   * @param body The unchanged body whose measured thigh/shank determine reach.
   * @returns The same metre claim for actual world-metre hip/ankle pairs, bounded below by the original one metre of slack.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed measured-body premise, world-metre varying points, signed claim and unchanged slack floor.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the shared lowering owner's exact cosine-law reach at this law's KNEE, followed by its unchanged horizontal-distance comparison, Pythagorean vertical reach and this law's Math.max(-1, claim).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical reach preparation feeds a scalar claim reader, used both by ground's root trials and a walk's descent samples.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the same knee threshold, outside-reach result, metre slack bound and actual point arithmetic; the ordinary short path remains unsupplied and reads the current body as before.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed cosine and reach square root prepare once rather than in every root/descent probe; every actual point pair retains its horizontal distance and remaining square root.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The synchronous ground solve or fixed-body take owns its unchanged measured lengths and knee threshold; changing that body requires a new reader, without sharing any queried claim.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One owner-local closure retains the canonical scalar reach reader until its solve/take releases it; no hip, ankle, claim, time history or global pose cache is retained.
   */
  export function prepareShort(
    body: IHumanBody,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
    const read: ReturnType<typeof resolveHumanPosture.prepareShort> = resolveHumanPosture.prepareShort(body, KNEE);
    return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number => Math.max(-1, read(hip, ankle));
  }

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
   * @param resolution Optional exact FK reader borrowed from this synchronous descent construction; the returned points never retain it.
   * @returns The heading, the pivots and the hip joints under that root.
   */
  export function pelvis(
    body: IHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
    resolution?: ReturnType<typeof preparePoseResolution>,
  ): IPelvis {
    const { yaw, pivots }: Pick<IPelvis, "yaw" | "pivots"> = turn(planned, feet);
    return {
      yaw,
      pivots,
      hips: hipJoints(
        body,
        root,
        resolveHumanPosture.heading({ yaw, pitch: 0, roll: 0 }),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States heading/pivot units and the scheduled-foot dependency; root and pelvis-joint angles cannot affect this orientation decision.
   * @evidence contracts/development/implementation.md#principled-implementation Applies each claiming foot's original weighted hip-twist band, heel-rise pivot share and two-band gap rule in the same left/right order as pelvis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One orientation owner serves full pelvis placement and contact-window pivot reads, separating the later hip FK that only full placement consumes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every heading/pitch, weight, strict comparison, wrap, twist and heel-rise coefficient; no contact sample or bound changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work for two feet; pivot-only contact sampling omits unread root-path evaluation, pelvic-angle trigonometry and hip FK while retaining all actual stance samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Full placement and pivot-only reading share this exact formula owner; every distinct scheduled-foot pair is actually evaluated and no completed orientation is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns only two local bands and one fresh pivot record per call; no body, pose, query history or external resource is retained.
   */
  export function turn(
    planned: number,
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
  ): Pick<IPelvis, "yaw" | "pivots"> {
    const pivots: Record<"left" | "right", number> = { left: 0, right: 0 };
    let yaw: number = planned;
    // Each claiming foot's band: its pivoted heading, near the planned one,
    // give or take `TWIST` over its claim.
    type IBand = { centre: number; half: number };
    const bands: IBand[] = [];
    for (const side of SIDES) {
      const w: number = weight(feet[side]);
      if (w <= 0) continue;
      const rotation: IAutoMovieQuaternion = feet[side].placement.rotation;
      const direction: ReturnType<typeof HumanFoot.headingPitch> = HumanFoot.headingPitch(rotation);
      const heading: number = direction.heading;
      const off: number = wrapDegrees(planned - heading);
      const excess: number =
        Math.abs(off) > TWIST ? off - Math.sign(off) * TWIST : 0;
      pivots[side] =
        excess * Math.min(1, Math.max(0, -direction.pitch / HEEL_UP));
      bands.push({
        centre: planned + wrapDegrees(heading + pivots[side] - planned),
        half: TWIST / w,
      });
      const turned: number = wrapDegrees(yaw - (heading + pivots[side]));
      if (Math.abs(turned) > TWIST / w)
        yaw -= turned - (Math.sign(turned) * TWIST) / w;
    }
    // Feet further apart than their bands, as in a stepping turn, hold the
    // pelvis in the gap between the bands, at the planned heading as near as
    // the gap allows, so the pelvis turns on with the plan as the claims pass
    // from one foot to the other.
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
   * Settle the pelvis against the stances.
   *
   * @param body The body.
   * @param root The unconstrained root, world metres.
   * @param planned The unconstrained heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot as scheduled.
   * @param claims The lowering a foot claims in place of its faded stance's,
   *   metres.
   * @param rocker The room under which a stance's heel begins to rise,
   *   degrees; `walkLeg.ROCKER` when absent. A gait gives less while it
   *   starts and stops: a foot that is not stepping keeps its heel down until
   *   its ankle can bend no further.
   * @param resolution Optional exact FK loan from this synchronous person observation; only the actual hip read borrows it.
   * @returns The pelvis and each stance as reached.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States frames, units, claim replacement, rocker onset and both returned stances.
   * @evidence contracts/development/implementation.md#principled-implementation Solves the smooth maximum's fixed point by a bracketed root with every taking foot's whole claim, once for each set of fading feet kept or left out, and runs between those lowerings by the feet's weights (multilinear), so the lowering is continuous in a weight: a weight inside the fixed point is ill-posed where a stance trades heel rise for lowering at a slope of one. Only stances whose claims read their ankles participate in trial placement, and deferred endpoints fit at that same final root when read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Pelvis orientation and fixed weights precede trial placement, the scalar root solve and final endpoint completion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the claim of a whole stance, the bracket expansion, the root tolerance and the foot ranges; a weight of one or none gives the single lowering it gave before, and inactive stances only skip trials whose residual cannot read them.
   * @evidence contracts/development/implementation.md#efficient-algorithms One root solve when no foot is fading, two with one fading foot and four with both; each root trial fits at most the bearing unnamed stances with a share in it; body-only short-reach preparation is lazy behind an actual unnamed bearing claim, so named/airborne-only claims omit it. Inactive final endpoints fit only if read, and the original root iteration bounds remain.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Stance weights and claim ownership remain fixed within one ground solve, so its root solves and their trials share them and the prepared stance readers without sharing across input postures.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned ground result owns two endpoint records and one deferred final-fit callback until the query releases it; no time history or global cache is retained.
   */
  export function ground(
    body: IHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
    claims: Readonly<Partial<Record<"left" | "right", number>>> = {},
    rocker: number = walkLeg.ROCKER,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IGround {
    const {
      yaw,
      pivots,
      hips: joints,
    }: IPelvis = pelvis(body, root, planned, hips, feet, resolution === undefined ? undefined : prepareHumanPoseResolution.read(resolution));
    const hip: (side: "left" | "right", drop: number) => IAutoMovieVector3 = (side: "left" | "right", drop: number): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = joints[side];
      return { x: p.x, y: p.y - drop, z: p.z };
    };
    const weights: Record<"left" | "right", number> = {
      left: weight(feet.left),
      right: weight(feet.right),
    };
    let short: ReturnType<typeof prepareShort> | undefined;
    const bearing: Record<"left" | "right", boolean> = {
      left: claims.left === undefined && weights.left > 0,
      right: claims.right === undefined && weights.right > 0,
    };
    let share: Record<"left" | "right", number> = { left: bearing.left ? 1 : 0, right: bearing.right ? 1 : 0 };
    const placed: IGround["feet"] = {} as IGround["feet"];
    const contacts: IGround["contacts"] = {} as IGround["contacts"];
    const readers: Partial<Record<"left" | "right", ReturnType<typeof walkReachStance.prepare>>> = {};
    const place: (drop: number, inactive?: boolean, requested?: "left" | "right") => void = (drop: number, inactive: boolean = false, requested?: "left" | "right"): void => {
      for (const side of SIDES) {
        if (requested !== undefined && side !== requested) continue;
        // A named swing claim, or a foot with no stance weight, does not
        // read its stance during the root solve. Place it only at the final
        // root, where the caller may need the returned endpoint.
        if (bearing[side] === inactive) continue;
        if (!inactive && !(share[side] > 0)) continue;
        const out: { end: walkFoot.IEnd; contact: IAutoMovieVector3 } =
          (readers[side] ??= walkReachStance.prepare(
            body,
            side,
            feet[side],
            yaw,
            pivots[side],
            rocker,
          ))(hip(side, drop));
        placed[side] = out.end;
        contacts[side] = out.contact;
      }
    };
    // A foot claims its stance's lowering, or `CLAIM` under none when it
    // has no share in the lowering being solved.
    const claim: (side: "left" | "right") => number = (side: "left" | "right"): number => {
      const named: number | undefined = claims[side];
      if (named !== undefined) return named;
      if (!(share[side] > 0)) return -CLAIM;
      if (short === undefined) short = prepareShort(body);
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
      let high: number = first;
      let over: number = asked(high) - high;
      for (let k: number = 0; k < 8 && over > 0; k++) {
        high *= 2;
        over = asked(high) - high;
      }
      const ends: ReadonlyMap<number, number> = new Map([
        [0, first],
        [high, over],
      ]);
      return over > 0
        ? high
        : bracketedRoot(
            (d: number): number => ends.get(d) ?? asked(d) - d,
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
    const fading: ("left" | "right")[] = SIDES.filter(
      (side: "left" | "right"): boolean => bearing[side] && weights[side] < 1,
    );
    let drop: number = 0;
    for (let mask: number = 0; mask < 1 << fading.length; mask++) {
      let part: number = 1;
      share = { left: bearing.left ? 1 : 0, right: bearing.right ? 1 : 0 };
      fading.forEach((side: "left" | "right", i: number): void => {
        const kept: boolean = (mask & (1 << i)) !== 0;
        share[side] = kept ? 1 : 0;
        part *= kept ? weights[side] : 1 - weights[side];
      });
      drop += part * settle();
    }
    share = { left: bearing.left ? 1 : 0, right: bearing.right ? 1 : 0 };
    place(drop);
    const completed: Pick<IGround, "feet" | "contacts"> = walkReachFeet(
      { feet: placed, contacts }, bearing, (side: "left" | "right"): void => place(drop, true, side),
    );
    return {
      yaw,
      root: { ...root, y: root.y - drop },
      hips: { left: hip("left", drop), right: hip("right", drop) },
      ...completed,
    };
  }
  /**
   * Hold a swinging foot inside its leg's ranges under a settled pelvis: the
   * ankle within reach and no further behind the hip than a thigh `EXTENSION`
   * degrees back and the knee's bend carry it (an ankle past that turns
   * forward onto that boundary at the same hip-to-ankle distance and knee
   * angle), the heading within `TWIST` of the pelvis, the pitch inside the
   * ankle's range, and neither toe nor heel
   * nearer the floor than the swing carried them.
   *
   * @param body The body.
   * @param side The foot.
   * @param settled The pelvis.
   * @param foot The swinging foot.
   * @param share The share of the swing, when the caller's stances may stand outside these ranges (a foot rolled onto its edge, a stance far behind the hip): the ranges then come in over the first `FADE` of the swing and go over its last, so the swing leaves and joins its stances where they stand. Held throughout when absent.
   * @returns The foot as reached.
   */
  export function swing(
    body: IHumanBody,
    side: "left" | "right",
    settled: IGround,
    foot: walkFoot.IFoot,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/side and the returned settled-pelvis, foot and optional-share reader.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the unchanged sphere/cone, hip/ankle and clearance rules to one prepared owner with this law's exact named bounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bound record and one prepared swing owner; raw swing delegates here too.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same knee, extension, side, twist and fade values govern raw and prepared paths, with every varying input evaluated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation per side; repeated reads retain the bounded solver work while sharing body-only reach and socket terms.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A reader is valid for the unchanged body and side only; no pelvis, foot or share result is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning action releases one reader per used side with its plan, without growing query history.
   */
  export function prepareSwing(
    body: IHumanBody,
    side: "left" | "right",
  ): ReturnType<typeof prepareWalkReachSwing> {
    return prepareWalkReachSwing(body, side, {
      knee: KNEE, extension: EXTENSION, side: SIDE, twist: TWIST, fade: FADE,
    });
  }
  /** Both feet. */
  export const SIDES: readonly ["left", "right"] = ["left", "right"];

  /** The width, metres, to which the root's lowering is solved: a nanometre, under which its error adds less than a micrometre per second to a rate read over a frame. */
  const FINE: number = 1e-9;

  /** The largest extension, degrees, of a leg's thigh, swinging or planted, 2° inside the hip's 30° extension (DEFAULT_HUMANOID_ROM); the ankle trails further by the knee's bend. */
  export const EXTENSION: number = 28;

  /** The furthest a swinging leg's line leans to the side of its foot, degrees: the ankle's 25° of inversion and eversion (DEFAULT_HUMANOID_ROM), the same bound a stance stands inside, so a swing joins its stances where they are. */
  const SIDE: number = walkReachStance.SIDE;

  /** The least knee flexion of a planted or reaching leg, degrees (provisional): a walking knee never locks straight. */
  const KNEE: number = 10;

  /** The common hip heading limit from a ROM table, degrees (`walkHipTwist`); a missing hip twist is refused. */
  export const hipTwist: typeof walkHipTwist = walkHipTwist;

  /** The largest heading, degrees, a foot may keep from the pelvis: the hip's own internal and external rotation (DEFAULT_HUMANOID_ROM, 45° either way, `hipTwist`); a turn that asks more is taken by spinning on the ball of the foot (a spin turn, Hase and Stein 1999). */
  export const TWIST: number = hipTwist(DEFAULT_HUMANOID_ROM);

  /** Pitch, degrees toes-down, at which a planted foot's heel is far enough up to take the whole pivot turn on its toe pad (provisional). */
  const HEEL_UP: number = 30;
}
