import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";
import { IAutoMovieCompiledInstancePrototype } from "./IAutoMovieCompiledInstancePrototype";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import { IAutoMovieInstanceChunk } from "./IAutoMovieInstanceChunk";
import { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Compact generated runtime for a non-formation instance set. Bounds summarize slot positions; radius estimates and slot scale feed viewer culling without guaranteeing enclosure of every visible model.
 *
 * @evidence contracts/common.md#principled-implementation Layout, route snapshot, seed and variation regenerate positions and prototype choices; chunk and overall summaries are measured through that same slot law, and canonical digest covers the compiled inputs and summaries.
 * @evidence contracts/common.md#clear-and-simple-design Compact placement and variation laws serve both viewer and oracle, with reusable prototype tables and bounded chunk summaries rather than one persisted record per instance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Along-route placement uses the compiled route snapshot instead of mutable design, and invalid route or nonfinite variation refuses regeneration rather than fabricating positions.
 * @evidence contracts/common.md#meaningful-documentation Describes optional prototype compatibility, route-null local layouts, world anchor and degree heading, seed and variation, slot-point bounds, radius expansion, chunks, tiers and digest coverage.
 * @author Samchon
 */
export interface IAutoMovieCompiledInstanceSet {
  /** Generated instance-set format. */
  version: 1;

  /** Stable world-design id. */
  id: string;

  /** Exact designed slot count. */
  count: number;

  /** Base design recipe. */
  modelRecipe: string;

  /** Resolved prototype runtimes; omitted for a legacy single-prototype set. */
  prototypes?: IAutoMovieCompiledInstancePrototype[];

  /** Exact compact placement law. */
  layout: IAutoMovieInstanceSetDesign["layout"];

  /**
   * Resolved route geometry for `along-route`, or null for local layouts.
   *
   * The viewer and source oracle regenerate slots from this snapshot without consulting mutable world design.
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

  /** Maximum compiled prototype radius estimate in metres for viewer culling; each prototype follows tier/base/0.5m fallback and 0.01m floor policy, with producer-owned root-centering and geometry-coverage premises. */
  projectionRadius: number;

  /** Bounded independently regenerable slot ranges. */
  chunks: IAutoMovieInstanceChunk[];

  /** Ordered automatic LOD representations. */
  lod: IAutoMovieCompiledFormationLod[];

  /** Digest of every field above except this digest. */
  digest: string;
}
