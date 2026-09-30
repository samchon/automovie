import type { ConnectedBodyResult } from "./connectedBodyProtocol";

type Reading = Extract<
  ConnectedBodyResult,
  { operation: "preview" }
>["anatomy"];

/**
 * Describe only the anatomical relation an explicit body check actually read.
 *
 * Imaging observation, an explicitly named target, a legacy entered radius
 * or adult CT allometry supplies a spherical articular
 * head. Its millimetre radius and exact skin clearance are reported separately so room
 * for the head cannot be mistaken for a complete humerus, scapula or muscle
 * contact result. Crossed skin has no valid inside, and a body outside the
 * source cohort has no inferred bone radius to report.
 */
export function bodyAnatomyReading(reading: Reading): string | null {
  if (reading === null) return null;
  if (reading.status === "unavailable")
    return reading.reason === "skin-crossing"
      ? "Humeral-head clearance unavailable: the posed skin crosses itself."
      : "Humeral-head estimate unavailable outside the adult CT range (18–79 years, 1.321–1.930 m).";
  const parts = reading.heads.map((head) => {
    const side = head.bone === "leftUpperArm" ? "left" : "right";
    const radius = (head.radiusMetres * 1000).toFixed(1);
    const room = (Math.abs(head.clearanceMetres) * 1000).toFixed(1);
    const origin =
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
  });
  return "Humeral heads only: " + parts.join("; ") + ".";
}
