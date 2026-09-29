/**
 * Compile the connected body's posed skin and its material-region output.
 * The original vertex identities stay shared through shape, dual-quaternion
 * skinning and optional gravity sag; normals are computed from the final
 * Y-up, Z-forward metre positions before regions split UV or material seams.
 * The basis owns sag neighbourhoods once. The caller owns document-rest and
 * lean-shape evaluation so skin colour, veins and sag reuse the same basis.
 * It receives the already validated pose transforms and material colour,
 * returns new region parts and the unsplit posed surfaces for underwear, and
 * does not establish collision-free or anatomically valid contact.
 */
import type { IAutoMovieModel } from "@automovie/interface";

import { portraitNormals } from "../../common/mesh/areaWeightedNormals";
import { HUMAN_BODY_SKIN_RELIEF_POSE } from "../constants/HUMAN_BODY_SKIN_RELIEF_POSE";
import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { createHumanBodyAppearance } from "./appearance/createHumanBodyAppearance";
import { createHumanBodyPosedSurface } from "./createHumanBodyPosedSurface";
import { createHumanBodySurfaceRegionParts } from "./createHumanBodySurfaceRegionParts";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodyReliefWeights } from "./humanBodyReliefWeights";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Form each posed skin surface once, then project it into its authored material
 * regions. Region buffers do not own the original shared vertex identities;
 * the unsplit positions and normals are also returned for garment cutting.
 * A rest document uses its skinned positions without a sag calculation;
 * anatomical relief weights are evaluated only for posed textured skin.
 */
export function createHumanBodySurfaceParts(basis: IAutoMovieHumanBodyBasis) {
  const posedSurface = basis.surfaces.map((surface) =>
    createHumanBodyPosedSurface(surface, basis.joints),
  );
  const regionParts = basis.surfaces.map(createHumanBodySurfaceRegionParts);
  return (input: {
    document: IAutoMovieHumanBodyBasisDocument;
    shaped: ReturnType<typeof evaluateHumanBodyShape>;
    posed: boolean;
    transforms: Parameters<typeof skinHumanBodySurface>[3];
    restAll: () => ReturnType<typeof evaluateHumanBodyShape>;
    leanOf: (index: number) => number[];
    coloured: ReturnType<ReturnType<typeof createHumanBodyAppearance>>["coloured"];
  }) => {
    const { document, shaped, posed, transforms, restAll, leanOf, coloured } = input;
    const skin = HUMAN_BODY_SKIN_SITES.material;
    // gravity's change in the skin's frame moves the soft tissue; a document
    // at the rest pose the basis was authored in hangs as authored
    const restShape =
      posed && basis.surfaces.some((surface) => surface.sag !== undefined)
        ? restAll()
        : null;
    const posedSurfaces: { positions: number[]; normals: number[] }[] = [];
    const parts: IAutoMovieModel["parts"] = basis.surfaces.flatMap(
      (surface, index) => {
        const positions = posedSurface[index]({
          shaped: shaped.surfaces[index],
          transforms,
          rest: restShape?.surfaces[index] ?? null,
          lean: () => leanOf(index),
          document,
        });
        const normals = portraitNormals(positions, surface.indices);
        posedSurfaces[index] = { positions, normals };
        // the skin's anatomical relief follows the pose: its creases deepen
        // where a bent joint folds the skin and its wrinkles flatten where it
        // stretches it, read on the body at rest
        const reliefWeights =
          document.skinDetail === undefined ||
          surface.relief?.material !== skin ||
          !posed
            ? null
            : (() => {
                const atRestNow = restAll();
                return humanBodyReliefWeights({
                  basis,
                  table: HUMAN_BODY_SKIN_RELIEF_POSE,
                  positions: atRestNow.surfaces[index],
                  normals: portraitNormals(
                    atRestNow.surfaces[index],
                    surface.indices,
                  ),
                  landmarks: atRestNow.landmarks,
                  pose: document.pose ?? [],
                });
              })();
        return regionParts[index]({
          positions,
          normals,
          skinMaterial: skin,
          colors: coloured === null ? null : coloured.colors[index],
          reliefWeights,
        });
      },
    );
    return { parts, posedSurfaces };
  };
}
