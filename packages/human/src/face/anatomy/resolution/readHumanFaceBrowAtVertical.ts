import type { IHumanFaceBrowSection } from "./IHumanFaceBrowSection";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Where the vertical line at head-frame X `x` crosses one eyebrow on the
 * build's final surface: the lowest and highest points where the posed brow
 * card's triangles of that side meet the plane of constant X.
 *
 * The side's triangles are those whose three vertices belong to the
 * periocular registration's brow vertices of that side. A vertical that misses
 * the card returns a gap, and a basis without the registration returns its gap.
 *
 * @author Samchon
 */
export function readHumanFaceBrowAtVertical(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  x: number,
): IHumanFaceBrowSection | IHumanFaceMeasurementGap {
  const periocular = context.basis.periocular;
  if (periocular === undefined)
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const brow = periocular[side].brow;
  const own = new Set(brow.vertices);
  const surface = context.surface(brow.surface);
  const point = (vertex: number) => ({
    x: surface.positions[vertex * 3],
    y: surface.positions[vertex * 3 + 1],
    z: surface.positions[vertex * 3 + 2],
  });
  let inferior: IHumanFaceBrowSection["inferior"] | null = null;
  let superior: IHumanFaceBrowSection["superior"] | null = null;
  for (let at = 0; at < surface.indices.length; at += 3) {
    const corners = [
      surface.indices[at],
      surface.indices[at + 1],
      surface.indices[at + 2],
    ];
    if (!corners.every((vertex) => own.has(vertex))) continue;
    for (let edge = 0; edge < 3; edge++) {
      const a = point(corners[edge]);
      const b = point(corners[(edge + 1) % 3]);
      if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
      const t = (x - a.x) / (b.x - a.x);
      const p = { x, y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) };
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
