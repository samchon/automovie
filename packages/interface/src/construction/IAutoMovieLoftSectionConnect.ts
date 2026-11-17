import type { IAutoMovieLoftSectionBoundary } from "./IAutoMovieLoftSectionBoundary";
import type { IAutoMovieLoftSectionSource } from "./IAutoMovieLoftSectionSource";

/**
 * Declared generating laws on regular station intervals changed by continuation.
 *
 * @evidence contracts/development/design.md#principled-representation Native, basis and mixed alternatives identify complete local fields over physical-mm bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieLoftSectionConnect publishes span laws that AutoMovieLoftSection selects before preparing a station reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Native and basis geometry remain explicit alternatives rather than an inferred fit through sampled Cartesian endpoint points.
 * @evidence contracts/development/common.md#meaningful-documentation Members define field selection, interval units, endpoint weight orientation and binding ownership.
 */
export namespace IAutoMovieLoftSectionConnect {
  /**
     * Explicit native, mixed or basis law on a changed regular station span.
     *
     * finish stores these records in the returned chain; active returns a borrowed law using inclusive bounds and validates finite increasing bounds and any retained mixed endpoint binding. Preserve all nested data while chain readers cache station preparations. An absent or empty span list leaves original ownership in effect; a basis span explicitly selects the chain's coefficient field. These laws grant no cap domain beyond their regular endpoints.
     *
     * @evidence contracts/development/design.md#principled-representation Each variant defines a full phase function over its station interval; mixed uses one positive native scalar extension and one complete coefficient extension with a C2-flat station weight.
     * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant states exactly which actual generators the reader evaluates.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Native endpoints are not Cartesian Taylor jets; basis endpoints are complete functions with all phase derivatives.
     * @evidence contracts/development/common.md#meaningful-documentation Native end selects weight one at that end, and all station coordinates use mm.
     */
    export type ISpan =
      | {
          /** Use a complete native scalar bridge throughout the interval. */
          kind: "native";

          /** Admitted native extent/shoulder law; its two endpoint stations own the inclusive physical-mm bounds. */
          law: IAutoMovieLoftSectionBoundary.IBridge;
        }
      | {
          /** Select the existing complete spline coefficient field, overriding any original native source on this span. */
          kind: "basis";

          /** Inclusive lower physical station in millimetres. */
          from: number;

          /** Inclusive upper physical station in millimetres, strictly greater than from with a finite difference. */
          to: number;
        }
      | {
          /** Blend a complete native extension and a complete basis extension with a quintic station weight. */
          kind: "mixed";

          /** Inclusive lower physical station in millimetres. */
          from: number;

          /** Inclusive upper physical station in millimetres, strictly greater than from with a finite difference. */
          to: number;

          /** Native scalar bridge on the same bounds, matching its actual native endpoint and a declared constant extension at the other end. */
          native: IAutoMovieLoftSectionBoundary.IBridge;

          /** End where native weight is one: bottom means from, top means to. The opposite weight is zero, and first/second physical-station weight derivatives vanish at both ends. */
          nativeEnd: "bottom" | "top";

          /** Bound endpoint at the opposite end, required by the reader to have field.kind = basis. Its complete coefficient jets define a quadratic station extension before blending; changing the layer requires rebinding this record. */
          basis: IAutoMovieLoftSectionSource.IEndpoint;
        };
}
