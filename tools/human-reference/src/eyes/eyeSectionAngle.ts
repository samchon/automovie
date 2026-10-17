import type { Section } from "../schema/Section.ts";

/**
 * Reads an eye radial angle without interpreting an ordinary physical station as degrees.
 * The legacy observation protocol explicitly stored degrees in its mm field;
 * only that exact declared protocol is adapted. New observations use deg.
 *
 * @evidence contracts/common.md#principled-implementation Uses an explicit angular coordinate first and admits the old field only when its complete definition declares the known angle protocol.
 * @evidence contracts/common.md#clear-and-simple-design Keeps unit migration in one boundary adapter shared by the annular builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not infer angular units from an identity, numeric range or missing field.
 * @evidence contracts/common.md#meaningful-documentation States the legacy conversion premise and new angular coordinate.
 * @evidence contracts/performance.md#efficient-algorithms Field admission uses constant time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless unit adapter coordinates no repeated requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No resource or retained state is acquired.
 */
export function eyeSectionAngle(section: Section): number {
  const angle: number | undefined =
    section.station.deg ??
    (section.station.definition ===
    "phase in degrees about the eye axis (mm field holds degrees)"
      ? section.station.mm
      : undefined);
  if (
    angle === undefined ||
    !Number.isFinite(angle) ||
    angle < 0 ||
    angle >= 360
  )
    throw new Error("Eye radial station needs an explicit angular protocol");
  return angle;
}
