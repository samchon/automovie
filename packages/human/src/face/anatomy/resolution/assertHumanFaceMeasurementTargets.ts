import type { AutoMovieHumanFaceMeasurementReading } from "../../structures/AutoMovieHumanFaceMeasurementReading";

/**
 * Refuse a document whose measurement target cannot be read on its face.
 *
 * A target is a request for a measured value; when the measurement reads
 * unavailable on the final surface, the target cannot be met or even checked,
 * so the document refuses with that reading's reason instead of keeping the
 * target silently.
 *
 * @evidence contracts/common.md#principled-implementation A target is judged on the same final-surface reading the editor reports.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the readings that carry a target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreadable target refuses by its gap's reason; it is never kept unchecked.
 * @evidence contracts/common.md#meaningful-documentation States why an unreadable target refuses and what the refusal names.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The check names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The check moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The check emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The check compares no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The check builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the readings.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each registered measurement states its protocol.
 * @evidence contracts/anatomy.md#permitted-range A target the face cannot read is outside what the face can answer and refuses by name.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The check admits no input of its own.
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
