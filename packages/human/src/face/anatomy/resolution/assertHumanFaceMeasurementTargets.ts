import type {
  IAutoMovieHumanFaceMeasurementMeasured as ImportedIAutoMovieHumanFaceMeasurementMeasured,
  IAutoMovieHumanFaceMeasurementUnavailable as ImportedIAutoMovieHumanFaceMeasurementUnavailable,
} from "@automovie/human";

import type { AutoMovieHumanFaceMeasurementReading } from "../../structures/AutoMovieHumanFaceMeasurementReading";

/**
 * Refuse targeted instruments whose supplied reading is unavailable. The maintained builder passes the complete registry output after request admission, so registered target identities are present there. This helper does not solve a target or check requested-versus-measured equality, and a missing id in a direct partial reading list currently passes. Numerical inversion belongs to the editor's separate solver.
 *
 * @evidence contracts/common.md#principled-implementation Targeted unavailable readings cause explicit refusal with their instrument reason.
 * @evidence contracts/common.md#clear-and-simple-design The actual builder supplies every admitted registry reading; numerical target inversion is a separate editor operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper checks availability, not equality to requested value; missing ids in direct partial inputs currently do not reject.
 * @evidence contracts/common.md#meaningful-documentation Target identity and actual unavailable reason remain separate from retained requested context.
 * @evidence contracts/performance.md#efficient-algorithms Target count times report-length searches gives O(targets times readings) work.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing complete reading records are reused instead of geometry rebuilding or invented measurements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs are read synchronously and no target or reading reference is retained.
 *
 * @author Samchon
 */
export function assertHumanFaceMeasurementTargets(
  readings: readonly AutoMovieHumanFaceMeasurementReading[],
  targets: readonly string[],
): void {
  for (const id of targets) {
    const reading: AutoMovieHumanFaceMeasurementReading | undefined =
      readings.find(
        (
          candidate:
            | ImportedIAutoMovieHumanFaceMeasurementMeasured
            | ImportedIAutoMovieHumanFaceMeasurementUnavailable,
        ): boolean => candidate.measurement === id,
      );
    if (reading !== undefined && reading.status === "unavailable")
      throw new Error(`The face cannot reach target ${id}: ${reading.reason}.`);
  }
}
