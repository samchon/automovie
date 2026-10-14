import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieDrawingGap,
  IAutoMovieDrawingView,
  IAutoMovieQuantityContributor,
  IAutoMovieQuantityFinding,
  IAutoMovieSpaceShell,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtEnvironmentContainsPoint } from "@automovie/engine";
import { builtEnvironmentSpaceFidelity } from "@automovie/engine";
import { builtSpaceContainsPoint } from "@automovie/engine";
import { builtSpaceIsConvex } from "@automovie/engine";
import { builtSpaceShellVolume } from "@automovie/engine";
import { builtSpaceStatesVolume } from "@automovie/engine";
import { validateBuiltEnvironment } from "@automovie/engine";
import { deriveAutoMovieDrawing } from "@automovie/engine";
import { measureAutoMovieQuantities } from "@automovie/engine";
import { BUILT_SPACE_SHELL_TEST_HALL as HALL } from "../internal/BUILT_SPACE_SHELL_TEST_HALL";
import { assertBuiltSpaceShellTestRefusals } from "../internal/assertBuiltSpaceShellTestRefusals";
import { builtSpaceShellTestBoxShell as boxShell } from "../internal/builtSpaceShellTestBoxShell";
import { builtSpaceShellTestSpaceOf as spaceOf } from "../internal/builtSpaceShellTestSpaceOf";
import { builtSpaceShellTestWork as work } from "../internal/builtSpaceShellTestWork";
import { drawingView } from "../internal/drawingFixtures";
import { hasViolation, namedFacts, nclose } from "../internal/predicates";

/**
 * Query an authored closed shell with an atrium void and retain declared fidelity and unsupported downstream section gaps.
 *
 * Scenarios:
 * 1. A shelled hall with an atrium void: a point in the room is inside, a point in the void is **outside**, a point beyond the hall is outside, and a point on the hall's own face, edge and corner is inside — the corner case being the one a bare solid-angle test gets wrong.
 * 2. Signed shell volume matches outer box minus void within 1e-9 cubic metres.
 * 3. A space states its volume once: carrying cells beside a shell is refused.
 * 4. A shell is held to what makes its inside a fact — too few vertices, too few triangles, a ragged index count, an index naming no vertex, a degenerate facet, an unmatched directed edge, a doubled facet, and a shell wound inside out are each refused.
 * 5. `fidelity` is a closed word, may not be declared by a space that states no volume, and folds over descendants: a faceted hall makes its own building faceted, a volume-less subtree is `unstated`.
 * 6. Quantity contributor/total volume match 336 within 1e-6, and the faceted space produces its unsupported curvature gap beside the exact-declared twin.
 * 7. The drafter cannot section a shell and says so: a cut sheet of the shelled hall draws no region for it and carries an `unsupported` gap naming the subject, while the same sheet of a celled hall draws the region and raises no such gap. A sheet that does draw a faceted space owns up to that under the same subject the take-off uses, so the two artifacts cannot disagree about whether a dome was drawn or approximated.
 * 8. Either spelling answers one set of questions: `builtSpaceStatesVolume` and `builtSpaceIsConvex` read a shell, one cell, several cells and nothing at all without any caller counting cells for itself.
 * 9. Missing-vertex triples give zero volume and false containment; the existing repeated-index facet mutation preserves the tested inside/outside answers without NaN poisoning.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls shell and descendant containment, signed volume, spelling/convexity/fidelity readers, building admission, quantity take-off and drawing derivation. Literal point Booleans, volumes, selected gap subject/status/reason fragments, region counts and malformed-shell path membership expose filled atrium voids, lost boundary admission, absent-volume confusion or downstream gaps presented as solved geometry.
 * @evidence contracts/testing.md#independent-expectations Authored boxes give 10*4*10-4*4*4=336 m3 under volume tolerance 1e-9 and quantity tolerance 1e-6; explicit face/edge/corner/void points supply independent membership expectations. Hand-written index/vertex mutations and shell-versus-cell twins determine refusal/gap/region expectations. Fidelity labels are authored metadata, and selected region counts/gaps do not independently validate full drawing geometry, arbitrary shell topology or curved-space accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Inside/outside/void/boundary points, malformed facets/indices/winding, exclusive cell/shell spelling, fidelity folding, quantity and drawing controls, empty volume and unvalidated dangling/flat facets retain the original cases; this does not certify arbitrary shells or render a curved solid.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_space_shell imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_space_shell(): void {
  const shelled: IAutoMovieBuiltEnvironment = work({});
  TestValidator.equals(
    "a shelled hall holds its room and not its atrium",
    namedFacts([
      [
        "valid",
        (): boolean =>
          validateBuiltEnvironment({ environment: shelled }).success,
      ],
      [
        "inTheRoom",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 1, y: 2, z: 1 }),
      ],
      [
        "inTheAtrium",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "hall", {
            x: 5,
            y: 2,
            z: 5,
          }) === false,
      ],
      [
        "beyondTheHall",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "hall", {
            x: 12,
            y: 2,
            z: 5,
          }) === false,
      ],
      [
        "onAFace",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 0, y: 2, z: 5 }),
      ],
      [
        "onAnEdge",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 0, y: 0, z: 5 }),
      ],
      [
        "inACorner",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 0, y: 0, z: 0 }),
      ],
      [
        "onTheAtriumWall",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 3, y: 2, z: 5 }),
      ],
      [
        "throughTheParent",
        (): boolean =>
          builtEnvironmentContainsPoint(shelled, "whole", { x: 1, y: 2, z: 1 }),
      ],
    ]),
    {
      valid: true,
      inTheRoom: true,
      inTheAtrium: true,
      beyondTheHall: true,
      onAFace: true,
      onAnEdge: true,
      inACorner: true,
      onTheAtriumWall: true,
      throughTheParent: true,
    },
  );

  TestValidator.predicate(
    "the shell encloses the hall less its atrium, exactly",
    nclose(builtSpaceShellVolume(HALL), 10 * 4 * 10 - 4 * 4 * 4, 1e-9),
  );

  const cube: IAutoMovieSpaceShell = boxShell(
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 2, z: 2 },
  );
  assertBuiltSpaceShellTestRefusals(cube);

  const faceted: IAutoMovieBuiltEnvironment = work({ fidelity: "faceted" });
  TestValidator.equals(
    "a faceted volume says so, and says it for everything above it",
    namedFacts([
      [
        "facetedValidates",
        (): boolean =>
          validateBuiltEnvironment({ environment: faceted }).success,
      ],
      [
        "exactValidates",
        (): boolean =>
          validateBuiltEnvironment({ environment: work({ fidelity: "exact" }) })
            .success,
      ],
      [
        "junkWordRefused",
        (): boolean =>
          hasViolation(
            validateBuiltEnvironment({
              environment: work({
                fidelity: "approximate" as IAutoMovieBuiltSpace["fidelity"],
              }),
            }),
            "type",
            ".fidelity",
          ),
      ],
      [
        "nothingToApproximate",
        (): boolean => {
          const environment: IAutoMovieBuiltEnvironment = work({});
          spaceOf(environment, "whole").fidelity = "faceted";
          return hasViolation(
            validateBuiltEnvironment({ environment }),
            "type",
            ".fidelity",
          );
        },
      ],
      [
        "theHallIsExactByDefault",
        (): boolean =>
          builtEnvironmentSpaceFidelity(shelled, "hall") === "exact",
      ],
      [
        "theFacetedHallIsFaceted",
        (): boolean =>
          builtEnvironmentSpaceFidelity(faceted, "hall") === "faceted",
      ],
      [
        "andSoIsTheBuildingOverIt",
        (): boolean =>
          builtEnvironmentSpaceFidelity(faceted, "whole") === "faceted",
      ],
      [
        "aVolumelessSubtreeIsUnstated",
        (): boolean => {
          const environment: IAutoMovieBuiltEnvironment = work({});
          delete spaceOf(environment, "hall").shell;
          return (
            builtEnvironmentSpaceFidelity(environment, "whole") === "unstated"
          );
        },
      ],
    ]),
    {
      facetedValidates: true,
      exactValidates: true,
      junkWordRefused: true,
      nothingToApproximate: true,
      theHallIsExactByDefault: true,
      theFacetedHallIsFaceted: true,
      andSoIsTheBuildingOverIt: true,
      aVolumelessSubtreeIsUnstated: true,
    },
  );

  TestValidator.equals(
    "the take-off measures the shell and owns up to the facets",
    namedFacts([
      [
        "shellVolumeIsMeasured",
        (): boolean => {
          const finding: IAutoMovieQuantityFinding = measureAutoMovieQuantities(
            {
              environment: shelled,
            },
          ).findings.find(
            (entry: IAutoMovieQuantityFinding): boolean =>
              entry.subject === "space-volume",
          )!;
          return (
            finding.contributors.some(
              (contributor: IAutoMovieQuantityContributor): boolean =>
                contributor.owner === "hall" &&
                nclose(contributor.value, 336, 1e-6),
            ) && nclose(finding.total, 336, 1e-6)
          );
        },
      ],
      [
        "anExactSpaceRaisesNoCurvatureGap",
        (): boolean =>
          measureAutoMovieQuantities({ environment: shelled }).gaps.some(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "curved-space-boundary",
          ) === false,
      ],
      [
        "aFacetedSpaceRaisesOne",
        (): boolean =>
          measureAutoMovieQuantities({ environment: faceted }).gaps.some(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "curved-space-boundary" &&
              gap.status === "unsupported" &&
              gap.reason.includes("hall"),
          ),
      ],
    ]),
    {
      shellVolumeIsMeasured: true,
      anExactSpaceRaisesNoCurvatureGap: true,
      aFacetedSpaceRaisesOne: true,
    },
  );

  const celled: IAutoMovieBuiltEnvironment = work({
    shell: undefined,
    cells: [
      {
        id: "box",
        planes: [
          { normal: { x: 1, y: 0, z: 0 }, offset: 10 },
          { normal: { x: -1, y: 0, z: 0 }, offset: 0 },
          { normal: { x: 0, y: 1, z: 0 }, offset: 4 },
          { normal: { x: 0, y: -1, z: 0 }, offset: 0 },
          { normal: { x: 0, y: 0, z: 1 }, offset: 10 },
          { normal: { x: 0, y: 0, z: -1 }, offset: 0 },
        ],
      },
    ],
  });
  const plan: IAutoMovieDrawingView = drawingView({
    origin: { x: 0, y: 2, z: 0 },
  });
  TestValidator.equals(
    "a shell is a section the drafter cannot cut, and it says which",
    namedFacts([
      [
        "theShelledHallDrawsNoRegion",
        (): boolean =>
          deriveAutoMovieDrawing({ environment: shelled, view: plan }).regions
            .length === 0,
      ],
      [
        "andTheSheetNamesTheSubject",
        (): boolean =>
          deriveAutoMovieDrawing({
            environment: shelled,
            view: plan,
          }).gaps.some(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "shelled-space-section" &&
              gap.status === "unsupported",
          ),
      ],
      [
        "aCelledHallDrawsItsRegion",
        (): boolean =>
          deriveAutoMovieDrawing({ environment: celled, view: plan }).regions
            .length === 1,
      ],
      [
        "andRaisesNoSuchGap",
        (): boolean =>
          deriveAutoMovieDrawing({ environment: celled, view: plan }).gaps.some(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "shelled-space-section",
          ) === false,
      ],
      [
        "aDrawnFacetedRegionOwnsUpToItToo",
        (): boolean =>
          deriveAutoMovieDrawing({
            environment: work({
              shell: undefined,
              cells: spaceOf(celled, "hall").cells,
              fidelity: "faceted",
            }),
            view: plan,
          }).gaps.some(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "curved-space-boundary" &&
              gap.status === "unsupported" &&
              gap.reason.includes("hall"),
          ),
      ],
      [
        "andAnExactOneDoesNot",
        (): boolean =>
          deriveAutoMovieDrawing({ environment: celled, view: plan }).gaps.some(
            (gap: IAutoMovieDrawingGap): boolean =>
              gap.subject === "curved-space-boundary",
          ) === false,
      ],
    ]),
    {
      theShelledHallDrawsNoRegion: true,
      andTheSheetNamesTheSubject: true,
      aCelledHallDrawsItsRegion: true,
      andRaisesNoSuchGap: true,
      aDrawnFacetedRegionOwnsUpToItToo: true,
      andAnExactOneDoesNot: true,
    },
  );

  const twoCells: IAutoMovieBuiltEnvironment = work({
    shell: undefined,
    cells: [
      ...spaceOf(celled, "hall").cells,
      { ...spaceOf(celled, "hall").cells[0]!, id: "second" },
    ],
  });
  TestValidator.equals(
    "one set of questions, whichever spelling answered them",
    namedFacts([
      [
        "aShellIsAVolume",
        (): boolean => builtSpaceStatesVolume(spaceOf(shelled, "hall")),
      ],
      [
        "aCellIsAVolume",
        (): boolean => builtSpaceStatesVolume(spaceOf(celled, "hall")),
      ],
      [
        "aNameIsNot",
        (): boolean =>
          builtSpaceStatesVolume(spaceOf(shelled, "whole")) === false,
      ],
      [
        "oneCellIsConvex",
        (): boolean => builtSpaceIsConvex(spaceOf(celled, "hall")),
      ],
      [
        "twoCellsAreNot",
        (): boolean => builtSpaceIsConvex(spaceOf(twoCells, "hall")) === false,
      ],
      [
        "aShellIsNot",
        (): boolean => builtSpaceIsConvex(spaceOf(shelled, "hall")) === false,
      ],
      [
        "andNeitherIsANameWithNoCells",
        (): boolean => builtSpaceIsConvex(spaceOf(shelled, "whole")) === false,
      ],
    ]),
    {
      aShellIsAVolume: true,
      aCellIsAVolume: true,
      aNameIsNot: true,
      oneCellIsConvex: true,
      twoCellsAreNot: true,
      aShellIsNot: true,
      andNeitherIsANameWithNoCells: true,
    },
  );

  const dangling: IAutoMovieSpaceShell = {
    vertices: [],
    triangles: cube.triangles,
  };
  const flat: IAutoMovieSpaceShell = {
    vertices: cube.vertices,
    triangles: cube.triangles.map((index: number, at: number): number =>
      at === 1 ? 0 : index,
    ),
  };
  TestValidator.equals(
    "an unvalidated shell is read as the arithmetic says",
    namedFacts([
      [
        "danglingEnclosesNothing",
        (): boolean => nclose(builtSpaceShellVolume(dangling), 0, 0),
      ],
      [
        "danglingHoldsNothing",
        (): boolean =>
          builtSpaceContainsPoint(
            { id: "x", kind: "room", parent: null, cells: [], shell: dangling },
            { x: 1, y: 1, z: 1 },
          ) === false,
      ],
      [
        "aFlatFacetIsSkippedRatherThanSummed",
        (): boolean =>
          builtSpaceContainsPoint(
            { id: "x", kind: "room", parent: null, cells: [], shell: flat },
            { x: 1, y: 1, z: 1 },
          ),
      ],
      [
        "andWhatItLeavesOpenStaysOutside",
        (): boolean =>
          builtSpaceContainsPoint(
            { id: "x", kind: "room", parent: null, cells: [], shell: flat },
            { x: 9, y: 9, z: 9 },
          ) === false,
      ],
    ]),
    {
      danglingEnclosesNothing: true,
      danglingHoldsNothing: true,
      aFlatFacetIsSkippedRatherThanSummed: true,
      andWhatItLeavesOpenStaysOutside: true,
    },
  );
}
