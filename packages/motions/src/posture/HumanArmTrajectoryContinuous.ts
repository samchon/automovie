import { ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes } from "./HumanArmShapes";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryShapeOwners } from "./HumanArmTrajectoryShapeOwners";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { nameArmTrajectoryPair } from "./nameArmTrajectoryPair";
import { prepareHumanArmCurveSpeed } from "./prepareHumanArmCurveSpeed";

/**
 * Inspect the played joint curve against the self geometry an action holds
 * fixed. The same signed allowances apply to the actual probe and to the
 * reverse corner. Motion outside the stationary span, moving obstacles and
 * contacts stay with the native model. A joint chart without a finite
 * interval bound also keeps the native reading for that interval.
 *
 * @param c The existing admission context and the authored fixed interval.
 * @param knots The playback knot clock, a subset of the admission clock
 *   (laid, retimed, or snapped onto the fine grid). Each native interval is
 *   in one played quintic, so its two endpoint jets determine it.
 * @param x The playback joint coordinates.
 * @param rates The velocities and accelerations of the played curve.
 * @returns One witnessed or unresolved collision interval per native step.
 */
export function HumanArmTrajectoryContinuous(
  c: M.IContext,
  knots: readonly number[],
  x: readonly (readonly (readonly number[])[])[],
  rates: Knots.IRates,
): M.ICurveWitness[] {
  if (c.fixedSelf === undefined || c.still) return [];
  const [heldFrom, heldTo] = c.fixedSelf;
  const first: number = c.times.findIndex((t) => t >= heldFrom);
  if (first < 0 || c.times[first]! >= heldTo) return [];
  const results: M.ICurveWitness[] = [];
  x.forEach((arm, a) => {
    const setup = c.setups[a]!;
    const velocities = rates.velocities[a]!;
    const accelerations = rates.accelerations[a]!;
    const position = Knots.positions(knots, arm, velocities, accelerations);
    const jet = (seconds: number): number[][] =>
      Knots.at(knots, arm, velocities, accelerations, seconds);
    const others: number = setup.body.tangle.parts.length;
    const frame = c.frames[a]![first]!;
    const levers = armLevers(
      setup,
      frame,
      G.placed(setup, frame, jet(c.times[first]!)[0]!),
    );
    const bind = prepareHumanArmCurveSpeed(setup, levers);
    if (bind === undefined) return;
    const resolution: number = (ROM_TOLERANCE * Math.PI * levers[0]) / 180;
    for (let k: number = first; k + 1 < c.n && c.times[k]! < heldTo; ++k) {
      const from: number = c.times[k]!;
      const to: number = Math.min(c.times[k + 1]!, heldTo);
      const speed: number | undefined = bind(jet(from), jet(to), to - from);
      if (speed === undefined || !Number.isFinite(speed)) continue;
      const sample = (seconds: number): ISample => {
        const current = c.frames[a]![k]!;
        const q: number[] = position(seconds).coordinates;
        const placed = G.placed(setup, current, q, true);
        // Outside the native pair screen we can certify only its cutoff.
        let worst: ISample = {
          gap: T.CHECK + M.TOLERANCE,
          what: "self clearance",
        };
        const note = (depth: number, what: () => string): void => {
          const gap: number = T.SKIN + M.TOLERANCE - depth;
          if (gap < worst.gap) worst = { gap, what: what() };
        };
        for (const pair of P.deepest(c, a, k, placed, P.CUT).values())
          if (current.shapes[pair.shape]!.part < others)
            note(pair.short, () =>
              nameArmTrajectoryPair(c, a, k, pair.probe, pair.shape),
            );
        for (const pair of P.embedded(c, a, k, placed, P.CUT).values())
          if (current.body[pair.corner]!.part < others)
            note(
              pair.short,
              () =>
                `the body's ${pair.bone} inside the arm's ${pair.shape.bone}`,
            );
        return worst;
      };
      const finding = inspect(
        from,
        to,
        speed * 1000,
        resolution * 1000,
        sample,
      );
      if (finding !== undefined) results.push({ ...finding, k });
    }
  });
  return results;
}

interface ISample {
  gap: number;
  what: string;
}

interface IInterval {
  from: number;
  to: number;
  left: ISample;
  right: ISample;
}

/** The distance from each driven joint to any forward probe or solid point. */
function armLevers(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  frame: IAutoMovieMotionHumanArmGeometry.IFrame,
  placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
): readonly [number, number, number] {
  const radius = { upper: 0, lower: 0, hand: 0 };
  frame.surface.forEach((point, i) => {
    const owner = frame.owners[i]!;
    radius[owner] = Math.max(radius[owner], Vector3.length(point));
  });
  const joints = {
    upper: placed.shoulder,
    lower: placed.elbow,
    hand: placed.wrist,
  };
  const owners = HumanArmTrajectoryShapeOwners(frame.colliders);
  HumanArmShapes.colliders(frame, placed).forEach((shape, i) => {
    const owner = owners[i]!;
    radius[owner] = Math.max(
      radius[owner],
      Vector3.distance(joints[owner], shape.centre) + shape.radius,
    );
  });
  const upper: number = Vector3.length(setup.rest.lower.translation);
  const lower: number = Vector3.length(setup.rest.hand.translation);
  const elbow: number = Math.max(radius.lower, lower + radius.hand);
  return [Math.max(radius.upper, upper + elbow), elbow, radius.hand];
}

/** Subdivide only while the two signed-distance cones do not enclose clearance. */
function inspect(
  from: number,
  to: number,
  speed: number,
  resolution: number,
  sample: (time: number) => ISample,
): Omit<M.ICurveWitness, "k"> | undefined {
  const left = sample(from);
  const right = sample(to);
  const found = (time: number, at: ISample) => ({
    time,
    value: M.TOLERANCE - at.gap,
    what: at.what,
  });
  if (left.gap < 0) return found(from, left);
  if (right.gap < 0) return found(to, right);
  const pending: IInterval[] = [{ from, to, left, right }];
  while (pending.length !== 0) {
    const row = pending.pop()!;
    const travel: number = speed * (row.to - row.from);
    const lower: number = (row.left.gap + row.right.gap - travel) / 2;
    if (lower >= 0) continue;
    const middle: number = row.from + (row.to - row.from) / 2;
    const at: ISample = sample(middle);
    if (at.gap < 0) return found(middle, at);
    if (travel <= resolution || !(row.from < middle && middle < row.to))
      return found(middle, { gap: lower, what: `unresolved ${at.what}` });
    pending.push(
      { from: middle, to: row.to, left: at, right: row.right },
      { from: row.from, to: middle, left: row.left, right: at },
    );
  }
  return undefined;
}
