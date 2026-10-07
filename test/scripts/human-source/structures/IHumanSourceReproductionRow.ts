import type { IHumanSourceReproductionError } from "./IHumanSourceReproductionError.ts";

/**
 * One published field reproduced on the source generation.
 *
 * `regeneration` compares the published field with the value freshly derived
 * from the pinned upstream through `recipe`; it is null when no upstream state
 * reproduces the row (`provenance` then names where the value comes from;
 * `regenerated-producer` is a whole field a rebuilt producer wrote anew, whose
 * difference from the published field `p2` and `p1` then measure).
 * `p2` compares the published field with what the written one-skin generation
 * evaluates to on the published vertices (a body row on a head-only vertex
 * counts as head carry plus row), `p1` with the written P1 pair; both are
 * measured on the artifacts after assembly, and null means the representation
 * does not store the field (an attached part is referenced, not copied) or it
 * was not measured, never a silent zero.
 * `newSupport` says whether vertices the published surface never had receive
 * a value: regenerated from upstream, unavailable, or not needed because the
 * row does not reach them.
 *
 * @author Samchon
 */
export interface IHumanSourceReproductionRow {
  basis: "face" | "body";
  surface: string;
  row: string;
  role:
    | "channel-endpoint"
    | "corrective"
    | "landmark"
    | "neutral"
    | "weights"
    | "joint"
    | "attachment"
    | "part-endpoint";
  provenance:
    | "upstream-recipe"
    | "carried-published"
    | "carried-part"
    | "regenerated-producer";
  recipe: string | null;
  regeneration: IHumanSourceReproductionError | null;
  p2: IHumanSourceReproductionError | null;
  p1: IHumanSourceReproductionError | null;
  newSupport: "regenerated" | "unavailable" | "not-needed";
  note: string;
}
