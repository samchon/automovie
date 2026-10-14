import type { IAutoMovieCompiledFormation, IAutoMovieCompiledFormationLod, IAutoMovieFormationSlot } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Describes one compiled chunk and its resident display-selection state.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Binds one compiled formation chunk's bounds/anonymous placements to tier instance buffers and prior tier selection; metre-space radius supports culling, while selected null means no previous admitted tier and removed counts cue-taken members.
 * @evidence contracts/common.md#clear-and-simple-design Keeps per-chunk culling/hysteresis and resident buffer references together, separate from tier-wide shared geometry/material/cycle ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anonymous membership comes from compiled slots and cue removal, not promoted-hero fixture assumptions or full-population per-member objects.
 * @evidence contracts/common.md#meaningful-documentation Gives runtime bounds/membership, metre radius, tier-map ownership role, nullable prior selection and current cue-removal meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This state shape executes no frustum, LOD or cue-selection algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime updates own reuse of tier buffers and prior selection; a record performs no coordination itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Formation construction/disposal owns the referenced chunk buffers; the interface acquires no independent resource/task.
 */
export interface IChunkObject {
  /**
   * Retains the compiled chunk identity, bounds and anonymous membership used by runtime culling.
   */
  runtime: IAutoMovieCompiledFormation["chunks"][number];

  /**
   * Stores the metre-space chunk radius used with the model projection radius in frustum admission.
   */
  radius: number;

  /**
   * Retains exact compiled placements for the anonymous members represented by this chunk.
   */
  slots: IAutoMovieFormationSlot[];

  /** Maps each declared display tier to its resident instance buffer. */
  tiers: Map<IAutoMovieCompiledFormationLod["tier"], THREE.InstancedMesh>;

  /**
   * Retains the previously selected tier for hysteretic transitions on later frames.
   */
  selected: IAutoMovieCompiledFormationLod["tier"] | null;

  /** Members of this chunk a cue has taken out at the current time. */
  removed: number;
}

