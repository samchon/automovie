import { edgeInside } from "./edgeInside";
import { planeHeight } from "./planeHeight";
import type { PlanPoint } from "./PlanPoint";


/**
 * Whether a plan point lies inside a counter-clockwise convex polygon, allowing `margin` outside
 * each edge.
 */
export const containsPoint = (polygon: readonly PlanPoint[], point: PlanPoint, margin = 1e-9): boolean => polygon.every((p, i) => planeHeight(edgeInside(p, polygon[(i + 1) % polygon.length]!), point) >= -margin);
