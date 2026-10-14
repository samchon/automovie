/**
 * Builds the two height planes of a gable and the one height plane of a lean-to roof from stated support lines.
 * Roof position, slope, thickness and candidate regions are inputs of the calling space owner and are not
 * chosen here. Returned pieces are convex planar regions in planar-domain orientation with their top-face
 * equation, and the vertical thickness is the normal thickness divided by the cosine of the slope.
 */
import { clipPlan, type PlanPoint, type RoofPatch } from "./planar-domain";

export interface RoofRules {
  /** Top-face height (m) of the courtyard-side support line (portico eave datum) and of the east gable support line. */
  courtEave: number;
  /** Lean-to roof slope (rad). */
  leanSlope: number;
  /** Gable slope (rad). */
  gableSlope: number;
  /** Slope (rad) of the east gable only. Lower than the sanctuary and porch so the ridge at the south end sits under the coping. */
  eastGableSlope: number;
  /** Normal thickness (m) of the roof mass. */
  normalThickness: number;
  /** Horizontal projection (m) of an open eave end. */
  overhang: number;
  /** Top-face height (m) of the east gable's support line at the centre of the east outer wall. */
  eastWallSupport: number;
  /** Top-face height (m) of the sanctuary gable support line. */
  sanctuarySupport: number;
  /** Top-face height (m) of the porch gable support line. */
  porchSupport: number;
}

/** Vertical thickness at slope. */
export const roofVerticalThickness = (rules: RoofRules, slope: number): number =>
  rules.normalThickness / Math.cos(slope);

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

/**
 * A lean-to roof rising from one support line (lowLine) in the rising direction (+1 toward increasing
 * coordinate). The top face at the support line is height, and the opposite side (the eave projection)
 * drops along the same plane.
 */
export const leanToPlanes = (props: {
  owner: string; id: string; tier: RoofPatch["tier"];
  pieces: readonly PlanPoint[][]; axis: "x" | "z";
  lowLine: number; rising: 1 | -1; height: number;
  slope: number; thickness: number;
}): RoofPatch[] => {
  const gradient = props.rising * Math.tan(props.slope);
  const plane = {
    x: props.axis === "x" ? gradient : 0,
    z: props.axis === "z" ? gradient : 0,
    constant: props.height - gradient * props.lowLine,
  };
  return props.pieces.map((polygon, piece) => ({
    id: `${props.id}.${piece}`, owner: props.owner, surface: `surface.${props.owner}.upper`,
    tier: props.tier, polygon: polygon.map((p) => ({ ...p })), height: plane, thickness: props.thickness,
  }));
};
