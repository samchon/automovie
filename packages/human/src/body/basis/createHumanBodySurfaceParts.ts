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
 * Form each posed connected skin surface once, then gather its authored material regions. Source vertex identities remain shared through shape, skinning, optional rest-detail filtering and sag; final normals use Y-up, Z-forward metre positions before render seams duplicate vertices. Unsplit posed positions and normals remain available to garment and contact consumers.
 *
 * Caller-owned rest and lean providers share the same document revision with appearance. Rest documents skip sag; posed textured skin may receive authored anatomical relief weights. These stages establish no collision-free or anatomically valid contact.
 *
 * Explicit physicalSource compilation captures native geometry fingerprints or declared canonical sample IDs before UV gathering. Each document supplies its actual instance to the namespace owner; invalid or mismatched source registration refuses. Omission preserves legacy output and metadata absence.
 *
 * @evidence contracts/common.md#principled-implementation Original surface incidence is registered before performance/UV splitting, then one posed evaluation and final normal pass feed both unsplit authority and correspondence-preserving material regions.
 * @evidence contracts/common.md#clear-and-simple-design Basis compilation prepares registration, pose and region gatherers; the document pass produces skin and optional relief once before region projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native and canonical source modes cannot relabel each other, invalid sample domains refuse, and optional absence or authored relief never implies physical registration or clinical/contact acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes source identity from render seams, basis metre frame, same-revision providers, registration modes and collision/clinical limitations.
 * @evidence contracts/performance.md#efficient-algorithms Compilation walks source vertices/corners and prepares topology owners; document work includes actual skinning/filter/sag cost plus linear final normals and gathered region arrays, with rest evaluation requested only when a dependent stage needs it.
 * @evidence contracts/performance.md#reuse-equivalent-work Registration and per-surface pose/region closures are shared across documents; one current posed array supplies normals, garment authority and all material regions, while lazy rest evaluation is shared with appearance.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains immutable basis registrations and compiled gatherers until unreachable; outputs own region and unsplit arrays, transient relief/rest references expire with the request, and no external handle or task is acquired.
 */
export function createHumanBodySurfaceParts(
  basis: IAutoMovieHumanBodyBasis,
  physicalSource?: "native-indexed" | "source-partition",
): (input: IHumanBodySurfacePartsInput) => {
  parts: IAutoMovieModel["parts"];
  posedSurfaces: IAutoMovieHumanBodyPosedSurface[];
} {
  // Compilation captures incidence before performance and UV gathering. The
  // instance is supplied by each admitted document, never a generation alone.
  const registrations: ({ identity: string; samples: number[] } | undefined)[] =
    basis.surfaces.map(
      (
        surface: (typeof basis.surfaces)[number],
      ): { identity: string; samples: number[] } | undefined => {
        if (physicalSource === undefined) return undefined;
        const source: typeof surface.sourcePartition = surface.sourcePartition;
        if (physicalSource === "native-indexed") {
          if (source !== undefined)
            throw new Error(
              "Native indexed registration cannot relabel a declared canonical source partition.",
            );
          const fingerprint: string = autoMovieRenderDigest(
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
              (_: unknown, vertex: number): number => vertex,
            ),
          };
        }
        if (source === undefined || source.generation.trim() === "")
          throw new Error(
            "Physical source-partition registration needs the actual canonical source record.",
          );
        const extent: number =
          source.originalVertices +
          source.intersections.length +
          (source.refinements?.length ?? 0);
        if (
          !Number.isSafeInteger(source.originalVertices) ||
          source.originalVertices < 3 ||
          !Number.isSafeInteger(extent) ||
          source.samples.length !== surface.positions.length / 3 ||
          source.samples.some(
            (sample: number): boolean =>
              !Number.isSafeInteger(sample) || sample < 0 || sample >= extent,
          )
        )
          throw new Error(
            "Physical source-partition samples must match the actual preUV surface and safe canonical domain.",
          );
        return {
          identity: source.generation,
          samples: Array.from(source.samples),
        };
      },
    );
  const posedSurface: ReturnType<typeof createHumanBodyPosedSurface>[] =
    basis.surfaces.map(
      (
        surface: (typeof basis.surfaces)[number],
      ): ReturnType<typeof createHumanBodyPosedSurface> =>
        createHumanBodyPosedSurface(surface, basis.joints),
    );
  const regionParts: ReturnType<typeof createHumanBodySurfaceRegionParts>[] =
    basis.surfaces.map(createHumanBodySurfaceRegionParts);
  return (
    input: IHumanBodySurfacePartsInput,
  ): {
    parts: IAutoMovieModel["parts"];
    posedSurfaces: IAutoMovieHumanBodyPosedSurface[];
  } => {
    const {
      document,
      shaped,
      posed,
      transforms,
      restAll,
      leanOf,
      coloured,
    }: typeof input = input;
    const skin: string = HUMAN_BODY_SKIN_SITES.material;
    // gravity's change in the skin's frame moves the soft tissue; a document
    // at the rest pose the basis was authored in hangs as authored
    const restShape: ReturnType<IHumanBodySurfacePartsInput["restAll"]> | null =
      posed &&
      basis.surfaces.some(
        (surface: (typeof basis.surfaces)[number]): boolean =>
          surface.sag !== undefined || surface.mush !== undefined,
      )
        ? restAll()
        : null;
    const posedSurfaces: IAutoMovieHumanBodyPosedSurface[] = [];
    const parts: IAutoMovieModel["parts"] = basis.surfaces.flatMap(
      (
        surface: (typeof basis.surfaces)[number],
        index: number,
      ): IAutoMovieModel["parts"] => {
        const positions: number[] = posedSurface[index]({
          shaped: shaped.surfaces[index],
          transforms,
          rest: restShape?.surfaces[index] ?? null,
          lean: (): number[] => leanOf(index),
          document,
        });
        const normals: number[] = areaWeightedNormals(
          positions,
          surface.indices,
        );
        posedSurfaces[index] = { positions, normals };
        // the skin's anatomical relief follows the pose: its creases deepen
        // where a bent joint folds the skin and its wrinkles flatten where it
        // stretches it, read on the body at rest
        const reliefWeights: ReturnType<typeof humanBodyReliefWeights> | null =
          document.skinDetail === undefined ||
          surface.relief?.material !== skin ||
          !posed
            ? null
            : ((): ReturnType<typeof humanBodyReliefWeights> => {
                const atRestNow: ReturnType<typeof restAll> = restAll();
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
