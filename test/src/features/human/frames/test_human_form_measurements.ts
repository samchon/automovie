import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { FamilyConicFormMeasurements as Form } from "../../../reference-conics/FamilyConicFormMeasurements";
import { FamilyConicSurfaceMeasurements as Surface } from "../../../reference-conics/FamilyConicSurfaceMeasurements";

/**
 * The capture checks read the supplied skin, the named owner surfaces, and the
 * published source charts at their actual shared boundary positions.
 *
 * Scenarios:
 *
 * 1. An outward simplex has genus zero, interior winding +1, and no crossings. The
 *    campaign accepts exactly 0.01 mm of combined bed/strip clipping.
 * 2. A second simplex translated by three metres is two metres away in the
 *    resident mesh. A deliberately mismatched pair of source charts has a 0.02
 *    mm gap independently of that mesh distance. A probe placed inside the
 *    first simplex and an over-limit nail produce separate findings.
 * 3. An edge of a translated simplex pierces the interior of the first one's
 *    sloped face. The report refuses the crossing and measures that gap as
 *    zero.
 * 4. Removing one simplex face leaves one boundary. The caller's declared open
 *    root and a separately supplied triangle stream retain that geometry.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual capture form report with original index and source charts.
 * @evidence contracts/development/testing.md#independent-expectations The simplex has four outward faces, six edges and four vertices. The disjoint faces approach within two metres, and the source plane offset is in millimetres. The overlapping edge contains (0.5, 0.25, 0.25), strictly inside the face x + y + z = 1. The clipping boundary is fixed by the campaign's made-figure check.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a clean body at the clipping limit, a disconnected pair with excess clipping, and already intersecting surfaces with a zero gap. One open root passes its declared topology and refuses two claimed closed components.
 * @evidence contracts/development/testing.md#execution-ownership Small synchronous fixtures require no figure assembly, references, or rendering.
 * @evidence contracts/development/common.md#meaningful-documentation States each measured geometry, units, and findings.
 */
export function test_human_form_measurements(): void {
  const shape = fixture();
  const pass = Form.measure(
    shape,
    [
      {
        name: "air",
        derivation: "past the tetrahedron",
        point: [1000, 1000, 1000],
      },
    ],
    [0.1, 0.1, 0.1],
    [],
    [{ digit: "digit", maximumMm: 0.01 }],
  );
  if (
    pass.findings.length !== 0 ||
    pass.pieces.length !== 1 ||
    pass.pieces[0]!.genus !== 0 ||
    Math.abs(pass.interior.winding - 1) > 1e-12 ||
    pass.crossings.length !== 0
  )
    throw new Error(
      "the exact outward simplex must satisfy the shape report: " +
        pass.findings.join(", "),
    );

  const separate = fixture([3, 0, 0]);
  const refused = Form.measure(
    separate,
    [
      {
        name: "blocked",
        derivation: "inside the first tetrahedron",
        point: [100, 100, 100],
      },
    ],
    [0.1, 0.1, 0.1],
    [["first", "second"]],
    [{ digit: "digit", maximumMm: 0.01 + Number.EPSILON * 0.01 }],
  );
  if (
    refused.findings.length !== 3 ||
    !refused.findings.some((finding) => finding.startsWith("digit clips ")) ||
    refused.pieces.length !== 2 ||
    refused.probes[0]?.reading?.inside !== true ||
    refused.clearances.length !== 1 ||
    refused.clearances[0]?.gapMm !== 2000 ||
    refused.contacts.length !== 1 ||
    Math.abs(refused.contacts[0]!.maxMm - 0.02) > 1e-12
  )
    throw new Error(
      "both named surface measurements and three failures must be retained: " +
        JSON.stringify(refused),
    );

  const crossed = Form.measure(
    fixture([0.25, 0.25, 0.25]),
    [],
    [0.1, 0.1, 0.1],
    [["first", "second"]],
  );
  if (
    !crossed.crossings.some(
      ({ triangle, other, coplanar }) =>
        !coplanar && triangle < 4 !== other < 4,
    ) ||
    !crossed.findings.some((finding) =>
      finding.startsWith("skin crosses at "),
    ) ||
    crossed.clearances[0]?.gapMm !== 0
  )
    throw new Error(
      "crossing tetrahedra must report a transverse witness and zero clearance: " +
        JSON.stringify(crossed),
    );

  verifyExplicitSurfaces();
}

/**
 * An isolated pair can retain an open root. Only the explicitly declared
 * topology is required, and an independently supplied triangle surface can be
 * measured against either component.
 */
function verifyExplicitSurfaces(): void {
  const pair = fixture([3, 0, 0]).mesh;
  const closed = { genus: 0, boundaryLoops: 0 };
  const open = { genus: 0, boundaryLoops: 1 };
  const mesh = {
    positions: pair.positions,
    indices: [...pair.indices.slice(0, 9), ...pair.indices.slice(12)],
  };
  const correct = Surface.measure(mesh, { pieces: [closed, open] });
  const wrong = Surface.measure(mesh, { pieces: [closed, closed] });
  const single = Surface.measure(mesh, { pieces: [closed] });
  if (
    correct.findings.length !== 0 ||
    correct.probes.length !== 0 ||
    correct.pieces[0]?.boundaryLoops !== 1 ||
    correct.pieces[1]?.boundaryLoops !== 0 ||
    !wrong.findings.some((finding) =>
      finding.startsWith("skin genus/boundary"),
    ) ||
    single.findings.length !== 2
  )
    throw new Error("the original retained pair must have one open root");

  const first = fixture().mesh;
  const second = pair.indices
    .slice(12)
    .flatMap((index) => pair.positions.slice(index * 3, index * 3 + 3));
  const gap = Surface.gap(
    Surface.prepareGap(first, "first"),
    Surface.prepareGap({ positions: second, indices: null }, "second"),
  );
  if (gap !== 2000) throw new Error(`the explicit surface gap is ${gap} mm`);
}

/** One outward tetrahedron, with an optional translated twin and one chart gap. */
function fixture(
  translate?: AutoMovieVector3Tuple,
): Parameters<typeof Form.measure>[0] {
  const base: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  const triangles: number[] = [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3];
  const mesh: IAutoMovieConstructionRealization.IMesh = {
    positions:
      translate !== undefined
        ? [
            ...base,
            ...base.map((value, i): number => value + translate[i % 3]!),
          ]
        : base,
    indices:
      translate !== undefined
        ? [...triangles, ...triangles.map((vertex): number => vertex + 4)]
        : triangles,
    coordinates: Array.from(
      { length: translate === undefined ? 12 : 24 },
      (_, i): number => (i >= 12 && i % 3 === 0 ? 1 : 0),
    ),
    owners: translate === undefined ? ["first"] : ["first", "second"],
  };
  return {
    mesh,
    surfaces:
      translate === undefined ? [] : [plane("first", 0), plane("second", 0.02)],
    body: {
      name: "fixture",
      points:
        translate === undefined ? [] : [{ chain: "first", chart: [0, 0] }],
      faces:
        translate !== undefined
          ? [
              {
                chain: "second",
                cycles: [{ kind: "hole", points: [0], chart: [[0, 0]] }],
              },
            ]
          : [],
    },
  };
}

/** A world millimetre plane with the same chart on both source authorities. */
function plane(name: string, heightMm: number): IAutoMovieSolidSurface {
  const point = (u: number, v: number): AutoMovieVector3Tuple => [
    u,
    v,
    heightMm,
  ];
  return {
    name,
    orientation: 1,
    point,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: point(u, v),
      u: [1, 0, 0],
      v: [0, 1, 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
}
