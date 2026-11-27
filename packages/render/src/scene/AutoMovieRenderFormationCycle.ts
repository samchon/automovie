import { type IAutoMovieGait, type IAutoMovieModel, type IAutoMovieFormationCadenceSegment } from "@automovie/interface";
import { formationCycleGait as formationCycleGaitImplementation } from "./internal/formationCycleGait.js";
import { type IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import { type IBakeFormationCycleProps } from "./IBakeFormationCycleProps.js";
import { bakeFormationCycle as bakeFormationCycleImplementation } from "./internal/bakeFormationCycle.js";
import { formationCycleStride as formationCycleStrideImplementation } from "./internal/formationCycleStride.js";
import { type IAutoMovieFormationCadence } from "./IAutoMovieFormationCadence.js";
import { formationCycleCadence as formationCycleCadenceImplementation } from "./internal/formationCycleCadence.js";
import { applyFormationCycleCadence as applyFormationCycleCadenceImplementation } from "./internal/applyFormationCycleCadence.js";
import { formationCyclePosition as formationCyclePositionImplementation } from "./internal/formationCyclePosition.js";
import { type IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";
import { sampleFormationCycleMatrix as sampleFormationCycleMatrixImplementation } from "./internal/sampleFormationCycleMatrix.js";
import { formationCycleOf as formationCycleOfImplementation } from "./internal/formationCycleOf.js";
import { applyFormationCycleMaterial as applyFormationCycleMaterialImplementation } from "./internal/applyFormationCycleMaterial.js";

import type * as THREE from "three";
import { isAutoMovieFormationCycleMaterial as isAutoMovieFormationCycleMaterialImplementation } from "./internal/isAutoMovieFormationCycleMaterial.js";
import { selectFormationShadowPalette as selectFormationShadowPaletteImplementation } from "./internal/selectFormationShadowPalette.js";
import { createFormationCycleShadowMaterials as createFormationCycleShadowMaterialsImplementation } from "./internal/createFormationCycleShadowMaterials.js";

/** Public operations for Auto Movie Render Formation Cycle. */
export namespace AutoMovieRenderFormationCycle {
  /** Owned depth and distance projections for one cycle tier and its palette. */
  export type IShadowMaterials = {
    /** Depth projection used by directional and spot shadow maps. */
    depth: THREE.MeshDepthMaterial;
    /** Distance projection used by point light shadow maps. */
    distance: THREE.MeshDistanceMaterial;
    /** Select the palette identity before drawing with the corresponding material. */
    beforeDraw: (
      /** Shadow material selected for this draw. */
      material: THREE.Material,
      /** Beauty material represented by the geometry group. */
      paletteMaterial: THREE.Material,
    ) => void;
    /** Dispose both owned projection materials through resource retirement. */
    dispose: () => void;
  };

  /** Create this cycle tier's owned shadow projections and palette selector. */
  export const createFormationCycleShadowMaterials: (
    cycle: IAutoMovieFormationCycle,
    palette: readonly THREE.Material[],
  ) => IShadowMaterials = (
    cycle: IAutoMovieFormationCycle,
    palette: readonly THREE.Material[],
  ): IShadowMaterials =>
    createFormationCycleShadowMaterialsImplementation(cycle, palette);
  /**
   * Whether a material carries the formation cycle's shader patch, whatever other
   * patches it carries beside it.
   */
  export function isAutoMovieFormationCycleMaterial(material: THREE.Material): boolean {
    return isAutoMovieFormationCycleMaterialImplementation(material);
  }

  /**
   * The palette material a formation's shadow draw stands for: the material of
   * the geometry group three's shadow map is drawing, or the first palette entry
   * for an ungrouped draw or a group the geometry does not hold.
   *
   * Three passes the drawn entry of `geometry.groups`, or null, typed as a
   * `THREE.Group | THREE.GeometryGroup | null`; only an entry of the geometry's
   * own groups selects a palette material.
   */
  export function selectFormationShadowPalette(geometry: THREE.BufferGeometry, palette: readonly THREE.Material[], group: THREE.Group | THREE.GeometryGroup | null): THREE.Material {
    return selectFormationShadowPaletteImplementation(geometry, palette, group);
  }

  /**
   * The cycle a runtime model performs by default, or null when it performs none.
   *
   * A gait is declarative profile data ({@link IAutoMovieGait}): per-limb phase,
   * duty and amplitude, the same rows the engine synthesises a named performer's
   * locomotion from. The first declared one is what a unit performs until a cue
   * calls for another.
   *
   * Returns null only when no profile declares gaits. This lookup does not check
   * for a skeleton; bakeFormationCycle owns whether that model can be animated.
   * The returned gait remains borrowed from the first nonempty profile list.
   */
  export function formationCycleGait(model: IAutoMovieModel): IAutoMovieGait | null {
    return formationCycleGaitImplementation(model);
  }

  /**
   * Bake one runtime model's whole repertoire into rigid part-matrix tables.
   *
   * `built` must already be at rest with its world matrices current, because the
   * merged instance geometry was baked from exactly those rest matrices: what is
   * stored per sample is `posed * rest?뼘?, the transform that carries a
   * rest-space vertex to where the cycle puts it. The object is left at the last
   * sampled pose; callers extract geometry before baking, never after.
   *
   * The poses are the given pose takes (`IBakeFormationCycleProps.takes`, a
   * performed member's cycle) or, without them, come from {@link gaitMotion},
   * whose keyframe `i` of `samples` sits exactly at cycle position `i / samples`.
   * The loop-closing duplicate is omitted because texture playback wraps the last
   * column to the first. Each sample passes through the same {@link applyPose}
   * used by named performers. This bake passes default joint axes and no clinical
   * rest frames; a caller using different explicit axes/rest frames may therefore
   * obtain a different attitude at the same phase.
   *
   * The table is a sampled Float32 affine approximation, not an exact continuous
   * rigid rotation or a proof of no-slip foot contact. Its stride uses the
   * existing lowest-part trajectory heuristic. Returned take textures transfer to
   * the representation owner; a later take's refusal retires earlier textures.
   */
  export function bakeFormationCycle(input: IBakeFormationCycleProps): IAutoMovieFormationCycle | null {
    return bakeFormationCycleImplementation(input);
  }

  /**
   * Estimate ground metres per baked cycle from the lowest part's trajectory.
   *
   * The lowest sampled part is used as a possible ground-contact proxy. Half its
   * closed horizontal path approximates a reciprocating sweep, and samples in its
   * lower half-height range approximate the contact fraction. Dividing that sweep
   * by the fraction estimates stride for this simple gait model.
   *
   * Arbitrary paths can circle, touch elsewhere or remain at low height without
   * contact; those cases need not satisfy the proxy. This is not a physical
   * no-slip/contact solver or an exact ground distance inferred from any figure.
   *
   * A track that never moves horizontally returns zero, and a figure with no
   * parts returns zero: nothing is carried anywhere, and the caller plays such a
   * cycle on its own declared period.
   */
  export function formationCycleStride(tracks: ReadonlyArray<readonly THREE.Vector3[]>): number {
    return formationCycleStrideImplementation(tracks);
  }

  /**
   * Fold one unit's cue segments into the cycles its members have turned over.
   *
   * The two accumulators are what a member needs and all it needs: everyone in a
   * unit covers the unit's travel, while a turn carries a member over ground
   * proportional to its own distance from the pivot, so the outer file of a
   * wheeling unit steps as many times as the ground under it requires and the
   * inner file steps fewer. A member composes them from its own radius.
   *
   * Segments are folded rather than sampled because stride belongs to the take:
   * where a unit walks one cue and runs the next, the second cue's ground is
   * counted in the second cue's strides. That is also what keeps a change of
   * action from jumping the cycle, since everything already turned over stays
   * turned over.
   *
   * A take that carries a body nowhere is played on its own period instead, which
   * is the difference between a crowd standing at ease and a crowd frozen. This
   * integration uses the bake's stride estimate; it does not prove exact foot
   * contact or no-slip motion for arbitrary gait paths.
   */
  export function formationCycleCadence(cycle: IAutoMovieFormationCycle, segments: readonly IAutoMovieFormationCadenceSegment[]): IAutoMovieFormationCadence {
    return formationCycleCadenceImplementation(cycle, segments);
  }

  /**
   * Write one unit's current cadence into the cells its materials read.
   *
   * Cadence integration selects a take and absolute advance/turn, then writes two
   * float cells and one texture cell per tier without per-member mutation. This
   * describes cadence uniforms only; culling, instance transforms and draws
   * remain additional work, and final pixels also depend on host scene state.
   */
  export function applyFormationCycleCadence(cycle: IAutoMovieFormationCycle, segments: readonly IAutoMovieFormationCadenceSegment[]): IAutoMovieFormationCadence {
    return applyFormationCycleCadenceImplementation(cycle, segments);
  }

  /**
   * Where one member stands in its cycle, in `[0, 1)`.
   *
   * Phase is the slot's compiled `motionPhase`, derived from the formation seed
   * and the slot index, so the member that leads the stride leads it on every
   * machine and in every run. What is added to it is the ground its unit has
   * covered, expressed in cycles. No clock is read, and nothing accumulates
   * between frames: the same cues at the same time always resolve to the same
   * mathematical point under these inputs. That does not establish identical
   * captured bytes across GPU arithmetic or unrelated host state.
   */
  export function formationCyclePosition(cadence: Pick<IAutoMovieFormationCadence, "advance" | "turn">, phase: number, radius?: number): number {
    return formationCyclePositionImplementation(cadence, phase, radius);
  }

  /**
   * Read and linearly mix two neighboring canonical baked samples into a CPU
   * rest-to-posed matrix, closing the last sample back into the first. Valid
   * finite position, positive sample count and complete selected take are
   * producer premises. JavaScript arithmetic over Float32 table data follows the
   * shader law without claiming bit-identical native GLSL or observed
   * appearance.
   */
  export function sampleFormationCycleMatrix(cycle: IAutoMovieFormationCycle, part: number, position: number, take?: IAutoMovieFormationCycleTake): THREE.Matrix4 {
    return sampleFormationCycleMatrixImplementation(cycle, part, position, take);
  }

  /**
   * Read the cycle bound by the Viewer formation owner, or null when absent. The
   * metadata is an internal typed handoff; arbitrary foreign userData values are
   * not structurally admitted by this lookup.
   */
  export function formationCycleOf(object: THREE.Object3D): IAutoMovieFormationCycle | null {
    return formationCycleOfImplementation(object);
  }

  /**
   * Teach one material to place its vertices at each member's own cycle position.
   *
   * Injection rather than a bespoke material, because a formation is drawn by
   * more than one material over a shot's life: the lit beauty material, and the
   * shadow depth/distance materials and depth, normal, mask and outline overrides
   * a guide pass swaps in. A pass that kept the rest pose while beauty marched
   * would make a review frame describe a film that does not exist, so every one
   * of them goes through here.
   *
   * The transform is applied in model space, before three's own instancing step
   * consumes `transformed`, so the member is posed and then placed rather than
   * the other way round. Normals are rotated by the same matrix, which keeps the
   * shading and the silhouette shells honest about the moving surface.
   *
   * The bake stores affine part transforms in three Float32 texture rows. Shader
   * interpolation blends adjacent matrices, so rotations are approximated and can
   * lose orthogonality between samples. The injection is the material's shader
   * patch `automovie-formation-cycle`, composed with its other patches; applying
   * it again, with this cycle or another, replaces it rather than injecting
   * twice.
   */
  export function applyFormationCycleMaterial(material: THREE.Material, cycle: IAutoMovieFormationCycle): void {
    applyFormationCycleMaterialImplementation(material, cycle);
  }
}
