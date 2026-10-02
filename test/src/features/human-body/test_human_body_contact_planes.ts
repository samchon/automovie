import { TestValidator } from "@nestia/e2e";

import {
  type BodyContactBones,
  bisectorPlane,
  chooseContactPlane,
  contactPlane,
  depthOfPlane,
  ownerOfSeam,
} from "../../../scripts/body-basis/bodyContactPlanes";
import { nclose } from "../internal/predicates";

const identity = { x: 0, y: 0, z: 0, w: 1 };
const quarter = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
const half = { x: 1, y: 0, z: 0, w: 0 };

const bones = (
  child: { x: number; y: number; z: number },
  rotation = identity,
): BodyContactBones =>
  new Map([
    [
      "hips",
      {
        position: { x: 0, y: 0, z: 0 },
        rotation: identity,
        length: 0.2,
        parent: null,
      },
    ],
    [
      "spine",
      { position: child, rotation, length: 0.2, parent: "hips" as const },
    ],
  ]);

const near = (found: number[], expected: number[]): boolean =>
  found.length === expected.length &&
  found.every((value, at) => nclose(value, expected[at], 1e-9));

/**
 * The separating planes of two skin segments: the fold plane of a parent and
 * its child, the contact plane of two bone segments, the signed depth, the
 * seam owner and the choice of the cheaper plane.
 *
 * Bones are hand-placed: a bone runs from its head along its rotation's local
 * Y column, so the identity points up and a quarter turn about X points
 * forward.
 *
 * Scenarios:
 * 1. A child bent a quarter turn from its parent has a fold plane through the
 *    child's head whose normal is the sum of the two axes, pointing to the
 *    child's side for the child and negated for the parent; two bones that are
 *    not parent and child, and a child folded straight back on its parent
 *    (axes cancelling), have none.
 * 2. Two parallel bones a metre apart have a contact plane at their midpoint
 *    with its normal from `other` to `part`; two bones that meet have none.
 * 3. The signed depth of a vertex is its distance along the normal.
 * 4. A seam vertex belongs to `other` (`-1`) exactly when the bone that
 *    dominates it is `other`.
 * 5. With both planes available the cheaper one wins: corners that already
 *    straddle the fold plane choose it, and corners that straddle the contact
 *    plane choose that; with no crossed corner on one side both cost
 *    infinity and the fold plane, listed first, is kept; with neither plane
 *    the answer is null.
 */
export const test_human_body_contact_planes = (): void => {
  // 1. fold plane
  const bent = bones({ x: 0, y: 0.2, z: 0 }, quarter);
  const fold = bisectorPlane(bent, "spine", "hips")!;
  TestValidator.predicate(
    "child side normal",
    near(fold.normal, [0, Math.SQRT1_2, Math.SQRT1_2]),
  );
  TestValidator.predicate("through the child head", near(fold.point, [0, 0.2, 0]));
  TestValidator.predicate(
    "parent side normal is the negation",
    near(bisectorPlane(bent, "hips", "spine")!.normal, [
      0,
      -Math.SQRT1_2,
      -Math.SQRT1_2,
    ]),
  );
  TestValidator.equals(
    "not parent and child",
    bisectorPlane(
      new Map([...bent, ["chest" as const, { ...bent.get("spine")!, parent: null }]]),
      "hips",
      "chest",
    ),
    null,
  );
  TestValidator.equals(
    "a child folded straight back has no crease",
    bisectorPlane(bones({ x: 0, y: 0.2, z: 0 }, half), "spine", "hips"),
    null,
  );

  // 2. contact plane
  const apart = bones({ x: 1, y: 0.1, z: 0 });
  const contact = contactPlane(apart, "hips", "spine")!;
  TestValidator.predicate("midpoint", near(contact.point, [0.5, 0.1, 0]));
  TestValidator.predicate("normal from other to part", near(contact.normal, [-1, 0, 0]));
  TestValidator.equals(
    "bones that meet have no contact plane",
    contactPlane(bones({ x: 0, y: 0.2, z: 0 }), "hips", "spine"),
    null,
  );

  // 3. depth
  TestValidator.predicate(
    "depth along the normal",
    nclose(
      depthOfPlane({ point: [0, 0, 0], normal: [0, 0, 1] }, [9, 9, 9, 0, 0, 0.25], 1),
      0.25,
      1e-12,
    ),
  );

  // 4. seam owner
  const owner = ownerOfSeam(
    new Map([
      ["hips", [0, 1, 2]],
      ["spine", [2, 3]],
    ]),
    (v) => (v <= 1 ? "hips" : "spine"),
    "hips",
    "spine",
  );
  TestValidator.equals("a hips vertex belongs to part", owner.get(0), 1);
  TestValidator.equals("a spine vertex belongs to other", owner.get(3), -1);
  TestValidator.equals("the seam vertex follows its dominant bone", owner.get(2), -1);

  // 5. the cheaper plane
  const both = bones({ x: 0.5, y: 0.2, z: 0 });
  const straddleContact = [0.2, 0.3, 0, 0.3, 0.1, 0];
  const straddleFold = [0.2, 0.3, 0, 0.3, 0.1, 0];
  TestValidator.equals(
    "corners straddling the fold plane choose it",
    chooseContactPlane(both, straddleFold, [0], [1], "spine", "hips")!.kind,
    "fold",
  );
  TestValidator.equals(
    "corners straddling the contact plane choose it",
    chooseContactPlane(
      both,
      [0.6, 0.2, 0, 0.1, 0.3, 0],
      [0],
      [1],
      "spine",
      "hips",
    )!.kind,
    "contact",
  );
  TestValidator.equals(
    "no crossed corner on one side keeps the first plane",
    chooseContactPlane(both, straddleContact, [0], [], "spine", "hips")!.kind,
    "fold",
  );
  TestValidator.equals(
    "neither plane",
    chooseContactPlane(
      new Map([
        ["hips" as const, { ...both.get("hips")!, parent: null }],
        ["chest" as const, { ...both.get("hips")!, parent: null }],
      ]),
      straddleContact,
      [0],
      [1],
      "hips",
      "chest",
    ),
    null,
  );
};
