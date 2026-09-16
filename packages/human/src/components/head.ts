import type { IAutoMovieModelPart } from "@automovie/interface";

import {
  portraitNormals,
  portraitPart,
  portraitRegion,
} from "../geometry/geometry";
import type {
  IPortraitComponent,
  IPortraitComponentHost,
} from "../geometry/portraitComponents";
import type { IPortraitSurfaceLayer } from "../geometry/portraitSurface";
import { sealPortraitContactSeams } from "../geometry/sealPortraitContactSeams";
import {
  type IPortraitHeadFormation,
  preparePortraitHead,
} from "./headPreparation";

export type { IPortraitHeadPerformance } from "./headPreparation";

/**
 * Materialize a connected head and its dependent anatomical interiors.
 * preparePortraitHead owns unchanged-host fitting, attachment, continuation,
 * refinement, layers, replacements and final proposals. This consumer seals
 * declared contacts before computing one shared normal field and packing each
 * material region; component finishers then read that same final surface.
 *
 * Host, source and refined positions use millimetres. Part packing converts
 * geometry to model units through portraitPart. Resident vertex IDs survive
 * sealing even when its index equivalence removes coincident seam faces.
 * Linear skin colours use per-corner values when contact welding preserved
 * distinct material samples. Independent interiors receive no stale normals.
 * The caller's host is retained and each call constructs new output arrays.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Publishes the joined skin and dependent interiors produced from one prepared component assembly.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Seals declared contacts, derives common normals and material regions, then finishes interiors from the resulting joined surface.
 */
export function buildPortraitHead(
  host: IPortraitComponentHost,
  components: IPortraitComponent[],
  rounds: number,
  surfaceLayers: readonly IPortraitSurfaceLayer[] = [],
  anatomy: IPortraitHeadFormation = {},
) {
  const { surface, regions, finishers, source } = preparePortraitHead(
    host,
    components,
    rounds,
    surfaceLayers,
    anatomy,
  );
  const refined = sealPortraitContactSeams(
    surface,
    finishers.flatMap((attached) => attached.closures ?? []),
  );
  const packed = refined.positions.flat(),
    normals = portraitNormals(packed, refined.indices);
  const parts: IAutoMovieModelPart[] = [];
  for (let group = 0; group < regions.length; group++) {
    const selected: number[] = [];
    const colors: number[][] | undefined =
      refined.colors === undefined || regions[group].material !== "skin"
        ? undefined
        : [];
    for (let i = 0; i < refined.groups.length; i++)
      if (refined.groups[i] === group) {
        selected.push(...refined.indices.slice(i * 3, i * 3 + 3));
        if (colors !== undefined)
          colors.push(
            ...(refined.cornerColors === undefined
              ? refined.indices
                  .slice(i * 3, i * 3 + 3)
                  .map((id) => refined.colors![id])
              : refined.cornerColors.slice(i * 3, i * 3 + 3)),
          );
      }
    if (selected.length !== 0)
      parts.push(
        portraitPart(
          regions[group].id,
          portraitRegion(packed, normals, selected, colors),
          regions[group].material,
        ),
      );
  }
  for (const attached of finishers) parts.push(...attached.finish(refined));
  return { parts, refined, source };
}
