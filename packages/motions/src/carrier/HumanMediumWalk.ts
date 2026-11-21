import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMedium,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanWater } from "../perform/HumanWater";
import { poseBones } from "../posture/poseBones";

type Params = IAutoMovieMotionHumanMedium.IWalkParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The wading measurement: walking speed in water 1.2 m deep, as a share of the land speed (Fantozzi et al. 2015, https://pmc.ncbi.nlm.nih.gov/articles/PMC4569370/: 40 % slower). */
const WADE_SHARE: number = 0.6;

/** The water depth of that measurement, metres. */
const WADE_DEPTH: number = 1.2;

/** How far a swinging foot clears the medium's surface, metres (provisional staging). */
const CLEARANCE: number = 0.05;

/** Hands held above the water's surface at hip depth or deeper, metres (provisional staging). */
const ARMS_ABOVE: number = 0.15;

/** The trunk's forward lean while wading, degrees (provisional staging). */
const WADE_LEAN: number = 10;

/**
 * Terrain factors of the walking-energy equation (Pandolf, Givoni and
 * Goldman 1977, after Soule and Goldman 1972): loose sand 2.1 and a
 * swampy bog, taken for mud, 1.8. Soft snow's factor rises with depth;
 * 1.3 a decimetre of sinking is a provisional reading.
 */
const TERRAIN: Readonly<Record<"sand" | "mud", number>> = {
  sand: 2.1,
  mud: 1.8,
};

/** Soft snow's terrain factor per metre of sinking (provisional). */
const SNOW_PER_METRE: number = 13;

/**
 * Walk through a medium or into a wind: the walk (`walk`) at the speed the
 * medium allows, with the feet, arms and trunk adapted to it.
 *
 * In water the walk slows as the immersed body's quadratic drag
 * (`HumanWater.sum`) rises with depth, calibrated so that water 1.2 m deep
 * gives the measured 40 % slower walk, and the arms rise above the surface
 * at hip depth or deeper. Water deeper than the chest is refused: the body
 * swims there. In snow, sand or mud each stance sole sinks to the medium's
 * depth and each swing clears its surface; the speed follows the terrain
 * factor of the walking-energy equation at equal metabolic power,
 * `1/sqrt(eta)`, and a foot stuck in mud halts the walk for the authored
 * delay at each toe-off while it is pulled free. A steady wind leans the body into it until gravity's
 * moment about the ankles balances the wind's, `tan(lean) = F / (m g)`; a
 * wind beyond what the feet's half length can bear is refused, for a gust
 * the existing perturbation's capture step answers. With neither medium
 * nor wind this is the walk unchanged.
 *
 * @param context The standing entry, the path, the medium and the wind.
 * @returns The adapted walk.
 * @throws {HumanRefusal} For water above the chest, a sinking deeper than the shank, or a wind beyond static balance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each medium's rule, its source and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The water speed scales with the drag ratio by quadratic drag; the yielding speed with the energy equation's terrain factor; the wind lean with the static moment balance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the medium and wind, choose the speed, plan the walk, then adapt each sample.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The clearance, arm height, wading lean and snow factor are named provisional values; the speeds follow measured or derived rules.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two drag sums at most once; each sample scans the foot's few plant windows.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the walk and the immersed body's drag model.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the walk plan and the plant windows for the action.
 */
export function HumanMediumWalk(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const { to, via, medium, wind }: Params = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const plan = (pace: number): Plan =>
    walk.plan({
      ...context,
      params: {
        to,
        ...(via === undefined ? {} : { via }),
        ...(pace < 1 ? { manner: { pace } } : {}),
      },
    });
  if (medium === undefined && wind === undefined) return plan(1);

  const ground: number =
    (context.entry.feet.left.ankle.y + context.entry.feet.right.ankle.y) / 2 -
    body.measure.ankleHeight;
  const depth: number = medium?.depth ?? 0;
  let pace: number = 1;
  let sink: number = 0;
  if (medium?.kind === "water") {
    if (!(depth > 0 && depth <= body.measure.chestHeight))
      throw new HumanRefusal({
        kind: "reach",
        axis: "medium.depth",
        value: depth,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: body.measure.chestHeight,
          unit: "m",
        },
        reason: "water deeper than the chest is swum, not waded",
        fix: "swim (HumanWater) or wade shallower water",
      });
    pace = wading(body, context.entry.pose, ground, depth);
  } else if (medium !== undefined) {
    HumanBound.within("medium.depth", depth, 0, body.measure.shank, "m");
    sink = depth;
    const eta: number =
      medium.kind === "snow"
        ? 1 + SNOW_PER_METRE * depth
        : TERRAIN[medium.kind];
    pace = 1 / Math.sqrt(eta);
  }
  const hold: number = medium?.kind === "mud" ? (medium.hold ?? 0) : 0;
  HumanBound.within("medium.hold", hold, 0, 2, "s");

  // The wind's lean: gravity's moment about the ankles balances the wind's.
  const weight: number = body.profile.mass * AutoMovieGravity.STANDARD;
  const push: IAutoMovieVector3 =
    wind === undefined ? { x: 0, y: 0, z: 0 } : { ...wind, y: 0 };
  const force: number = Vector3.length(push);
  const limit: number =
    (weight * body.measure.footLength) / 2 / body.measure.hipHeight;
  if (force > limit)
    throw new HumanRefusal({
      kind: "base",
      axis: "wind",
      value: force,
      feasible: { kind: "range", minimum: 0, maximum: limit, unit: "N" },
      reason:
        "a steady wind this strong moves the pressure centre past the toes",
      fix: "stage it as a gust answered by a perturbation's capture step",
    });
  const lean: number = Math.atan(force / weight);
  const into: IAutoMovieVector3 =
    force === 0 ? { x: 0, y: 0, z: 0 } : Vector3.scale(push, -1 / force);

  const walked: Plan = plan(pace);
  const windows: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanContactWindow[]
  > = {
    left: [],
    right: [],
  };
  for (const window of walked.contacts)
    if (
      window.kind === "plant" &&
      (window.part === "leftFoot" || window.part === "rightFoot")
    )
      windows[window.part === "leftFoot" ? "left" : "right"].push(window);
  const surface: number = ground + depth;

  // A foot stuck in mud halts the walk for the hold at each toe-off while it
  // is pulled free: the walk's own clock pauses there, so both feet stay
  // where they are and the body waits.
  const offs: number[] = (hold === 0 ? [] : [...windows.left, ...windows.right])
    .map(
      (window: IAutoMovieMotionHumanContactWindow): number =>
        window.to * walked.duration,
    )
    .filter((off: number): boolean => off < walked.duration - 1e-9)
    .sort((a: number, b: number): number => a - b);
  const duration: number = walked.duration + offs.length * hold;
  const walkTime = (at: number): number => {
    let paused: number = 0;
    for (const off of offs) {
      if (at <= off + paused) break;
      if (at <= off + paused + hold) return off;
      paused += hold;
    }
    return at - paused;
  };
  const filmTime = (time: number, leaving: boolean): number => {
    let paused: number = 0;
    for (const off of offs)
      if (off < time || (leaving && off === time)) paused += hold;
    return time + paused;
  };
  return {
    ...walked,
    duration,
    events: walked.events.map(
      (event: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
        ...event,
        share: filmTime(event.share * walked.duration, false) / duration,
      }),
    ),
    contacts: walked.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => ({
        ...window,
        from: filmTime(window.from * walked.duration, false) / duration,
        to: filmTime(window.to * walked.duration, true) / duration,
        ...(sink > 0 &&
        window.kind === "plant" &&
        window.support.kind === "ground"
          ? { support: { kind: "ground", height: ground - sink } }
          : {}),
      }),
    ),
    posture: (at: number): Posture => {
      const time: number = walkTime(at);
      const posture: Posture = walked.posture(time);
      const share: number = time / walked.duration;
      const limbs: Posture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const) {
        const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
        if (goal === undefined || sink === 0) continue;
        const swing: number = swingShare(windows[side], share);
        const rise: number =
          -sink + (sink + CLEARANCE) * Math.sin(Math.PI * swing);
        limbs[`${side}Leg`] = {
          ...goal,
          point: { ...goal.point, y: goal.point.y + rise },
          bend: { ...goal.bend, y: goal.bend.y + rise },
        };
      }
      const facing: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle(UP, posture.yaw),
        { x: 0, y: 0, z: 1 },
      );
      if (
        medium?.kind === "water" &&
        surface >= ground + body.measure.hipHeight
      )
        for (const side of ["left", "right"] as const) {
          const out: number =
            (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth;
          const across: IAutoMovieVector3 = Vector3.cross(UP, facing);
          const hand: IAutoMovieVector3 = Vector3.add(
            Vector3.add(
              posture.root,
              Vector3.scale(facing, body.measure.upperArm),
            ),
            Vector3.scale(across, 1.5 * out),
          );
          limbs[`${side}Arm`] = {
            point: { ...hand, y: surface + ARMS_ABOVE },
            bend: {
              ...Vector3.add(hand, Vector3.scale(across, out)),
              y: surface + ARMS_ABOVE,
            },
          };
        }
      const wading: number = medium?.kind === "water" ? WADE_LEAN : 0;
      const windward: number = lean / Quaternion.DEG2RAD;
      return {
        ...posture,
        root: Vector3.add(
          { ...posture.root, y: posture.root.y - sink },
          Vector3.scale(into, body.measure.hipHeight * Math.tan(lean)),
        ),
        pitch: posture.pitch + wading + windward * Vector3.dot(into, facing),
        roll:
          posture.roll -
          windward * Vector3.dot(into, Vector3.cross(UP, facing)),
        limbs,
      };
    },
  };
}

/** The walking speed share in water of a depth: quadratic drag calibrated on the 1.2 m measurement. */
function wading(
  body: IAutoMovieMotionHumanBody,
  pose: Parameters<typeof poseBones>[1],
  ground: number,
  depth: number,
): number {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    pose,
  );
  const unit: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const drag = (level: number): number =>
    Vector3.length(
      HumanWater.sum(body, bones, unit, { surface: ground + level }).drag,
    );
  const here: number = drag(depth);
  if (here === 0) return 1;
  return Math.min(1, WADE_SHARE * Math.sqrt(drag(WADE_DEPTH) / here));
}

/**
 * How far through its swing a foot is at a share of the walk: 0 while it
 * is planted, rising to 1 at the next plant.
 */
function swingShare(
  windows: readonly IAutoMovieMotionHumanContactWindow[],
  share: number,
): number {
  for (let k: number = 0; k + 1 < windows.length; ++k) {
    const off: number = windows[k]!.to;
    const on: number = windows[k + 1]!.from;
    if (share > off && share < on) return (share - off) / (on - off);
  }
  return 0;
}
