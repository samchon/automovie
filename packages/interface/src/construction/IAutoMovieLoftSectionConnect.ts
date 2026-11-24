import type { IAutoMovieLoftSectionBoundary } from "./IAutoMovieLoftSectionBoundary";
import type { IAutoMovieLoftSectionJet } from "./IAutoMovieLoftSectionJet";
import type { IAutoMovieLoftSectionPhase } from "./IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftSectionSource } from "./IAutoMovieLoftSectionSource";

/**
 * Declared generating laws on regular station intervals changed by continuation.
 */
export namespace IAutoMovieLoftSectionConnect {
  /** Original local section generator before frame, lift and features. */
  export interface IOriginal {
    /** Stable name of this complete original material field. */
    readonly name: string;

    /** Physical mm. A bounded prefix hands its final 0/1/2 jets to the retained distal field. A regular owner includes both exact ends. */
    readonly domain: readonly [number, number];

    /** Own the complete original uncapped station interval. Omission selects a bounded prefix with a protected distal field. */
    readonly regular?: true;

    /** Local section plane position at physical mm and correspondence radians. */
    readonly point: (station: number, phase: number) => [number, number];

    /** Prepare the same Point0 at one fixed physical station. */
    readonly pointAt?: (station: number) => (phase: number) => [number, number];

    /** The same point and its first two phase derivatives, without requesting physical station derivatives. */
    readonly phase: (station: number, phase: number) => IAutoMovieLoftSectionPhase;

    /** The same local field's actual physical-station/radian total2. */
    readonly jet: (station: number, phase: number) => IAutoMovieLoftSectionJet;

    /** Prepare the same total2 at one fixed physical station. */
    readonly jetAt?: (station: number) => (phase: number) => IAutoMovieLoftSectionJet;
  }

  /**
   * Explicit native, mixed or basis law on a changed regular station span.
   *
   * finish stores these records in the returned chain; active returns a borrowed law using inclusive bounds and validates finite increasing bounds and any retained mixed endpoint binding. Preserve all nested data while chain readers cache station preparations. An absent or empty span list leaves original ownership in effect; a basis span explicitly selects the chain's coefficient field. These laws grant no cap domain beyond their regular endpoints.
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
