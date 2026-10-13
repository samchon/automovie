import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyVertebraMeasurements } from "./IAutoMovieHumanBodyVertebraMeasurements";

/**
 * Twelve thoracic vertebrae articulating with ribs and supporting the bony cage. Their separate volumes do not determine curvature or intervertebral disc geometry.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty T1-T12 fields preserve twelve separately numbered midline rib-bearing vertebral measurements.
 * @evidence contracts/common.md#clear-and-simple-design The thoracic collection composes the common vertebra carrier while curvature remains a separate spine quantity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Separate vertebral volumes cannot supply thoracic curvature, intervertebral discs or resolved rib articulations.
 * @evidence contracts/common.md#meaningful-documentation The prose gives rib-bearing cage support and members retain each thoracic vertebra identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Thoracic vertebral typing performs no disc geometry or kyphotic alignment computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Twelve numbered thoracic fields store no reusable vertebral/rib articulation result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Thoracic bone inputs retain no intervertebral surfaces or cage-alignment solver.
 * @author Samchon
 */
export type IAutoMovieHumanBodyThoracicVertebraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered T1 vertebra. */
    t1?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T2 vertebra. */
    t2?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T3 vertebra. */
    t3?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T4 vertebra. */
    t4?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T5 vertebra. */
    t5?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T6 vertebra. */
    t6?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T7 vertebra. */
    t7?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T8 vertebra. */
    t8?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T9 vertebra. */
    t9?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T10 vertebra. */
    t10?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T11 vertebra. */
    t11?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered T12 vertebra. */
    t12?: IAutoMovieHumanBodyVertebraMeasurements;
  }>;
