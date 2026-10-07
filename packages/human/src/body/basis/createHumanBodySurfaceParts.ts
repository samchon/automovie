/**
 * Compile the connected body's posed skin and its material-region output.
 * The original vertex identities stay shared through shape, dual-quaternion
 * skinning, optional rest-detail filtering and gravity sag; normals are computed from the final
 * Y-up, Z-forward metre positions before regions split UV or material seams.
 * The basis owns sag neighbourhoods once. The caller owns document-rest and
 * lean-shape evaluation so skin colour, veins and sag reuse the same basis.
 * It receives the already validated pose transforms and material colour,
 * returns new region parts and the unsplit posed surfaces for underwear, and
 * does not establish collision-free or anatomically valid contact.
 */
import {
  autoMovieRenderDigest,
  canonicalizeAutoMovieJson,
} from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { HUMAN_BODY_SKIN_RELIEF_POSE } from "../constants/HUMAN_BODY_SKIN_RELIEF_POSE";
import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyPosedSurface } from "../structures/IAutoMovieHumanBodyPosedSurface";
import type { IHumanBodySurfacePartsInput } from "./IHumanBodySurfacePartsInput";
import { createHumanBodyPosedSurface } from "./createHumanBodyPosedSurface";
import { createHumanBodySurfaceRegionParts } from "./createHumanBodySurfaceRegionParts";
import { humanBodyReliefWeights } from "./humanBodyReliefWeights";

/**
 * Form each posed skin surface once, then project it into its authored material
 * regions. Region buffers do not own the original shared vertex identities;
 * the unsplit positions and normals are also returned for garment cutting.
 * A rest document uses its skinned positions without a sag calculation;
 * anatomical relief weights are evaluated only for posed textured skin.
 * Explicit physicalSource compilation captures native content fingerprints or
 * canonical sample IDs before any UV split. Each document supplies its actual
 * instance to the sole namespace helper. Missing or mismatched registration
 * refuses; omission keeps the original position-derived output.
 * @evidence contracts/common.md#principled-implementation Uses actual preUV source incidence and the existing canonical digest/domain owners; performance changes coordinates without inventing point identity.
 * @evidence contracts/common.md#clear-and-simple-design One compiled source registration accompanies the existing shared-skin and region stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native indices are not output UV ordinals or fake canonical samples, and normal islands do not identify physical points.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes explicit registration from default absence and clinical acceptance.
 * @evidence contracts/modeling.md#emitted-geometry Original source incidence travels beside the unchanged performed coordinate and normal arrays through the same region gather.
 * @evidence contracts/modeling.md#spatial-conventions Positions remain in the original metre frame; dimensionless samples identify points without transforming them.
 * @evidence contracts/modeling.md#shared-boundaries Material and UV aliases of a source point receive the same instance-bound identity.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Registration identifies supplied geometry, not an anatomical quantity or cohort.
 * @evidenceExclude contracts/anatomy.md#permitted-range Pose and source admission remain independent of this incidence registration.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal source registration is not a numerical body sculpt input.
 */
export function createHumanBodySurfaceParts(
  basis: IAutoMovieHumanBodyBasis,
  physicalSource?: "native-indexed" | "source-partition",
) {
  // Compilation captures incidence before performance and UV gathering. The
  // instance is supplied by each admitted document, never a generation alone.
  const registrations = basis.surfaces.map((surface) => {
    if (physicalSource === undefined) return undefined;
    const source = surface.sourcePartition;
    if (physicalSource === "native-indexed") {
      if (source !== undefined)
        throw new Error(
          "Native indexed registration cannot relabel a declared canonical source partition.",
        );
      const fingerprint = autoMovieRenderDigest(
        canonicalizeAutoMovieJson({
          positions: surface.positions,
          indices: surface.indices,
        }),
      );
      return {
        identity: canonicalizeAutoMovieJson({
          mode: "native-indexed",
          basis: basis.id,
          surface: surface.id,
          fingerprint,
        }),
        samples: Array.from(
          { length: surface.positions.length / 3 },
          (_, vertex) => vertex,
        ),
      };
    }
    if (source === undefined || source.generation.trim() === "")
      throw new Error(
        "Physical source-partition registration needs the actual canonical source record.",
      );
    const extent =
      source.originalVertices +
      source.intersections.length +
      (source.refinements?.length ?? 0);
    if (
      !Number.isSafeInteger(source.originalVertices) ||
      source.originalVertices < 3 ||
      !Number.isSafeInteger(extent) ||
      source.samples.length !== surface.positions.length / 3 ||
      source.samples.some(
        (sample) =>
          !Number.isSafeInteger(sample) || sample < 0 || sample >= extent,
      )
    )
      throw new Error(
        "Physical source-partition samples must match the actual preUV surface and safe canonical domain.",
      );
    return { identity: source.generation, samples: Array.from(source.samples) };
  });
  const posedSurface = basis.surfaces.map((surface) =>
    createHumanBodyPosedSurface(surface, basis.joints),
  );
  const regionParts = basis.surfaces.map(createHumanBodySurfaceRegionParts);
  return (input: IHumanBodySurfacePartsInput) => {
    const { document, shaped, posed, transforms, restAll, leanOf, coloured } =
      input;
    const skin = HUMAN_BODY_SKIN_SITES.material;
    // gravity's change in the skin's frame moves the soft tissue; a document
    // at the rest pose the basis was authored in hangs as authored
    const restShape =
      posed &&
      basis.surfaces.some(
        (surface) => surface.sag !== undefined || surface.mush !== undefined,
      )
        ? restAll()
        : null;
    const posedSurfaces: IAutoMovieHumanBodyPosedSurface[] = [];
    const parts: IAutoMovieModel["parts"] = basis.surfaces.flatMap(
      (surface, index) => {
        const positions = posedSurface[index]({
          shaped: shaped.surfaces[index],
          transforms,
          rest: restShape?.surfaces[index] ?? null,
          lean: () => leanOf(index),
          document,
        });
        const normals = areaWeightedNormals(positions, surface.indices);
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
                  normals: areaWeightedNormals(
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
          physical:
            registrations[index] === undefined
              ? undefined
              : {
                  domain: humanPhysicalSourceDomain(
                    document.id,
                    registrations[index]!.identity,
                  ),
                  samples: registrations[index]!.samples,
                },
        });
      },
    );
    return { parts, posedSurfaces };
  };
}
