import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieModel,
} from "@automovie/interface";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject";

/**
 * A compiled instance set and its prototype sources. Source objects remain
 * caller-owned; construction flattens rigid representations before making
 * the viewer's own chunk meshes, materials and per-frame accounting state.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Supplies the compact set and prototype representations used for its selected resolution policy.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Distinguishes compiled members from generated or host-loaded prototype objects.
 * @author Samchon
 */
export interface IBuildInstancedInstanceSetProps {
  /**
   * Compact set whose chunks, variation and prototype LOD definitions are read.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Supplies the compiled policy and member population projected into viewer batches.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps member regeneration grounded in the compiled compact representation.
   */
  instanceSet: IAutoMovieCompiledInstanceSet;

  /**
   * Compiled runtime models keyed by identity; a missing referenced LOD model
   * refuses before that prototype's representation is built.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Supplies the exact model identities referenced by prototype LOD tiers.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Retains explicit source identity during representation selection.
   */
  models: ReadonlyMap<string, IAutoMovieModel>;

  /**
   * Already-loaded prototype objects keyed by runtime model id. Omission or a
   * missing entry builds that model's recipe instead. Objects are borrowed,
   * and flattening refuses unsupported skin, morph or multi-material meshes.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Supplies the host-loaded alternative for an explicitly referenced prototype.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps external rigid prototypes on the same flattening boundary as generated ones.
   */
  prototypeObjects?: ReadonlyMap<string, IAutoMovieModelObject>;
}
