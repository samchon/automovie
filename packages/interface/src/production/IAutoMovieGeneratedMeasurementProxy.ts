/**
 * Explicit external-model dimensions used to estimate a root-centred population projection radius.
 *
 * @evidence contracts/common.md#principled-implementation productionProjectionRadii converts box full extents to half their three-dimensional diagonal, or humanoid stature and maximum shoulder/hip width to half their two-dimensional diagonal; productionAssetInventory admits finite positive dimensions before this calculation.
 * @evidence contracts/common.md#clear-and-simple-design Two closed dimension recipes provide the projection-radius table independently from appearance bytes and collision geometry; actor-root distance and skeletal reach queries keep their own measurement semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The schema supplies no envelope centre or root offset, and the humanoid recipe supplies no depth. The half diagonal is a centred-envelope estimate used around the actor root, not a validated conservative bound of offset visual geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines positive meter dimensions, exact radius derivation and the separation from root-distance and skeletal-reach queries.
 * @author Samchon
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
