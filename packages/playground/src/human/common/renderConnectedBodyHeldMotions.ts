import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the motions the body view's rig holds, one disabled row per qualifying joint listing its held axes, under one collapsed group.
 *
 * A joint whose constraint gives an axis no range does not move on it: the fingers have no abduction (no splay), the thumb's first metacarpal has neither abduction nor twist (no opposition), the clavicle joint has no twist, and the scapula follows the arm only through the source's scapulohumeral couplings. The joint rows show this per joint once it is picked; this group lists every held axis at once, derived from the basis's joints, so a missing motion is named rather than discovered. A joint with a thorax-relative shoulder goal is moved by that goal, not by axes, and is not listed. Only joints matching the search are listed; nothing is appended when none match.
 *
 * @evidence contracts/common.md#principled-implementation Null constrained axes identify motions held by each source joint, while thorax-relative shoulder goals and null constraints are excluded from generic-axis classification.
 * @evidence contracts/common.md#clear-and-simple-design Rig constraints remain the source authority and this renderer only names held-axis gaps through shared disabled rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Held source axes are not offered as fictional sliders or described as a subject's measured clinical capacity.
 * @evidence contracts/common.md#meaningful-documentation The comment explains null-axis meaning, shoulder-goal exclusion, source-derived inventory, search and empty-result behavior.
 * @evidence contracts/performance.md#efficient-algorithms One j-joint scan checks three axes per matching constrained joint in O(j) axis work plus searched id characters; h held joints retain O(h) row DOM and at most three temporary axis labels each.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The renderer owns no solved rig cache or shared numerical evaluation; each redraw reflects the supplied basis constraints.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Held rows transfer to the parent container and remain until replacement or close; temporary axis arrays own no listener, worker or GPU handle.
 */
export function renderConnectedBodyHeldMotions(
  dom: Document,
  container: HTMLElement,
  basis: IAutoMovieHumanBodyBasis,
  query: string,
): void {
  const rows: HTMLElement[] = [];
  for (const joint of basis.joints) {
    if (
      joint.shoulder !== undefined ||
      joint.constraint === null ||
      !joint.bone.toLowerCase().includes(query)
    )
      continue;
    const constraint: NonNullable<
      IAutoMovieHumanBodyBasis["joints"][number]["constraint"]
    > = joint.constraint;
    const held: ("flexion" | "abduction" | "twist")[] = (
      ["flexion", "abduction", "twist"] as const
    ).filter(
      (axis: "flexion" | "abduction" | "twist"): boolean =>
        constraint[axis] === null,
    );
    if (held.length > 0)
      rows.push(
        createConnectedDisabledRow(
          dom,
          joint.bone,
          `The source rig holds ${joint.bone} on ${held.join(" and ")}; no such motion is offered.`,
        ),
      );
  }
  if (rows.length === 0) return;
  const group: HTMLDetailsElement = dom.createElement("details");
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = `Motions this rig holds (${rows.length} joints)`;
  group.append(summary, ...rows);
  container.append(group);
}
