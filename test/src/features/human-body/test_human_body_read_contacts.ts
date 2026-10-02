import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { meshOfSegment } from "../../../scripts/body-basis/bodyContactGeometry";
import {
  type IBodySegmented,
  countBodyContactTriangles,
  readBodyContacts,
  readMovedBodyContacts,
  summarizeBodyContacts,
} from "../../../scripts/body-basis/readBodyContacts";
import { createBodyContactPatchFixture } from "../internal/bodyContactPatchFixture";

/**
 * Crossing readings of a body split into segments: every pair, the pairs a
 * corrective that moved some vertices can have changed, and the two small
 * summaries.
 *
 * The segmented body is the two-patch fixture (see
 * `createBodyContactPatchFixture`), the flat patch as the part `flat` and the
 * pierced tent as the part `tent`, plus a third part `far` a metre away that
 * crosses nothing.
 *
 * Scenarios:
 * 1. The full reading finds the one pair `flat` and `tent` with triangles on
 *    both sides, and no pair for a part against itself when `within` is off;
 *    the negative twin, a clear fixture, reads nothing.
 * 2. Moving a vertex of `tent` reads the pair again; moving only a vertex of
 *    `far` reads no moved pair (`known` absent); a known pair whose parts
 *    were not moved stays as it was.
 * 3. A known pair of a touched part is replaced by the fresh reading and not
 *    doubled.
 * 4. With `within` on, a segment that crosses itself reads its own pair; with
 *    it off the same moved reading skips it.
 * 5. The triangle count sums both sides of every pair, and the summary lists
 *    `part x other` joined by commas, `-` for none.
 */
export const test_human_body_read_contacts = (): void => {
  const segmentedOf = (positions: number[], fixture = createBodyContactPatchFixture()): IBodySegmented => {
    const parts = [
      { id: "flat", corners: fixture.a },
      { id: "tent", corners: fixture.b },
      {
        id: "far",
        corners: [0, 1, 2],
      },
    ].map(({ id, corners }) => ({
      id,
      name: null,
      geometry: {
        type: "mesh" as const,
        mesh: meshOfSegment(
          id === "far" ? positions.map((value, at) => (at % 3 === 0 ? value + 5 : value)) : positions,
          corners,
        ),
      },
      material: null,
      attachedBone: null,
      transform: null,
    }));
    const model: IAutoMovieModel = {
      id: "segmented",
      name: null,
      origin: "imported",
      parts,
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return {
      model,
      sources: new Map([
        ["flat", [...new Set(fixture.a)]],
        ["tent", [...new Set(fixture.b)]],
        ["far", [100]],
      ]),
    };
  };
  const fixture = createBodyContactPatchFixture();
  const crossing = segmentedOf(fixture.positions);

  // 1. full reading
  const pairs = readBodyContacts(crossing, false);
  TestValidator.equals("one pair", pairs.length, 1);
  TestValidator.predicate(
    "the pair names both parts with triangles on both sides",
    pairs[0].part === "flat" &&
      pairs[0].other === "tent" &&
      pairs[0].triangles > 0 &&
      pairs[0].otherTriangles > 0,
  );
  const clear = createBodyContactPatchFixture(3, -0.005);
  TestValidator.equals(
    "the clear twin reads nothing",
    readBodyContacts(segmentedOf(clear.positions, clear)).length,
    0,
  );

  // 2. moved readings
  const moved = readMovedBodyContacts(crossing, new Set([9]), null);
  TestValidator.equals("a moved vertex of the tent reads the pair", moved.length, 1);
  TestValidator.equals(
    "a moved vertex of an uncrossed part reads nothing without a known reading",
    readMovedBodyContacts(crossing, new Set([100]), null).length,
    0,
  );
  const known = [
    { part: "flat", other: "tent", triangles: 999, otherTriangles: 999 },
  ];
  TestValidator.equals(
    "the known pair stays when its parts were not moved",
    readMovedBodyContacts(segmentedOf(fixture.positions), new Set([]), known),
    known,
  );

  // 3. a known pair of a touched part is replaced
  const replaced = readMovedBodyContacts(crossing, new Set([9]), known);
  TestValidator.equals("not doubled", replaced.length, 1);
  TestValidator.predicate(
    "and read afresh",
    replaced[0].triangles === moved[0].triangles && replaced[0].triangles !== 999,
  );

  // 4. within
  const folded: IBodySegmented = {
    ...crossing,
    model: {
      ...crossing.model,
      parts: [
        {
          ...crossing.model.parts[0],
          geometry: {
            type: "mesh",
            mesh: meshOfSegment(fixture.positions, [...fixture.a, ...fixture.b]),
          },
        },
      ],
    },
    sources: new Map([["flat", [...new Set([...fixture.a, ...fixture.b])]]]),
  };
  TestValidator.predicate(
    "a segment through itself reads its own pair",
    readBodyContacts(folded, true).some((pair) => pair.part === pair.other),
  );
  TestValidator.equals(
    "and skips it when within is off",
    readMovedBodyContacts(folded, new Set([9]), null, false).length,
    0,
  );
  TestValidator.predicate(
    "the moved reading finds it when within is on",
    readMovedBodyContacts(folded, new Set([9]), null, true).some(
      (pair) => pair.part === pair.other,
    ),
  );

  // 5. summaries
  TestValidator.equals(
    "the triangles of both sides",
    countBodyContactTriangles([
      { part: "a", other: "b", triangles: 3, otherTriangles: 4 },
      { part: "c", other: "c", triangles: 1, otherTriangles: 1 },
    ]),
    9,
  );
  TestValidator.equals(
    "the summary",
    summarizeBodyContacts([
      { part: "a", other: "b", triangles: 1, otherTriangles: 1 },
      { part: "c", other: "c", triangles: 1, otherTriangles: 1 },
    ]),
    "axb,cxc",
  );
  TestValidator.equals("no pair", summarizeBodyContacts([]), "-");
};
