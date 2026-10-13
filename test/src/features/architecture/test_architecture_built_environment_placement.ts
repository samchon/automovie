import {
  builtEnvironmentPlacementBounds,
  builtEnvironmentPlacementOverlap,
  builtEnvironmentSupportStatus,
  validateBuiltEnvironment,
} from "@automovie/engine";
import type { AutoMovieBuiltPlacementSupportLocator } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtPlacementTestBody as body } from "../internal/builtPlacementTestBody";
import { builtPlacementTestEnvironment as environment } from "../internal/builtPlacementTestEnvironment";
import { builtPlacementTestSupport as support } from "../internal/builtPlacementTestSupport";
import { throwsError } from "../internal/predicates";

/**
 *
 * Building placement review reuses authored geometry and compact population
 * bounds instead of asking a reviewer to infer support from rendered pixels.
 *
 * Scenarios:
 *
 * 1. An environment-owned element and a compact three-member population return
 *    hand-derived world boxes and preserve their different measurement bases.
 * 2. A missing element and a transform-only group remain unresolved, while an
 *    element citing a runtime model reference resolves to the one world origin
 *    the record does state and labels that box `element-origin-point`.
 * 3. Bearing against an element and an authored surface classifies exact
 *    contact, positive gap, penetration, no planar support, and the exact
 *    tolerance boundary; omitted tolerance takes the deterministic default.
 * 4. A declared chandelier suspension is legitimate only when both its body
 *    and named ceiling resolve; every subject/support unresolved combination
 *    reports the exact missing side and retains the basis of the side it knows.
 * 5. Negative and non-finite tolerances are refused rather than silently
 *    changing the meaning of contact.
 * 6. Named-neighbour bounds distinguish positive-volume overlap, exact face
 *    contact, separation, conservative population involvement, and unresolved
 *    operands without expanding population members.
 * 7. An extent-free body is never silently confused with a measured one: it
 *    bears from its origin and clears its neighbour, and both answers carry the
 *    basis that says no volume was measured.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `builtEnvironmentPlacementBounds`, `builtEnvironmentSupportStatus` and `builtEnvironmentPlacementOverlap` beside `validateBuiltEnvironment` and asserts world boxes with their basis, bearing and suspension status, signed gap, unresolved sides and bases, overlap status, and tolerance refusals; it catches invented bounds for a missing, transform-only or undeclared population target, a referenced model with no box, contact misclassified at the tolerance boundary, face contact reported as overlap, a known side's basis lost when the other is unresolved, and a negative or infinite tolerance silently accepted.
 * @evidence contracts/testing.md#independent-expectations Boxes and gaps are hand arithmetic on the fixture: the 1 m slab centred at y 0.5 tops out at 1, so cubes centred at 1.5, 1.75 and 1.25 rest, float 0.25 and sink 0.25, the cube at x 5 is off the 4 m slab, a neighbour at x 0.5 overlaps and one at x 1 touches, the three-member grid at anchor (0, 1, 4) with unit spacing spans x -1.5..1.5, y 1..2, z 3.5..4.5, and the floor surface's constant height 1 meets the resting cube's underside; basis labels and unresolved side names are the interface's documented values.
 * @evidence contracts/testing.md#distinguishing-cases Positive element, population and origin-point bounds; null for a missing element, a transform-only root, a missing population and a record with no populations; bearing resting, floating, sunk, off-support, exactly at tolerance 0.25, on a surface, on a population and from an origin point; suspension; unresolved subject, support, both, and a surface with an empty polygon; negative and infinite tolerance refusals; overlapping, touching, separate, population and extent-free operands, and both operands unresolved; multi-part support is owned by test_architecture_built_environment_multipart_support and population member bounds by test_architecture_built_population_placement_bounds.
 */
export const test_architecture_built_environment_placement = (): void => {
  const source = environment();
  TestValidator.equals(
    "the authored environment is valid",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );

  TestValidator.equals(
    "element world bounds",
    builtEnvironmentPlacementBounds({
      environment: source,
      target: body("element", "resting"),
    }),
    {
      min: { x: -0.5, y: 1, z: -0.5 },
      max: { x: 0.5, y: 2, z: 0.5 },
      basis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "compact population world bounds",
    builtEnvironmentPlacementBounds({
      environment: source,
      target: body("population", "flags"),
    }),
    {
      min: { x: -1.5, y: 1, z: 3.5 },
      max: { x: 1.5, y: 2, z: 4.5 },
      basis: "population-placement-bounds",
    },
  );
  TestValidator.equals(
    "unknown element has no invented bounds",
    builtEnvironmentPlacementBounds({
      environment: source,
      target: body("element", "missing"),
    }),
    null,
  );
  TestValidator.equals(
    "transform-only element has no invented bounds",
    builtEnvironmentPlacementBounds({
      environment: source,
      target: body("element", "root"),
    }),
    null,
  );
  TestValidator.equals(
    "referenced model without local geometry is its stated origin point",
    builtEnvironmentPlacementBounds({
      environment: source,
      target: body("element", "external"),
    }),
    {
      min: { x: 0, y: 1, z: 0 },
      max: { x: 0, y: 1, z: 0 },
      basis: "element-origin-point",
    },
  );
  TestValidator.equals(
    "unknown population has no invented bounds",
    builtEnvironmentPlacementBounds({
      environment: source,
      target: body("population", "missing"),
    }),
    null,
  );
  const unpopulated = environment();
  delete unpopulated.populations;
  TestValidator.equals(
    "a record declaring no populations at all resolves none",
    builtEnvironmentPlacementBounds({
      environment: unpopulated,
      target: body("population", "flags"),
    }),
    null,
  );

  const bearing = (
    subjectId: string,
    target: AutoMovieBuiltPlacementSupportLocator = support("element", "slab"),
    tolerance?: number,
  ) =>
    builtEnvironmentSupportStatus({
      environment: source,
      query: {
        subject: body("element", subjectId),
        support: target,
        kind: "bearing",
        ...(tolerance === undefined ? {} : { tolerance }),
      },
    });
  TestValidator.equals("resting on element support", bearing("resting"), {
    status: "resting",
    gap: 0,
    unresolved: [],
    subjectBasis: "element-geometry-bounds",
    supportBasis: "element-geometry-bounds",
  });
  TestValidator.equals("floating above element support", bearing("floating"), {
    status: "floating",
    gap: 0.25,
    unresolved: [],
    subjectBasis: "element-geometry-bounds",
    supportBasis: "element-geometry-bounds",
  });
  TestValidator.equals("sunk into element support", bearing("sunk"), {
    status: "sunk",
    gap: -0.25,
    unresolved: [],
    subjectBasis: "element-geometry-bounds",
    supportBasis: "element-geometry-bounds",
  });
  TestValidator.equals(
    "element standing outside named support",
    bearing("off-support"),
    {
      status: "not-over-support",
      gap: null,
      unresolved: [],
      subjectBasis: "element-geometry-bounds",
      supportBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "exact tolerance boundary is resting",
    bearing("floating", support("element", "slab"), 0.25),
    {
      status: "resting",
      gap: 0.25,
      unresolved: [],
      subjectBasis: "element-geometry-bounds",
      supportBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "authored support surface uses its height rule",
    bearing("resting", support("surface", "floor-surface")),
    {
      status: "resting",
      gap: 0,
      unresolved: [],
      subjectBasis: "element-geometry-bounds",
      supportBasis: "surface-height-rule",
    },
  );
  TestValidator.equals(
    "compact population can be the named support without expansion",
    bearing("population-resting", support("population", "flags")),
    {
      status: "resting",
      gap: 0,
      unresolved: [],
      subjectBasis: "element-geometry-bounds",
      supportBasis: "population-placement-bounds",
    },
  );

  TestValidator.equals(
    "a body the record carries no vertices for is probed as its origin",
    bearing("external"),
    {
      status: "resting",
      gap: 0,
      unresolved: [],
      subjectBasis: "element-origin-point",
      supportBasis: "element-geometry-bounds",
    },
  );

  TestValidator.equals(
    "authored chandelier suspension",
    builtEnvironmentSupportStatus({
      environment: source,
      query: {
        subject: body("element", "chandelier"),
        support: support("element", "ceiling"),
        kind: "suspended",
      },
    }),
    {
      status: "suspended",
      gap: null,
      unresolved: [],
      subjectBasis: "element-geometry-bounds",
      supportBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "unresolved subject retains support basis",
    bearing("missing"),
    {
      status: "unresolved",
      gap: null,
      unresolved: ["subject"],
      subjectBasis: null,
      supportBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "unresolved support retains subject basis",
    bearing("resting", support("surface", "missing")),
    {
      status: "unresolved",
      gap: null,
      unresolved: ["support"],
      subjectBasis: "element-geometry-bounds",
      supportBasis: null,
    },
  );
  TestValidator.equals(
    "both unresolved sides are named in stable order",
    bearing("missing", support("element", "missing")),
    {
      status: "unresolved",
      gap: null,
      unresolved: ["subject", "support"],
      subjectBasis: null,
      supportBasis: null,
    },
  );
  const degenerate = environment();
  degenerate.surfaces[0]!.surface.polygon = [];
  TestValidator.equals(
    "surface with no measurable face is unresolved",
    builtEnvironmentSupportStatus({
      environment: degenerate,
      query: {
        subject: body("element", "resting"),
        support: support("surface", "floor-surface"),
        kind: "bearing",
      },
    }).status,
    "unresolved",
  );
  TestValidator.predicate(
    "negative tolerance is refused",
    throwsError(() => bearing("resting", support("element", "slab"), -1)),
  );
  TestValidator.predicate(
    "non-finite tolerance is refused",
    throwsError(() => bearing("resting", support("element", "slab"), Infinity)),
  );

  const overlap = (left: string, right: string) =>
    builtEnvironmentPlacementOverlap({
      environment: source,
      left: body("element", left),
      right: body("element", right),
    });
  TestValidator.equals(
    "positive-volume neighbour overlap",
    overlap("resting", "overlap-neighbour"),
    {
      status: "overlapping",
      unresolved: [],
      leftBasis: "element-geometry-bounds",
      rightBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "exact face contact is not overlap",
    overlap("resting", "touch-neighbour"),
    {
      status: "separate",
      unresolved: [],
      leftBasis: "element-geometry-bounds",
      rightBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "separated neighbours",
    overlap("resting", "off-support"),
    {
      status: "separate",
      unresolved: [],
      leftBasis: "element-geometry-bounds",
      rightBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "population overlap preserves conservative basis",
    builtEnvironmentPlacementOverlap({
      environment: source,
      left: body("population", "flags"),
      right: body("element", "off-support"),
    }),
    {
      status: "separate",
      unresolved: [],
      leftBasis: "population-placement-bounds",
      rightBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "an extent-free operand clears its neighbour under a disclosed basis",
    overlap("external", "resting"),
    {
      status: "separate",
      unresolved: [],
      leftBasis: "element-origin-point",
      rightBasis: "element-geometry-bounds",
    },
  );
  TestValidator.equals(
    "both unresolved overlap operands are named",
    builtEnvironmentPlacementOverlap({
      environment: source,
      left: body("element", "missing-left"),
      right: body("population", "missing-right"),
    }),
    {
      status: "unresolved",
      unresolved: ["left", "right"],
      leftBasis: null,
      rightBasis: null,
    },
  );
};
