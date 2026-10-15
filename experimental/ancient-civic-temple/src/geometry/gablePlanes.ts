import { clipPlan } from "./clipPlan";
import type { PlanPoint } from "./PlanPoint";
import type { RoofPatch } from "./RoofPatch";

/**
 * The ridge between two support lines. When both support lines have the same top height the ridge is the
 * midpoint; otherwise it moves to the line where two faces of the same slope meet. The candidate region is
 * taken independently of the support lines and may be several convex pieces; each piece is split at the ridge line.
 */

export const gablePlanes = (props: {
  owner: string; id: string; tier: RoofPatch["tier"];
  pieces: readonly PlanPoint[][]; axis: "x" | "z";
  supportLow: number; supportHigh: number; height: number; highHeight?: number;
  slope: number; thickness: number;
}): RoofPatch[] => {
  const rise = Math.tan(props.slope);
  const highHeight = props.highHeight ?? props.height;
  const ridge = (highHeight - props.height + (props.supportLow + props.supportHigh) * rise) / (2 * rise);
  return props.pieces.flatMap((polygon, piece) => [-1, 1].flatMap((side) => {
    const gradient = -side * rise;
    // side<0: the face rising from the lower-coordinate support line; side>0: the face rising from the higher-coordinate one.
    const plane = {
      x: props.axis === "x" ? gradient : 0,
      z: props.axis === "z" ? gradient : 0,
      constant: side < 0 ? props.height - rise * props.supportLow : highHeight + rise * props.supportHigh,
    };
    const half = clipPlan(polygon, {
      x: props.axis === "x" ? side : 0,
      z: props.axis === "z" ? side : 0,
      constant: -side * ridge,
    });
    return half.length === 0 ? [] : [{
      id: `${props.id}.${piece}.${side < 0 ? "low" : "high"}`,
      owner: props.owner, surface: `surface.${props.owner}.upper`, tier: props.tier,
      polygon: half, height: plane, thickness: props.thickness,
    }];
  }));
};
