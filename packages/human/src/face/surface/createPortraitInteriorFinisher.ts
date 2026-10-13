import type { IAutoMovieModelPart } from "@automovie/interface";

import { createMetricMeshPart } from "../mesh/createMetricMeshPart";
import type { IControlMesh } from "../mesh/structures/IControlMesh";
import type { IPortraitInterior } from "./structures/IPortraitInterior";

/**
 * Bridge one native interior producer to both component consumers. The head
 * stages prepareInteriors before packing skin; existing direct callers use
 * finish. Each path invokes the same producer once per call. The head chooses
 * the native path instead of also invoking finish for that component.
 *
 * The producer must read the final skin without mutation and return fresh meshes
 * in head millimetres. This adapter neither caches nor clones those buffers;
 * createMetricMeshPart owns millimetre-to-metre packing, retaining native indices,
 * material identities and order. Callers spread the returned callbacks into the
 * attachment declaration and own their lifetime.
 *
 * @evidence contracts/common.md#principled-implementation Both APIs share one native producer, and compatibility finish maps its ordered interiors through the established metric packing boundary.
 * @evidence contracts/common.md#clear-and-simple-design Two callbacks adapt existing consumers without a second oral geometry implementation; the head owns choosing the native path once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stale mesh cache or metre-to-millimetre round trip is introduced; fresh buffers and nonmutating producer behavior remain explicit producer premises.
 * @evidence contracts/common.md#meaningful-documentation Prose states units, callback ownership, once-per-path production, the head's path choice and absence of cloning or caching.
 * @evidence contracts/performance.md#efficient-algorithms Construction is constant work; finish adds the producer's actual cost and linear metric buffer transformation per returned interior.
 * @evidence contracts/performance.md#reuse-equivalent-work Both paths share the producer implementation, not effectful results; every invocation observes its supplied final skin and produces fresh interiors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned callbacks retain the supplied producer until their owner drops them; produced native and packed mesh populations are caller-owned, with no global resource.
 */
export function createPortraitInteriorFinisher(
  prepare: (refined: IControlMesh) => IPortraitInterior[],
): { prepareInteriors: (refined: IControlMesh) => IPortraitInterior[]; finish: (refined: IControlMesh) => IAutoMovieModelPart[] } {
  return {
    prepareInteriors: prepare,
    finish: (refined: IControlMesh): IAutoMovieModelPart[] =>
      prepare(refined).map(({ id, mesh, material }: IPortraitInterior): ReturnType<typeof createMetricMeshPart> =>
        createMetricMeshPart(id, mesh, material),
      ),
  };
}
