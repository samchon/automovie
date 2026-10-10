import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { humanBodyMeasurementSide } from "./humanBodyMeasurementSide";

/**
 * Orient a one-sided measurement rule to the requested side of the body.
 *
 * Rules are authored once, on one side (`HUMAN_BODY_MEASUREMENTS` places the
 * limb rules on the left landmarks). The other side's instrument is the same
 * rule with every landmark exchanged for its mirror under the basis's pairing
 * convention: `joint-l-` and `joint-r-` prefixes, `-left` and `-right`
 * suffixes. The fractions, step count, pick and plane orientation are the
 * same definition read on the other limb, so the right arm's girth is never a
 * second hand-kept rule that could drift from the left's. A rule already on
 * the requested side is returned unchanged.
 *
 * A side cannot be asked of a midline or bilateral rule: the trunk girths and
 * the shoulder-to-shoulder distance have no left or right instance, and the
 * request is refused by the rule's label instead of reading the same value
 * twice under two names. A mirrored landmark the basis lacks is not checked
 * here; the reader answers null for it as for any missing landmark.
 */
export function orientHumanBodyMeasurement(
  label: string,
  rule: IAutoMovieHumanBodyMeasurement,
  side: AutoMovieHumanBodySide,
): IAutoMovieHumanBodyMeasurement {
  const own = humanBodyMeasurementSide(rule);
  if (own === side) return rule;
  if (own === "midline" || own === "bilateral")
    throw new Error(`The ${own} measurement ${label} has no ${side} side.`);
  const mirror = (name: string): string =>
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
  const mirrorBone = <Bone extends string>(bone: Bone): Bone =>
    (bone.startsWith("left")
      ? "right" + bone.slice("left".length)
      : bone.startsWith("right")
        ? "left" + bone.slice("right".length)
        : bone) as Bone;
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
