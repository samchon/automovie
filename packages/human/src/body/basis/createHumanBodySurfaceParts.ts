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

import { createHumanFaceBasisRegion } from "../../face/basis/createHumanFaceBasisRegion";
import { humanFaceBasisRegion } from "../../face/basis/humanFaceBasisRegion";
import { portraitNormals } from "../../face/mesh/portraitNormals";
import { HUMAN_BODY_SKIN_RELIEF_POSE } from "../constants/HUMAN_BODY_SKIN_RELIEF_POSE";
import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { createHumanBodyAppearance } from "./createHumanBodyAppearance";
import { createHumanBodySurfaceSag } from "./createHumanBodySurfaceSag";
import { evaluateHumanBodyShape } from "./evaluateHumanBodyShape";
import { humanBodyReliefWeights } from "./humanBodyReliefWeights";
import { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Form each posed skin surface once, then project it into its authored material
 * regions. Region buffers do not own the original shared vertex identities;
 * the unsplit positions and normals are also returned for garment cutting.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Skins the shaped connected surface and forms its deterministic material regions without replacing its shared topology.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Applies the declared pose, gravity sag and relief weights before deriving common normals and material-region meshes.
 */
export function createHumanBodySurfaceParts(basis: IAutoMovieHumanBodyBasis) {
  const sags = basis.surfaces.map((surface) =>
    surface.sag === undefined
      ? null
      : createHumanBodySurfaceSag(surface, surface.sag),
  );
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
      posed && sags.some((sag) => sag !== null) ? restAll() : null;
    const posedSurfaces: { positions: number[]; normals: number[] }[] = [];
    const parts: IAutoMovieModel["parts"] = basis.surfaces.flatMap(
      (surface, index) => {
        const skinned = skinHumanBodySurface(
          shaped.surfaces[index],
          surface.skin,
          basis.joints,
          transforms,
        );
        const sag = sags[index];
        const positions = (() => {
          if (sag === null || restShape === null) return skinned;
          const declared = surface.sag!;
          const lean = leanOf(index);
          // the skin's rest down after the pose: each vertex's transform is
          // rigid, so a point a centimetre below it lands a centimetre along it
          const below = skinHumanBodySurface(
            shaped.surfaces[index].map((value, i) =>
              i % 3 === 1 ? value - 0.01 : value,
            ),
            surface.skin,
            basis.joints,
            transforms,
          );
          const softness = Math.min(
            declared.softness.range[1],
            Math.max(
              declared.softness.range[0],
              Object.entries(declared.softness.channels).reduce(
                (total, [id, gain]) => total + gain * (document.shape[id] ?? 0),
                declared.softness.base,
              ),
            ),
          );
          return sag({
            rest: restShape.surfaces[index],
            lean,
            skinned,
            hanging: below.map((value, i) => (value - skinned[i]) / 0.01),
            softness,
          });
        })();
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
        return surface.regions.map((region) => {
          const mesh =
            coloured === null || region.material !== skin
              ? humanFaceBasisRegion(positions, normals, region)
              : createHumanFaceBasisRegion(region)(
                  positions,
                  normals,
                  coloured.colors[index],
                );
          if (reliefWeights !== null && region.material === skin) {
            // gathered through the region's own source correspondence
            const triples = reliefWeights.flatMap((w) => [w, w, w]);
            const gathered = createHumanFaceBasisRegion(region)(
              triples,
              triples,
            ).positions;
            mesh.reliefWeights = gathered.filter((_, i) => i % 3 === 0);
          }
          return {
            id: region.id,
            name: region.id,
            material: region.material,
            geometry: { type: "mesh" as const, mesh },
            attachedBone: null,
            transform: null,
          };
        });
      },
    );
    return { parts, posedSurfaces };
  };
}
