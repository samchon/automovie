import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import { resolveHumanFaceOralArchFrame } from "@automovie/human/face/anatomy/oral/resolveHumanFaceOralArchFrame";

import { measureHumanSourceCrownDimensions } from "./measureHumanSourceCrownDimensions.ts";
import type { IHumanSourceCrownAffineFrame } from "./structures/IHumanSourceCrownAffineFrame.ts";

/**
 * Register all 32 source crowns on independent orthonormal affine axes.
 * Height is the existing port-centroid to crown-centroid source axis. Width
 * is the ordered cervical arch tangent projected perpendicular to height;
 * depth completes that frame. A terminal tangent uses its single neighbor.
 * Singular support refuses instead of borrowing head axes. These source
 * spans are not clinical mesiodistal/buccolingual/gingival measurements.
 * Positive scales on the three axes have determinant sx*sy*sz>0, retaining
 * source orientation and native cervical/closure correspondence.
 */
export function createHumanSourceCrownAffineFrames(face: IAutoMovieHumanFaceBasis): IHumanSourceCrownAffineFrame[] {
  const dental = face.surfaces.find((surface) => surface.id === "Human.teeth_base");
  if (dental === undefined) throw new Error("Source crown frames need the actual dental surface.");
  const crowns = readHumanFaceOralCrowns(face), dimensions = measureHumanSourceCrownDimensions(face);
  const result: IHumanSourceCrownAffineFrame[] = [];
  for (const mandibular of [false, true]) {
    const arch = resolveHumanFaceOralArchFrame(crowns.filter((crown) => crown.mandibular === mandibular), dental.positions, mandibular);
    const centre = (at: number): number[] => {
      const crown = crowns.find((one) => one.id === arch.stations[at].id)!;
      return dimensions.find((one) => one.crown === crown.id)!.cervicalCentreMetres;
    };
    arch.stations.forEach((station, at) => {
      const crown = crowns.find((one) => one.id === station.id)!, dimension = dimensions.find((one) => one.crown === crown.id)!;
      const heightAxis = [...dimension.crownAxis];
      const before = centre(Math.max(0, at - 1)), after = centre(Math.min(arch.stations.length - 1, at + 1));
      const tangent = after.map((value, axis) => value - before[axis]);
      const along = tangent.reduce((sum, value, axis) => sum + value * heightAxis[axis], 0);
      const projected = tangent.map((value, axis) => value - along * heightAxis[axis]), length = Math.hypot(...projected);
      if (!(length > 0) || !Number.isFinite(length)) throw new Error("Source crown has no independent cervical arch tangent: " + crown.id);
      const widthAxis = projected.map((value) => value / length);
      const depthAxis = [heightAxis[1] * widthAxis[2] - heightAxis[2] * widthAxis[1], heightAxis[2] * widthAxis[0] - heightAxis[0] * widthAxis[2], heightAxis[0] * widthAxis[1] - heightAxis[1] * widthAxis[0]];
      const axes = [widthAxis, depthAxis, heightAxis];
      const extents = axes.map((direction) => {
        const values = crown.vertices.map((vertex) => direction.reduce((sum, value, axis) => sum + value * (dental.positions[3 * vertex + axis] - dimension.cervicalCentreMetres[axis]), 0));
        return Math.max(...values) - Math.min(...values);
      });
      if (extents.some((value) => !(value > 0) || !Number.isFinite(value))) throw new Error("Source crown has an empty geometric axis span: " + crown.id);
      const paired = (mandibular ? 8 : 0) + Number(crown.id[1]) - 1;
      result.push({ crown: crown.id, vertices: [...crown.vertices], centreMetres: [...dimension.cervicalCentreMetres], widthAxis, depthAxis, heightAxis,
        sourceExtentsMetres: extents, parameterIndices: [3 * paired, 3 * paired + 1, 3 * paired + 2],
        qualification: "Actual cervical-port/crown geometry and ordered arch tangent. Axes and spans are source conventions, not clinical CEJ, cusp or population-fitted measurements." });
    });
  }
  return result;
}
