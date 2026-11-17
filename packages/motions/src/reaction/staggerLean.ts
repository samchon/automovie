import {
  type IAutoMovieResolvedBone,
  Vector3,
  minimumJerk,
  physicalInertiaTensor,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { walkReach } from "../actions/walkReach";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFrame } from "../posture/HumanFrame";
import { staggerBounds } from "./staggerBounds";

/**
 * A stagger's trunk and the root that carries it, as prepared curves of the
 * recovery's courses (`staggerRecover`).
 *
 * The trunk answers only the part of the extrapolated centre of mass's
 * lead the base cannot hold, `delta = |xi - p|` with `p` the centre of
 * pressure as near `xi` as the bearing feet reach (the pendulum's own rule).
 * The balance equation with the body's angular momentum, `m z x'' = m g (p -
 * x) - H'` (Hof 2007, J Biomech 40:451, as restated by van den Bogaart et
 * al. 2019, Eqn 1), integrated over a rest-to-rest rotation of the upper body
 * by `dtheta` about the hips, shifts the extrapolated centre of mass by `J
 * dtheta / (m z)`, the short-lunge limit of Koolen et al.'s reaction mass
 * (2012, Int J Robot Res 31:1094, eqs. 30, 38, 41); so the rotation that
 * answers `delta` is `dtheta = delta m z / J`, `m` the body's mass, `z` the
 * pendulum's length (`staggerBounds.PENDULUM` hip heights) and `J` the
 * upper body's moment of inertia about the hips, read from the body's own
 * mass model (`resolveAutoMovieMomentum.pose`, `physicalInertiaTensor`) on
 * the entry posture about the axis of each tilt. A forward flexion of the
 * trunk accelerates the centre of mass backward (van den Bogaart et al.
 * 2019), so the trunk turns toward the fall, along `xi - p`: forward for a
 * push from behind, as Koolen's model lunges toward the capture point. It is
 * bounded by the hip's extension (`walkReach.EXTENSION`), the tighter of the
 * hip's sagittal limits, read at `KNOTS` a second and interpolated so the
 * rotation runs on from sample to sample, and eased in from the measured
 * reaction over the weight shift (`staggerBounds.REACTION`, `TRANSFER`), so
 * it starts from the entry's upright trunk; `delta` vanishes once the base
 * holds the extrapolated centre of mass, so the trunk rights as it settles.
 *
 * The root carries the centre of mass on its course less the shift the
 * trunk's tilt makes of it, the measured shift per sine of pitch and roll
 * (`staggerKnots.bending`).
 *
 * @param body The body.
 * @param entry The posture the push meets.
 * @param walk The centre of mass's travel, the centre of pressure and the extrapolated centre of mass on the floor and the entry's centre of mass, world metres, at seconds since the action's start.
 * @param bend The centre of mass's shift per sine of the trunk's pitch and roll, metres.
 * @returns The trunk's tilt, degrees, the upright root before any lowering, world metres, and the reaction's eased share from the entry, at a second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its derivation and sources, the direction and why, the bound, the sampling and onset, and the root's compensation.
 * @evidence contracts/development/implementation.md#principled-implementation Hof's balance equation with angular momentum integrated over a rest-to-rest rotation gives dtheta = delta m z / J for the unheld part of the lead; J is the upper body's inertia about the hips from the body's own mass model; the source's sign (flexion accelerates the centre backward) puts the trunk toward the fall.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The inertia once from the entry, then per sample the unheld lead, the angle and its direction; per read an interpolation, the ease and the root's compensation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fitted coefficient: m, z and J are the body's, delta the pendulum's, the bound the hip's range.
 * @evidence contracts/development/implementation.md#efficient-algorithms One posed mass model and two tensor reads per plan, one course read per sample once, and constant work per read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The admission and the displayed feet read the same law, so the legs admitted are the legs shown; each sample is computed once and kept for its plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the courses, the shift vectors, its constants and at most one sample per `KNOTS` of the plan.
 */
export function staggerLean(
  body: IHumanActionContext["body"],
  entry: IHumanActionContext["entry"],
  walk: {
    course: (seconds: number) => IAutoMovieVector3;
    pressure: (seconds: number) => IAutoMovieVector3;
    extrapolated: (seconds: number) => IAutoMovieVector3;
    centre: IAutoMovieVector3;
  },
  bend: Record<"pitch" | "roll", IAutoMovieVector3>,
): (seconds: number) => {
  trunk: { pitch: number; roll: number };
  root: IAutoMovieVector3;
  ease: number;
} {
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
    { x: 0, y: 0, z: 1 },
  );
  const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  const onset: number = AutoMovieMotionHumanTiming.seconds(staggerBounds.REACTION);
  const rise: number = AutoMovieMotionHumanTiming.seconds(staggerBounds.TRANSFER);
  const rolling: number = Vector3.dot(bend.roll, across) < 0 ? -1 : 1;
  const root: IAutoMovieVector3 = entry.posture.root;

  // The upper body's inertia about the hips on the entry posture: every
  // mass part but the legs', about the middle of the two hip joints.
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = HumanTrunk.resolve(body, entry.posture);
  const posed: resolveAutoMovieMomentum.IPosed = resolveAutoMovieMomentum.pose(body.massModel, bones);
  const legs: RegExp = /(UpperLeg|LowerLeg|Foot|Toes)$/;
  const upper: typeof posed.parts = posed.parts.filter(
    (_: (typeof posed.parts)[number], i: number): boolean => !legs.test(body.massModel.segments[i]!.bone),
  );
  const hips: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(bones.get("leftUpperLeg")!.worldPosition, bones.get("rightUpperLeg")!.worldPosition),
    0.5,
  );
  const tensor: number[][] = physicalInertiaTensor(upper, hips);
  const about: (axis: IAutoMovieVector3) => number = (axis: IAutoMovieVector3): number => {
    const a: number[] = [axis.x, axis.y, axis.z];
    let sum: number = 0;
    for (let i: number = 0; i < 3; i++)
      for (let j: number = 0; j < 3; j++) sum += a[i]! * tensor[i]![j]! * a[j]!;
    return sum;
  };

  // Pitch turns about the axis across the heading, roll about the heading.
  const reach: Record<"pitch" | "roll", number> = {
    pitch: (body.massModel.mass * staggerBounds.PENDULUM * body.measure.hipHeight) / about(across),
    roll: (body.massModel.mass * staggerBounds.PENDULUM * body.measure.hipHeight) / about(forward),
  };
  const cap: number = walkReach.EXTENSION;

  // The tilt that answers the unheld lead, toward the fall, at a sample.
  const samples: Map<number, { pitch: number; roll: number }> = new Map();
  const sample: (k: number) => { pitch: number; roll: number } = (k: number): { pitch: number; roll: number } => {
    const known: { pitch: number; roll: number } | undefined = samples.get(k);
    if (known !== undefined) return known;
    const t: number = k / staggerBounds.KNOTS;
    const xi: IAutoMovieVector3 = walk.extrapolated(t);
    const p: IAutoMovieVector3 = walk.pressure(t);
    const lead: IAutoMovieVector3 = { x: xi.x - p.x, y: 0, z: xi.z - p.z };
    const along: number = Vector3.dot(lead, forward);
    const aside: number = Vector3.dot(lead, across);
    const degrees: (metres: number, of: number) => number = (metres: number, of: number): number =>
      Math.sign(metres) * Math.min(cap, (Math.abs(metres) * of * 180) / Math.PI);
    const out: { pitch: number; roll: number } = {
      pitch: degrees(along, reach.pitch),
      roll: rolling * degrees(aside, reach.roll),
    };
    samples.set(k, out);
    return out;
  };
  return (seconds: number): { trunk: { pitch: number; roll: number }; root: IAutoMovieVector3; ease: number } => {
    const travel: IAutoMovieVector3 = walk.course(seconds);
    const ease: number = minimumJerk.share(
      Math.min(1, Math.max(0, (seconds - onset) / rise)),
    );
    const at: number = Math.max(0, seconds * staggerBounds.KNOTS);
    const k: number = Math.floor(at);
    const a: { pitch: number; roll: number } = sample(k);
    const b: { pitch: number; roll: number } = sample(k + 1);
    const trunk: { pitch: number; roll: number } = {
      pitch: ease * (a.pitch + (b.pitch - a.pitch) * (at - k)),
      roll: ease * (a.roll + (b.roll - a.roll) * (at - k)),
    };

    // The root carries the centre on its course less the trunk's shift.
    const pp: number = Math.sin((trunk.pitch * Math.PI) / 180);
    const r: number = Math.sin((trunk.roll * Math.PI) / 180);
    return {
      trunk,
      ease,
      root: {
        x: root.x + travel.x - bend.pitch.x * pp - bend.roll.x * r,
        y: root.y,
        z: root.z + travel.z - bend.pitch.z * pp - bend.roll.z * r,
      },
    };
  };
}
