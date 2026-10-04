import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";

import type { IAutoMovieHumanPersonSourceChart } from "./IAutoMovieHumanPersonSourceChart";
import type { IAutoMovieHumanPersonSourceWeight } from "./IAutoMovieHumanPersonSourceWeight";

/**
 * An admitted pair of complementary source partitions: owned copies of both
 * records, the size of their shared canonical sample namespace, and memoized
 * chart and preimage lookups over it. Lookups return buffers borrowed read
 * only from the plan. Everything is dimensionless.
 *
 * @evidence contracts/common.md#principled-implementation One admitted plan answers every sample's chart and preimage from the captured records.
 * @evidence contracts/common.md#clear-and-simple-design Two records, one count and two lookups.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Records are copied at admission so later caller mutation cannot change the plan.
 * @evidence contracts/common.md#meaningful-documentation States each member, ownership of returned buffers and that values are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The plan defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The plan emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Counts, IDs and affine weights are dimensionless and carry no frame.
 * @evidence contracts/modeling.md#shared-boundaries Both skins resolve shared samples through this one plan.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
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
   *
   * @evidence contracts/common.md#principled-implementation Weights are evaluated from the sample's captured chart by the shared affine owner and memoized.
   * @evidence contracts/common.md#clear-and-simple-design One function of a sample.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IAutoMovieHumanPersonSourcePartitionPlan.preimage is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States what weights it returns.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IAutoMovieHumanPersonSourcePartitionPlan.preimage is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IAutoMovieHumanPersonSourcePartitionPlan.preimage carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IAutoMovieHumanPersonSourcePartitionPlan.preimage decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#spatial-conventions IDs and affine weights are dimensionless.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanPersonSourcePartitionPlan.preimage constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IAutoMovieHumanPersonSourcePartitionPlan.preimage is a declaration and displays nothing itself.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IAutoMovieHumanPersonSourcePartitionPlan.preimage carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IAutoMovieHumanPersonSourcePartitionPlan.preimage admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IAutoMovieHumanPersonSourcePartitionPlan.preimage defines no input through which a caller shapes a human form.
   */
  preimage: (sample: number) => readonly IAutoMovieHumanPersonSourceWeight[];

  /**
   * A sample's ordered chart.
   *
   * @evidence contracts/common.md#principled-implementation Charts are read from the captured cut and refinement tables and memoized.
   * @evidence contracts/common.md#clear-and-simple-design One function of a sample.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IAutoMovieHumanPersonSourcePartitionPlan.chart is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States what chart it returns.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IAutoMovieHumanPersonSourcePartitionPlan.chart is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IAutoMovieHumanPersonSourcePartitionPlan.chart carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IAutoMovieHumanPersonSourcePartitionPlan.chart decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#spatial-conventions IDs and affine coordinates are dimensionless.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanPersonSourcePartitionPlan.chart constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IAutoMovieHumanPersonSourcePartitionPlan.chart is a declaration and displays nothing itself.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IAutoMovieHumanPersonSourcePartitionPlan.chart carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IAutoMovieHumanPersonSourcePartitionPlan.chart admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IAutoMovieHumanPersonSourcePartitionPlan.chart defines no input through which a caller shapes a human form.
   */
  chart: (sample: number) => IAutoMovieHumanPersonSourceChart;
}
