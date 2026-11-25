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
 * Seed the earliest obstructed part of a return from the actual settled
 * pose. On a contact transition, perform a short release before joining the
 * return (MoveIt Task Constructor, BSD-3-Clause, `Place::setRetractMotion`).
 * Here the authored clock and the measured obstruction delimit that release:
 * its start is the exact held pose and it rejoins at the first clear part of
 * the sampled return. Move only its free states along both endpoints of
 * their swept distance gradient (Schulman et al. 2014, §4.2). The optimiser
 * and final playback admission still read the whole course.
 *
 * @param context The original knots' context.
 * @param fine The prepared frame grid and obstacle allowances.
 * @param seed The sampled course through its exact hold positions.
 * @returns The seed with its improved release if one was found.
 * @see https://moveit.github.io/moveit_task_constructor/tutorials/pick-and-place.html
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

  const returning: boolean[] = fine.times.map(
    (_: number, k: number): boolean => k >= held,
  );
  let dense: number[][][] = Knots.read(
    context.times,
    fine.times,
    seed.x,
    Knots.bounded(context, seed.x),
  );
  let reading: M.IEvaluation = M.evaluate(fine, dense, undefined, returning);
  if (Math.max(edge(reading, held), edge(reading, free)) <= M.TOLERANCE)
    return seed;
  let rejoin: number = free + 1;
  while (
    rejoin < fine.n - 1 &&
    Math.max(edge(reading, rejoin), pose(reading, rejoin)) > M.TOLERANCE
  )
    ++rejoin;
  const release: number[] = Array.from(
    { length: rejoin - held },
    (_: unknown, i: number): number => free + i,
  );
  const knots: number[] = [...new Set([...seed.knots, ...release])].sort(
    (a: number, b: number): number => a - b,
  );
  const times: number[] = knots.map((k: number): number => fine.times[k]!);
  const clock: Parameters<typeof Knots.bounded>[0] = {
    ...context,
    times,
    n: times.length,
  };
  const contact: boolean[] = fine.times.map(
    (_: number, k: number): boolean => k >= held && k <= rejoin,
  );
  let current: ISeed = seed;
  let worst: number = excess(reading, held, rejoin);
  let region: number = Clear.REGION;
  while (worst > M.TOLERANCE) {
    const step: number[][][] = Clear.prefix(
      fine,
      dense,
      reading,
      held,
      rejoin,
      region,
    );
    const x: number[][][] = dense.map(
      (arm: number[][], a: number): number[][] =>
        knots.map((k: number): number[] => {
          const delta: number[] | undefined = step[a]![k - free];
          return delta === undefined
            ? arm[k]!
            : M.ranged(
                fine,
                a,
                arm[k]!.map((q: number, d: number): number => q + delta[d]!),
              );
        }),
    );
    const candidate: number[][][] = Knots.read(
      times,
      fine.times,
      x,
      Knots.bounded(clock, x),
    );
    const moved: M.IEvaluation = M.evaluate(fine, candidate, undefined, contact);
    const next: number = excess(moved, held, rejoin);
    // An unadmitted change must improve by at least the same distance the
    // model resolves. This bounds the local work by the initial miss.
    if (next > M.TOLERANCE && worst - next < M.TOLERANCE) break;
    current = { knots, x };
    dense = candidate;
    reading = moved;
    worst = next;
    region = Math.min(Clear.WIDEST, region * Clear.EXPAND);
  }
  return current;
}

/** The local clearance excess, millimetres, through the release prefix. */
function excess(reading: M.IEvaluation, held: number, rejoin: number): number {
  let out: number = 0;
  for (let k: number = held; k < rejoin; ++k)
    out = Math.max(out, edge(reading, k), pose(reading, k + 1));
  return out;
}

/** The forward/reverse and other-arm clearance excess at a pose. */
function pose(reading: M.IEvaluation, k: number): number {
  let out: number = 0;
  for (const arm of reading.pairs) {
    const pairs: M.IEvaluation["pairs"][number][number] = arm[k];
    if (pairs === undefined) continue;
    for (const pair of pairs.deepest.values())
      out = Math.max(out, pair.short - T.SKIN);
    for (const pair of pairs.embedded.values())
      out = Math.max(out, pair.short - T.SKIN);
  }
  for (const pair of reading.crossing[k]?.values() ?? [])
    out = Math.max(out, pair.short - T.SKIN);
  return out;
}

/** The swept clearance excess from one adjacent frame to the next. */
function edge(reading: M.IEvaluation, k: number): number {
  let out: number = 0;
  for (const arm of reading.swept)
    for (const sweep of arm[k]!)
      out = Math.max(out, 1000 * (sweep.lower - sweep.clear));
  return out;
}
