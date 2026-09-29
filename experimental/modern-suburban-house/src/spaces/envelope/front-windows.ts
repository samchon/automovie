/** Front elevation rough window voids shared with their room reservations. */

/**
 * @evidence spaces/envelope/front.md Three selected front windows retain their facade-owned rough spans.
 * @evidence principles/core/source-units.md#source-scope-preservation Rooms consume these cuts without owning a second window coordinate.
 * @evidence principles/core/source-units.md#source-substantive-completion Wall holes and curtain reservations move together when a front void changes.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-front-window, bedroom-two-front-window, and bedroom-three-front-window each fix their own rough X span and sill/head; this record carries those three facade voids to the rooms.
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
