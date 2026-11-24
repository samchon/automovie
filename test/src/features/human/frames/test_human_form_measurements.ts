import { measureAutoMovieMeshPieces } from "@automovie/engine";
import {
  AutoMovieHumanArmSources,
  AutoMovieHumanFootToeSources,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionRealization,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { FamilyConicFormMeasurements as Form } from "../../../reference-conics/FamilyConicFormMeasurements";
import { FamilyConicNeutralForm as Neutral } from "../../../reference-conics/FamilyConicNeutralForm";
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
 * 5. The neutral adapter uses the exact emitted groups and welded pieces. Two
 *    retained circular courses place an empty-space probe inside the simplex,
 *    whereas missing cutter and nail observations stay unavailable. All twenty
 *    exact-limit clipping receipts qualify. Missing, duplicate, nonfinite,
 *    unknown and excessive readings each retain their own failure.
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
  verifyRetainedNeutralForm();
}

/** The neutral gate uses real buffers, source walls, and explicit absence. */
function verifyRetainedNeutralForm(): void {
  const shape = fixture([3, 0, 0]);
  const mesh = { ...shape.mesh, normals: null, uvs: null, skin: null };
  const pieces = measureAutoMovieMeshPieces(mesh);
  const charts = new Map([
    ["trunk", plane("trunk", 0)],
    ["leg.left", cylinder("leg.left", 100)],
    ["leg.right", cylinder("leg.right", 500)],
    ["thumb.left", plane("thumb.left", 0)],
    ["finger.left.index", plane("finger.left.index", 0.02)],
  ]);
  const capture: Parameters<typeof Neutral.measure>[0] = {
    mesh,
    pieces,
    solidSurfaces: charts,
    triangleGroups: [
      { name: "thumb.left/solid", start: 0 },
      { name: "finger.left.index/solid", start: 12 },
    ],
    calibration: {
      chains: [
        chain("trunk", 100),
        chain("leg.left", 100),
        chain("leg.right", 500),
      ],
      bodies: [
        {
          name: "fixture",
          points: [{ chain: "thumb.left", chart: [0, 0] }],
          faces: [
            ...["trunk", "leg.left", "leg.right"].map((chain) => ({
              chain,
              cycles: [],
            })),
            {
              chain: "finger.left.index",
              cycles: [{ kind: "hole", points: [0], chart: [[0, 0]] }],
            },
          ],
        },
      ],
    },
  };
  const { measurements, unavailable } = Neutral.measure(capture);
  const legs = measurements?.probes.find(({ name }) => name === "legs");
  if (
    measurements === null ||
    measurements.pieces !== pieces ||
    Math.abs(measurements.interior.winding - 1) > 1e-12 ||
    measurements.clearances.find(({ first }) => first === "thumb.left")
      ?.gapMm !== 2000 ||
    Math.abs(measurements.contacts[0]!.maxMm - 0.02) > 1e-12 ||
    measurements.contacts[0]!.pointMm[2] !== 0.02 ||
    !measurements.findings.some((finding) =>
      finding.startsWith(
        "shared contact finger.left.index / thumb.left gaps 0.02 mm",
      ),
    ) ||
    legs === undefined ||
    !("point" in legs) ||
    Math.hypot(legs.point[0] - 300, legs.point[1] - 300, legs.point[2] - 100) >
      1e-9 ||
    legs.reading?.inside !== true ||
    !measurements.findings.some((finding) =>
      finding.startsWith("nose.nostril.left probe unplaced"),
    ) ||
    !unavailable.some((finding) =>
      finding.includes("no nail clipping receipts"),
    )
  )
    throw new Error(
      `neutral form must report the exact retained buffers and unavailable sites: ${JSON.stringify({ measurements, unavailable })}`,
    );

  const empty = Neutral.measure({ ...capture, mesh: { ...mesh, indices: [] } });
  if (
    empty.measurements !== null ||
    !empty.unavailable.some((finding) =>
      finding.includes("no retained triangle buffer"),
    )
  )
    throw new Error("an absent retained skin must remain unavailable");

  const nailClipping = (["left", "right"] as const)
    .flatMap((side) => [
      ...AutoMovieHumanArmSources.names(side),
      ...AutoMovieHumanFootToeSources.names(side),
    ])
    .map((digit) => ({ digit, maximumMm: 0.01 }));
  const complete = Neutral.measure({ ...capture, nailClipping });
  if (
    nailClipping.length !== 20 ||
    complete.measurements?.clipping !== nailClipping ||
    complete.unavailable.some((finding) => finding.includes("nail clipping")) ||
    complete.measurements.findings.some((finding) => finding.includes("clips "))
  )
    throw new Error(
      "twenty retained clipping observations at 0.01 mm must qualify",
    );

  const [excess, duplicate, missing, ...rest] = nailClipping;
  const incomplete = Neutral.measure({
    ...capture,
    nailClipping: [
      { ...excess!, maximumMm: 0.012 },
      { ...duplicate!, maximumMm: Number.NaN },
      duplicate!,
      { digit: "unknown", maximumMm: 0 },
      ...rest,
    ],
  });
  if (
    incomplete.unavailable.length !== 4 ||
    !incomplete.unavailable.some((finding) =>
      finding.startsWith(`${duplicate!.digit} has 2`),
    ) ||
    !incomplete.unavailable.some((finding) =>
      finding.startsWith(`${missing!.digit} has 0`),
    ) ||
    !incomplete.unavailable.some((finding) =>
      finding.includes("finite nonnegative"),
    ) ||
    !incomplete.unavailable.some((finding) =>
      finding.includes("unknown digit unknown"),
    ) ||
    !incomplete.measurements?.findings.some((finding) =>
      finding.startsWith(`${excess!.digit} clips 0.012`),
    )
  )
    throw new Error(
      "neutral form must name all invalid or excessive clipping observations",
    );
}

/** A straight world-Y course with regular stations at 100 and 300 mm. */
function chain(name: string, x: number): IAutoMovieLoftChain {
  return {
    name,
    order: 1,
    rule: "polar",
    samples: 16,
    layers: [100, 300].map((y) => ({
      y,
      frame: { origin: [x, y, 100], u: [1, 0, 0], v: [0, 0, 1] },
      coefficients: [0, 50, 0, 0, 0, 50],
      slopes: [0, 0, 0, 0, 0, 0],
    })),
  };
}

/** The analytic 50 mm circular wall about that course. */
function cylinder(name: string, x: number): IAutoMovieSolidSurface {
  const point = (station: number, phase: number): AutoMovieVector3Tuple => [
    x + 50 * Math.cos(phase),
    station,
    100 + 50 * Math.sin(phase),
  ];
  return {
    name,
    orientation: 1,
    period: 2 * Math.PI,
    pointAt: (station) => (phase) => point(station, phase),
    jet: () => {
      throw new Error("the probe owns a Point0 query");
    },
  };
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
