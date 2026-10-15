import type { PlanPoint } from "./PlanPoint";
import type { RoofPatch } from "./RoofPatch";

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
