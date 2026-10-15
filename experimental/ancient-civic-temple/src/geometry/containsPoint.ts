import { edgeInside } from "./edgeInside";
import { planeHeight } from "./planeHeight";
import type { PlanPoint } from "./PlanPoint";


export const containsPoint = (polygon: readonly PlanPoint[], point: PlanPoint, margin = 1e-9): boolean => polygon.every((p, i) => planeHeight(edgeInside(p, polygon[(i + 1) % polygon.length]!), point) >= -margin);
