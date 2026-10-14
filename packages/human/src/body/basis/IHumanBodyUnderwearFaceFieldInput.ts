import type { IAutoMovieMeshQueryHierarchy } from "@automovie/engine";

import type { IHumanBodyUnderwearEnvelopeCentre } from "./IHumanBodyUnderwearEnvelopeCentre";

/**
 * Actual immutable envelope centres and one complete posed material triangle.
 *
 * @evidence contracts/common.md#principled-implementation Three same-frame material corners, complete qualified centers and their existing hierarchy supply one whole-face field-direction query with a resident seed.
 * @evidence contracts/common.md#clear-and-simple-design The input borrows one compiled field and names the face/seed instead of requalifying or duplicating centers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hierarchy cannot replace or reduce the original center population and a seed must identify an actual qualified center.
 * @evidence contracts/common.md#meaningful-documentation Members give posed meter coordinates, resident identities, existing finite hierarchy and whole-face bound seed meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Face-field input typing performs no complete-branch separation or exact cell computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The borrowed hierarchy exposes existing compiled-center reuse while the face reader owns query work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This input acquires no new geometric population, hierarchy lifetime or active native query task.
 * @author Samchon
 */
export interface IHumanBodyUnderwearFaceFieldInput {
  /** Three XYZ corners, in posed skin metres. */
  face: readonly number[];

  /** Complete qualified centre population, retaining original identities. */
  centres: readonly IHumanBodyUnderwearEnvelopeCentre[];

  /** Existing finite centre hierarchy; it owns no new geometric population. */
  root: IAutoMovieMeshQueryHierarchy<IHumanBodyUnderwearEnvelopeCentre>;

  /** One actual qualified centre supplying the complete face distance bound. */
  seed: readonly number[];
}
