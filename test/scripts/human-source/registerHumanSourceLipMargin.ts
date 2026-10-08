import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanBasisSourcePartition } from "@automovie/human/common/basis/IAutoMovieHumanBasisSourcePartition";

import { compileHumanSourceLipMaterialCourse } from "./compileHumanSourceLipMaterialCourse.ts";
import { findHumanSourceLipMarginPairs } from "./findHumanSourceLipMarginPairs.ts";
import type { IHumanSourceLipMarginRegistration } from "./structures/IHumanSourceLipMarginRegistration.ts";

/**
 * Register native contact courses on the current source skin.
 * Current positions, lips-region incidence, jaw axis and central contact ports
 * are explicit prerequisites. The existing pair owner retains its original
 * 2 mm stations, central ports and stop order. The native facet-course owner
 * constructs their continuous support before positive disks are registered.
 * Source preparation and P1 publication call this same registration, so a legacy
 * face need not carry a field that P1 only creates after source preparation.
 * This registration does not seal lips or supply clinical resting geometry.
 */
export function registerHumanSourceLipMargin(
  face: IAutoMovieHumanFaceBasis,
  positions: readonly number[],
  sourcePartition?: IAutoMovieHumanBasisSourcePartition,
): IHumanSourceLipMarginRegistration {
  const contact = face.contact;
  const surface = face.surfaces.find((one) => one.id === contact?.lips.surface);
  const region = surface?.regions.find((one) => one.id.endsWith("/lips"));
  if (
    contact === undefined ||
    surface === undefined ||
    region === undefined ||
    face.articulation === undefined ||
    positions.length !== surface.positions.length
  )
    throw new Error(
      "Source lip margin registration needs current contact skin, vermilion incidence and articulation.",
    );
  const margin = findHumanSourceLipMarginPairs(
    positions,
    region.indices,
    face.articulation.jaw.axis,
  );
  const partition = sourcePartition ?? surface.sourcePartition;
  if (partition === undefined)
    throw new Error("Continuous source lip registration needs actual root parent/sample correspondence.");
  const axis = face.articulation.jaw.axis;
  const along = (vertex: number): number => positions[3 * vertex] * axis[0] + positions[3 * vertex + 1] * axis[1] + positions[3 * vertex + 2] * axis[2];
  const course = (side: "upper" | "lower") => {
    const component = margin[side];
    const extreme = (sense: 1 | -1): number => component.reduce((best, vertex) =>
      sense * along(vertex) > sense * along(best) || (along(vertex) === along(best) && vertex < best) ? vertex : best);
    const stops = [extreme(-1), ...[...new Set([...margin.pairs.map((pair) => pair[side]), contact.lips[side]])]
      .sort((a, b) => along(a) - along(b) || a - b), extreme(1)];
    return compileHumanSourceLipMaterialCourse({
      surface: { ...surface, positions: [...positions], sourcePartition: partition },
      component, regionIndices: region.indices, stops, axis,
    });
  };
  const upper = course("upper"), lower = course("lower");
  return {
    margin: { kind: "material", upper, lower },
    record: {
      rule: "Original 2 mm interior contact stations/central ports retain native facet/edge barycentric correspondence. Native along-level slabs and identical critical ports construct the course; positive material disks register all used facets. Actual represented along/height validates the course; unsupported construction is not proof that no continuous monotone path exists.",
      limitMetres: margin.limitMetres, stationMetres: margin.stationMetres,
      upperPoints: upper.points.length, lowerPoints: lower.points.length,
      upperStops: upper.stops.length, lowerStops: lower.stops.length,
    },
  };
}
