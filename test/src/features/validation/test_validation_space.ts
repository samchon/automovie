import { validateSpace } from "@automovie/engine";
import { IAutoMovieValidation, IAutoMovieSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { hasViolation, namedFacts } from "../internal/predicates";
import { validationSpaceFixtures } from "../internal/validationSpaceFixtures";
import { assertValidationSpaceHeights } from "../internal/assertValidationSpaceHeights";


/**
 * Pins malformed space admission before ground queries consume its data.
 *
 * Scenarios:
 *
 * 1. A well-formed flat + ramp space validates.
 * 2. An empty space id / surface id is a `type` violation.
 * 3. A duplicated surface id is a `type` violation on the duplicate.
 * 4. An unknown surface kind (runtime junk past the closed union) is rejected.
 * 5. A footprint of fewer than three points encloses no area.
 * 6. Collinear footprint points enclose no area. 6b. A concave footprint (an
 *    L-shape) is accepted, which is the exact inverse of what this case pinned
 *    before #1868: the ground query classifies against the ring rather than its
 *    hull, so the notch is the author's and no longer a shape the validator has
 *    to forbid on the query's behalf. 6c. A footprint with a collinear point on
 *    an edge is still allowed. 6d. A self-crossing footprint is refused: it has
 *    no inside for a foot to be on, and its two spellings reach different
 *    checks — a symmetric bowtie's lobes cancel and it is caught as a ring
 *    enclosing no area, while a lopsided one encloses area and is caught as a
 *    ring that crosses itself. 6e. Holes: a well-formed void through a plate
 *    passes; a hole of fewer than three points, a collinear hole, a
 *    self-crossing hole, a hole reaching outside its plate, a hole flush
 *    against the outer ring, an outer ring reaching in to touch a hole, and two
 *    holes sharing plan area are each refused at the hole's own path, so an
 *    author is told which ring is wrong. A ring already refused on its own is
 *    not compared with the others, and the holes that survived still are.
 * 7. A non-finite footprint plan coordinate is a `range` violation (`y` is
 *    documented-ignored and deliberately not checked).
 * 8. A non-finite height anchor is a `range` violation.
 * 9. A ramp whose `rampTo` sits at the anchor's XZ has a degenerate axis.
 * 10. A non-finite `rampTo` is caught by the anchor check (and safely skips the
 *     degeneracy math).
 * 11. A walkable id that resolves to no surface (or is duplicated) is a `type`
 *     violation.
 * 12. A surface states its ground exactly once: carrying a height rule beside the
 *     anchors is refused, and carrying neither is refused. Two statements are
 *     two answers waiting to be edited apart; none is no ground at all.
 * 13. A constant, a plane, and a heightfield lattice each validate on their own.
 * 14. Every height-rule parameter is range-checked: a non-finite level, a
 *     non-finite plane term, a non-finite lattice origin, a pitch at or below
 *     zero, a lattice under two lines on an axis, a sample array that is not
 *     exactly the lattice, and a non-finite sample.
 * 15. A height rule whose `kind` is runtime junk past the closed union is refused
 *     rather than read as a lattice whose fields do not exist.
 *
 * @evidence contracts/testing.md#behavioral-verification Asserts acceptance of valid flat, ramp, concave and holed spaces and located rejection of malformed rings, anchors and references.
 *
 * @evidence contracts/testing.md#independent-expectations Located errors follow the authored field paths and finite complete lattice contract, independently of the validator's implementation; this does not measure rendered ground.
 *
 * @evidence contracts/testing.md#distinguishing-cases Retains every previous positive, malformed, touching-hole, crossing-ring and bad-anchor case; the shared height helper keeps the rule cases and adds a missing sample.
 *
 * @evidence contracts/testing.md#execution-ownership Portable engine admission runs through test_validation_space; the discoverable test_validation_space entry owns every synchronous case without a browser or native renderer.
 */
export function test_validation_space(): void {
  const { v, valid, withSurface }: ReturnType<typeof validationSpaceFixtures> = validationSpaceFixtures();

  TestValidator.equals(
    "valid space passes",
    validateSpace({ space: valid }).success,
    true,
  );

  TestValidator.predicate(
    "empty space id",
    hasViolation(
      validateSpace({ space: { ...valid, id: " " } }),
      "type",
      "$input.id",
    ),
  );
  TestValidator.predicate(
    "empty surface id",
    hasViolation(
      validateSpace({ space: withSurface({ id: "" }) }),
      "type",
      ".id",
    ),
  );
  TestValidator.predicate(
    "duplicate surface id",
    hasViolation(
      validateSpace({ space: withSurface({ id: "floor" }) }),
      "type",
      "surfaces[1].id",
    ),
  );
  TestValidator.predicate(
    "unknown surface kind",
    hasViolation(
      validateSpace({
        space: withSurface({ kind: "lava" as IAutoMovieSurface["kind"] }),
      }),
      "type",
      ".kind",
    ),
  );
  TestValidator.predicate(
    "footprint needs three points",
    hasViolation(
      validateSpace({ space: withSurface({ polygon: [v(0, 0), v(1, 0)] }) }),
      "type",
      ".polygon",
    ),
  );
  TestValidator.predicate(
    "collinear footprint rejected",
    hasViolation(
      validateSpace({
        space: withSurface({ polygon: [v(0, 0), v(1, 1), v(2, 2)] }),
      }),
      "type",
      ".polygon",
    ),
  );
  TestValidator.equals(
    "concave footprint accepted",
    validateSpace({
      space: withSurface({
        // An L-shape. The (2,2) inner corner sits inside the convex hull, which
        // is why this was refused while the query read the hull; the query
        // reads the ring now, so the notch is a shape and not a defect.
        polygon: [v(0, 0), v(4, 0), v(4, 2), v(2, 2), v(2, 4), v(0, 4)],
      }),
    }).success,
    true,
  );
  TestValidator.equals(
    "footprint with a collinear edge point passes",
    validateSpace({
      space: withSurface({
        // A square with an extra midpoint on the bottom edge: the vertex adds
        // nothing and takes nothing away, so it must be accepted.
        polygon: [v(0, 0), v(2, 0), v(4, 0), v(4, 4), v(0, 4)],
      }),
    }).success,
    true,
  );
  TestValidator.predicate(
    "a symmetric bowtie cancels to no area",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(4, 4), v(4, 0), v(0, 4)],
        }),
      }),
      "type",
      ".polygon",
    ),
  );
  TestValidator.predicate(
    "a lopsided bowtie encloses area and is refused for crossing itself",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(4, 4), v(4, 0), v(0, 6)],
        }),
      }),
      "type",
      ".polygon",
    ),
  );
  TestValidator.equals(
    "a plate with an atrium void passes",
    validateSpace({
      space: withSurface({
        polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
        holes: [[v(2, 2), v(6, 2), v(6, 6), v(2, 6)]],
      }),
    }).success,
    true,
  );
  TestValidator.predicate(
    "a hole needs three points",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [[v(2, 2), v(6, 2)]],
        }),
      }),
      "type",
      ".holes[0]",
    ),
  );
  TestValidator.predicate(
    "a collinear hole encloses nothing",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [[v(2, 2), v(3, 3), v(4, 4)]],
        }),
      }),
      "type",
      ".holes[0]",
    ),
  );
  TestValidator.predicate(
    "a hole may not reach outside its own plate",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [[v(6, 6), v(12, 6), v(12, 10), v(6, 10)]],
        }),
      }),
      "type",
      ".holes[0]",
    ),
  );
  TestValidator.predicate(
    "a hole flush against the outer ring is a notch, not a void",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [[v(0, 2), v(4, 2), v(4, 6), v(0, 6)]],
        }),
      }),
      "type",
      ".holes[0]",
    ),
  );
  TestValidator.predicate(
    "two holes may not share plan area",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [
            [v(1, 1), v(4, 1), v(4, 4), v(1, 4)],
            [v(3, 3), v(6, 3), v(6, 6), v(3, 6)],
          ],
        }),
      }),
      "type",
      ".holes[1]",
    ),
  );
  TestValidator.predicate(
    "a non-finite hole coordinate is located at the hole's own point",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [[v(2, 2), v(Number.POSITIVE_INFINITY, 2), v(6, 6)]],
        }),
      }),
      "range",
      ".holes[0][1].x",
    ),
  );
  TestValidator.predicate(
    "a self-crossing hole is refused like any other ring",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [[v(2, 2), v(6, 6), v(6, 2), v(2, 7)]],
        }),
      }),
      "type",
      ".holes[0]",
    ),
  );
  TestValidator.predicate(
    "a later hole is still compared against the holes that survived",
    hasViolation(
      validateSpace({
        space: withSurface({
          polygon: [v(0, 0), v(8, 0), v(8, 8), v(0, 8)],
          holes: [
            [v(1, 1), v(2, 2), v(3, 3)],
            [v(4, 4), v(6, 4), v(6, 6), v(4, 6)],
            [v(5, 5), v(7, 5), v(7, 7), v(5, 7)],
          ],
        }),
      }),
      "type",
      ".holes[2]",
    ),
  );
  TestValidator.equals(
    "an outer ring that reaches in to touch a hole is refused too",
    validateSpace({
      space: withSurface({
        // A plate with a tongue whose tip lands exactly on the void's own rim.
        polygon: [
          v(0, 0),
          v(8, 0),
          v(8, 8),
          v(0, 8),
          v(0, 4.5),
          v(2, 4),
          v(0, 3.5),
        ],
        holes: [[v(2, 2), v(6, 2), v(6, 6), v(2, 6)]],
      }),
    }).success,
    false,
  );
  TestValidator.predicate(
    "non-finite footprint coordinate",
    hasViolation(
      validateSpace({
        space: withSurface({ polygon: [v(0, 0), v(Number.NaN, 0), v(1, 1)] }),
      }),
      "range",
      ".polygon[1].x",
    ),
  );
  TestValidator.predicate(
    "non-finite anchor",
    hasViolation(
      validateSpace({
        space: withSurface({ anchor: { x: 0, y: Number.NaN, z: 0 } }),
      }),
      "range",
      ".anchor.y",
    ),
  );
  TestValidator.predicate(
    "degenerate ramp axis",
    hasViolation(
      validateSpace({
        space: withSurface({ rampTo: { x: 4, y: 2, z: 0 } }),
      }),
      "range",
      ".rampTo",
    ),
  );
  const junkRamp: IAutoMovieValidation = validateSpace({
    space: withSurface({ rampTo: { x: Number.NaN, y: 2, z: 0 } }),
  });
  TestValidator.predicate(
    "non-finite rampTo caught",
    hasViolation(junkRamp, "range", ".rampTo.x"),
  );
  TestValidator.equals(
    "non-finite rampTo skips the degeneracy math",
    namedFacts([
      ["refused", (): boolean => junkRamp.success === false],
      [
        "violated",
        (): boolean => junkRamp.success === false && junkRamp.violations.length === 1,
      ],
    ]),
    { refused: true, violated: true },
  );
  const junkRampZ: IAutoMovieValidation = validateSpace({
    space: withSurface({ rampTo: { x: 8, y: 2, z: Number.NaN } }),
  });
  TestValidator.equals(
    "non-finite rampTo z likewise skips the degeneracy math",
    namedFacts([
      [
        "hasViolationJunkRampZRange",
        (): boolean => hasViolation(junkRampZ, "range", ".rampTo.z"),
      ],
      ["junkRampZSuccess", (): boolean => junkRampZ.success === false],
      [
        "junkRampZViolations",
        (): boolean => junkRampZ.success === false && junkRampZ.violations.length === 1,
      ],
    ]),
    {
      hasViolationJunkRampZRange: true,
      junkRampZSuccess: true,
      junkRampZViolations: true,
    },
  );
  TestValidator.predicate(
    "unresolved walkable id",
    hasViolation(
      validateSpace({ space: { ...valid, walkable: ["floor", "ghost"] } }),
      "type",
      "walkable[1]",
    ),
  );
  TestValidator.predicate(
    "duplicated walkable id",
    hasViolation(
      validateSpace({ space: { ...valid, walkable: ["floor", "floor"] } }),
      "type",
      "walkable[1]",
    ),
  );
  assertValidationSpaceHeights();
}
