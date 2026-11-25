import { HumanArmTrajectoryClear as Clear } from "./HumanArmTrajectoryClear";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/** The existing seed and the frame indices of its knots. */
interface ISeed {
  /** The seed knots' indices on the frame grid. */
  knots: number[];

  /** Each arm's coordinates at each knot. */
  x: number[][][];
}

/**
 * Give the seed one free knot to clear a swept obstruction as it leaves its
 * last settled site. The sampling planner checks poses; the quintic through
 * its knots can still sweep into a shape on either side of the first free
 * frame. Use the existing collision-normal detour (`HumanArmTrajectoryClear`)
 * at that frame, against the actual settled pose and the moving shape. Keep
 * the change only if the clearance across the same two edges improves. The
 * normal optimiser still admits or refuses the whole course.
 *
 * @param context The original knots' context.
 * @param fine The prepared frame grid and obstacle allowances.
 * @param seed The sampled course through its exact hold positions.
 * @returns The seed with its improved release if one was found.
 */
export function HumanArmSeedRelease(
  context: M.IContext,
  fine: M.IContext,
  seed: ISeed,
): ISeed {
  if (context.open || context.still) return seed;
  let held: number = fine.n - 2;
  while (
    held > 0 &&
    fine.sites.every((sites: (M.ISite | undefined)[]): boolean =>
      sites[held] === undefined,
    )
  )
    --held;
  const free: number = held + 1;
  if (held === 0 || free >= fine.n - 1 || !seed.knots.includes(held))
    return seed;

  const contact: boolean[] = fine.times.map(
    (_: number, k: number): boolean => k >= held && k <= free + 1,
  );
  const dense: number[][][] = Knots.read(
    context.times,
    fine.times,
    seed.x,
    Knots.bounded(context, seed.x),
  );
  const reading: M.IEvaluation = M.evaluate(fine, dense, undefined, contact);
  if (sweptExcess(reading, free) <= M.TOLERANCE) return seed;

  const shares: number[] = [];
  shares[free] =
    (fine.times[free]! - fine.times[held]!) /
    (fine.times[free + 1]! - fine.times[held]!);
  const detours: Clear.IDetour[] = Clear.detour(
    fine,
    dense,
    reading,
    held,
    free + 1,
    shares,
    Clear.REGION,
  );
  if (detours.length === 0) return seed;
  const knots: number[] = seed.knots.includes(free)
    ? seed.knots
    : [...seed.knots, free].sort((a: number, b: number): number => a - b);
  const x: number[][][] = dense.map((arm: number[][], a: number): number[][] => {
    const released: number[] = arm[free]!.map(
      (q: number, d: number): number =>
        detours.reduce(
          (value: number, detour: Clear.IDetour): number =>
            value + detour.delta[a]![d]!,
          q,
        ),
    );
    const ranged: number[] = M.ranged(fine, a, released);
    return knots.map((k: number): number[] => (k === free ? ranged : arm[k]!));
  });
  const times: number[] = knots.map((k: number): number => fine.times[k]!);
  const candidate: number[][][] = Knots.read(
    times,
    fine.times,
    x,
    Knots.bounded({ ...context, times, n: times.length }, x),
  );
  const moved: M.IEvaluation = M.evaluate(fine, candidate, undefined, contact);
  return excess(moved, free) < excess(reading, free)
    ? { knots, x }
    : seed;
}

/** The local clearance excess, in millimetres, at and around release. */
function excess(reading: M.IEvaluation, free: number): number {
  let out: number = sweptExcess(reading, free);
  for (const arm of reading.pairs) {
    const pairs: NonNullable<M.IEvaluation["pairs"][number][number]> = arm[free]!;
    for (const pair of pairs.deepest.values())
      out = Math.max(out, pair.short - T.SKIN);
    for (const pair of pairs.embedded.values())
      out = Math.max(out, pair.short - T.SKIN);
  }
  for (const pair of reading.crossing[free]?.values() ?? [])
    out = Math.max(out, pair.short - T.SKIN);
  return out;
}

/** The swept clearance excess on both sides of the first free frame. */
function sweptExcess(reading: M.IEvaluation, free: number): number {
  let out: number = 0;
  for (const arm of reading.swept)
    for (let k: number = free - 1; k <= free; ++k)
      for (const sweep of arm[k]!)
        out = Math.max(out, 1000 * (sweep.lower - sweep.clear));
  return out;
}
