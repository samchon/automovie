import type { IAutoMovieVector3 } from "@automovie/interface";
import { containsPoint } from "./containsPoint";
import type { PlanPoint } from "./PlanPoint";
import type { RoofPatch } from "./RoofPatch";
import { along } from "./along";
import { splitVerticalFace } from "./splitVerticalFace";
import { prismFaces } from "./prismFaces";
import { wallColumns } from "./wallColumns";
import { WallFace } from "./WallFace";
import { WallSpec } from "./WallSpec";

/** The roof piece (of that unit) 1mm outward along the normal from a face's midpoint. */
const adjacentPatch = (
  roof: readonly RoofPatch[], tier: RoofPatch["tier"], corners: readonly IAutoMovieVector3[], normal: PlanPoint
): RoofPatch | undefined => {
  const cx = corners.reduce((s, c) => s + c.x, 0) / corners.length;
  const cz = corners.reduce((s, c) => s + c.z, 0) / corners.length;
  const probe = { x: cx + normal.x * 1e-3, z: cz + normal.z * 1e-3 };
  return roof.find((r) => r.tier === tier && containsPoint(r.polygon, probe));
};
/** Classifies a column prism's faces by surface owner, and splits stated long faces into bands by the adjacent roof. */

export const wallFaces = (wall: WallSpec, roof: readonly RoofPatch[]): WallFace[] => {
  const coordinates = wall.plan.map((p) => along(wall.axis, p));
  const min = Math.min(...coordinates);
  const max = Math.max(...coordinates);
  const surface = (name: string) => name.startsWith("surface.") ? name : `surface.${wall.owner}.${name}`;
  const faces: WallFace[] = [];
  for (const column of wallColumns(wall, roof)) {
    for (const interval of column.intervals) {
      for (const face of prismFaces(column.polygon, interval.bottom, interval.top)) {
        if (face.side === "top") {
          const owner = !interval.uppermost ? "reveal"
            : column.segment.top.kind === "flat"
              ? column.segment.top.coping === undefined ? column.segment.top.surface : "joint"
              : "bearing";
          faces.push({ surface: surface(owner), corners: face.corners });
          continue;
        }
        if (face.side === "bottom") {
          faces.push({ surface: surface(interval.bottom.constant === wall.bottom ? "footing" : "reveal"), corners: face.corners });
          continue;
        }
        const perpendicular = wall.axis === "x" ? face.normal.z : face.normal.x;
        const lengthwise = wall.axis === "x" ? face.normal.x : face.normal.z;
        if (Math.abs(perpendicular) > 1 - 1e-9) {
          const lowSide = perpendicular < 0;
          const owner = lowSide ? column.segment.low : column.segment.high;
          const split = lowSide ? column.segment.lowSplit : column.segment.highSplit;
          const neighbor = split === undefined ? undefined : adjacentPatch(roof, split.tier, face.corners, face.normal);
          if (split === undefined || neighbor === undefined) {
            faces.push({ surface: surface(owner), corners: face.corners });
          } else {
            faces.push(...splitVerticalFace(face.corners, neighbor.height, neighbor.thickness, {
              below: surface(owner), within: surface(split.within ?? "joint"), above: surface(split.above),
            }));
          }
        } else if (Math.abs(lengthwise) > 1 - 1e-9) {
          const at = along(wall.axis, { x: face.corners[0]!.x, z: face.corners[0]!.z });
          const owner = Math.abs(at - min) < 1e-9 ? wall.ends?.low ?? "end"
            : Math.abs(at - max) < 1e-9 ? wall.ends?.high ?? "end" : "reveal";
          faces.push({ surface: surface(owner), corners: face.corners });
        } else {
          faces.push({ surface: surface("joint"), corners: face.corners });
        }
      }
    }
  }
  return faces;
};
