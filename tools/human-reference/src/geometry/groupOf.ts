import { Group } from "./Group.ts";

/**
 * Groups source rig channels for diagnostic support selection, without claiming anatomical attachment borders.
 *
 * @evidence contracts/common.md#principled-implementation Documented source rig naming rules provide diagnostic weight support, not anatomical insertion borders.
 * @evidence contracts/common.md#clear-and-simple-design One function owns channel classification and the explicit trunk fallback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant bounded regular-expression checks on one name.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a group string without retaining the channel name.
 */
export function groupOf(name: string): Group {
  if (/^FACIAL_.*Neck/i.test(name) || /^neck_0/.test(name)) return "neck";
  if (/^FACIAL_/.test(name) || name === "head") return "head";
  const side: "l" | "r" | null = name.endsWith("_l")
    ? "l"
    : name.endsWith("_r")
      ? "r"
      : null;
  if (side) {
    if (/^upperarm/.test(name)) return `upperarm_${side}`;
    if (/^lowerarm/.test(name)) return `lowerarm_${side}`;
    if (
      /^(foot|ball|ankle|bigtoe|indextoe|middletoe|ringtoe|littletoe)/.test(
        name,
      )
    )
      return `foot_${side}`;
    if (/^(hand|wrist|thumb|index_|middle_|ring_|pinky_)/.test(name))
      return `hand_${side}`;
    if (/^thigh/.test(name)) return `thigh_${side}`;
    if (/^calf/.test(name)) return `calf_${side}`;
  }
  return "trunk";
}
