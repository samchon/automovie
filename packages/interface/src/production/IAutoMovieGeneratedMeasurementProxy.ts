/**
 * Explicit external-model dimensions used to estimate a root-centred population
 * projection radius.
 */
export type IAutoMovieGeneratedMeasurementProxy =
  | {
      /**
       * Box envelope whose half diagonal supplies the population projection
       * radius.
       */
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
      /**
       * Height/width envelope whose half diagonal supplies the population
       * projection radius.
       */
      recipe: "humanoid-landmarks-v1";

      /** Positive stature, shoulder width and hip width in production meters. */
      parameters: {
        /** Positive full stature in meters. */
        height: number;

        /** Positive full shoulder width in meters. */
        shoulderWidth: number;

        /**
         * Positive full hip width in meters; the larger declared width enters
         * the radius estimate.
         */
        hipWidth: number;
      };
    };
