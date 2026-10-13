import {
  builtEnvironmentContainsPoint,
  builtEnvironmentSpaceFidelity,
  builtSpaceContainsPoint,
  builtSpaceIsConvex,
  builtSpaceShellVolume,
  builtSpaceStatesVolume,
  deriveAutoMovieDrawing,
  measureAutoMovieQuantities,
  validateBuiltEnvironment,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltSpace,
  IAutoMovieSpaceShell,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { BUILT_SPACE_SHELL_TEST_HALL as HALL } from "../internal/BUILT_SPACE_SHELL_TEST_HALL";
import { assertBuiltSpaceShellTestRefusals } from "../internal/assertBuiltSpaceShellTestRefusals";
import { builtSpaceShellTestBoxShell as boxShell } from "../internal/builtSpaceShellTestBoxShell";
import { builtSpaceShellTestSpaceOf as spaceOf } from "../internal/builtSpaceShellTestSpaceOf";
import { builtSpaceShellTestWork as work } from "../internal/builtSpaceShellTestWork";
import { drawingView } from "../internal/drawingFixtures";
import { hasViolation, namedFacts, nclose } from "../internal/predicates";

/**
 * A logical volume may be its own closed boundary, and that boundary may have a
 * void through it.
 *
 * Half-space cells state every polyhedral region exactly, but a region pierced
 * by an atrium is a chore to decompose and a curved region cannot be stated at
 * all — the exact gap #1868 names, and the one IFC keeps a `Brep` fallback and
 * an `IfcFacetedBrepWithVoids` open for. This case pins that the escape hatch
 * is exact where it claims to be and refuses everything a query could not read,
 * and that what it still cannot do is reported rather than smoothed over.
 *
 * Scenarios:
 *
 * 1. A shelled hall with an atrium void: a point in the room is inside, a point in
 *    the void is **outside**, a point beyond the hall is outside, and a point
 *    on the hall's own face, edge and corner is inside — the corner case being
 *    the one a bare solid-angle test gets wrong.
 * 2. The enclosed volume is the outer box less the void, exactly.
 * 3. A space states its volume once: carrying cells beside a shell is refused.
 * 4. A shell is held to what makes its inside a fact — too few vertices, too few
 *    triangles, a ragged index count, an index naming no vertex, a degenerate
 *    facet, an unmatched directed edge, a doubled facet, and a shell wound
 *    inside out are each refused.
 * 5. `fidelity` is a closed word, may not be declared by a space that states no
 *    volume, and folds over descendants: a faceted hall makes its own building
 *    faceted, a volume-less subtree is `unstated`.
 * 6. The quantity take-off measures a shell exactly, and reports a faceted space
 *    as its own `unsupported` gap rather than quoting facets as a curve.
 * 7. The drafter cannot section a shell and says so: a cut sheet of the shelled
 *    hall draws no region for it and carries an `unsupported` gap naming the
 *    subject, while the same sheet of a celled hall draws the region and raises
 *    no such gap. A sheet that does draw a faceted space owns up to that under
 *    the same subject the take-off uses, so the two artifacts cannot disagree
 *    about whether a dome was drawn or approximated.
 * 8. Either spelling answers one set of questions: `builtSpaceStatesVolume` and
 *    `builtSpaceIsConvex` read a shell, one cell, several cells and nothing at
 *    all without any caller counting cells for itself.
 * 9. A shell nobody validated is read as the arithmetic says rather than thrown
 *    over: an index naming no vertex contributes no facet to the volume or the
 *    winding, and a facet with no area is skipped rather than summed as a `NaN`
 *    that would poison every later answer.
 */
export const test_architecture_built_space_shell = (): void => {
  const shelled = work({});
  TestValidator.equals(
    "a shelled hall holds its room and not its atrium",
    namedFacts([
      [
        "valid",
        () => validateBuiltEnvironment({ environment: shelled }).success,
      ],
      [
        "inTheRoom",
        () =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 1, y: 2, z: 1 }),
      ],
      [
        "inTheAtrium",
        () =>
          builtEnvironmentContainsPoint(shelled, "hall", {
            x: 5,
            y: 2,
            z: 5,
          }) === false,
      ],
      [
        "beyondTheHall",
        () =>
          builtEnvironmentContainsPoint(shelled, "hall", {
            x: 12,
            y: 2,
            z: 5,
          }) === false,
      ],
      [
        "onAFace",
        () =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 0, y: 2, z: 5 }),
      ],
      [
        "onAnEdge",
        () =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 0, y: 0, z: 5 }),
      ],
      [
        "inACorner",
        () =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 0, y: 0, z: 0 }),
      ],
      [
        "onTheAtriumWall",
        () =>
          builtEnvironmentContainsPoint(shelled, "hall", { x: 3, y: 2, z: 5 }),
      ],
      [
        "throughTheParent",
        () =>
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

  const cube = boxShell({ x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 });
  assertBuiltSpaceShellTestRefusals(cube);

  const faceted = work({ fidelity: "faceted" });
  TestValidator.equals(
    "a faceted volume says so, and says it for everything above it",
    namedFacts([
      [
        "facetedValidates",
        () => validateBuiltEnvironment({ environment: faceted }).success,
      ],
      [
        "exactValidates",
        () =>
          validateBuiltEnvironment({ environment: work({ fidelity: "exact" }) })
            .success,
      ],
      [
        "junkWordRefused",
        () =>
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
        () => {
          const environment = work({});
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
        () => builtEnvironmentSpaceFidelity(shelled, "hall") === "exact",
      ],
      [
        "theFacetedHallIsFaceted",
        () => builtEnvironmentSpaceFidelity(faceted, "hall") === "faceted",
      ],
      [
        "andSoIsTheBuildingOverIt",
        () => builtEnvironmentSpaceFidelity(faceted, "whole") === "faceted",
      ],
      [
        "aVolumelessSubtreeIsUnstated",
        () => {
          const environment = work({});
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
        () => {
          const finding = measureAutoMovieQuantities({
            environment: shelled,
          }).findings.find((entry) => entry.subject === "space-volume")!;
          return (
            finding.contributors.some(
              (contributor) =>
                contributor.owner === "hall" &&
                nclose(contributor.value, 336, 1e-6),
            ) && nclose(finding.total, 336, 1e-6)
          );
        },
      ],
      [
        "anExactSpaceRaisesNoCurvatureGap",
        () =>
          measureAutoMovieQuantities({ environment: shelled }).gaps.some(
            (gap) => gap.subject === "curved-space-boundary",
          ) === false,
      ],
      [
        "aFacetedSpaceRaisesOne",
        () =>
          measureAutoMovieQuantities({ environment: faceted }).gaps.some(
            (gap) =>
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

  const celled = work({
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
  const plan = drawingView({ origin: { x: 0, y: 2, z: 0 } });
  TestValidator.equals(
    "a shell is a section the drafter cannot cut, and it says which",
    namedFacts([
      [
        "theShelledHallDrawsNoRegion",
        () =>
          deriveAutoMovieDrawing({ environment: shelled, view: plan }).regions
            .length === 0,
      ],
      [
        "andTheSheetNamesTheSubject",
        () =>
          deriveAutoMovieDrawing({
            environment: shelled,
            view: plan,
          }).gaps.some(
            (gap) =>
              gap.subject === "shelled-space-section" &&
              gap.status === "unsupported",
          ),
      ],
      [
        "aCelledHallDrawsItsRegion",
        () =>
          deriveAutoMovieDrawing({ environment: celled, view: plan }).regions
            .length === 1,
      ],
      [
        "andRaisesNoSuchGap",
        () =>
          deriveAutoMovieDrawing({ environment: celled, view: plan }).gaps.some(
            (gap) => gap.subject === "shelled-space-section",
          ) === false,
      ],
      [
        "aDrawnFacetedRegionOwnsUpToItToo",
        () =>
          deriveAutoMovieDrawing({
            environment: work({
              shell: undefined,
              cells: spaceOf(celled, "hall").cells,
              fidelity: "faceted",
            }),
            view: plan,
          }).gaps.some(
            (gap) =>
              gap.subject === "curved-space-boundary" &&
              gap.status === "unsupported" &&
              gap.reason.includes("hall"),
          ),
      ],
      [
        "andAnExactOneDoesNot",
        () =>
          deriveAutoMovieDrawing({ environment: celled, view: plan }).gaps.some(
            (gap) => gap.subject === "curved-space-boundary",
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

  const twoCells = work({
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
        () => builtSpaceStatesVolume(spaceOf(shelled, "hall")),
      ],
      ["aCellIsAVolume", () => builtSpaceStatesVolume(spaceOf(celled, "hall"))],
      [
        "aNameIsNot",
        () => builtSpaceStatesVolume(spaceOf(shelled, "whole")) === false,
      ],
      ["oneCellIsConvex", () => builtSpaceIsConvex(spaceOf(celled, "hall"))],
      [
        "twoCellsAreNot",
        () => builtSpaceIsConvex(spaceOf(twoCells, "hall")) === false,
      ],
      [
        "aShellIsNot",
        () => builtSpaceIsConvex(spaceOf(shelled, "hall")) === false,
      ],
      [
        "andNeitherIsANameWithNoCells",
        () => builtSpaceIsConvex(spaceOf(shelled, "whole")) === false,
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
    triangles: cube.triangles.map((index, at) => (at === 1 ? 0 : index)),
  };
  TestValidator.equals(
    "an unvalidated shell is read as the arithmetic says",
    namedFacts([
      ["danglingEnclosesNothing", () => builtSpaceShellVolume(dangling) === 0],
      [
        "danglingHoldsNothing",
        () =>
          builtSpaceContainsPoint(
            { id: "x", kind: "room", parent: null, cells: [], shell: dangling },
            { x: 1, y: 1, z: 1 },
          ) === false,
      ],
      [
        "aFlatFacetIsSkippedRatherThanSummed",
        () =>
          builtSpaceContainsPoint(
            { id: "x", kind: "room", parent: null, cells: [], shell: flat },
            { x: 1, y: 1, z: 1 },
          ),
      ],
      [
        "andWhatItLeavesOpenStaysOutside",
        () =>
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
};
