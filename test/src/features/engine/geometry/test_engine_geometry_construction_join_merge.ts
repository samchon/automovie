
import { AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { nclose } from "../../internal/predicates";

/**
 * A merge join realizes the union of two parts: its seam lies on both surfaces,
 * its rails stand at their declared chords, and its blend meets each surface G1
 * and G2 at its rail.
 *
 * Construction: a post (radius 0.015 m, along +z) merged onto a beam (radius
 * 0.03 m, along +x), chords 0.006 m on each, chord tolerance 1e-4.
 *
 * Scenarios:
 *
 * 1. No diagnostic is recorded; every traced seam point lies on both cylinders
 *    (the Steinmetz curve) within the periodic cubic section spline's bound at
 *    16 points per section; the rails stand 0.006 m from the seam (within 1e-6
 *    of the beam radius); rails read against 0.007 m chords, and the seam
 *    against a beam 1 mm wider, fail.
 * 2. At every blend column the blend's normal matches each surface's at its rail
 *    and its normal curvature across the rail matches too, within the join's
 *    documented departure (spacing / r)^2 / 8; with the two surfaces swapped it
 *    does not.
 * 3. A historical serialized point seed with tuple chart points realizes the
 *    same seam as the named point seed.
 * 4. The same merge seeded by a search along the post's station line at phase pi /
 *    2 traces the same seam on both cylinders.
 */
export function test_engine_geometry_construction_join_merge(): void {
  type V3 = [number, number, number];
  const R: number = 0.03;
  const r: number = 0.015;
  const w: number = 0.006;
  const host: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
    "beam",
    {
      origin: { x: -0.1, y: 0, z: 0 },
      u: { x: 0, y: 0, z: 1 },
      v: { x: 0, y: 1, z: 0 },
    },
    R,
    0.2,
  );
  const part: IAutoMovieConstructionNode = ConstructionShapes.cylinder(
    "post",
    {
      origin: { x: 0, y: 0, z: 0 },
      u: { x: 0, y: 1, z: 0 },
      v: { x: 1, y: 0, z: 0 },
    },
    r,
    0.08,
  );
  const onPost = (p: V3): number => Math.hypot(p[0], p[1]) - r;
  const onBeam =
    (wider: number) =>
    (p: V3): number =>
      Math.hypot(p[1], p[2]) - (R + wider);
  const seam = (j: IAutoMovieConstructionRealization.IJoin): V3[] =>
    j.join.curve.points.map(
      (q: IAutoMovieSolidIntersection.IPoint): V3 => [
        q.point[0] / 1000,
        q.point[1] / 1000,
        q.point[2] / 1000,
      ],
    );

  const tree: IAutoMovieConstructionNode = ConstructionShapes.join(
    "merge",
    "blend.post",
    host,
    part,
    {
      partFace: "post",
      hostFace: "beam",
      part: { station: R + 0.001, phase: Math.PI / 2 },
      host: { station: 0.1 + r, phase: 0.01 },
    },
    { part: { type: "chord", value: w }, host: { type: "chord", value: w } },
  );
  const real: IAutoMovieConstructionRealization.IRealization =
    AutoMovieEngineConstruction.realize({ name: "made", root: tree }, { chord: 1e-4 });
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const joined: IAutoMovieConstructionRealization.IJoin = ConstructionRead.join(
    real,
    "blend.post",
  );
  const seamBound: number = ConstructionChecks.sectionSpline(R, 16);
  const legacySeed: unknown = JSON.parse(
    JSON.stringify({
      type: "point",
      partFace: "post",
      hostFace: "beam",
      part: [R + 0.001, Math.PI / 2],
      host: [0.1 + r, 0.01],
    }),
  );
  const legacy: IAutoMovieConstructionRealization.IRealization =
    AutoMovieEngineConstruction.realize(
      {
        name: "made",
        root: {
          ...tree,
          seed: legacySeed,
        } as unknown as IAutoMovieConstructionNode,
      },
      { chord: 1e-4 },
    );
  TestValidator.equals(
    "serialized tuple seed diagnostics",
    legacy.diagnostics.length,
    0,
  );
  const legacySeam: V3[] = seam(ConstructionRead.join(legacy, "blend.post"));
  const namedSeam: V3[] = seam(joined);
  TestValidator.predicate(
    "serialized tuple seed seam",
    legacySeam.length === namedSeam.length &&
      legacySeam.every((point: V3, i: number): boolean =>
        point.every((coordinate: number, k: number): boolean =>
          nclose(coordinate, namedSeam[i]![k]!, 1e-12),
        ),
      ),
  );
  TestValidator.equals(
    "on both",
    ConstructionChecks.onBoth(seam(joined), onPost, onBeam(0), seamBound),
    [],
  );
  TestValidator.equals(
    "chords",
    ConstructionChecks.chords(
      joined.join,
      (): number => 1000 * w,
      (): number => 1000 * w,
      1e-6 * R,
    ),
    [],
  );
  TestValidator.predicate(
    "wrong chords",
    ConstructionChecks.chords(
      joined.join,
      (): number => 1000 * (w + 0.001),
      (): number => 1000 * (w + 0.001),
      1e-6 * R,
    ).length !== 0,
  );
  TestValidator.predicate(
    "wider beam",
    ConstructionChecks.onBoth(seam(joined), onPost, onBeam(0.001), 1e-9 * R)
      .length !== 0,
  );

  const spacing: number = (2 * Math.PI * (r + w)) / 48;
  const plane: number = (spacing / r) ** 2 / 8;
  const blend: IAutoMovieSolidSurface = ConstructionRead.surface(
    real,
    "blend.post",
  );
  const beam: IAutoMovieSolidSurface = ConstructionRead.surface(real, "beam");
  const post: IAutoMovieSolidSurface = ConstructionRead.surface(real, "post");
  TestValidator.equals(
    "G1 and G2",
    ConstructionChecks.rails(
      joined.blend,
      blend,
      beam,
      post,
      plane,
      plane / (1000 * r),
    ),
    [],
  );
  TestValidator.predicate(
    "swapped surfaces",
    ConstructionChecks.rails(
      joined.blend,
      blend,
      post,
      beam,
      plane,
      plane / (1000 * r),
    ).length !== 0,
  );

  if (tree.type !== "join") throw new Error("the fixture node is a join");
  const found: IAutoMovieConstructionRealization.IRealization =
    AutoMovieEngineConstruction.realize(
      {
        name: "made",
        root: {
          ...tree,
          seed: {
            type: "search",
            partFace: "post",
            hostFace: "beam",
            phase: Math.PI / 2,
            from: 0,
            to: 1,
          },
        },
      },
      { chord: 1e-4 },
    );
  TestValidator.equals("search diagnostics", found.diagnostics.length, 0);
  TestValidator.equals(
    "search seam",
    ConstructionChecks.onBoth(
      seam(ConstructionRead.join(found, "blend.post")),
      onPost,
      onBeam(0),
      seamBound,
    ),
    [],
  );
}
