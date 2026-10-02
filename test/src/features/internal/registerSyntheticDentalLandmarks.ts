import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

import type { IDentalClinicalRegistration } from "../../../scripts/face-review/IDentalClinicalRegistration";
import type { IDentalSurfaceAnchor } from "../../../scripts/face-review/IDentalSurfaceAnchor";
import { meshComponents } from "../../../scripts/face-review/prepareGingivaBasis";

/**
 * Register known landmarks of the analytic box crowns used by gingival tests.
 * Each box's front incisal edge is vertices 2/3 and cervical edge is 6/7;
 * the fixture supplies the actual gingival-edge anchors independently.
 * Component names are read from topology, not inferred from a human mesh.
 * This synthetic registration proves arithmetic, not anatomical acquisition.
 */
export function registerSyntheticDentalLandmarks(
  basis: IAutoMovieHumanFaceBasis,
  crownStarts: readonly number[],
  zeniths: readonly IDentalSurfaceAnchor[],
): Map<number, IDentalClinicalRegistration> {
  const surface = basis.surfaces.find((one) => one.id === basis.contact!.incisors.surface)!;
  const component = meshComponents(surface.positions.length / 3, surface.indices);
  return new Map(crownStarts.map((start, at) => {
    const incisal = { vertices: [start + 2, start + 3], weights: [0.5, 0.5] };
    return [component[start], {
      basisRevision: basis.id,
      registrationId: "analytic-box-crown-" + at,
      axis: { incisal, cervical: { vertices: [start + 6, start + 7], weights: [0.5, 0.5] } },
      incisalOrCusp: incisal,
      gingivalZenith: zeniths[at],
    }];
  }));
}
