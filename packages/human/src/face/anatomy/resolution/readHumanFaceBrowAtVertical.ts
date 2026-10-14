import type {
  IAutoMovieHumanFacePeriocular as ImportedIAutoMovieHumanFacePeriocular,
  IAutoMovieHumanFacePeriocularComponent as ImportedIAutoMovieHumanFacePeriocularComponent,
  IHumanFaceMeasurementSurface as ImportedIHumanFaceMeasurementSurface,
} from "@automovie/human";

import type { IHumanFaceBrowSection } from "./IHumanFaceBrowSection";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Where the vertical line at head-frame X `x` crosses one eyebrow on the build's final surface: the lowest and highest points where the posed brow card's triangles of that side meet the plane of constant X.
 *
 * The side's triangles are those whose three vertices belong to the periocular registration's brow vertices of that side. A vertical that misses the card returns a gap, and a basis without the registration returns its gap.
 *
 * @evidence contracts/common.md#principled-implementation Registered brow-card triangle edges intersect the requested fixed-X plane and select lowest/highest Y crossings.
 * @evidence contracts/common.md#clear-and-simple-design The card envelope instrument stays distinct from generated shaft or actual opaque-hair acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No registration/missed crossing returns a gap; coplanar constant-X edges are skipped, and replaced card surface refusal propagates to report assembly.
 * @evidence contracts/common.md#meaningful-documentation Coordinates and requested X use head metres and no alpha-texture boundary is sampled.
 * @evidence contracts/performance.md#efficient-algorithms The surface triangle scan is linear with a brow-vertex membership set and fixed edge work.
 * @evidence contracts/performance.md#reuse-equivalent-work One current surface read and membership set serve all candidate triangles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two owned crossing vectors escape; full surface copies and membership sets are temporary.
 *
 * @author Samchon
 */
export function readHumanFaceBrowAtVertical(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  x: number,
): IHumanFaceBrowSection | IHumanFaceMeasurementGap {
  const periocular: ImportedIAutoMovieHumanFacePeriocular | undefined =
    context.basis.periocular;
  if (periocular === undefined)
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const brow: ImportedIAutoMovieHumanFacePeriocularComponent =
    periocular[side].brow;
  const own: Set<number> = new Set(brow.vertices);
  const surface: ImportedIHumanFaceMeasurementSurface = context.surface(
    brow.surface,
  );
  const point: (vertex: number) => { x: number; y: number; z: number } = (
    vertex: number,
  ): { x: number; y: number; z: number } => ({
    x: surface.positions[vertex * 3],
    y: surface.positions[vertex * 3 + 1],
    z: surface.positions[vertex * 3 + 2],
  });
  let inferior: IHumanFaceBrowSection["inferior"] | null = null;
  let superior: IHumanFaceBrowSection["superior"] | null = null;
  for (let at: number = 0; at < surface.indices.length; at += 3) {
    const corners: number[] = [
      surface.indices[at],
      surface.indices[at + 1],
      surface.indices[at + 2],
    ];
    if (!corners.every((vertex: number): boolean => own.has(vertex))) continue;
    for (let edge: number = 0; edge < 3; edge++) {
      const a: { x: number; y: number; z: number } = point(corners[edge]);
      const b: { x: number; y: number; z: number } = point(
        corners[(edge + 1) % 3],
      );
      if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
      const t: number = (x - a.x) / (b.x - a.x);
      const p: { x: number; y: number; z: number } = {
        x,
        y: a.y + t * (b.y - a.y),
        z: a.z + t * (b.z - a.z),
      };
      if (inferior === null || p.y < inferior.y) inferior = p;
      if (superior === null || p.y > superior.y) superior = p;
    }
  }
  if (inferior === null || superior === null)
    return {
      reason: `missing rule: the vertical does not cross the ${side} brow`,
    };
  return { inferior, superior };
}
