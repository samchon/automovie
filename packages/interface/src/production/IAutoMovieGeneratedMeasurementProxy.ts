/**
 * Explicit external-model dimensions used to estimate a root-centred population projection radius.
 *
 * @evidence contracts/common.md#principled-implementation The closed metadata arms retain box extents or humanoid stature/widths as intended projection-envelope inputs. The production radius-table producer and asset admission are retired; Engine population compilers accept an explicit supplied radius table instead of reading these dimensions automatically.
 * @evidence contracts/common.md#clear-and-simple-design Two closed dimension records separate intended projection envelopes from appearance bytes and collision geometry; actor-root distance and skeletal reach queries keep their own measurement semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The schema supplies no envelope centre or root offset, and the humanoid recipe supplies no depth. Its intended half-diagonal interpretation uses all three box extents or stature and maximum shoulder/hip width; that centred estimate does not certify enclosure of offset visual geometry, and no current producer computes it from this field automatically.
 * @evidence contracts/common.md#meaningful-documentation Defines positive meter dimensions, exact radius derivation and the separation from root-distance and skeletal-reach queries.
 */
export type IAutoMovieGeneratedMeasurementProxy =
  | {
      /** Box envelope whose half diagonal supplies the population projection radius. */
      recipe: "box-v1";

      /** Positive full extents in production meters. */
      parameters: {
        /** Positive full local-X extent in meters. */
        width: number;

        /** Positive full local-Y extent in meters. */
        height: number;

        /** Positive full local-Z extent in meters. */
        depth: number;
      };
    }
  | {
      /** Height/width envelope whose half diagonal supplies the population projection radius. */
      recipe: "humanoid-landmarks-v1";

      /** Positive stature, shoulder width and hip width in production meters. */
      parameters: {
        /** Positive full stature in meters. */
        height: number;

        /** Positive full shoulder width in meters. */
        shoulderWidth: number;

        /** Positive full hip width in meters; the larger declared width enters the radius estimate. */
        hipWidth: number;
      };
    };
