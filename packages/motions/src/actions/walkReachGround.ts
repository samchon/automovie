import { bracketedRoot, smoothMinimum } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import { walkReach } from "./walkReach";
import { walkReachFeet } from "./walkReachFeet";
import { walkReachStance } from "./walkReachStance";

/** What a stance's reading returns: its foot as reached and its contact point. */
type IGroundRead = {
  end: walkFoot.IEnd;
  contact: IAutoMovieVector3;
  pitch: number;
};

/** The settled members the feet complete. */
type GroundCompleted = "feet" | "contacts";

/** A pelvis tilted from upright: its world rotation and the hips it carries. */
type IGroundTilt = {
  rotation: IAutoMovieQuaternion;
  hips: Record<AutoMovieHumanSide, IAutoMovieVector3>;
};
/**
 * The width, metres, to which the root's lowering is solved: a nanometre, under
 * which its error adds less than a micrometre per second to a rate read over a
 * frame.
 */
const FINE: number = 1e-9;

/**
 * A cap on the doublings of the root's bracket past the first claim, a guard
 * and not a tolerance: claims that do not rise as the hips lower never enter
 * the loop (see `ground`), and 2⁸ = 256 times the first claim bounds the
 * guard's cost; a claim still over its lowering after them takes the bracket's
 * end as its lowering.
 */
const DOUBLINGS: number = 8;

/**
 * Settle the pelvis against the stances (`walkReach`): lower the root until
 * every bearing stance's claim on it is met, each stance held by
 * `walkReachStance`.
 *
 * @param body The body.
 * @param root The unconstrained root, world metres.
 * @param planned The pelvis turned toward this stance (`pelvis`).
 * @param feet Each foot as scheduled.
 * @param claims The lowering a foot claims in place of its faded stance's,
 *   metres.
 * @param rocker The room under which a stance's heel begins to rise, degrees;
 *   `walkLeg.ROCKER` when absent. A gait gives less while it starts and stops:
 *   a foot that is not stepping keeps its heel down until its ankle can bend no
 *   further.
 * @param tilt The pelvis's tilt from upright under its settled heading, given
 *   the unlowered root, that heading and the upright hip joints
 *   (`walkReachHeld.tilt`): its world rotation and the hip joints it carries. A
 *   caller that shows the pelvis tilted (a trunk tipped about the hips) gives
 *   it, so the lowering is settled on the hip joints as shown; upright when
 *   absent.
 * @param dorsal Each planted foot's dorsal limit, degrees, by the weight it
 *   bears (`walkLeg.dorsal`); an unloaded foot's for a side absent.
 * @param step The hip's largest vertical step a frame of the caller's planned
 *   course, metres, which eases each leg's reach over a soft band
 *   (`walkReachShort.prepare`); a hard reach when absent.
 * @param solved The root's lowering already solved for this instant in
 *   preparation, metres; the stances are then placed under it with no root
 *   search. Solved here when absent.
 * @param pitches Each foot's pitch its stance rule reached at this instant,
 *   solved in preparation (`IGround.pitches`); a foot is then placed at it with
 *   no search. Solved here for a side absent.
 * @returns The pelvis and each stance as reached.
 */
export function walkReachGround(
  body: IAutoMovieMotionHumanBody,
  root: IAutoMovieVector3,
  planned: walkReach.IPelvis,
  feet: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>
  >,
  claims: Readonly<Partial<Record<AutoMovieHumanSide, number>>> = {},
  rocker: number = walkLeg.ROCKER,
  tilt?: (
    root: IAutoMovieVector3,
    yaw: number,
    joints: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
  ) => IGroundTilt,
  dorsal: Readonly<Partial<Record<AutoMovieHumanSide, number>>> = {},
  step?: number,
  solved?: number,
  pitches: Readonly<Partial<Record<AutoMovieHumanSide, number>>> = {},
): walkReach.IGround {
  const { yaw, pivots, hips: upright }: walkReach.IPelvis = planned;

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
    left: walkReach.weight(feet.left),
    right: walkReach.weight(feet.right),
  };
  let short: ReturnType<typeof walkReach.prepareShort> | undefined;
  const bearing: Record<AutoMovieHumanSide, boolean> = {
    left: claims.left === undefined && weights.left > 0,
    right: claims.right === undefined && weights.right > 0,
  };
  let share: Record<AutoMovieHumanSide, number> = {
    left: bearing.left ? 1 : 0,
    right: bearing.right ? 1 : 0,
  };
  const placed: walkReach.IGround["feet"] = {} as walkReach.IGround["feet"];
  const contacts: walkReach.IGround["contacts"] =
    {} as walkReach.IGround["contacts"];
  const reached: walkReach.IGround["pitches"] = { left: 0, right: 0 };
  // Each stance's reader, prepared once for this solve.
  const readers: Record<
    AutoMovieHumanSide,
    ReturnType<typeof walkReachStance.prepare>
  > = {
    left: walkReachStance.prepare(
      body,
      "left",
      feet.left,
      yaw,
      pivots.left,
      rocker,
      dorsal.left,
    ),
    right: walkReachStance.prepare(
      body,
      "right",
      feet.right,
      yaw,
      pivots.right,
      rocker,
      dorsal.right,
    ),
  };
  const read: Record<AutoMovieHumanSide, Map<number, IGroundRead>> = {
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
    for (const side of walkReach.SIDES) {
      if (requested !== undefined && side !== requested) continue;
      // A named swing claim, or a foot with no stance weight, does not
      // read its stance during the root solve. Place it only at the final
      // root, where the caller may need the returned endpoint.
      if (bearing[side] === inactive) continue;
      if (!inactive && !(share[side] > 0)) continue;
      // A bearing stance's reading is its hip's alone, so a lowering asked again (drop 0 under each fading mask) takes it.
      const known: IGroundRead | undefined = inactive
        ? undefined
        : read[side].get(drop);
      const out: IGroundRead =
        known ?? readers[side](hip(side, drop), pitches[side]);
      if (!inactive && known === undefined) read[side].set(drop, out);
      placed[side] = out.end;
      contacts[side] = out.contact;
      reached[side] = out.pitch;
    }
  };
  // A foot claims its stance's lowering, or `walkReach.CLAIM` under none when it
  // has no share in the lowering being solved.
  const claim: (side: AutoMovieHumanSide) => number = (
    side: AutoMovieHumanSide,
  ): number => {
    const named: number | undefined = claims[side];
    if (named !== undefined) return named;
    if (!(share[side] > 0)) return -walkReach.CLAIM;
    if (short === undefined) short = walkReach.prepareShort(body, step);
    return short(joints[side], placed[side].ankle);
  };
  const lowering: () => number = (): number =>
    -smoothMinimum(
      smoothMinimum(-claim("left"), -claim("right"), walkReach.CLAIM),
      0,
      walkReach.CLAIM,
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
  const fading: AutoMovieHumanSide[] = walkReach.SIDES.filter(
    (side: AutoMovieHumanSide): boolean => bearing[side] && weights[side] < 1,
  );
  let drop: number = solved ?? 0;
  if (solved === undefined)
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
  const completed: Pick<walkReach.IGround, GroundCompleted> = walkReachFeet(
    { feet: placed, contacts },
    bearing,
    (side: AutoMovieHumanSide): void => place(drop, true, side),
  );
  return {
    yaw,
    root: { ...root, y: root.y - drop },
    hips: { left: hip("left", drop), right: hip("right", drop) },
    ...completed,
    // A foot that bears nothing is placed only when it is read
    // (`walkReachFeet`), and its pitch with it.
    pitches: {
      get left(): number {
        void completed.feet.left;
        return reached.left;
      },
      get right(): number {
        void completed.feet.right;
        return reached.right;
      },
    },
    ...(tilted === undefined ? {} : { pelvis: tilted.rotation }),
  };
}
