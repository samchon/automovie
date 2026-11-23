import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";
import type { IAutoMovieCompiledInstancePrototype } from "./IAutoMovieCompiledInstancePrototype";
import type { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import type { IAutoMovieInstanceChunk } from "./IAutoMovieInstanceChunk";
import type { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Compact generated runtime for a non-formation instance set. Bounds summarize
 * slot positions; radius estimates and slot scale feed viewer culling without
 * guaranteeing enclosure of every visible model.
 */
export interface IAutoMovieCompiledInstanceSet {
  /** Generated instance-set format. */
  version: 1;

  /** Stable world-design id. */
  id: string;

  /** Exact designed slot count. */
  count: number;

  /** Base model group id the instance set design names. */
  model: string;

  /**
   * Resolved prototype runtimes with base `default` weight one first; omitted
   * for a legacy single-prototype set.
   */
  prototypes?: IAutoMovieCompiledInstancePrototype[];

  /** Exact compact placement law. */
  layout: IAutoMovieInstanceSetDesign["layout"];

  /**
   * Resolved route geometry for `along-route`, or null for local layouts.
   *
   * The viewer and source oracle regenerate slots from this snapshot without
   * consulting mutable world design.
   */
  route: IAutoMovieWorldDesign["routes"][number] | null;

  /** World-space origin for local layouts. */
  anchor: IAutoMovieVector3;

  /** World-space base heading in degrees. */
  facingDeg: number;

  /** Full safe-integer design seed. */
  seed: number;

  /** Exact seed-derived visual and semantic variation law. */
  variation: IAutoMovieInstanceSetDesign["variation"];

  /** Bounds of generated slot positions before geometry-radius expansion. */
  bounds: IAutoMovieFormationBounds;

  /** Binary64 running-mean centroid of all generated slot positions. */
  centroid: IAutoMovieVector3;

  /**
   * Maximum compiled prototype radius estimate in metres for viewer culling;
   * each prototype follows tier/base/0.5m fallback and 0.01m floor policy, with
   * producer-owned root-centering and geometry-coverage premises.
   */
  projectionRadius: number;

  /** Bounded independently regenerable slot ranges. */
  chunks: IAutoMovieInstanceChunk[];

  /** Ordered automatic LOD representations. */
  lod: IAutoMovieCompiledFormationLod[];

  /** Digest of every field above except this digest. */
  digest: string;
}
