import type { IAutoMovieLoftSectionBoundary } from "./IAutoMovieLoftSectionBoundary";
import type { IAutoMovieLoftSectionSource } from "./IAutoMovieLoftSectionSource";

/**
 * Declared generating laws on regular station intervals changed by
 * continuation.
 */
export namespace IAutoMovieLoftSectionConnect {
  /**
   * Explicit native, mixed or basis law on a changed regular station span.
   *
   * Finish stores these records in the returned chain; active returns a
   * borrowed law using inclusive bounds and validates finite increasing bounds
   * and any retained mixed endpoint binding. Preserve all nested data while
   * chain readers cache station preparations. An absent or empty span list
   * leaves original ownership in effect; a basis span explicitly selects the
   * chain's coefficient field. These laws grant no cap domain beyond their
   * regular endpoints.
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
