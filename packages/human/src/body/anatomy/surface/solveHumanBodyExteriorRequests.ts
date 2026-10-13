import { createHumanBodyMeasurementReader } from "../../measure/createHumanBodyMeasurementReader";
import { humanBodyChannelReach } from "../../measure/humanBodyChannelReach";
import { solveHumanBodyMeasuredChannel } from "../../measure/solveHumanBodyMeasuredChannel";
import { solveHumanBodySimpleOffsets } from "../../simple/solveHumanBodySimpleOffsets";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisChannel } from "../../structures/shape/IAutoMovieHumanBodyBasisChannel";
import { HUMAN_BODY_EXTERIOR_TOLERANCE_METRES } from "./HUMAN_BODY_EXTERIOR_TOLERANCE_METRES";
import type { IAutoMovieHumanBodyExteriorRequest } from "./IAutoMovieHumanBodyExteriorRequest";

/** Passes over the requests before coupled channels are declared inconsistent. */
const PASSES: number = 6;

/**
 * Solve bound surface targets together on one shape.
 *
 * Each request is solved along its own channel with `solveHumanBodyMeasuredChannel`, in order, over `shape`, and the passes repeat until every reading on the rest skin holds within 0.05 mm, because one channel can move another target's reading. When six passes stall on coupled channels, the bounded joint solver `solveHumanBodySimpleOffsets` (finite-difference Jacobian with Broyden updates inside each channel's reach, `humanBodyChannelReach`) solves all bound channels together from there. Requests that neither meets refuse as `inconsistent-measurements` by their paths. A target its channel cannot reach in a sequential pass hands over to the joint solve; when that fails too, the refusal names that path with the inverse's message. Channels no request binds keep their weights.
 *
 * @evidence contracts/common.md#principled-implementation Sequential per-channel inverses and a bounded finite-difference/Broyden joint fallback test all target residuals against the shared 0.05 mm budget; unreadable or unmet requests refuse without changing caller weights.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates coupled exterior conditions while measurement readers, channel reach and numerical offset solving retain their own responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Six passes are a declared work budget, not a convergence proof; failed coupled requests remain errors rather than tolerance relaxation or substituted measurements.
 * @evidence contracts/common.md#meaningful-documentation The prose gives channel coupling, reach bounds, unchanged unbound weights and path-specific failures when sequential and joint solves cannot meet targets.
 * @evidence contracts/performance.md#efficient-algorithms For R requests, C bound channels and shaped-skin cost G, up to six sequential passes and joint trial readings dominate; residual readers share one shaped skin per trial while dense joint workspace grows with C and R.
 * @evidence contracts/performance.md#reuse-equivalent-work Each trial uses one reader for all requested instruments; joint solving reuses the stalled state and initial residual while different channel weights require a fresh skin evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shape copies, readers, residuals and offset matrices are synchronous call-local state; only solved weights escape and failure retains no numerical task or caller mutation.
 * @author Samchon
 */
export function solveHumanBodyExteriorRequests(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  requests: readonly IAutoMovieHumanBodyExteriorRequest[],
): Record<string, number> {
  let solved: Record<string, number> = { ...shape };
  if (requests.length === 0) return solved;
  const residuals: (trial: Record<string, number>) => number[] | null = (trial: Record<string, number>): number[] | null => {
    const reader: ReturnType<typeof createHumanBodyMeasurementReader> = createHumanBodyMeasurementReader(basis, trial);
    const readings: (number | null)[] = requests.map((one: IAutoMovieHumanBodyExteriorRequest): number | null => reader.read(one.rule));
    return readings.some((value: number | null): boolean => value === null)
      ? null
      : readings.map((value: number | null, index: number): number => value! - requests[index].metres);
  };
  const met: (values: readonly number[]) => boolean = (values: readonly number[]): boolean =>
    values.every(
      (value: number): boolean => Math.abs(value) <= HUMAN_BODY_EXTERIOR_TOLERANCE_METRES,
    );
  // a sequential pass refuses a target its channel cannot reach from where
  // the other channels left the body; the joint solve may still meet it, so
  // the first such refusal is kept to name if the joint solve fails too
  let refusal: Error | undefined;
  sequential: for (let pass: number = 0; pass < PASSES; pass++) {
    for (const one of requests)
      try {
        solved = solveHumanBodyMeasuredChannel({
          basis,
          shape: solved,
          channel: one.binding.channel,
          targetMetres: one.metres,
          measurement:
            one.binding.side === undefined
              ? { rule: one.binding.rule }
              : { rule: one.binding.rule, side: one.binding.side },
        }).shape;
      } catch (error: unknown) {
        // the caller's refusal names the anatomical path, not only the channel
        refusal = new Error(
          `anatomy.${one.binding.path}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
        break sequential;
      }
    const current: number[] | null = residuals(solved);
    if (current !== null && met(current)) return solved;
  }
  // the sequential passes stalled on coupled channels: solve them jointly
  const channels: IAutoMovieHumanBodyBasisChannel[] = requests.map(
    (one: IAutoMovieHumanBodyExteriorRequest): IAutoMovieHumanBodyBasisChannel =>
      basis.channels.find((channel: IAutoMovieHumanBodyBasisChannel): boolean => channel.id === one.binding.channel)!,
  );
  const start: number[] = channels.map((channel: IAutoMovieHumanBodyBasisChannel): number => solved[channel.id] ?? 0);
  const place: (offsets: readonly number[]) => Record<string, number> = (offsets: readonly number[]): Record<string, number> => {
    const trial: Record<string, number> = { ...solved };
    channels.forEach((channel: IAutoMovieHumanBodyBasisChannel, index: number): void => {
      const weight: number = start[index] + offsets[index];
      if (weight === 0) delete trial[channel.id];
      else trial[channel.id] = weight;
    });
    return trial;
  };
  const offsets: number[] | null = solveHumanBodySimpleOffsets({
    ranges: channels.map((channel: IAutoMovieHumanBodyBasisChannel, index: number): readonly [number, number] => {
      // the same reach the per-channel inverse brackets: endpoints beyond an
      // unavailable source target are never evaluated
      const reach: ReturnType<typeof humanBodyChannelReach> = humanBodyChannelReach(basis, channel);
      return [
        reach.minimum - start[index],
        reach.maximum - start[index],
      ] as const;
    }),
    initial: residuals(solved),
    evaluate: (trial: readonly number[]): number[] | null => residuals(place(trial)),
    met,
  });
  if (offsets !== null) {
    const joint: Record<string, number> = place(offsets);
    const final: number[] | null = residuals(joint);
    if (final !== null && met(final)) return joint;
  }
  throw (
    refusal ??
    new Error(
      "inconsistent-measurements:" +
        requests.map((one: IAutoMovieHumanBodyExteriorRequest): string => "anatomy." + one.binding.path).join(", "),
    )
  );
}
