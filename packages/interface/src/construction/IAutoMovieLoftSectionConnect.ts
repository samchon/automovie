import type { IAutoMovieLoftSectionBoundary } from "./IAutoMovieLoftSectionBoundary";
import type { IAutoMovieLoftSectionSource } from "./IAutoMovieLoftSectionSource";

/**
 * Declared generating laws on regular station intervals changed by
 * continuation.
 */
export namespace IAutoMovieLoftSectionConnect {
  /**
   * Declared section-generating law on inclusive physical-station bounds in
   * millimetres. Native uses one scalar bridge. Basis selects the existing
   * periodic coefficient field. Mixed blends the native bridge and opposite
   * endpoint's quadratic basis extension with a quintic station weight whose
   * first two derivatives vanish at both ends. Keep the records unchanged while
   * chain readers retain them. An omitted or empty list leaves original section
   * ownership in effect.
   */
  export type ISpan =
    | {
        /** Use a complete native scalar bridge throughout the interval. */
        kind: "native";

        /**
         * Admitted native extent/shoulder law; its two endpoint stations own
         * the inclusive physical-mm bounds.
         */
        law: IAutoMovieLoftSectionBoundary.IBridge;
      }
    | {
        /**
         * Select the existing complete spline coefficient field, overriding any
         * original native source on this span.
         */
        kind: "basis";

        /** Inclusive lower physical station in millimetres. */
        from: number;

        /**
         * Inclusive upper physical station in millimetres, strictly greater
         * than from with a finite difference.
         */
        to: number;
      }
    | {
        /**
         * Blend a complete native extension and a complete basis extension with
         * a quintic station weight.
         */
        kind: "mixed";

        /** Inclusive lower physical station in millimetres. */
        from: number;

        /**
         * Inclusive upper physical station in millimetres, strictly greater
         * than from with a finite difference.
         */
        to: number;

        /**
         * Native scalar bridge on the same bounds, matching its actual native
         * endpoint and a declared constant extension at the other end.
         */
        native: IAutoMovieLoftSectionBoundary.IBridge;

        /**
         * End where native weight is one: bottom means from, top means to. The
         * opposite weight is zero, and first/second physical-station weight
         * derivatives vanish at both ends.
         */
        nativeEnd: "bottom" | "top";

        /**
         * Bound endpoint at the opposite end, required by the reader to have
         * field.kind = basis. Its complete coefficient jets define a quadratic
         * station extension before blending; changing the layer requires
         * rebinding this record.
         */
        basis: IAutoMovieLoftSectionSource.IEndpoint;
      };
}
