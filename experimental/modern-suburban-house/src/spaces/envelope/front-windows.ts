/** Front elevation rough window voids shared with their room reservations. */

/**
 * @evidence spaces/envelope/front.md Three selected front windows retain their facade-owned rough spans.
 * @evidenceReview spaces/envelope/front.md #9ea9268 front-windows.ts:9-31 holds living/bedroomTwo/bedroomThree spans = front.md:83,:107,:157; front.ts:95,96,104 cut them from this record. Reformat only.
 * @evidence principles/core/source-units.md#source-scope-preservation Rooms consume these cuts without owning a second window coordinate.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Room curtains read FRONT_WINDOWS.<w>.from/to/top: living.ts:51, bedroom-two.ts:49, bedroom-three.ts:58; no room re-types a front window coordinate.
 * @evidence principles/core/source-units.md#source-substantive-completion Wall holes and curtain reservations move together when a front void changes.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f front.ts:95-104 holes and the three room curtains (living.ts:51, bedroom-two.ts:49, bedroom-three.ts:58) read the same record, so a span/head edit moves both.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Living-front-window, bedroom-two-front-window, and bedroom-three-front-window each fix their own rough X span and sill/head; this record carries those three facade voids to the rooms.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 front.md:83 X=[-5.10,-2.30] Y=[0.70,2.30]; :107 X=[-4.80,-2.70] Y=[3.91,5.31]; :157 X=[2.65,4.75] Y=[3.91,5.31] = front-windows.ts:12-29; rooms import the record. front.md body not revised by source work.
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
