import {
  measureAutoMovieQuantities,
} from "@automovie/engine";
import {
  type AutoMovieQuantityBasis, type AutoMovieQuantitySubject, type AutoMovieQuantityUnit, type IAutoMovieDrawingGap, type IAutoMovieQuantityContributor, type IAutoMovieQuantityFinding, type IAutoMovieQuantityReport,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  drawingEnvironment,
} from "../internal/drawingFixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { test02DrawingQuantityGeometry } from "../internal/test02DrawingQuantityGeometry";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * The design is measured, and every number says whether it can be believed.
 *
 * All of it is hand arithmetic over the fixture. The hall is 10 x 6 on plan, so
 * its floor is 60 m2 and its 3 m volume is 180 m3; the roof deck adds 10 x 0.5
 * x 6 = 30 m3; the stair route climbs 3 and runs 2 in one leg, so it is the
 * square root of 13 long; the ramp climbs 3 and runs 4, so it is exactly 5. The
 * door void is 0.9 x 2.1 = 1.89 m2 and the oculus is a circle of radius 0.3.
 *
 * The volume figure is the one that must not be read as exact. A logical space
 * is a union of convex cells and this is the sum of them, so the report says
 * `approximate` and carries a reason. Other findings' `exact` labels describe
 * report policy rather than exact-real arithmetic or measured physical truth.
 *
 * Scenarios:
 *
 * 1. Every subject is answered for, in the fixed order, at the fixture's own
 *    dimensions and units.
 * 2. Areas, lengths and counts are `exact`; a logical volume is `approximate` and
 *    carries an approximation reason where exact findings carry `null`.
 * 3. Contributors are bounded: what the bound leaves out is counted and summed,
 *    and the total still covers every owner.
 * 4. A subject with nothing to measure reports a zero over zero owners rather than
 *    vanishing from the report.
 * 5. Openings with no void, and cells no volume can be computed for, are gaps
 *    rather than omissions or zeros.
 * 6. A convex cell's volume is its own arithmetic: a box, a box with a corner cut
 *    off, a cell written with unnormalized normals, and a cell nothing bounds.
 * 7. A cell's cross-section has its expected area where the cut passes through it, empty where
 *    it does not, and reported as unbounded where the design never closed it.
 * 8. A malformed bound and an invalid design are refused at their own messages.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs measureAutoMovieQuantities plus the existing cell volume/section probes, checking full subject/unit/value/basis rows, contributor ordering/truncation/reconciliation, approximation/gap policy, empty subjects, repeated digest and malformed-input refusal. Original scenarios 6/7 are delegated sequentially to test02DrawingQuantityGeometry.
 * @evidence contracts/testing.md#independent-expectations Authored boxes give 60 floor area and 180+30 volume; a 0.9-by-2.1 void and radius-0.3 circle give opening area, while sqrt(13)+five gives route length on the six-decimal output grid. Literal counts/owner lists and box 24, clipped-cube 5/6 and section eight supply analytic expectations without product-calculated expected values.
 * @evidence contracts/testing.md#distinguishing-cases Populated/empty openings, full/bounded contributors, absent void/unbounded cell gaps, normalized/scaled/repeated planes, redundant edge contact, cut-off cube and open/parallel cells distinguish geometry/accounting branches. Through/above/contradictory/unbounded sections retain distinct outcomes; malformed contributor bounds and schema fail at their stated causes.
 * @evidence contracts/testing.md#execution-ownership Uses local existing atelier/cell declarations and synchronous numerical report/drawing APIs without rendering, filesystem publication, resources, clocks, global replacement or a new host. Exact labels and selected area/volume checks do not certify arbitrary numeric conditioning, cell-union volume, full section-shape equality or physical take-off; repeated digests do not independently prove byte equality.
 */
export function test_drawing_quantity_report(): void {
  const environment: IAutoMovieBuiltEnvironment = drawingEnvironment();
  const report: IAutoMovieQuantityReport = measureAutoMovieQuantities({ environment });
  const finding: (subject: string) => IAutoMovieQuantityFinding = (subject: string) : IAutoMovieQuantityFinding =>
    report.findings.find((entry: IAutoMovieQuantityFinding) : boolean => entry.subject === subject)!;

  // 1-2. Every subject, at the fixture's own dimensions.
  TestValidator.equals(
    "the report names its protocol and the environment it measured",
    [report.version, report.protocol, report.environment],
    [1, "automovie.quantity.v1", "atelier"],
  );
  TestValidator.predicate(
    "areas, lengths and counts are the fixture's own arithmetic",
    test12ValuesClose(
    report.findings.map((entry: IAutoMovieQuantityFinding) : (number | AutoMovieQuantitySubject | AutoMovieQuantityUnit | AutoMovieQuantityBasis)[] => [
      entry.subject,
      entry.unit,
      entry.total,
      entry.owners,
      entry.basis,
    ]),
    [
      ["space-floor-area", "m2", 60, 1, "exact"],
      ["space-volume", "m3", 210, 2, "approximate"],
      // 0.9 x 2.1 plus a circle of radius 0.3.
      ["opening-area", "m2", 2.172743, 2, "exact"],
      // The square root of 13, plus a 3-4-5 ramp.
      ["connector-length", "m", 8.605551, 2, "exact"],
      ["element-count", "count", 6, 6, "exact"],
      ["opening-count", "count", 3, 3, "exact"],
      ["model-occurrence-count", "count", 5, 4, "exact"],
    ],
    ),
  );
  TestValidator.predicate(
    "a logical volume states an approximation where an exact area states none",
    test12ValuesClose(
    [
      finding("space-volume").approximation !== null,
      finding("space-floor-area").approximation,
      finding("space-volume").contributors,
    ],
    [
      true,
      null,
      [
        { owner: "hall", value: 180 },
        { owner: "roof-deck", value: 30 },
      ],
    ],
    ),
  );
  TestValidator.predicate(
    "owners are ordered by what they cost, then by their own id",
    test12ValuesClose(
    [
      finding("connector-length").contributors,
      finding("model-occurrence-count").contributors,
    ],
    [
      [
        { owner: "service-ramp", value: 5 },
        { owner: "roof-stair", value: 3.605551 },
      ],
      [
        { owner: "slab", value: 2 },
        { owner: "beam", value: 1 },
        { owner: "leaf", value: 1 },
        { owner: "wall", value: 1 },
      ],
    ],
    ),
  );
  TestValidator.equals(
    "the door and the oculus are measured from their own voids",
    namedFacts([
      [
        "oculus",
        () : boolean =>
          nclose(
            finding("opening-area").contributors.find(
              (entry: IAutoMovieQuantityContributor) : boolean => entry.owner === "oculus",
            )!.value,
            Math.PI * 0.09,
          ),
      ],
      [
        "frontDoor",
        () : boolean =>
          nclose(finding("opening-area").contributors.find(
            (entry: IAutoMovieQuantityContributor) : boolean => entry.owner === "front-door",
          )!.value, 1.89, 0),
      ],
    ]),
    { oculus: true, frontDoor: true },
  );

  // 3. The bound.
  const bounded: IAutoMovieQuantityFinding = measureAutoMovieQuantities({
    environment,
    maxContributors: 2,
  }).findings.find((entry: IAutoMovieQuantityFinding) : boolean => entry.subject === "element-count")!;
  TestValidator.predicate(
    "the bound names two owners, counts the other four, and still totals six",
    test12ValuesClose(
    [
      bounded.total,
      bounded.owners,
      bounded.contributors.map((entry: IAutoMovieQuantityContributor) : string => entry.owner),
      bounded.omittedOwners,
      bounded.omittedValue,
    ],
    [6, 6, ["beam", "building"], 4, 4],
    ),
  );
  TestValidator.predicate(
    "the default bound leaves nothing out of a building this small",
    test12ValuesClose(
    report.findings.map((entry: IAutoMovieQuantityFinding) : number[] => [entry.omittedOwners, entry.omittedValue]),
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    ),
  );
  TestValidator.equals(
    "the same design measures the same digest twice",
    measureAutoMovieQuantities({ environment: drawingEnvironment() }).digest,
    report.digest,
  );

  // 4. A subject with nothing to measure.
  const bare: IAutoMovieQuantityReport = measureAutoMovieQuantities({
    environment: withoutOpenings(environment),
  });
  TestValidator.predicate(
    "a design with no openings reports a zero over zero owners, not a hole",
    test12ValuesClose(
    bare.findings
      .filter((entry: IAutoMovieQuantityFinding) : boolean => entry.subject.startsWith("opening-"))
      .map((entry: IAutoMovieQuantityFinding) : (number | AutoMovieQuantitySubject)[] => [
        entry.subject,
        entry.total,
        entry.owners,
        entry.contributors.length,
      ]),
    [
      ["opening-area", 0, 0, 0],
      ["opening-count", 0, 0, 0],
    ],
    ),
  );

  // 5. Gaps.
  TestValidator.equals(
    "the report names every take-off the design cannot support",
    report.gaps.map((gap: IAutoMovieDrawingGap) : string[] => [gap.subject, gap.status]),
    [
      ["developed-surface-area", "unsupported"],
      ["material-quantity", "unsupported"],
      ["opening-area", "not-run"],
      ["opening-deduction", "unsupported"],
      ["pattern-cut-waste", "unsupported"],
      ["surface-identity", "unsupported"],
    ],
  );
  TestValidator.equals(
    "an opening-free design reports no opening-area gap",
    bare.gaps.some((gap: IAutoMovieDrawingGap) : boolean => gap.subject === "opening-area"),
    false,
  );
  const unbounded: IAutoMovieQuantityReport = measureAutoMovieQuantities({
    environment: unboundedCell(environment),
  });
  TestValidator.predicate(
    "a cell nothing bounds contributes nothing and is reported as not run",
    test12ValuesClose(
    [
      unbounded.findings.find((entry: IAutoMovieQuantityFinding) : boolean => entry.subject === "space-volume")!
        .total,
      unbounded.gaps.find((gap: IAutoMovieDrawingGap) : boolean => gap.subject === "unbounded-space-cell")
        ?.status,
    ],
    // The hall's 180 and the deck's 30 still measure; the open cell adds
    // nothing rather than adding a horizon.
    [210, "not-run"],
    ),
  );

  // 6-7. Existing cell volume and cross-section cases remain sequential.
  test02DrawingQuantityGeometry(environment, unboundedCell);

  // 8. Refusals.
  TestValidator.equals(
    "a malformed bound and an invalid design are refused at their own messages",
    namedFacts([
      [
        "a fractional contributor bound is refused",
        () : boolean =>
          throwsError(
            () : IAutoMovieQuantityReport =>
              measureAutoMovieQuantities({ environment, maxContributors: 1.5 }),
            "must be a positive safe integer",
          ),
      ],
      [
        "a zero contributor bound is refused",
        () : boolean =>
          throwsError(
            () : IAutoMovieQuantityReport =>
              measureAutoMovieQuantities({ environment, maxContributors: 0 }),
            "must be a positive safe integer",
          ),
      ],
      [
        "a bound of one is accepted and names exactly one owner",
        () : boolean =>
          measureAutoMovieQuantities({
            environment,
            maxContributors: 1,
          }).findings.find((entry: IAutoMovieQuantityFinding) : boolean => entry.subject === "element-count")!
            .contributors.length === 1,
      ],
      [
        "an invalid design is refused before anything is measured",
        () : boolean =>
          throwsError(
            () : IAutoMovieQuantityReport =>
              measureAutoMovieQuantities({
                environment: { ...environment, version: 2 as unknown as 1 },
              }),
            ["is invalid at", "building schema version must be 1"],
          ),
      ],
    ]),
    {
      "a fractional contributor bound is refused": true,
      "a zero contributor bound is refused": true,
      "a bound of one is accepted and names exactly one owner": true,
      "an invalid design is refused before anything is measured": true,
    },
  );
}

/** The same design with every opening removed. */
const withoutOpenings: (environment: IAutoMovieBuiltEnvironment) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({ ...environment, openings: [] });

/**
 * The same design with an extra logical space nothing closes.
 *
 * Four half-spaces bound its x and y and leave z running to the horizon, which
 * is a real authoring mistake and the one case a cross-section and a volume
 * both have to decline rather than answer.
 */
const unboundedCell: (environment: IAutoMovieBuiltEnvironment) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  spaces: [
    ...environment.spaces,
    {
      id: "open-air",
      kind: "void",
      parent: "site",
      cells: [
        {
          id: "open-cell",
          planes: [
            { normal: { x: 1, y: 0, z: 0 }, offset: 10 },
            { normal: { x: -1, y: 0, z: 0 }, offset: 0 },
            { normal: { x: 0, y: 1, z: 0 }, offset: 3 },
            { normal: { x: 0, y: -1, z: 0 }, offset: 0 },
          ],
        },
      ],
    },
  ],
});
