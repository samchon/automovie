import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";
import { IAutoMovieCompiledInstancePrototype } from "./IAutoMovieCompiledInstancePrototype";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";
import { IAutoMovieInstanceChunk } from "./IAutoMovieInstanceChunk";
import { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/** Compact generated runtime for a non-formation instance set. */
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

  /** Exact bounds of all generated slots. */
  bounds: IAutoMovieFormationBounds;

  /** Exact arithmetic centroid of all generated slots. */
  centroid: IAutoMovieVector3;

  /** Compiler-derived representative radius used by viewer culling. */
  projectionRadius: number;

  /** Bounded independently regenerable slot ranges. */
  chunks: IAutoMovieInstanceChunk[];

  /** Ordered automatic LOD representations. */
  lod: IAutoMovieCompiledFormationLod[];

  /** Digest of every field above except this digest. */
  digest: AutoMovieContentDigest;
}
