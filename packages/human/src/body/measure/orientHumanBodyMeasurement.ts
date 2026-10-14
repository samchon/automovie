import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { humanBodyMeasurementSide } from "./humanBodyMeasurementSide";

/**
 * Orient a one-sided measurement rule to the requested side of the body.
 *
 * Authored unilateral rules exchange joint-l-/joint-r- prefixes, -left/-right skin-name suffixes and paired left/right humanoid bone prefixes. Fractions, steps, selection and plane policy stay unchanged, so opposite limbs share an instrument definition. A rule already on the requested side is returned by identity; a mirrored result is a shallow copy with changed names/bones and a copied range where present. Other unchanged nested data can remain shared.
 *
 * Midline/bilateral rules refuse a unilateral request by label. This naming operation checks no basis membership or geometrical symmetry; a missing mirrored landmark remains unavailable at measurement. The closed humanoid vocabulary supplies counterpart bone names, without asserting that a particular rig carries both.
 *
 * @evidence contracts/common.md#principled-implementation Shared side classification precedes naming-convention mirroring of all applicable axis, level, origin and region-bone references while measurement policy stays unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One rule definition supplies both unilateral instruments instead of hand-maintained left/right measurement tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Midline/bilateral requests refuse, and identifier mirroring cannot invent absent rig landmarks or certify physical symmetry.
 * @evidence contracts/common.md#meaningful-documentation The prose states pairing conventions, unchanged sampling policy, same-side identity return and shallow-copy sharing on a mirrored result.
 * @evidence contracts/performance.md#efficient-algorithms Side/name checks and B region-bone replacements take linear identifier work; no candidate body or measurement is evaluated.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing rule and side owners are reused, and the same-side path returns its current rule without an unnecessary clone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Mirrored records own changed identifiers/bone arrays and any copied range while unchanged data remain shared; helper closures expire without cache or task retention.
 */
export function orientHumanBodyMeasurement(
  label: string,
  rule: IAutoMovieHumanBodyMeasurement,
  side: AutoMovieHumanBodySide,
): IAutoMovieHumanBodyMeasurement {
  const own: ReturnType<typeof humanBodyMeasurementSide> =
    humanBodyMeasurementSide(rule);
  if (own === side) return rule;
  if (own === "midline" || own === "bilateral")
    throw new Error(`The ${own} measurement ${label} has no ${side} side.`);
  const mirror: (name: string) => string = (name: string): string =>
    name.startsWith("joint-l-")
      ? "joint-r-" + name.slice("joint-l-".length)
      : name.startsWith("joint-r-")
        ? "joint-l-" + name.slice("joint-r-".length)
        : name.endsWith("-left")
          ? name.slice(0, -"-left".length) + "-right"
          : name.endsWith("-right")
            ? name.slice(0, -"-right".length) + "-left"
            : name;
  // humanoid bones pair by a left/right prefix (leftFoot, rightFoot)
  const mirrorBone: (bone: AutoMovieHumanoidBone) => AutoMovieHumanoidBone = (
    bone: AutoMovieHumanoidBone,
  ): AutoMovieHumanoidBone =>
    (bone.startsWith("left")
      ? "right" + bone.slice("left".length)
      : bone.startsWith("right")
        ? "left" + bone.slice("right".length)
        : bone) as AutoMovieHumanoidBone;
  if (rule.kind === "distance")
    return { ...rule, from: mirror(rule.from), to: mirror(rule.to) };
  if (rule.kind === "skin-distance" || rule.kind === "skin-height")
    return { ...rule, from: mirror(rule.from), to: mirror(rule.to) };
  if (rule.kind === "skin-reach")
    return {
      ...rule,
      from: mirror(rule.from),
      to: mirror(rule.to),
      origin: mirror(rule.origin),
      bones: rule.bones.map(mirrorBone),
    };
  if (rule.kind === "extent")
    return {
      ...rule,
      from: mirror(rule.from),
      to: mirror(rule.to),
      bones: rule.bones.map(mirrorBone),
    };
  if ("level" in rule)
    return {
      ...rule,
      from: mirror(rule.from),
      to: mirror(rule.to),
      level: mirror(rule.level),
    };
  return {
    ...rule,
    from: mirror(rule.from),
    to: mirror(rule.to),
    range: [...rule.range],
  };
}
