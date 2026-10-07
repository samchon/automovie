import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import { createConnectedDisabledRow } from "./createConnectedDisabledRow";

/**
 * Append the motions the body view's rig holds, one disabled row per joint
 * and held axis, under one collapsed group.
 *
 * A joint whose constraint gives an axis no range does not move on it: the
 * fingers have no abduction (no splay), the thumb's first metacarpal has
 * neither abduction nor twist (no opposition), the clavicle joint has no
 * twist, and the scapula follows the arm only through the source's
 * scapulohumeral couplings. The joint rows show this per joint once it is
 * picked; this group lists every held axis at once, derived from the basis's
 * joints, so a missing motion is named rather than discovered. A joint with
 * a thorax-relative shoulder goal is moved by that goal, not by axes, and is
 * not listed. Only joints matching the search are listed; nothing is
 * appended when none match.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names every joint axis the source rig holds instead of leaving the missing motion to be discovered.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Lists each held joint axis as a disabled row derived from the basis's joint constraints.
 * @author Samchon
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
    const constraint = joint.constraint;
    const held = (["flexion", "abduction", "twist"] as const).filter(
      (axis) => constraint[axis] === null,
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
  const group = dom.createElement("details");
  const summary = dom.createElement("summary");
  summary.textContent = `Motions this rig holds (${rows.length} joints)`;
  group.append(summary, ...rows);
  container.append(group);
}
