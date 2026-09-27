/** Front elevation rough window voids shared with their room reservations. */

/**
 * @evidence spaces/envelope/front.md Three selected front windows retain their facade-owned rough spans.
 * @evidenceReview spaces/envelope/front.md #65e443e `FRONT_WINDOWS` holds the living, bedroom-two and bedroom-three rough X/Y spans stated in their front-elevation H2s; `buildFront` places these same values in its wall holes.
 * @evidence principles/core/source-units.md#source-scope-preservation Rooms consume these cuts without owning a second window coordinate.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 `living.ts`, `bedroom-two.ts` and `bedroom-three.ts` derive their curtain X extents and top heights from their respective `FRONT_WINDOWS` entries, preserving facade ownership of the rough voids.
 * @evidence principles/core/source-units.md#source-substantive-completion Wall holes and curtain reservations move together when a front void changes.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `buildFront` consumes all three window records as holes, while each matching room curtain uses the same `from`, `to` and `top`; changing one record feeds both the exterior cut and interior reservation.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-front-window, bedroom-two-front-window, and bedroom-three-front-window each fix their own rough X span and sill/head; this record carries those three facade voids to the rooms.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 The three `FRONT_WINDOWS` entries carry the distinct living and upper-bedroom X spans and sill/head levels from `front.md` to `buildFront` and room curtains without changing their parent window placements.
 */
export const FRONT_WINDOWS = {
  living: {
    id: "living-front-window",
    from: -5.1,
    to: -2.3,
    bottom: 0.7,
    top: 2.3,
  },
  bedroomTwo: {
    id: "bedroom-two-front-window",
    from: -4.8,
    to: -2.7,
    bottom: 3.91,
    top: 5.31,
  },
  bedroomThree: {
    id: "bedroom-three-front-window",
    from: 2.65,
    to: 4.75,
    bottom: 3.91,
    top: 5.31,
  },
} as const;
