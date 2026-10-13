/**
 * A target or observed double-layer skinfold at a named body site.
 *
 * Calipers pinch two layers of skin and underlying subcutaneous adipose; this millimetre reading is not one-sided fat thickness, a regional 3D fat volume, or a muscle boundary. NHANES Body Measures Manual §3.4.10 defines the triceps and subscapular observation procedure and its failure cases. The owning field supplies the anatomical site and body side.
 *
 * @evidence contracts/common.md#principled-implementation Target/observed millimetres represent a pinched double skin/adipose layer with a named caliper protocol.
 * @evidence contracts/common.md#clear-and-simple-design The owning anatomical field supplies site/side while this union owns fold quantity and provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A double-layer caliper fold is not treated as one-sided fat thickness or regional adipose volume.
 * @evidence contracts/common.md#meaningful-documentation Prose cites the read NHANES skinfold protocol; member comments state units, posture and unknown uncertainty.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Skinfold typing executes no adipose-volume inference or caliper measurement processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The skinfold union shares no inferred fat-depot calculation across measurement sites.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fold metadata owns no caliper device session, scan data or generated adipose arrays.
 * @author Samchon
 */
export type IAutoMovieHumanBodySkinfoldThickness =
  | {
      /** Distinguishes desired double-layer fold from an actual caliper observation. */
      readonly kind: "target";

      /** Thickness of the pinched double skin/adipose layer in millimetres. */
      readonly millimetres: number;
    }
  | {
      /** Distinguishes desired double-layer fold from an actual caliper observation. */
      readonly kind: "observed";

      /** Thickness of the pinched double skin/adipose layer in millimetres. */
      readonly millimetres: number;

      /** Skinfold caliper protocol, distinct from one-sided imaging fat thickness. */
      readonly method: "skinfold-caliper";

      /** Observed position must match the named site's measurement protocol. */
      readonly acquisitionPosture: "standing" | "seated" | "supine";

      /** Absolute fold-thickness uncertainty in millimetres; omitted when unknown. */
      readonly uncertaintyMillimetres?: number;
    };
