import { AutoMovieEngineGravity, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
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

import { walk } from "../../gait/internal/walk";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanWater } from "../../perform/internal/HumanWater";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { shankTilt } from "./shankTilt";
import { unloadedFoot } from "./unloadedFoot";
import { HumanMediumWalkData } from "./HumanMediumWalkData";

/*
 * Walk through a medium or into a wind: the walk (`walk`) at the speed the
 * medium allows, with the feet, arms and trunk adapted to it.
 *
 * In water the walk slows as the immersed body's quadratic drag
 * (`HumanWater.sum`) rises with depth, calibrated so that water 1.2 m deep
 * gives the measured 40 % slower walk, and the arms rise above the surface at
 * hip depth or deeper. Water deeper than the chest is refused: the body swims
 * there. In snow, sand or mud, a layer as deep as the medium's depth over the
 * firm ground, each stance sole sinks through the layer to the ground and each
 * swing lifts clear of its surface; the speed follows the terrain factor of the
 * walking-energy equation at equal metabolic power, `1/sqrt(eta)`, and a foot
 * stuck in mud halts the walk for the authored delay at each toe-off while it
 * is pulled free. A steady wind leans the body into it until gravity's moment
 * about the ankles balances the wind's, `tan(lean) = F / (m g)`; a wind beyond
 * what the feet's half length can bear is refused, for a gust the existing
 * perturbation's capture step answers. With neither medium nor wind this is the
 * walk unchanged.
 * Parameter context: The standing entry, the path, the medium and the wind.
 * Returns: The adapted walk.
 * For water above the chest, a sinking deeper than the
 * shank, or a wind beyond static balance.
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
  if (medium !== undefined) HumanMediumWalk.admitDepth(medium, body.measure);
  if (medium?.kind === "water") {
    pace = wading(body, context.entry.pose, ground, depth);
  } else if (medium !== undefined) {
    sink = depth;
    const eta: number =
      medium.kind === "snow"
        ? 1 + HumanMediumWalkData.SNOW_PER_METRE * depth
        : HumanMediumWalkData.TERRAIN[medium.kind];
    pace = 1 / Math.sqrt(eta);
  }
  const hold: number = medium?.kind === "mud" ? (medium.hold ?? 0) : 0;
  HumanBound.within("medium.hold", hold, 0, 2, "s");

  // The wind's lean: gravity's moment about the ankles balances the wind's.
  const weight: number = body.profile.mass * AutoMovieEngineGravity.STANDARD;
  const push: IAutoMovieVector3 =
    wind === undefined ? { x: 0, y: 0, z: 0 } : { ...wind, y: 0 };
  const force: number = AutoMovieEngineVector3.length(push);
  const limit: number =
    (weight * body.measure.footLength) / 2 / body.measure.hipHeight;
  if (force > limit)
    throw new AutoMovieMotionHumanRefusal({
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
    force === 0 ? { x: 0, y: 0, z: 0 } : AutoMovieEngineVector3.scale(push, -1 / force);

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
      }),
    ),
    posture: (at: number): Posture => {
      const time: number = walkTime(at);
      const posture: Posture = walked.posture(time);
      const share: number = time / walked.duration;
      const limbs: Posture["limbs"] = { ...posture.limbs };
      const facing: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.fromAxisAngle(HumanMediumWalkData.UP, posture.yaw),
        { x: 0, y: 0, z: 1 },
      );
      const left: IAutoMovieVector3 = AutoMovieEngineVector3.cross(HumanMediumWalkData.UP, facing);
      const pelvis: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        posture.root,
        // As the wind leans the body.
        AutoMovieEngineQuaternion.rotateVector(
          humanPostureHeading({
            ...posture,
            pitch:
              posture.pitch +
              (lean / AutoMovieEngineQuaternion.DEG2RAD) * AutoMovieEngineVector3.dot(into, facing),
            roll:
              posture.roll -
              (lean / AutoMovieEngineQuaternion.DEG2RAD) *
                AutoMovieEngineVector3.dot(into, AutoMovieEngineVector3.cross(HumanMediumWalkData.UP, facing)),
          }),
          body.rest.get("hips")!,
        ),
      );
      for (const side of ["left", "right"] as const) {
        const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
        if (goal === undefined) continue;
        const swing: number = sink === 0 ? 0 : swingShare(windows[side], share);
        const rise: number = (sink + HumanMediumWalkData.CLEARANCE) * Math.sin(Math.PI * swing);
        const point: IAutoMovieVector3 = {
          ...goal.point,
          y: goal.point.y + rise,
        };
        // The lifted foot turns with its shank, so the ankle keeps its angle.
        const hip: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          pelvis,
          AutoMovieEngineVector3.scale(
            left,
            (side === "left" ? 1 : -1) * body.measure.hipHalfWidth,
          ),
        );
        const tilt: number =
          shankTilt(body, hip, point, facing) -
          shankTilt(body, hip, goal.point, facing);
        const lifted: IAutoMovieHumanLimbGoal = {
          ...goal,
          point,
          bend: { ...goal.bend, y: goal.bend.y + rise },
          ...(goal.rotation === undefined
            ? {}
            : {
                rotation: AutoMovieEngineQuaternion.multiply(
                  AutoMovieEngineQuaternion.fromAxisAngle(left, tilt),
                  goal.rotation,
                ),
              }),
        };
        // A foot no plant holds bears nothing: its ankle stays within
        // what a weightless ankle reaches.
        const bearing: boolean = windows[side].some(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            share >= window.from && share <= window.to,
        );
        // Eased over `EASE` seconds from each plant's edge, so the foot
        // turns into and out of its plants without a jump.
        const edge: number = Math.min(
          ...windows[side].map(
            (window: IAutoMovieMotionHumanContactWindow): number =>
              Math.min(
                Math.abs(share - window.from),
                Math.abs(share - window.to),
              ),
          ),
        );
        limbs[`${side}Leg`] = bearing
          ? lifted
          : unloadedFoot(
              body,
              hip,
              lifted,
              Math.min(1, (edge * walked.duration) / HumanMediumWalkData.EASE),
            );
      }
      if (
        medium?.kind === "water" &&
        surface >= ground + body.measure.hipHeight
      )
        for (const side of ["left", "right"] as const) {
          const out: number =
            (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth;
          const across: IAutoMovieVector3 = AutoMovieEngineVector3.cross(HumanMediumWalkData.UP, facing);
          // Held forward of the chest the trunk's wading lean carries
          // forward at the hands' height, clear of it by an upper arm.
          const hips: number = posture.root.y + body.rest.get("hips")!.y;
          const ahead: number =
            body.measure.chestDepth / 2 +
            body.measure.upperArm +
            Math.max(0, surface + HumanMediumWalkData.ARMS_ABOVE - hips) *
              Math.tan(HumanMediumWalkData.WADE_LEAN * AutoMovieEngineQuaternion.DEG2RAD);
          const hand: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            AutoMovieEngineVector3.add(posture.root, AutoMovieEngineVector3.scale(facing, ahead)),
            AutoMovieEngineVector3.scale(across, 1.5 * out),
          );
          limbs[`${side}Arm`] = {
            point: { ...hand, y: surface + HumanMediumWalkData.ARMS_ABOVE },
            bend: {
              ...AutoMovieEngineVector3.add(hand, AutoMovieEngineVector3.scale(across, out)),
              y: surface + HumanMediumWalkData.ARMS_ABOVE,
            },
          };
        }
      // Wading bends the trunk forward over the hips; the wind leans the
      // whole body about its feet, which the root's turn about the
      // skeleton's origin on the ground gives.
      const spine: readonly [number, number, number] = posture.joints.spine ?? [
        0, 0, 0,
      ];
      const windward: number = lean / AutoMovieEngineQuaternion.DEG2RAD;
      const joints: Posture["joints"] = { ...posture.joints };
      if (medium?.kind === "water")
        joints.spine = [spine[0] + HumanMediumWalkData.WADE_LEAN, spine[1], spine[2]];
      // The arm on the windward side, which the lean brings in over its
      // thigh, abducts by the lean, so it hangs plumb clear of the leg.
      if (force > 0)
        for (const side of ["left", "right"] as const) {
          const arm: readonly [number, number, number] | undefined =
            joints[`${side}UpperArm`];
          if (arm === undefined) continue;
          const outward: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
            AutoMovieEngineVector3.cross(HumanMediumWalkData.UP, facing),
            side === "left" ? 1 : -1,
          );
          joints[`${side}UpperArm`] = [
            arm[0],
            arm[1] + windward * Math.max(0, AutoMovieEngineVector3.dot(outward, into)),
            arm[2],
          ];
        }
      return {
        ...posture,
        joints,
        pitch: posture.pitch + windward * AutoMovieEngineVector3.dot(into, facing),
        roll:
          posture.roll -
          windward * AutoMovieEngineVector3.dot(into, AutoMovieEngineVector3.cross(HumanMediumWalkData.UP, facing)),
        limbs,
      };
    },
  };
}
/*
 * Depth admission for a medium that the walk can still cross on foot.
 */
export namespace HumanMediumWalk {
  /*
   * The two anatomical depths that limit the admitted media.
   */
  export type IMeasure = Pick<
    IAutoMovieMotionHumanBody["measure"],
    "chestHeight" | "shank"
  >;

  /*
   * Water is positive up to the chest. A solid layer extends up to the shank.
   */
  export function admitDepth(
    medium: NonNullable<Params["medium"]>,
    measure: IMeasure,
  ): void {
    const { depth } = medium;
    if (medium.kind !== "water") {
      HumanBound.within("medium.depth", depth, 0, measure.shank, "m");
      return;
    }
    if (!(depth > 0 && depth <= measure.chestHeight))
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "medium.depth",
        value: depth,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: measure.chestHeight,
          unit: "m",
        },
        reason: "water deeper than the chest is swum, not waded",
        fix: "swim (HumanWater) or wade shallower water",
      });
  }
}

/*
 * The walking speed share in water of a depth: quadratic drag calibrated on the
 * 1.2 m measurement.
 */
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
    AutoMovieEngineVector3.length(
      HumanWater.sum(body, bones, unit, { surface: ground + level }).drag,
    );
  const here: number = drag(depth);
  if (here === 0) return 1;
  return Math.min(1, HumanMediumWalkData.WADE_SHARE * Math.sqrt(drag(HumanMediumWalkData.WADE_DEPTH) / here));
}

/*
 * How far through its swing a foot is at a share of the walk: 0 while it is
 * planted, rising to 1 at the next plant.
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

type Params = IAutoMovieMotionHumanMedium.IWalkParams;

type Plan = IAutoMovieMotionHumanActionPlan;

type Posture = IAutoMovieMotionHumanPosture;
