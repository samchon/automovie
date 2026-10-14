import {
  builtEnvironmentPlacementBounds,
  builtEnvironmentPlacementOverlap,
  builtEnvironmentSupportStatus,
  validateBuiltEnvironment,
} from "@automovie/engine";
import type {
  AutoMovieBuiltPlacementSupportLocator,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPlacementBounds,
  IAutoMovieBuiltPlacementOverlapResult,
  IAutoMovieBuiltSupportResult,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtPlacementTestBody as body } from "../internal/builtPlacementTestBody";
import { builtPlacementTestEnvironment as environment } from "../internal/builtPlacementTestEnvironment";
import { builtPlacementTestSupport as support } from "../internal/builtPlacementTestSupport";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/predicates";

/**
 * Resolve placement bounds and classify bearing, suspension and named-neighbour overlap under disclosed measurement bases.
 *
 * Scenarios:
 * 1. An environment-owned element and a compact three-member population return hand-derived world boxes and preserve their different measurement bases.
 * 2. A missing element and a transform-only group remain unresolved, while an element citing a runtime model reference resolves to the one world origin the record does state and labels that box `element-origin-point`.
 * 3. Bearing against an element and an authored surface classifies exact contact, positive gap, penetration, no planar support, and the exact tolerance boundary; omitted tolerance takes the deterministic default.
 * 4. The resolved chandelier/ceiling suspension returns suspended; bearing cases with each unresolved-side combination name the missing side and retain the known side's basis.
 * 5. Negative and non-finite tolerances are refused rather than silently changing the meaning of contact.
 * 6. Named-neighbour bounds distinguish positive-volume overlap, exact face contact, separation, conservative population involvement, and unresolved operands without expanding population members.
 * 7. An extent-free body is never silently confused with a measured one: it bears from its origin and clears its neighbour, and both answers carry the basis that says no volume was measured.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls placement bounds, support status and pair overlap after graph validation, checking min/max/basis records, bearing gaps and statuses, resolved suspension, ordered unresolved sides and invalid-tolerance throws. Lost measurement provenance, a strict rather than inclusive tolerance boundary or conflating unresolved with separate contradicts these returned records.
 * @evidence contracts/testing.md#independent-expectations The authored unit cube at Y 1.5 reaches Y 1..2 above a slab top at 1; offsets ±0.25 and tolerance 0.25 determine resting/floating/sunk outcomes under the original nclose limits. Three grid slots at X -1/0/1 and prototype half-width 0.5 fix population bounds X -1.5..1.5; literal basis/status/id arrays fix categorical results. Suspension tests resolution rather than physical attachment, and the external model contributes only its stated origin.
 * @evidence contracts/testing.md#distinguishing-cases Keeps element/population/surface support, contact/gap/penetration/no-planar-support, the exact positive tolerance boundary, resolved suspension, bearing unresolved-side combinations, empty surface, invalid tolerances and pair contact/separation/overlap. The pair's both-unresolved case and disclosed origin fallback are observed; unresolved suspension, every one-sided overlap combination, thin contact between probes and actual population member occupancy are not certified.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_environment_placement imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_environment_placement(): void {
  const source: IAutoMovieBuiltEnvironment = environment();
  TestValidator.equals(
    "the authored environment is valid",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );

  TestValidator.predicate(
    "element world bounds",
    ((): boolean => {
      const observed: IAutoMovieBuiltPlacementBounds | null =
        builtEnvironmentPlacementBounds({
          environment: source,
          target: body("element", "resting"),
        });
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 3 &&
        Object.hasOwn(observed, "min") &&
        typeof observed["min"] === "object" &&
        typeof observed["min"] === "object" &&
        observed["min"] !== null &&
        observed["min"] !== undefined &&
        Object.keys(observed["min"]).length === 3 &&
        Object.hasOwn(observed["min"], "x") &&
        typeof observed["min"]["x"] === "number" &&
        nclose(observed["min"]["x"], -0.5) &&
        Object.hasOwn(observed["min"], "y") &&
        typeof observed["min"]["y"] === "number" &&
        nclose(observed["min"]["y"], 1) &&
        Object.hasOwn(observed["min"], "z") &&
        typeof observed["min"]["z"] === "number" &&
        nclose(observed["min"]["z"], -0.5) &&
        Object.hasOwn(observed, "max") &&
        typeof observed["max"] === "object" &&
        typeof observed["max"] === "object" &&
        observed["max"] !== null &&
        observed["max"] !== undefined &&
        Object.keys(observed["max"]).length === 3 &&
        Object.hasOwn(observed["max"], "x") &&
        typeof observed["max"]["x"] === "number" &&
        nclose(observed["max"]["x"], 0.5) &&
        Object.hasOwn(observed["max"], "y") &&
        typeof observed["max"]["y"] === "number" &&
        nclose(observed["max"]["y"], 2) &&
        Object.hasOwn(observed["max"], "z") &&
        typeof observed["max"]["z"] === "number" &&
        nclose(observed["max"]["z"], 0.5) &&
        Object.hasOwn(observed, "basis") &&
        observed["basis"] === "element-geometry-bounds"
      );
    })(),
  );
  TestValidator.predicate(
    "compact population world bounds",
    ((): boolean => {
      const observed: IAutoMovieBuiltPlacementBounds | null =
        builtEnvironmentPlacementBounds({
          environment: source,
          target: body("population", "flags"),
        });
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 3 &&
        Object.hasOwn(observed, "min") &&
        typeof observed["min"] === "object" &&
        typeof observed["min"] === "object" &&
        observed["min"] !== null &&
        observed["min"] !== undefined &&
        Object.keys(observed["min"]).length === 3 &&
        Object.hasOwn(observed["min"], "x") &&
        typeof observed["min"]["x"] === "number" &&
        nclose(observed["min"]["x"], -1.5) &&
        Object.hasOwn(observed["min"], "y") &&
        typeof observed["min"]["y"] === "number" &&
        nclose(observed["min"]["y"], 1) &&
        Object.hasOwn(observed["min"], "z") &&
        typeof observed["min"]["z"] === "number" &&
        nclose(observed["min"]["z"], 3.5) &&
        Object.hasOwn(observed, "max") &&
        typeof observed["max"] === "object" &&
        typeof observed["max"] === "object" &&
        observed["max"] !== null &&
        observed["max"] !== undefined &&
        Object.keys(observed["max"]).length === 3 &&
        Object.hasOwn(observed["max"], "x") &&
        typeof observed["max"]["x"] === "number" &&
        nclose(observed["max"]["x"], 1.5) &&
        Object.hasOwn(observed["max"], "y") &&
        typeof observed["max"]["y"] === "number" &&
        nclose(observed["max"]["y"], 2) &&
        Object.hasOwn(observed["max"], "z") &&
        typeof observed["max"]["z"] === "number" &&
        nclose(observed["max"]["z"], 4.5) &&
        Object.hasOwn(observed, "basis") &&
        observed["basis"] === "population-placement-bounds"
      );
    })(),
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
  TestValidator.predicate(
    "referenced model without local geometry is its stated origin point",
    ((): boolean => {
      const observed: IAutoMovieBuiltPlacementBounds | null =
        builtEnvironmentPlacementBounds({
          environment: source,
          target: body("element", "external"),
        });
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 3 &&
        Object.hasOwn(observed, "min") &&
        typeof observed["min"] === "object" &&
        typeof observed["min"] === "object" &&
        observed["min"] !== null &&
        observed["min"] !== undefined &&
        Object.keys(observed["min"]).length === 3 &&
        Object.hasOwn(observed["min"], "x") &&
        typeof observed["min"]["x"] === "number" &&
        nclose(observed["min"]["x"], 0) &&
        Object.hasOwn(observed["min"], "y") &&
        typeof observed["min"]["y"] === "number" &&
        nclose(observed["min"]["y"], 1) &&
        Object.hasOwn(observed["min"], "z") &&
        typeof observed["min"]["z"] === "number" &&
        nclose(observed["min"]["z"], 0) &&
        Object.hasOwn(observed, "max") &&
        typeof observed["max"] === "object" &&
        typeof observed["max"] === "object" &&
        observed["max"] !== null &&
        observed["max"] !== undefined &&
        Object.keys(observed["max"]).length === 3 &&
        Object.hasOwn(observed["max"], "x") &&
        typeof observed["max"]["x"] === "number" &&
        nclose(observed["max"]["x"], 0) &&
        Object.hasOwn(observed["max"], "y") &&
        typeof observed["max"]["y"] === "number" &&
        nclose(observed["max"]["y"], 1) &&
        Object.hasOwn(observed["max"], "z") &&
        typeof observed["max"]["z"] === "number" &&
        nclose(observed["max"]["z"], 0) &&
        Object.hasOwn(observed, "basis") &&
        observed["basis"] === "element-origin-point"
      );
    })(),
  );
  TestValidator.equals(
    "unknown population has no invented bounds",
    builtEnvironmentPlacementBounds({
      environment: source,
      target: body("population", "missing"),
    }),
    null,
  );
  const unpopulated: IAutoMovieBuiltEnvironment = environment();
  delete unpopulated.populations;
  TestValidator.equals(
    "a record declaring no populations at all resolves none",
    builtEnvironmentPlacementBounds({
      environment: unpopulated,
      target: body("population", "flags"),
    }),
    null,
  );

  const bearing: (
    subjectId: string,
    target?: AutoMovieBuiltPlacementSupportLocator,
    tolerance?: number,
  ) => IAutoMovieBuiltSupportResult = (
    subjectId: string,
    target: AutoMovieBuiltPlacementSupportLocator = support("element", "slab"),
    tolerance?: number,
  ): IAutoMovieBuiltSupportResult =>
    builtEnvironmentSupportStatus({
      environment: source,
      query: {
        subject: body("element", subjectId),
        support: target,
        kind: "bearing",
        ...(tolerance === undefined ? {} : { tolerance }),
      },
    });
  TestValidator.predicate(
    "resting on element support",
    ((): boolean => {
      const observed: IAutoMovieBuiltSupportResult = bearing("resting");
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "resting" &&
        Object.hasOwn(observed, "gap") &&
        typeof observed["gap"] === "number" &&
        nclose(observed["gap"], 0) &&
        Object.hasOwn(observed, "unresolved") &&
        Array.isArray(observed["unresolved"]) &&
        observed["unresolved"].length === 0 &&
        Object.hasOwn(observed, "subjectBasis") &&
        observed["subjectBasis"] === "element-geometry-bounds" &&
        Object.hasOwn(observed, "supportBasis") &&
        observed["supportBasis"] === "element-geometry-bounds"
      );
    })(),
  );
  TestValidator.predicate(
    "floating above element support",
    ((): boolean => {
      const observed: IAutoMovieBuiltSupportResult = bearing("floating");
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "floating" &&
        Object.hasOwn(observed, "gap") &&
        typeof observed["gap"] === "number" &&
        nclose(observed["gap"], 0.25) &&
        Object.hasOwn(observed, "unresolved") &&
        Array.isArray(observed["unresolved"]) &&
        observed["unresolved"].length === 0 &&
        Object.hasOwn(observed, "subjectBasis") &&
        observed["subjectBasis"] === "element-geometry-bounds" &&
        Object.hasOwn(observed, "supportBasis") &&
        observed["supportBasis"] === "element-geometry-bounds"
      );
    })(),
  );
  TestValidator.predicate(
    "sunk into element support",
    ((): boolean => {
      const observed: IAutoMovieBuiltSupportResult = bearing("sunk");
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "sunk" &&
        Object.hasOwn(observed, "gap") &&
        typeof observed["gap"] === "number" &&
        nclose(observed["gap"], -0.25) &&
        Object.hasOwn(observed, "unresolved") &&
        Array.isArray(observed["unresolved"]) &&
        observed["unresolved"].length === 0 &&
        Object.hasOwn(observed, "subjectBasis") &&
        observed["subjectBasis"] === "element-geometry-bounds" &&
        Object.hasOwn(observed, "supportBasis") &&
        observed["supportBasis"] === "element-geometry-bounds"
      );
    })(),
  );
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
  TestValidator.predicate(
    "exact tolerance boundary is resting",
    ((): boolean => {
      const observed: IAutoMovieBuiltSupportResult = bearing(
        "floating",
        support("element", "slab"),
        0.25,
      );
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "resting" &&
        Object.hasOwn(observed, "gap") &&
        typeof observed["gap"] === "number" &&
        nclose(observed["gap"], 0.25) &&
        Object.hasOwn(observed, "unresolved") &&
        Array.isArray(observed["unresolved"]) &&
        observed["unresolved"].length === 0 &&
        Object.hasOwn(observed, "subjectBasis") &&
        observed["subjectBasis"] === "element-geometry-bounds" &&
        Object.hasOwn(observed, "supportBasis") &&
        observed["supportBasis"] === "element-geometry-bounds"
      );
    })(),
  );
  TestValidator.predicate(
    "authored support surface uses its height rule",
    ((): boolean => {
      const observed: IAutoMovieBuiltSupportResult = bearing(
        "resting",
        support("surface", "floor-surface"),
      );
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "resting" &&
        Object.hasOwn(observed, "gap") &&
        typeof observed["gap"] === "number" &&
        nclose(observed["gap"], 0) &&
        Object.hasOwn(observed, "unresolved") &&
        Array.isArray(observed["unresolved"]) &&
        observed["unresolved"].length === 0 &&
        Object.hasOwn(observed, "subjectBasis") &&
        observed["subjectBasis"] === "element-geometry-bounds" &&
        Object.hasOwn(observed, "supportBasis") &&
        observed["supportBasis"] === "surface-height-rule"
      );
    })(),
  );
  TestValidator.predicate(
    "compact population can be the named support without expansion",
    ((): boolean => {
      const observed: IAutoMovieBuiltSupportResult = bearing(
        "population-resting",
        support("population", "flags"),
      );
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "resting" &&
        Object.hasOwn(observed, "gap") &&
        typeof observed["gap"] === "number" &&
        nclose(observed["gap"], 0) &&
        Object.hasOwn(observed, "unresolved") &&
        Array.isArray(observed["unresolved"]) &&
        observed["unresolved"].length === 0 &&
        Object.hasOwn(observed, "subjectBasis") &&
        observed["subjectBasis"] === "element-geometry-bounds" &&
        Object.hasOwn(observed, "supportBasis") &&
        observed["supportBasis"] === "population-placement-bounds"
      );
    })(),
  );

  TestValidator.predicate(
    "a body the record carries no vertices for is probed as its origin",
    ((): boolean => {
      const observed: IAutoMovieBuiltSupportResult = bearing("external");
      return (
        typeof observed === "object" &&
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "resting" &&
        Object.hasOwn(observed, "gap") &&
        typeof observed["gap"] === "number" &&
        nclose(observed["gap"], 0) &&
        Object.hasOwn(observed, "unresolved") &&
        Array.isArray(observed["unresolved"]) &&
        observed["unresolved"].length === 0 &&
        Object.hasOwn(observed, "subjectBasis") &&
        observed["subjectBasis"] === "element-origin-point" &&
        Object.hasOwn(observed, "supportBasis") &&
        observed["supportBasis"] === "element-geometry-bounds"
      );
    })(),
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
  const degenerate: IAutoMovieBuiltEnvironment = environment();
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
    throwsError(
      (): IAutoMovieBuiltSupportResult =>
        bearing("resting", support("element", "slab"), -1),
    ),
  );
  TestValidator.predicate(
    "non-finite tolerance is refused",
    throwsError(
      (): IAutoMovieBuiltSupportResult =>
        bearing("resting", support("element", "slab"), Infinity),
    ),
  );

  const overlap: (
    left: string,
    right: string,
  ) => IAutoMovieBuiltPlacementOverlapResult = (
    left: string,
    right: string,
  ): IAutoMovieBuiltPlacementOverlapResult =>
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
}
