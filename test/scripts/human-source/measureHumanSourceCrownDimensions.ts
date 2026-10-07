import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceCrownDimension } from "./structures/IHumanSourceCrownDimension.ts";

/**
 * Read crown projection heights about the source's exact cervical ports.
 *
 * The rooted axis is the unit vector from the port's vertex centroid toward
 * the crown's vertex centroid. The height is the greatest projection of a
 * crown vertex along that axis from the port centre. The full crown axial
 * span is recorded separately as greatest minus smallest projection.
 * Cervical axial extrema
 * expose a nonplanar port instead of silently interpreting its mean as CEJ.
 * Units are metres in the neutral canonical head frame. A vanishing axis or
 * nonpositive height refuses by identity; neither gets a fitted default.
 *
 * Cao et al., International Journal of Clinical Practice 2023, 2485368,
 * DOI 10.1155/2023/2485368, measured clinical height along a tooth long axis
 * from gingival margin to incisal-edge midpoint, buccal cusp, or the midpoint
 * between molar buccal cusps in 100 Han adults aged 18–24 with normal occlusion.
 * This source has no measured gingival margin or cusp correspondence. These
 * port-centre extrema are geometric source dimensions, not that protocol or
 * population's measured heights; its mean cannot replace an unknown here.
 */
export function measureHumanSourceCrownDimensions(
  face: IAutoMovieHumanFaceBasis,
): IHumanSourceCrownDimension[] {
  const dental = face.surfaces.find(
    (surface) => surface.id === "Human.teeth_base",
  );
  if (dental === undefined)
    throw new Error("Crown dimensions need the source dental surface.");
  const positions = dental.positions;
  const centre = (vertices: readonly number[]): number[] =>
    [0, 1, 2].map(
      (axis) =>
        vertices.reduce(
          (sum, vertex) => sum + positions[3 * vertex + axis],
          0,
        ) / vertices.length,
    );
  return readHumanFaceOralCrowns(face).map(
    (crown): IHumanSourceCrownDimension => {
      const cervical = centre(crown.cervical),
        body = centre(crown.vertices);
      const axis = body.map((value, at) => value - cervical[at]);
      const rank = Math.hypot(...axis);
      if (!(rank > 0) || !Number.isFinite(rank))
        throw new Error(`Crown ${crown.id} has no finite rooted source axis.`);
      const unit = axis.map((value) => value / rank);
      const projection = (vertex: number): number =>
        unit.reduce(
          (sum, value, at) =>
            sum + value * (positions[3 * vertex + at] - cervical[at]),
          0,
        );
      const extreme = crown.vertices.reduce((best, vertex) =>
        projection(vertex) > projection(best) ? vertex : best,
      );
      const height = projection(extreme);
      if (!(height > 0) || !Number.isFinite(height))
        throw new Error(
          `Crown ${crown.id} has no positive source projection height.`,
        );
      const ring = crown.cervical.map(projection);
      const all = crown.vertices.map(projection);
      const minimum = Math.min(...all),
        maximum = Math.max(...all);
      return {
        crown: crown.id,
        cervicalCentreMetres: cervical,
        crownAxis: unit,
        heightMetres: height,
        crownAxisRangeMetres: [minimum, maximum],
        axialSpanMetres: maximum - minimum,
        cervicalAxisRangeMetres: [Math.min(...ring), Math.max(...ring)],
        extremeVertex: extreme,
        qualification:
          "Source cervical-centroid to crown extreme along its centroid axis; no gingival-margin, buccal-cusp or clinical long-axis correspondence.",
      };
    },
  );
}
