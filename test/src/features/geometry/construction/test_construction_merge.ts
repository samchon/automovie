import {
  type AutoMovieConstructionRealization,
  type AutoMovieSolidIntersection,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionJoin,
} from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A merge realizes the union of two parts: its seam lies on both surfaces,
 * its rails stand at their declared chords, and its blend meets each
 * surface G1 and G2 at its rail.
 *
 * Scenarios:
 * 1. A cylinder of radius 0.015 m along +z merged onto a cylinder of radius 0.03 m along +x, chords 0.006 m on each: the seam's traced points lie on both cylinders (the Steinmetz curve), each within the periodic cubic section spline's bound on the realized cylinders (16 points per section); the rails stand 0.006 m from the seam; at every blend column the blend's normal matches each surface's at its rail and its normal curvature across the rail matches the surface's, and no diagnostic is recorded.
 * 2. The same merge seeded by a search along the post's station line at phase pi / 2 (a `search` seed) traces the same seam, on both cylinders.
 * 3. Red: the rails read against declared chords of 0.007 m, the seam against a host cylinder 1 mm wider, and the blend's rails against the two surfaces swapped, each fail.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the merge with `realizeAutoMovieConstruction` and reads the join's traced curve and rails (`IJoin.join`), the published blend's rails and cross directions (`IJoin.blend`) and the three surfaces' exact jets. It catches a seam off either surface, a rail at the wrong chord, a blend that leaves a surface at an angle (a crease) or with another normal curvature (a visible curvature step), a search seed that finds another meeting, and a join that records a premise it should have kept; any merge whose blend joins the two cylinders G2 at the declared chords passes.
 * @evidence contracts/development/testing.md#independent-expectations The closed forms: a point on the post satisfies `x^2 + y^2 = r^2`, on the beam `y^2 + z^2 = R^2`, so the seam is the Steinmetz curve; a chord is the straight distance from the curve point to its rail point (`AutoMovieConstructionWidth`); G2 is equal normals and equal normal curvature in the normal plane across the rail (`AutoMovieConstructionContinuity`), read from each surface's own 2-jet along the blend's cross direction. Limits: 1e-9 of the beam's radius on points and chords, the trace's 1e-12 m tolerance far below; 1e-6 rad and 1e-6 / r on the rails, a hundred times the blend's B-spline rounding at its columns. Oracle limit: between columns the blend is read by the seam audit, not here.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the crossing cylinders, by a point seed and by a search seed. Negative: the wrong chords, the wider host and the swapped surfaces. The diff's kept side belongs to `test_construction_diff`; nested joins to `test_construction_nesting`; a tangential contact to `test_construction_diagnostics`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_merge`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A cylinder of radius 0.015 m along +z merged onto a cylinder of radius 0.03 m along +x, chords 0.006 m on each: the seam's traced points...).
 */
export function test_construction_merge(): void {
  const failures: string[] = [];
  const R: number = 0.03;
  const r: number = 0.015;
  const w: number = 0.006;
  const host: AutoMovieConstructionNode = ConstructionShapes.cylinder(
    "beam",
    {
      origin: { x: -0.1, y: 0, z: 0 },
      u: { x: 0, y: 0, z: 1 },
      v: { x: 0, y: 1, z: 0 },
    },
    R,
    0.2,
  );
  const part: AutoMovieConstructionNode = ConstructionShapes.cylinder(
    "post",
    {
      origin: { x: 0, y: 0, z: 0 },
      u: { x: 0, y: 1, z: 0 },
      v: { x: 1, y: 0, z: 0 },
    },
    r,
    0.08,
  );
  const onPost: (p: V3) => number = (p: V3): number =>
    Math.hypot(p[0], p[1]) - r;
  const onBeam: (wider: number) => (p: V3) => number =
    (wider: number): ((p: V3) => number) =>
    (p: V3): number =>
      Math.hypot(p[1], p[2]) - (R + wider);
  const seam: (j: AutoMovieConstructionRealization.IJoin) => V3[] = (
    j: AutoMovieConstructionRealization.IJoin,
  ): V3[] =>
    j.join.curve.points.map(
      (q: AutoMovieSolidIntersection.IPoint): V3 => [
        q.point[0] / 1000,
        q.point[1] / 1000,
        q.point[2] / 1000,
      ],
    );

  // The seam at t = 0 is (r, 0, R): on the post at station R and phase pi / 2, on the beam at station 0.1 + r and phase 0.
  const tree: IAutoMovieConstructionJoin = ConstructionShapes.join(
    "merge",
    "blend.post",
    host,
    part,
    {
      partFace: "post",
      hostFace: "beam",
      part: [R + 0.001, Math.PI / 2],
      host: [0.1 + r, 0.01],
    },
    { part: { type: "chord", value: w }, host: { type: "chord", value: w } },
  ) as IAutoMovieConstructionJoin;
  const real: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0)
    failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);
  const joined: AutoMovieConstructionRealization.IJoin = ConstructionRead.join(
    real,
    "blend.post",
  );
  // The realized cylinders are periodic cubic B-splines through 16 points per section, so a seam point stands off the closed-form cylinders by up to that spline's bound on the larger radius, not by rounding.
  const seamBound: number = ConstructionChecks.sectionSpline(R, 16);
  failures.push(
    ...ConstructionChecks.onBoth(seam(joined), onPost, onBeam(0), seamBound),
  );
  // The join's curve and rails are in the kernel's millimetres; the seam above is read in metres.
  failures.push(
    ...ConstructionChecks.chords(
      joined.join,
      (): number => 1000 * w,
      (): number => 1000 * w,
      1e-6 * R,
    ),
  );

  // Red: wrong declared chords and a wider host must each fail.
  if (
    ConstructionChecks.chords(
      joined.join,
      (): number => 1000 * (w + 0.001),
      (): number => 1000 * (w + 0.001),
      1e-6 * R,
    ).length === 0
  )
    failures.push("proof: rails read against 0.007 m chords pass");
  if (
    ConstructionChecks.onBoth(seam(joined), onPost, onBeam(0.001), 1e-9 * R)
      .length === 0
  )
    failures.push("proof: the seam reads on a host 1 mm wider");

  // G1 and G2 at both rails, at the blend's columns, from the surfaces' exact jets. The published blend is a
  // periodic spline through its 48 columns, so its derivative along a rail is the spline's, not the rail's own:
  // the join documents it leaving the tangent planes by about `(spacing / R)^2 / 8`, spacing the column spacing on
  // the rail and R the smaller radius (the post's), which bounds the normals' angle and, over R, the curvatures.
  const spacing: number = (2 * Math.PI * (r + w)) / 48;
  const plane: number = (spacing / r) ** 2 / 8;
  const [blend, beam, post]: [
    IAutoMovieSolidSurface,
    IAutoMovieSolidSurface,
    IAutoMovieSolidSurface,
  ] = [
    ConstructionRead.surface(real, "blend.post"),
    ConstructionRead.surface(real, "beam"),
    ConstructionRead.surface(real, "post"),
  ];
  failures.push(
    ...ConstructionChecks.rails(
      joined.blend,
      blend,
      beam,
      post,
      plane,
      plane / (1000 * r),
    ),
  );
  if (
    ConstructionChecks.rails(
      joined.blend,
      blend,
      post,
      beam,
      plane,
      plane / (1000 * r),
    ).length === 0
  )
    failures.push("proof: the rails read G2 against the swapped surfaces");

  // A search seed along the post's station line at phase pi / 2 finds the same seam.
  const searched: IAutoMovieConstructionJoin = {
    ...tree,
    seed: {
      type: "search",
      partFace: "post",
      hostFace: "beam",
      phase: Math.PI / 2,
      from: 0,
      to: 1,
    },
  };
  const found: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction(
      { name: "made", root: searched },
      { chord: 1e-4 },
    );
  if (found.diagnostics.length !== 0)
    failures.push(`search seed: ${ConstructionRead.diagnostics(found)}`);
  else
    failures.push(
      ...ConstructionChecks.onBoth(
        seam(ConstructionRead.join(found, "blend.post")),
        onPost,
        onBeam(0),
        seamBound,
      ).map((f: string): string => `search seed: ${f}`),
    );

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} merge failures:\n${failures.join("\n")}`,
    );
}
