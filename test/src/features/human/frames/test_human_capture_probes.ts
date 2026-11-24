import {
  type AutoMovieHumanEmptyProbes as P,
  AutoMovieHumanConicSection as S,
} from "@automovie/human";
import { markHumanCaptureProbes } from "@automovie/human/capture";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1,
  IAutoMovieMark,
  IAutoMovieMesh,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { outwardBoxMesh } from "../../internal/outwardBoxMesh";
import { vclose } from "../../internal/predicates";

/**
 * The capture marks each placed empty probe outside the construction's hull,
 * filled by the skin, or empty, testing the hull first.
 *
 * The made family is a straight 40 mm course along +Y with `up` +X, so its
 * chart's `u` is +X and `v` is +Z, and each of its three sections, at 0, 20 and
 * 40 mm, is the circle of radius `R = 48 / pi` mm (about 15.28 mm) with its
 * four anchors on the `u` and `v` axes. The hull of the courses and anchors is
 * therefore the square prism whose cross-section has those anchors as corners:
 * it holds every point within `R / sqrt(2)` (about 10.80 mm) of the course and
 * no point farther than `R`. The skin is made of boxes in metres.
 *
 * Scenarios:
 *
 * 1. With the family on the median plane and a skin box 10 mm wide round the
 *    course from 10 to 30 mm: a probe on the course at 20 mm is `filled`, one
 *    on the box's face is `filled`, one 8 mm off the course is `empty`, one 40
 *    mm off the course, inside a second skin box beyond the hull, is
 *    `outside-hull`, and a probe with a reason gets no mark. Each mark's path,
 *    label, flag, anchor and point in metres follow its state.
 * 2. With no skin piece, or only a piece without triangles, the probe on the
 *    course is `empty`.
 * 3. With the family 30 mm off the median plane, a probe on its reflected course
 *    is `empty` when the family is mirrored and `outside-hull` when it is not.
 * 4. A listing with no placed probe gives no mark.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `markHumanCaptureProbes` with made families, probes and skin pieces and reads its marks, which catches a probe outside the hull marked filled or empty, a skin test that ignores the surface, a filled probe marked empty, a hull that leaves out a mirrored family's twin, a wrong label, flag, anchor or unit, and a mark for an unplaced probe.
 * @evidence contracts/development/testing.md#independent-expectations Each probe's state follows from the stated geometry: the hull's cross-section is the square on the circle's four axis anchors, so 8 mm off the course is inside and 40 mm is outside, and the skin boxes are written here; the labels and flags are the ones the Human empty-probe issue sets for the three states.
 * @evidence contracts/development/testing.md#distinguishing-cases Each of the three states, a probe both outside the hull and inside the skin, a probe on the skin's surface, no skin and a skin without triangles, a mirrored and an unmirrored family, an unplaced probe and an empty listing; `test_human_empty_probes` owns where the law places the probes.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made families and meshes; it builds no person and realizes no skin.
 * @evidence contracts/development/common.md#meaningful-documentation States the made family, its hull and the skin, and each scenario's probes and expected states.
 */
export function test_human_capture_probes(): void {
  const R: number = 48 / Math.PI;
  const rho: number = Math.SQRT2 - 1;
  const layout: IAutoMovieHumanConicSection.ILayout = S.limb(0);
  const knots: number[] = [0, 20, 40];
  const values: number[][] = [R, 0, 0, R, -R, 0, 0, -R, rho, rho, rho, rho].map(
    (x: number): number[] => knots.map((): number => x),
  );
  const member: (z: number, mirrored: boolean) => IAutoMovieHumanF1.IMember = (
    z: number,
    mirrored: boolean,
  ): IAutoMovieHumanF1.IMember => {
    const family: IAutoMovieHumanConicLoft.IFamily = {
      name: "made",
      centres: [
        [0, 0, z],
        [0, 40, z],
      ],
      halves: [],
      up: [1, 0, 0],
      layout,
      knots,
      values,
    };
    return { family, mirrored };
  };
  const piece: (
    name: string,
    mesh: IAutoMovieMesh,
  ) => IAutoMovieHumanF1.IPiece = (
    name: string,
    mesh: IAutoMovieMesh,
  ): IAutoMovieHumanF1.IPiece => ({
    name,
    positions: mesh.positions,
    indices: mesh.indices!,
    diagnostics: [],
  });
  const near: IAutoMovieHumanF1.IPiece = piece(
    "near",
    outwardBoxMesh(
      { x: -0.005, y: 0.01, z: -0.005 },
      { x: 0.005, y: 0.03, z: 0.005 },
    ),
  );
  const far: IAutoMovieHumanF1.IPiece = piece(
    "far",
    outwardBoxMesh(
      { x: 0.035, y: 0.01, z: -0.005 },
      { x: 0.045, y: 0.03, z: 0.005 },
    ),
  );
  const placed: (name: string, point: AutoMovieVector3Tuple) => P.IProbe = (
    name: string,
    point: AutoMovieVector3Tuple,
  ): P.IProbe => ({ name, derivation: "made", point });
  const kinds: (marks: readonly IAutoMovieMark[]) => string[] = (
    marks: readonly IAutoMovieMark[],
  ): string[] =>
    marks.map((mark: IAutoMovieMark): string => `${mark.path} ${mark.kind}`);

  // 1. The three states, the hull tested first, and an unplaced probe.
  const marks: IAutoMovieMark[] = markHumanCaptureProbes(
    "f",
    [
      placed("course", [0, 20, 0]),
      placed("face", [5, 20, 0]),
      placed("beside", [8, 20, 0]),
      { name: "lost", derivation: "made", reason: "no gap" },
      placed("open", [40, 20, 0]),
    ],
    [member(0, false)],
    [near, far],
  );
  TestValidator.equals(
    "each probe takes its state, the hull first",
    kinds(marks),
    [
      "f/probe/course probe/filled",
      "f/probe/face probe/filled",
      "f/probe/beside probe/empty",
      "f/probe/open probe/outside-hull",
    ],
  );
  const legend: Record<string, [string, boolean]> = {
    "probe/filled": ["filled probe", true],
    "probe/empty": ["empty probe", false],
    "probe/outside-hull": ["probe outside hull", true],
  };
  const metres: AutoMovieVector3Tuple[] = [
    [0, 0.02, 0],
    [0.005, 0.02, 0],
    [0.008, 0.02, 0],
    [0.04, 0.02, 0],
  ];
  TestValidator.predicate(
    "each mark carries its state's label and flag, its person and its point in metres",
    marks.every((mark: IAutoMovieMark, at: number): boolean => {
      const point: readonly number[] =
        mark.shape.type === "points" ? mark.shape.points : [];
      const want: AutoMovieVector3Tuple = metres[at]!;
      return (
        mark.label === legend[mark.kind]![0] &&
        mark.flagged === legend[mark.kind]![1] &&
        mark.anchor === "f" &&
        point.length === 3 &&
        vclose(
          { x: point[0]!, y: point[1]!, z: point[2]! },
          { x: want[0], y: want[1], z: want[2] },
          1e-15,
        )
      );
    }),
  );

  // 2. No skin, or a skin without triangles, fills nothing.
  const course: P.IProbe[] = [placed("course", [0, 20, 0])];
  TestValidator.equals(
    "without a skin triangle the probe is empty",
    [
      ...kinds(markHumanCaptureProbes("f", course, [member(0, false)], [])),
      ...kinds(
        markHumanCaptureProbes(
          "f",
          course,
          [member(0, false)],
          [{ ...near, indices: [] }],
        ),
      ),
    ],
    ["f/probe/course probe/empty", "f/probe/course probe/empty"],
  );

  // 3. A mirrored family's twin bounds the hull too.
  const twin: P.IProbe[] = [placed("twin", [0, 20, -30])];
  TestValidator.equals(
    "the hull holds a mirrored family's twin, and only when mirrored",
    [
      ...kinds(markHumanCaptureProbes("f", twin, [member(30, true)], [])),
      ...kinds(markHumanCaptureProbes("f", twin, [member(30, false)], [])),
    ],
    ["f/probe/twin probe/empty", "f/probe/twin probe/outside-hull"],
  );

  // 4. Nothing placed, nothing marked.
  TestValidator.equals(
    "a listing without a placed probe gives no mark",
    markHumanCaptureProbes(
      "f",
      [{ name: "lost", derivation: "made", reason: "no gap" }],
      [member(0, false)],
      [near],
    ),
    [],
  );
}
