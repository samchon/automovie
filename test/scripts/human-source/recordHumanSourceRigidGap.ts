import type { IHumanSourceRigidGap } from "./structures/IHumanSourceRigidGap.ts";

/**
 * Issues that own each rigid part's size relative to the head: the part's own
 * element issue (optics, measured dentition, tongue form and motion) and the
 * head-to-stature relation.
 */
const RIGID_GAP_OWNERS: Readonly<Record<string, readonly string[]>> = {
  "Human.low-poly": ["#2728", "#2704"],
  "Human.teeth_base": ["#2738", "#2704"],
  "Human.tongue01": ["#2739", "#2704"],
};

/**
 * Record a rigid part's motion against the skin as a named gap. A rigid part
 * cannot follow skin that a body control scales around it, and no measured
 * rule ties its size to stature or head size, so no scale is invented; the
 * gap names who owns that rule. A rigid part without an owner is refused.
 */
export function recordHumanSourceRigidGap(partId: string, count: number, sizes: Record<string, number>): IHumanSourceRigidGap {
  const owners = RIGID_GAP_OWNERS[partId];
  if (owners === undefined) throw new Error(`Rigid part ${partId} has no gap owner.`);
  return {
    gap: {
      subject: partId,
      quantity: "largest motion of a part vertex relative to its nearest skin point under a body control at weight one",
      sizes,
      owners: [...owners],
      reason: "the part is carried rigidly; the skin around it is scaled by body macros, and no measured rule ties this part's size to stature or head size, so no scale is invented",
    },
    losses: Object.entries(sizes).map(([name, size]) => ({
      basis: "face",
      surface: partId,
      row: name,
      kind: "part-rigid-relative-motion",
      vertices: count,
      maximumMetres: size,
      reason: `rigid part does not scale with the skin around it; owners ${owners.join(", ")}`,
    })),
  };
}
