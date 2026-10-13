import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";

/**
 * Classify a measurement rule's side from its declared landmark and region names.
 *
 * Joint landmark prefixes joint-l-/joint-r-, skin names ending -left/-right and extent/reach bone prefixes left/right identify each side. Both markers mean bilateral, no marker means midline. This reads the naming convention rather than checking actual geometric lateral placement or basis membership; unmarked names are not independently certified midline anatomy. The rule remains unchanged and no separate side label can drift from it.
 *
 * @evidence contracts/common.md#principled-implementation From/to and applicable level/origin names, plus extent/reach region bones, determine left/right marker presence and the resulting unilateral/bilateral/midline classification.
 * @evidence contracts/common.md#clear-and-simple-design The instrument's existing identifiers supply side information instead of a separately maintained rule-side table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Naming classification cannot certify physical lateral placement, basis membership or biological midline anatomy for arbitrary unmarked names.
 * @evidence contracts/common.md#meaningful-documentation The prose gives each prefix/suffix convention and explicitly defines both-marker and absent-marker behavior.
 * @evidence contracts/performance.md#efficient-algorithms A few landmark names and the rule's B region bones are scanned in linear text volume without measuring geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Orientation and rule consumers share this naming owner without caching mutable rule records or copying classifications into tables.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one closed classification escapes; the small name array expires and no basis, geometry cache or task is retained.
 */
export function humanBodyMeasurementSide(
  rule: IAutoMovieHumanBodyMeasurement,
): "left" | "right" | "bilateral" | "midline" {
  const names: string[] = [rule.from, rule.to];
  if (rule.kind !== "distance" && "level" in rule) names.push(rule.level);
  if (rule.kind === "skin-reach") names.push(rule.origin);
  // a skin extent's region bones pair by a left/right prefix (leftFoot)
  const bones: readonly string[] =
    rule.kind === "extent" || rule.kind === "skin-reach" ? rule.bones : [];
  const left: boolean =
    names.some(
      (name: string): boolean => name.startsWith("joint-l-") || name.endsWith("-left"),
    ) || bones.some((bone: string): boolean => bone.startsWith("left"));
  const right: boolean =
    names.some(
      (name: string): boolean => name.startsWith("joint-r-") || name.endsWith("-right"),
    ) || bones.some((bone: string): boolean => bone.startsWith("right"));
  return left && right
    ? "bilateral"
    : left
      ? "left"
      : right
        ? "right"
        : "midline";
}
