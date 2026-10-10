import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanPersonSourceChart } from "./IAutoMovieHumanPersonSourceChart";
import type { IAutoMovieHumanPersonSourceWeight } from "./IAutoMovieHumanPersonSourceWeight";

/**
 * An admitted pair of complementary source partitions: owned copies of both
 * records, the size of their shared canonical sample namespace, and memoized
 * chart and preimage lookups over it. Lookups return buffers borrowed read
 * only from the plan. Everything is dimensionless.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourcePartitionPlan {
  /** Owned copy of the face's source partition. */
  face: IAutoMovieHumanBasisSourcePartition;

  /** Owned copy of the body's source partition. */
  body: IAutoMovieHumanBasisSourcePartition;

  /** Count of canonical samples: originals, cut points and refinements. */
  sampleCount: number;

  /**
   * A sample's positive affine weights over original source vertices.
   */
  preimage: (sample: number) => readonly IAutoMovieHumanPersonSourceWeight[];

  /**
   * A sample's ordered chart.
   */
  chart: (sample: number) => IAutoMovieHumanPersonSourceChart;
}
