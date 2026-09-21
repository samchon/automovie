/**
 * Read-only contract shapes for the viewer's formation runtime and its callers.
 * A chunk binds compiled membership to resident tier buffers and prior selection;
 * a sparse exception identifies an existing member without repacking the crowd.
 * The runtime owns mutations and frame order. These declarations allocate no
 * state and contain no executable geometry, rendering or validation logic.
 */
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationLod,
  IAutoMovieFormationSlot,
  IAutoMovieTransform,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Per-frame bounded debug summary for one formation.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Reports visible, culled, removed, and promoted populations separately.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements bounded logical-to-display accounting for a formation.
 * @author Samchon
 */
export interface IAutoMovieFormationViewerStats {
  /**
   * Slots currently drawn per tier after chunk culling.
   *
   * `near` and `far` count anonymous instance slots. `hero` counts promoted
   * hero objects still inside the frustum instead, because an anonymous slot
   * can never select that tier: the builder drops the hero tier from the
   * anonymous LOD list. Anonymous accounting is therefore the sum of `near`,
   * `far`, `culled` and `removed`, and the hero count belongs beside it rather
   * than inside it.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Counts the visible slots selected for each display tier.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Reports the logical-to-display tier selection.
   */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;
  /**
   * Anonymous slots rejected by camera-frustum chunk culling.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Counts slots rejected by the active camera-frustum policy separately.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Reports the culling side of logical-to-display resolution.
   */
  culled: number;
  /**
   * Anonymous slots a per-member cue has taken out of the shot at this time.
   *
   * Counted apart from `culled`, because the two are different claims: a culled
   * member is off camera and would be drawn if the camera turned, while a
   * removed one is not in the shot at all.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Separates authored removal from camera culling and drawn tiers.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Keeps removed logical members out of display-tier counts.
   */
  removed: number;
  /**
   * Named heroes kept outside instance batches.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Separates named heroes from anonymous display tiers.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Preserves hero display identity outside anonymous LOD accounting.
   */
  heroes: number;
}

/**
 * Built instance runtime consumed by a viewer host.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Exposes the selected display representation and its bounded accounting.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display formation boundary.
 * @author Samchon
 */
export interface IAutoMovieFormationViewerObject {
  /**
   * Add this group to the current scene.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Holds the formation's selected display representations.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Materializes the logical formation as viewer-owned display objects.
   */
  object: THREE.Group;
  /**
   * Current LOD and culling summary.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Reports the active LOD and culling selection.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Reports bounded logical-to-display accounting.
   */
  stats: IAutoMovieFormationViewerStats;
  /**
   * Recompute chunk visibility for the current camera.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Re-evaluates the declared display policy for the current camera.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Selects the bounded display representation for each visible chunk.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-transition Preserves the prior tier so threshold crossings use the declared hysteresis transition.
   */
  update(
    camera: THREE.PerspectiveCamera,
    viewportHeight: number,
    time?: number,
    /** Source node/object-motion TRS captured before formation writes. */
    heroSources?: ReadonlyMap<string, IAutoMovieTransform>,
  ): void;
}

/**
 * Describes one compiled chunk and its resident display-selection state.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Describes one compiled chunk and its resident display-selection state.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Describes one compiled chunk and its resident display-selection state.
 * @author Samchon
 */
export interface IChunkObject {
  /**
   * Retains the compiled chunk identity, bounds and anonymous membership used by runtime culling.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains the compiled chunk identity, bounds and anonymous membership used by runtime culling.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains the compiled chunk identity, bounds and anonymous membership used by runtime culling.
   */
  runtime: IAutoMovieCompiledFormation["chunks"][number];
  /**
   * Stores the metre-space chunk radius used with the model projection radius in frustum admission.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Stores the metre-space chunk radius used with the model projection radius in frustum admission.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Stores the metre-space chunk radius used with the model projection radius in frustum admission.
   */
  radius: number;
  /**
   * Retains exact compiled placements for the anonymous members represented by this chunk.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains exact compiled placements for the anonymous members represented by this chunk.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains exact compiled placements for the anonymous members represented by this chunk.
   */
  slots: IAutoMovieFormationSlot[];
  /**
   * Maps each declared display tier to its resident instance buffer.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Maps each declared display tier to its resident instance buffer.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Maps each declared display tier to its resident instance buffer.
   */
  tiers: Map<IAutoMovieCompiledFormationLod["tier"], THREE.InstancedMesh>;
  /**
   * Retains the previously selected tier for hysteretic transitions on later frames.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains the previously selected tier for hysteretic transitions on later frames.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains the previously selected tier for hysteretic transitions on later frames.
   */
  selected: IAutoMovieCompiledFormationLod["tier"] | null;
  /** Members of this chunk a cue has taken out at the current time.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Counts authored absence separately from frustum culling and visible members.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Counts authored absence separately from frustum culling and visible members.
   */
  removed: number;
}

/**
 * One member a per-member cue names, found once at build rather than per frame.
 *
 * The channel is sparse and its whole promise is that a crowd does not pay for
 * it, so the members it singles out are located once and the per-frame work is
 * proportional to how many there are. A slot named but not found here — a
 * promoted hero, or an index outside the unit — simply has no instance to
 * write, which is what the builder gate already refuses at compile time.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Describes one sparse member override resolved against existing chunk buffers.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Describes one sparse member override resolved against existing chunk buffers.
 * @author Samchon
 */
export interface ISlotException {
  /** Zero-based slot inside the whole formation.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Identifies the singled-out logical member without renumbering the formation.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Identifies the singled-out logical member without renumbering the formation.
   */
  slot: number;
  /** The chunk whose instance buffers hold this member.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Identifies the resident chunk whose tier buffers contain this sparse exception.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Identifies the resident chunk whose tier buffers contain this sparse exception.
   */
  chunk: IChunkObject;
  /** This member's index inside that chunk's anonymous slots.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Locates the member inside each tier buffer without moving any later instance.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Locates the member inside each tier buffer without moving any later instance.
   */
  index: number;
  /** This member's designed placement, kept so it can be re-derived cheaply.
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains the original compiled placement from which each frame derives the sparse override.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains the original compiled placement from which each frame derives the sparse override.
   */
  designed: IAutoMovieFormationSlot;
}
