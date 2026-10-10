import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";

/**
 * The side of the body a measurement rule reads, derived from the landmarks
 * it names.
 *
 * The basis names its paired landmarks by one convention: joint cubes carry a
 * `joint-l-` or `joint-r-` prefix and named skin points and regions a `-left`
 * or `-right` suffix (`assertHumanSkinRegions` relies on the same suffixes).
 * A rule whose landmarks all lie on one side reads that side; a rule that
 * spans both (the biacromial distance, shoulder to shoulder) is `bilateral`;
 * a rule on midline landmarks only (the trunk girths) is `midline`. The side
 * is read from the rule itself, so the rule table keeps no second label that
 * could disagree with the landmarks it names.
 */
export function humanBodyMeasurementSide(
  rule: IAutoMovieHumanBodyMeasurement,
): "left" | "right" | "bilateral" | "midline" {
  const names: string[] = [rule.from, rule.to];
  if (rule.kind !== "distance" && "level" in rule) names.push(rule.level);
  if (rule.kind === "skin-reach") names.push(rule.origin);
  // a skin extent's region bones pair by a left/right prefix (leftFoot)
  const bones =
    rule.kind === "extent" || rule.kind === "skin-reach" ? rule.bones : [];
  const left =
    names.some(
      (name) => name.startsWith("joint-l-") || name.endsWith("-left"),
    ) || bones.some((bone) => bone.startsWith("left"));
  const right =
    names.some(
      (name) => name.startsWith("joint-r-") || name.endsWith("-right"),
    ) || bones.some((bone) => bone.startsWith("right"));
  return left && right
    ? "bilateral"
    : left
      ? "left"
      : right
        ? "right"
        : "midline";
}
