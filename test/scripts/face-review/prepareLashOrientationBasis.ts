import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import { type IHingedEyelashCard, hingeEyelashRegion } from "./hingeEyelashRegion";

/** One lid's lash region and the central sagittal angle its cards should have, degrees from the upward vertical. */
export interface IEyelashOrientationLid {
  region: string;
  target: number;
  /** Least sagittal angle any column may take, degrees from the upward vertical. */
  floor?: number;
}

/**
 * Re-orient the lash cards of a connected face basis to a measured central
 * lash direction.
 *
 * The source's lower lash card points far below the horizontal where the
 * measured lateral-photograph direction of the lower central lashes is near
 * horizontal (Kikuchi et al., Glob Dermatol 2015;2:74-77: 50 Japanese adults
 * of 22 to 38 years, upper 61.4 and 71.8 degrees, lower 90.0 and 99.8 degrees
 * from the vertical for men and women). Each named region's cards turn
 * rigidly about their own lash roots to the stated central angle
 * (`hingeEyelashRegion`); roots, chord lengths, fan and curl are unchanged,
 * the other regions and every other surface, material, channel and morph
 * target are untouched, and documents are restamped and the controls name
 * the revision. A region is refused when its vertices are shared with
 * another region, because the turn would move the other one's lashes too.
 * The target is a population value the caller supplies with its source; this
 * function owns only the geometry. Pure: returns new values.
 */
export function prepareLashOrientationBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  surface: string;
  skin: string;
  lids: readonly IEyelashOrientationLid[];
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    lids: { region: string; target: number; cards: IHingedEyelashCard[]; vertices: number }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("A lash orientation revision needs a distinct revision.");
  const surface = basis.surfaces.find((one) => one.id === input.surface);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (surface === undefined || skin === undefined)
    throw new Error("A lash orientation revision needs its lash and skin surfaces.");
  const lids = input.lids.map((lid) => {
    const region = surface.regions.find((one) => one.id === lid.region);
    if (region === undefined || region.uvs === null)
      throw new Error(`No mapped lash region ${lid.region}.`);
    const own = new Set(region.indices);
    for (const other of surface.regions)
      if (other !== region && other.indices.some((vertex) => own.has(vertex)))
        throw new Error(`Region ${lid.region} shares vertices with ${other.id}.`);
    const { moved, cards } = hingeEyelashRegion({
      positions: surface.positions,
      indices: region.indices,
      uvs: region.uvs,
      skin: skin.positions,
      target: lid.target,
      ...(lid.floor === undefined ? {} : { floor: lid.floor }),
    });
    for (const [vertex, point] of moved) surface.positions.splice(3 * vertex, 3, ...point);
    return { region: lid.region, target: lid.target, cards, vertices: moved.size };
  });
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((document) => ({ ...document, basis: input.revision })),
    controls: { ...input.controls, basis: input.revision },
    receipt: { source: input.basis.id, revision: input.revision, lids },
  };
}
