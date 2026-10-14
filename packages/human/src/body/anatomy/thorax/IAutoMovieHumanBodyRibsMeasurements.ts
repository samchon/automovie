import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyRibMeasurements } from "./IAutoMovieHumanBodyRibMeasurements";

/**
 * Twelve numbered ribs on one anatomical side of a thoracic cage.
 *
 * The first seven are true ribs, the next three have indirect sternal cartilage links, and the last two float; neither a combined chest girth nor one rib volume can locate all their joint/cartilage boundaries.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty rib1-rib12 record preserves each side's twelve independent numbered osseous quantities.
 * @evidence contracts/common.md#clear-and-simple-design Individual rib schemas own volume provenance while this collection owns the closed anatomical numbering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Combined chest girth or one rib volume cannot locate all true, indirectly linked and floating rib junctions.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes the three rib groups and members identify each numbered same-side bone.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Rib collection typing computes no cage assembly or joint/cartilage localization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Twelve numbered inputs store no reusable rib-cage reconstruction across sides.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Same-side rib records acquire no cage mesh, cartilage graph or respiratory task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRibsMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered rib 1 on this anatomical side. */
    rib1?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 2 on this anatomical side. */
    rib2?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 3 on this anatomical side. */
    rib3?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 4 on this anatomical side. */
    rib4?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 5 on this anatomical side. */
    rib5?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 6 on this anatomical side. */
    rib6?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 7 on this anatomical side. */
    rib7?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 8 on this anatomical side. */
    rib8?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 9 on this anatomical side. */
    rib9?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 10 on this anatomical side. */
    rib10?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 11 on this anatomical side. */
    rib11?: IAutoMovieHumanBodyRibMeasurements;

    /** Numbered rib 12 on this anatomical side. */
    rib12?: IAutoMovieHumanBodyRibMeasurements;
  }>;
