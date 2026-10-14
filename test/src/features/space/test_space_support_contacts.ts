import { detectSupportToppling, supportContactsFor } from "@automovie/engine";
import { IAutoMovieSpace, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  namedFacts,
  nclose,
  vclose,
} from "../internal/predicates";

const v: (x: number, z: number, y?: number) => IAutoMovieVector3 = (
  x: number,
  z: number,
  y: number = 0,
): IAutoMovieVector3 => ({ x, y, z });

/** A lone 2×2 table top at height 1 over void: nothing else to rest on. */
const space: IAutoMovieSpace = {
  id: "set",
  surfaces: [
    {
      id: "table",
      kind: "platform",
      polygon: [v(0, 0), v(2, 0), v(2, 2), v(0, 2)],
      anchor: { x: 0, y: 1, z: 0 },
      rampTo: null,
    },
    {
      id: "slope",
      kind: "ramp",
      polygon: [v(10, 0), v(14, 0), v(14, 4), v(10, 4)],
      anchor: { x: 10, y: 0, z: 0 },
      rampTo: { x: 14, y: 2, z: 0 },
    },
  ],
  walkable: [],
};

/**
 * `supportContactsFor` derives the support points #601's topple judgment was
 * taking as raw input: each footprint corner over a surface (walkable or not:
 * objects rest on no-go tops) becomes a contact at that surface's height, and
 * corners over nothing contribute none, so a crate half off a table edge loses
 * exactly the overhanging contacts and topples as physics expects.
 *
 * Scenarios:
 *
 * 1. A box footprint centered on the table yields four contacts, all at the table
 *    height.
 * 2. On a ramp the contacts carry the interpolated per-corner heights (hand
 *    oracle: 0→2 over x=10..14 gives 0.5 at x=11, 1.5 at x=13).
 * 3. A centered box is stable: `detectSupportToppling` over the derived contacts
 *    reports no topple.
 * 4. Half off the table edge only the on-table corners contact, and the center of
 *    mass overhangs: the same call now suggests a topple.
 * 5. Fully over void there are no contacts, and the topple judgment rejects the
 *    empty support with a `type` violation (its existing guard).
 *
 * @evidence contracts/testing.md#behavioral-verification Derives contact points with supportContactsFor and feeds them into detectSupportToppling, checking table/ramp heights, retained plan coordinates, stable centered support, two remaining edge contacts with a positive topple overshoot, and an empty-support type finding over void.
 * @evidence contracts/testing.md#independent-expectations The table footprint includes four centered corners at height 1 but only the x=1.5 pair of a half-overhanging footprint. Ramp rise 2 over span 4 gives heights 0.5 and 1.5 at x=11 and 13. Center x=2 is outside the remaining support segment x=1.5; assertions require positive rather than exact overshoot.
 * @evidence contracts/testing.md#distinguishing-cases Centered, sloped, partly unsupported and fully unsupported footprints distinguish projection from walkability and omitted contacts from invented ground. Exact topple tolerance, layered tops, physicsIntent and malformed source surfaces belong to other tests.
 * @evidence contracts/testing.md#execution-ownership The named test_space_support_contacts entry explicitly composes two portable product functions in memory; it proves this tested composition rather than installation in a production physics host, and dynamically registers no cases.
 */
export function test_space_support_contacts(): void {
  const centered: IAutoMovieVector3[] = supportContactsFor(space, [
    v(0.5, 0.5),
    v(1.5, 0.5),
    v(1.5, 1.5),
    v(0.5, 1.5),
  ]);
  TestValidator.equals("centered box has four contacts", centered.length, 4);
  TestValidator.predicate(
    "contacts sit at the table height",
    centered.every((contact: IAutoMovieVector3): boolean =>
      nclose(contact.y, 1),
    ),
  );
  TestValidator.predicate(
    "contact keeps its plan position",
    vclose(centered[0]!, { x: 0.5, y: 1, z: 0.5 }),
  );

  const onRamp: IAutoMovieVector3[] = supportContactsFor(space, [
    v(11, 1),
    v(13, 1),
  ]);
  TestValidator.equals(
    "ramp contacts interpolate",
    namedFacts([
      ["ncloseOnRamp0", (): boolean => nclose(onRamp[0]!.y, 0.5)],
      ["ncloseOnRamp1", (): boolean => nclose(onRamp[1]!.y, 1.5)],
    ]),
    { ncloseOnRamp0: true, ncloseOnRamp1: true },
  );

  const stable: ReturnType<typeof detectSupportToppling> =
    detectSupportToppling({
      node: "crate",
      centerOfMass: { x: 1, y: 1.2, z: 1 },
      support: centered,
    });
  TestValidator.equals("centered box is stable", stable.toppling, null);
  TestValidator.equals("stable box validates", stable.validation.success, true);

  const halfOff: IAutoMovieVector3[] = supportContactsFor(space, [
    v(1.5, 0.5),
    v(2.5, 0.5),
    v(2.5, 1.5),
    v(1.5, 1.5),
  ]);
  TestValidator.equals("overhanging corners skipped", halfOff.length, 2);
  const toppling: ReturnType<typeof detectSupportToppling> =
    detectSupportToppling({
      node: "crate",
      centerOfMass: { x: 2, y: 1.2, z: 1 },
      support: halfOff,
    });
  TestValidator.equals(
    "half-off box topples",
    namedFacts([
      ["topplingToppling", (): boolean => toppling.toppling !== null],
      [
        "topplingTopplingOvershoot",
        (): boolean =>
          toppling.toppling !== null && toppling.toppling.overshoot > 0,
      ],
    ]),
    { topplingToppling: true, topplingTopplingOvershoot: true },
  );

  const overVoid: IAutoMovieVector3[] = supportContactsFor(space, [
    v(50, 50),
    v(51, 50),
  ]);
  TestValidator.equals("void footprint has no contacts", overVoid.length, 0);
  TestValidator.predicate(
    "empty support rejected by the topple judge",
    hasViolation(
      detectSupportToppling({
        centerOfMass: { x: 50, y: 1, z: 50 },
        support: overVoid,
      }).validation,
      "type",
      ".support",
    ),
  );
}
