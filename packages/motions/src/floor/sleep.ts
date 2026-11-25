import type {
  IAutoMovieMotionHumanSleep,
  IAutoMovieMotionHumanTurnOver,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmConnect } from "../posture/HumanArmConnect";
import { turnOver } from "./turnOver";

/**
 * The share of time in bed spent in each lying position, Skarpsno et al. 2017
 * (BMJ Open 7:e015618): side 54.1 %, back 37.5 %, front 7.3 %; the side split
 * evenly.
 */
const PREVALENCE: Readonly<
  Record<IAutoMovieMotionHumanTurnOver.Position, number>
> = {
  lateralLeft: 0.541 / 2,
  lateralRight: 0.541 / 2,
  supine: 0.375,
  prone: 0.073,
};

/**
 * Sleep with seeded position changes: over a long lie, the lying performer
 * turns over `changes` times into positions drawn by how much of the night
 * people spend in each (Skarpsno et al. 2017), never the one it lies in, at
 * seeded instants spread over the sleep; between, it holds still. De Koninck et
 * al. 1992 count such shifts through the night; a film sleep compresses them
 * into its seconds.
 *
 * @param chain The lying performer's chain.
 * @param params The sleep's length, changes, seed and support.
 * @returns The chain with the turns appended.
 * @throws {HumanRefusal} When the changes are not a whole count of one or more,
 *   or the sleep is too short to hold between them.
 */
export function sleep<Chain extends sleep.IChain<Chain>>(
  chain: Chain,
  params: IAutoMovieMotionHumanSleep.ISleep,
): Chain {
  if (!(params.changes >= 1))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "changes",
      value: params.changes,
      reason: "a sleep changes position a whole number of times, one or more",
      fix: "give a positive whole count",
    });
  // Each turn takes up to two quarter turns of a second each.
  const free: number = params.duration - 2 * params.changes;
  if (!(free > 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "duration",
      value: params.duration,
      feasible: {
        kind: "range",
        minimum: 2 * params.changes,
        maximum: null,
        unit: "s",
      },
      reason: `${params.changes} changes leave no stillness in ${params.duration} s`,
      fix: "sleep longer or change position fewer times",
    });
  const next: () => number = HumanArmConnect.generator(params.seed);
  const weights: number[] = Array.from(
    { length: params.changes + 1 },
    (): number => 0.5 + next(),
  );
  const total: number = weights.reduce(
    (a: number, b: number): number => a + b,
    0,
  );
  let current: IAutoMovieMotionHumanTurnOver.Position | undefined;
  let out: Chain = chain;
  for (let i: number = 0; i < params.changes; ++i) {
    const to: IAutoMovieMotionHumanTurnOver.Position = draw(next(), current);
    current = to;
    const turn: IAutoMovieMotionHumanTurnOver = {
      to,
      hold: (free * weights[i + 1]!) / total,
      ...(params.on === undefined ? {} : { on: params.on }),
    };
    out = out.registered(turnOver.name, turn);
  }
  return out;
}

/** The positions a sleeper lies in, as `PREVALENCE` weighs them. */
const POSITIONS: readonly IAutoMovieMotionHumanTurnOver.Position[] = [
  "lateralLeft",
  "lateralRight",
  "supine",
  "prone",
];

/** A position drawn by prevalence, excluding the current one. */
function draw(
  u: number,
  current: IAutoMovieMotionHumanTurnOver.Position | undefined,
): IAutoMovieMotionHumanTurnOver.Position {
  const options: IAutoMovieMotionHumanTurnOver.Position[] = POSITIONS.filter(
    (p: IAutoMovieMotionHumanTurnOver.Position): boolean => p !== current,
  );
  const sum: number = options.reduce(
    (a: number, p: IAutoMovieMotionHumanTurnOver.Position): number =>
      a + PREVALENCE[p],
    0,
  );
  let left: number = u * sum;
  for (const p of options) {
    left -= PREVALENCE[p];
    if (left < 0) return p;
  }
  return options.at(-1)!;
}

/** What a sleep appends its turns to. */
export namespace sleep {
  /**
   * A chain the turns are appended to: each a registered `turnOver`, the chain
   * it returns read on.
   */
  export interface IChain<Chain> {
    /** Append a registered action. */
    registered(name: string, params: IAutoMovieMotionHumanTurnOver): Chain;
  }
}
