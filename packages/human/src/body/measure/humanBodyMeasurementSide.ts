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
 *
 * @evidence contracts/common.md#principled-implementation The side follows from the landmark names the rule already carries, under the basis's own pairing convention, so no rule needs a separate side field that could contradict its landmarks.
 * @evidence contracts/common.md#clear-and-simple-design One classifier over the rule's landmark fields; orientation and mirroring are owned by orientHumanBodyMeasurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rule id is special-cased; every rule is classified by the same naming convention.
 * @evidence contracts/common.md#meaningful-documentation States the naming convention, the four outcomes and why the side is derived rather than stored.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Left and right are the person's own sides as the basis names them (AutoMovieHumanBodySide), never screen X.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule table owns each instrument's definition and source; this classifier carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 */
export function humanBodyMeasurementSide(
  rule: IAutoMovieHumanBodyMeasurement,
): "left" | "right" | "bilateral" | "midline" {
  const names: string[] = [rule.from, rule.to];
  if (rule.kind !== "distance" && "level" in rule) names.push(rule.level);
  // a skin extent's region bones pair by a left/right prefix (leftFoot)
  const bones = rule.kind === "extent" ? rule.bones : [];
  const left =
    names.some((name) => name.startsWith("joint-l-") || name.endsWith("-left")) ||
    bones.some((bone) => bone.startsWith("left"));
  const right =
    names.some((name) => name.startsWith("joint-r-") || name.endsWith("-right")) ||
    bones.some((bone) => bone.startsWith("right"));
  return left && right ? "bilateral" : left ? "left" : right ? "right" : "midline";
}
