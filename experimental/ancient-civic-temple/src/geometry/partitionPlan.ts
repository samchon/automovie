import { edgeInside } from "./edgeInside";
import { clipPlan } from "./clipPlan";
import { PlanPoint } from "./PlanPoint";

/** Returns the intersection with a convex cutter and the non-overlapping outside pieces. */

export const partitionPlan = (
  subject: readonly PlanPoint[],
  cutter: readonly PlanPoint[]
): { inside: PlanPoint[]; outside: PlanPoint[][]; } => {
  let inside = subject.map((p) => ({ ...p }));
  const outside: PlanPoint[][] = [];
  for (let i = 0; i < cutter.length && inside.length > 0; ++i) {
    const plane = edgeInside(cutter[i]!, cutter[(i + 1) % cutter.length]!);
    const rejected = clipPlan(inside, {
      x: -plane.x, z: -plane.z, constant: -plane.constant,
    });
    if (rejected.length > 0) outside.push(rejected);
    inside = clipPlan(inside, plane);
  }
  return { inside, outside };
};
