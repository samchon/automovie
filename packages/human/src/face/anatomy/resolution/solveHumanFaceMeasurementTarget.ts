import { invertHumanMeasurement } from "../../../common/measure/invertHumanMeasurement";
import type { IHumanFaceMeasurementSolution } from "./IHumanFaceMeasurementSolution";
import type { IHumanFaceMeasurementSolveInput } from "./IHumanFaceMeasurementSolveInput";

/**
 * Solve one face measurement target onto the first listed channel that can
 * reach it, through the shared one-dimensional measurement inverse.
 *
 * Each listed channel is tried in order within its authored envelope, the
 * others kept at their current weights; the first whose real readings bracket
 * the target is solved to within half the 0.1 mm readout. Millimetres convert
 * to the inverse's metres at this edge only. A measurement with no listed
 * channel, one in another unit, one that reads a gap, or a target no channel
 * reaches refuses by name; no vertex or unlisted channel is moved to make it
 * fit.
 *
 * @author Samchon
 */
export function solveHumanFaceMeasurementTarget(
  input: IHumanFaceMeasurementSolveInput,
): IHumanFaceMeasurementSolution {
  const { measurement, target } = input;
  if (measurement.channels.length === 0)
    throw new Error(
      `The face measurement ${measurement.id} has no channel that varies it.`,
    );
  if (measurement.unit !== "millimetres")
    throw new Error(
      `Only millimetre face targets solve; ${measurement.id} is in ${measurement.unit}.`,
    );
  const failures: string[] = [];
  for (const id of measurement.channels) {
    const channel = input.channels.find((candidate) => candidate.id === id);
    if (channel === undefined) {
      failures.push(`${id} is not a basis channel`);
      continue;
    }
    try {
      const solved = invertHumanMeasurement({
        range: [channel.minimum, channel.maximum],
        current: input.weights[id] ?? 0,
        targetMetres: target / 1000,
        label: measurement.id,
        read: (weight) => {
          const value = input.read(id, weight);
          if (typeof value !== "number")
            throw new Error(
              `The face cannot measure ${measurement.id}: ${value.reason}.`,
            );
          return value / 1000;
        },
      });
      return {
        channel: id,
        weight: solved.weight,
        measured: solved.actualMetres * 1000,
      };
    } catch (error) {
      failures.push(
        `${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  throw new Error(
    `No channel reaches ${target} mm of ${measurement.id} (${failures.join("; ")}).`,
  );
}
