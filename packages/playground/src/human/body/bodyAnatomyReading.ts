import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";

type Reading = Extract<
  ConnectedBodyResult,
  { operation: "preview" }
>["anatomy"];

/**
 * Describe only the anatomical relation an explicit body check actually read.
 *
 * Imaging observation, an explicitly named target, a legacy entered radius or adult CT allometry supplies a spherical articular head. Its millimetre radius and exact skin clearance are reported separately so room for the head cannot be mistaken for a complete humerus, scapula or muscle contact result. Crossed skin has no valid inside, and a body outside the source cohort has no inferred bone radius to report.
 *
 * @evidence contracts/common.md#principled-implementation Formatting consumes the numerical preview's qualified union, converts metre-valued radii and gaps to millimetres and preserves the distinct unavailable, protruding and outside-centre outcomes without inferring additional anatomy.
 * @evidence contracts/common.md#clear-and-simple-design This display boundary produces one optional status sentence from existing humeral-head inspection data; it performs no measurement, inference or body edit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unavailable cohort label follows the numerical result's fixed adult-CT domain; observation, entered measurement, target and estimated provenance remain distinguished rather than converted to clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies source alternatives, millimetre display and the limitation to spherical heads and skin clearance, including why skin crossing prevents a valid inside reading.
 * @evidence contracts/performance.md#efficient-algorithms Formatting visits each of h head readings once and builds O(h) text fragments; one-decimal rounding is confined to display and never fed back into measurements.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous formatter coordinates no requests or phases and retains no previous anatomical reading.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only call-local strings and the returned sentence are allocated; no worker, renderer or ongoing task is acquired.
 */
export function bodyAnatomyReading(reading: Reading): string | null {
  if (reading === null) return null;
  if (reading.status === "unavailable")
    return reading.reason === "skin-crossing"
      ? "Humeral-head clearance unavailable: the posed skin crosses itself."
      : "Humeral-head estimate unavailable outside the adult CT range (18–79 years, 1.321–1.930 m).";
  const parts: string[] = reading.heads.map(
    (
      head: Extract<
        NonNullable<Reading>,
        { status: "measured" }
      >["heads"][number],
    ): string => {
      const side: string = head.bone === "leftUpperArm" ? "left" : "right";
      const radius: string = (head.radiusMetres * 1000).toFixed(1);
      const room: string = (Math.abs(head.clearanceMetres) * 1000).toFixed(1);
      const origin: string =
        head.source === "observed"
          ? `${head.observation.modality.toUpperCase()} observation`
          : head.source === "measured"
            ? "entered measurement"
            : head.source === "target"
              ? "anatomical target"
              : "adult CT estimate";
      return `${side} ${origin} radius ${radius} mm, ${
        head.centerInside
          ? head.clearanceMetres >= 0
            ? `skin room ${room} mm`
            : `skin protrusion ${room} mm`
          : `centre outside skin by ${(head.nearestMetres * 1000).toFixed(1)} mm`
      }`;
    },
  );
  return "Humeral heads only: " + parts.join("; ") + ".";
}
