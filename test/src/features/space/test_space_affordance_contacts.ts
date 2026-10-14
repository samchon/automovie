import { Quaternion, affordanceSupportContacts } from "@automovie/engine";
import {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../internal/predicates";

const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const UNIT: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

const SQUARE: IAutoMovieVector3[] = [
  { x: -0.5, y: 0, z: -0.5 },
  { x: 0.5, y: 0, z: -0.5 },
  { x: 0.5, y: 0, z: 0.5 },
  { x: -0.5, y: 0, z: 0.5 },
];

/**
 * `affordanceSupportContacts` lifts a stack-top's extent corners through the
 * affordance frame and the parent world transform into the world-space contact
 * points the #601 support judgment consumes. The oracle is hand math on a
 * translated + yawed parent; mis-use (a point-like kind, a missing extent) is a
 * mis-wired pipeline and throws.
 *
 * Scenarios:
 *
 * 1. A unit-square top at local height 0.5 on a parent at (2, 0, 1) yawed 90°:
 *    each corner (x, 0, z) maps to world (2 + z, 0.5, 1 − x): all four hand
 *    oracles, `y` at the face height.
 * 2. Extent corner `y` is ignored (write 0): a corner authored with y = 7 lands at
 *    the same world point as y = 0.
 * 3. A `handle` (point-like) throws: support contacts only come from a stack-top.
 * 4. A stack-top with `extent: null` throws: nothing to rest on.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls affordanceSupportContacts and asserts one transformed point per extent corner, the expected world coordinates, ignored extent Y, and explicit misuse errors for a handle or missing extent.
 * @evidence contracts/testing.md#independent-expectations A positive 90-degree Y rotation sends (x,z) to (z,-x), so parent translation gives (2+z,0.5,1-x). These hand coordinates and error fragments are independent of the returned contacts; tolerance-based vectors permit ordinary quaternion rounding.
 * @evidence contracts/testing.md#distinguishing-cases The square, nonzero corner Y, point-like kind and absent extent separate valid rigid placement from ignored-height and refusal branches. Both transforms use unit scale; non-unit scale, tilted affordance frames and actual toppling judgment are outside this helper test.
 * @evidence contracts/testing.md#execution-ownership The named test_space_affordance_contacts entry exercises portable quaternion/vector contact derivation directly, without a renderer or wired support host and with no dynamically registered cases.
 */
export function test_space_affordance_contacts(): void {
  const top: IAutoMovieAffordance = {
    id: "top",
    kind: "stack-top",
    frame: {
      translation: { x: 0, y: 0.5, z: 0 },
      rotation: IDENTITY,
      scale: UNIT,
    },
    extent: SQUARE,
  };
  const parentWorld: IAutoMovieTransform = {
    translation: { x: 2, y: 0, z: 1 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    scale: UNIT,
  };

  const contacts: IAutoMovieVector3[] = affordanceSupportContacts({
    affordance: top,
    parentWorld,
  });
  TestValidator.equals("one contact per extent corner", contacts.length, 4);
  SQUARE.forEach((corner: IAutoMovieVector3, i: number): void => {
    TestValidator.predicate(
      `corner ${i} lands at the yawed world point`,
      vclose(contacts[i]!, { x: 2 + corner.z, y: 0.5, z: 1 - corner.x }),
    );
  });

  const lofted: IAutoMovieVector3[] = affordanceSupportContacts({
    affordance: { ...top, extent: [{ x: 0.5, y: 7, z: 0.5 }, ...SQUARE] },
    parentWorld,
  });
  TestValidator.predicate(
    "extent corner y is ignored",
    vclose(lofted[0]!, { x: 2.5, y: 0.5, z: 0.5 }),
  );

  TestValidator.predicate(
    "a point-like kind throws",
    throwsError(
      (): IAutoMovieVector3[] =>
        affordanceSupportContacts({
          affordance: { ...top, kind: "handle", extent: null },
          parentWorld,
        }),
      ['"handle", not a "stack-top"'],
    ),
  );
  TestValidator.predicate(
    "a stack-top without an extent throws",
    throwsError(
      (): IAutoMovieVector3[] =>
        affordanceSupportContacts({
          affordance: { ...top, extent: null },
          parentWorld,
        }),
      ["has no extent"],
    ),
  );
}
