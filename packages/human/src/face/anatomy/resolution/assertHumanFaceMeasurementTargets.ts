import type { AutoMovieHumanFaceMeasurementReading } from "../../structures/AutoMovieHumanFaceMeasurementReading";

/**
 * Refuse a document whose measurement target cannot be read on its face.
 *
 * A target is a request for a measured value; when the measurement reads
 * unavailable on the final surface, the target cannot be met or even checked,
 * so the document refuses with that reading's reason instead of keeping the
 * target silently.
 *
 * @author Samchon
 */
export function assertHumanFaceMeasurementTargets(
  readings: readonly AutoMovieHumanFaceMeasurementReading[],
  targets: readonly string[],
): void {
  for (const id of targets) {
    const reading = readings.find((candidate) => candidate.measurement === id);
    if (reading !== undefined && reading.status === "unavailable")
      throw new Error(`The face cannot reach target ${id}: ${reading.reason}.`);
  }
}
