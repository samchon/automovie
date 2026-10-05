import { createHumanBodyMeasurementReader } from "../../measure/createHumanBodyMeasurementReader";
import { humanBodyChannelReach } from "../../measure/humanBodyChannelReach";
import { solveHumanBodyMeasuredChannel } from "../../measure/solveHumanBodyMeasuredChannel";
import { solveHumanBodySimpleOffsets } from "../../simple/solveHumanBodySimpleOffsets";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { HUMAN_BODY_EXTERIOR_TOLERANCE_METRES } from "./HUMAN_BODY_EXTERIOR_TOLERANCE_METRES";
import type { IAutoMovieHumanBodyExteriorRequest } from "./IAutoMovieHumanBodyExteriorRequest";

/** Passes over the requests before coupled channels are declared inconsistent. */
const PASSES = 6;

/**
 * Solve bound surface targets together on one shape.
 *
 * Each request is solved along its own channel with
 * `solveHumanBodyMeasuredChannel`, in order, over `shape`, and the passes
 * repeat until every reading on the rest skin holds within 0.05 mm, because
 * one channel can move another target's reading. When six passes stall on
 * coupled channels, the bounded joint solver `solveHumanBodySimpleOffsets`
 * (finite-difference Jacobian with Broyden updates inside each channel's
 * reach, `humanBodyChannelReach`) solves all bound channels together from there. Requests that
 * neither meets refuse as `inconsistent-measurements` by their paths. A
 * target its channel cannot reach in a sequential pass hands over to the
 * joint solve; when that fails too, the refusal names that path with the
 * inverse's message. Channels no request binds keep their weights.
 *
 * @evidence contracts/common.md#principled-implementation The per-channel inverse keeps ownership of reach and tolerance; this owner only orders requests and decides when the set holds.
 * @evidence contracts/common.md#clear-and-simple-design A bounded Gauss-Seidel pass over the requests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contradictory targets refuse instead of keeping the last solved one.
 * @evidence contracts/common.md#meaningful-documentation States the order, the stop rule, the pass limit and both refusals.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels Only bound channels change; other weights are kept.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It returns weights, not geometry.
 * @evidence contracts/modeling.md#spatial-conventions Targets and readings are metres on the source-rest skin.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder's consumer renders the shape.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rules own their definitions.
 * @evidence contracts/anatomy.md#permitted-range Channel reach and joint consistency refuse unsupported combinations without extrapolation.
 * @evidence contracts/anatomy.md#parametric-authority Named targets become private channel weights deterministically.
 * @author Samchon
 */
export function solveHumanBodyExteriorRequests(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  requests: readonly IAutoMovieHumanBodyExteriorRequest[],
): Record<string, number> {
  let solved = { ...shape };
  if (requests.length === 0) return solved;
  const residuals = (trial: Record<string, number>): number[] | null => {
    const reader = createHumanBodyMeasurementReader(basis, trial);
    const readings = requests.map((one) => reader.read(one.rule));
    return readings.some((value) => value === null) ? null : readings.map((value, index) => value! - requests[index].metres);
  };
  const met = (values: readonly number[]): boolean => values.every((value) => Math.abs(value) <= HUMAN_BODY_EXTERIOR_TOLERANCE_METRES);
  // a sequential pass refuses a target its channel cannot reach from where
  // the other channels left the body; the joint solve may still meet it, so
  // the first such refusal is kept to name if the joint solve fails too
  let refusal: Error | undefined;
  sequential: for (let pass = 0; pass < PASSES; pass++) {
    for (const one of requests)
      try {
        solved = solveHumanBodyMeasuredChannel({
          basis, shape: solved, channel: one.binding.channel, targetMetres: one.metres,
          measurement: one.binding.side === undefined ? { rule: one.binding.rule } : { rule: one.binding.rule, side: one.binding.side },
        }).shape;
      } catch (error) {
        // the caller's refusal names the anatomical path, not only the channel
        refusal = new Error(`anatomy.${one.binding.path}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        break sequential;
      }
    const current = residuals(solved);
    if (current !== null && met(current)) return solved;
  }
  // the sequential passes stalled on coupled channels: solve them jointly
  const channels = requests.map((one) => basis.channels.find((channel) => channel.id === one.binding.channel)!);
  const start = channels.map((channel) => solved[channel.id] ?? 0);
  const place = (offsets: readonly number[]): Record<string, number> => {
    const trial = { ...solved };
    channels.forEach((channel, index) => {
      const weight = start[index] + offsets[index];
      if (weight === 0) delete trial[channel.id];
      else trial[channel.id] = weight;
    });
    return trial;
  };
  const offsets = solveHumanBodySimpleOffsets({
    ranges: channels.map((channel, index) => {
      // the same reach the per-channel inverse brackets: endpoints beyond an
      // unavailable source target are never evaluated
      const reach = humanBodyChannelReach(basis, channel);
      return [reach.minimum - start[index], reach.maximum - start[index]] as const;
    }),
    initial: residuals(solved),
    evaluate: (trial) => residuals(place(trial)),
    met,
  });
  if (offsets !== null) {
    const joint = place(offsets);
    const final = residuals(joint);
    if (final !== null && met(final)) return joint;
  }
  throw refusal ?? new Error("inconsistent-measurements:" + requests.map((one) => "anatomy." + one.binding.path).join(", "));
}
