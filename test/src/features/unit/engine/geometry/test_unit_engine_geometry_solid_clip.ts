import { AutoMovieSolidClip } from "@automovie/engine";
import type { IAutoMovieSolidClip } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionBlendFixture as Fixture } from "../../../internal/construction/ConstructionBlendFixture";
import { nclose } from "../../../internal/predicates";

/**
 * `AutoMovieSolidClip.rail` lists the host rail of a join and `trim` cuts the
 * host faces along it.
 *
 * Fixture (`ConstructionBlendFixture`, millimetres): a beam of radius 30 mm
 * (face 0) and a post of radius 15 mm (face 1) merged once with rails 6 mm
 * wide, 48 blend columns; the rail lies wholly on the beam, a hole.
 *
 * Scenarios:
 *
 * 1. `rail` returns 48 points, one per column, each on the beam alone (face 0), at
 *    the phases 2 pi k / 48.
 * 2. Each rail point lies on the beam and stands where the mesh vertex of that
 *    point stands: the beam surface read at its chart (station, phase) is the
 *    vertex's position, and its distance from the beam's axis is 30 mm.
 * 3. The first point is (21, 0, 30): 6 mm beyond the post's radius 15 along the
 *    beam, on its top line.
 * 4. With the blend face appended to the body, `trim` of that rail on the blend
 *    face succeeds (null) and cuts exactly one cycle of kind "hole" into the
 *    beam through the rail's 48 vertices in order, with 48 chart points and 48
 *    neighbours, and none into the post or the blend face.
 * 5. With the post standing on the junction of two beams continued end to end,
 *
 * Ail returns 50 points: 48 columns and the two crossings from one beam to the
 * other, at the phases pi / 2 and 3 pi / 2. Each crossing names both beams, and
 * its two charts evaluate to one point on the junction (x = 0), 30 mm from the
 * axis; 24 points lie on the left beam alone.
 */
export function test_unit_engine_geometry_solid_clip(): void {
  const fixture: Fixture.IFixture = Fixture.create();
  const rail: IAutoMovieSolidClip.IRailPoint[] | string =
    AutoMovieSolidClip.rail(
      fixture.body,
      fixture.join,
      fixture.blend,
      fixture.index,
      fixture.count,
    );
  if (typeof rail === "string") throw new Error(`rail: ${rail}`);
  TestValidator.equals("points", rail.length, 48);
  rail.forEach((point: IAutoMovieSolidClip.IRailPoint, k: number): void => {
    TestValidator.equals(`faces ${k}`, point.faces, [0]);
    TestValidator.predicate(
      `phase ${k}`,
      nclose(point.phase, (2 * Math.PI * k) / 48, 1e-12),
    );
    const chart: [number, number] = point.chart.get(0)!;
    const at: number[] = fixture.body.faces[0]!.surface.jet(
      chart[0],
      chart[1],
    ).p;
    const vertex: number[] = fixture.body.mesh.positions.slice(
      3 * point.vertex,
      3 * point.vertex + 3,
    );
    TestValidator.equals(`vertex ${k}`, at, vertex);
    TestValidator.predicate(
      `on the beam ${k}`,
      nclose(Math.hypot(at[1]!, at[2]!), 30, 0.05),
    );
  });
  const first: number[] = fixture.body.faces[0]!.surface.jet(
    rail[0]!.chart.get(0)![0],
    rail[0]!.chart.get(0)![1],
  ).p;
  TestValidator.predicate("first x", nclose(first[0]!, 21, 1e-6));
  TestValidator.predicate("first y", nclose(first[1]!, 0, 1e-6));
  TestValidator.predicate("first z", nclose(first[2]!, 30, 1e-6));

  fixture.body.faces.push({
    surface: fixture.surface,
    stations: [0, fixture.blend.length],
    phases: Array.from(
      { length: fixture.count },
      (_: unknown, k: number): number => (2 * Math.PI * k) / fixture.count,
    ),
    cycles: [],
  });
  TestValidator.equals(
    "trim",
    AutoMovieSolidClip.trim(fixture.body, rail, 2, fixture.blend.host.kind),
    null,
  );
  TestValidator.equals("beam cycles", fixture.body.faces[0]!.cycles.length, 1);
  const cycle = fixture.body.faces[0]!.cycles[0]!;
  TestValidator.equals("kind", cycle.kind, "hole");
  TestValidator.equals(
    "vertices",
    cycle.vertices,
    rail.map((point: IAutoMovieSolidClip.IRailPoint): number => point.vertex),
  );
  TestValidator.equals("chart points", cycle.chart.length, 48);
  TestValidator.equals("neighbours", cycle.neighbours.length, 48);
  TestValidator.equals("post cycles", fixture.body.faces[1]!.cycles.length, 0);
  TestValidator.equals("blend cycles", fixture.body.faces[2]!.cycles.length, 0);
  // 5. A rail across two faces.
  const across: Fixture.IFixture = Fixture.create(true);
  const crossing: IAutoMovieSolidClip.IRailPoint[] | string =
    AutoMovieSolidClip.rail(
      across.body,
      across.join,
      across.blend,
      across.index,
      across.count,
    );
  if (typeof crossing === "string") throw new Error(`rail across: ${crossing}`);
  TestValidator.equals("across points", crossing.length, 50);
  const forks: IAutoMovieSolidClip.IRailPoint[] = crossing.filter(
    (point: IAutoMovieSolidClip.IRailPoint): boolean =>
      point.faces.length === 2,
  );
  TestValidator.equals("two crossings", forks.length, 2);
  TestValidator.predicate(
    "first crossing phase",
    nclose(forks[0]!.phase, Math.PI / 2, 1e-9),
  );
  TestValidator.predicate(
    "second crossing phase",
    nclose(forks[1]!.phase, (3 * Math.PI) / 2, 1e-9),
  );
  for (const fork of forks) {
    const where: number[][] = [...fork.chart.entries()].map(
      ([face, chart]: [number, [number, number]]): number[] =>
        across.body.faces[face]!.surface.jet(chart[0], chart[1]).p,
    );
    TestValidator.equals("both faces", [...fork.chart.keys()].sort(), [0, 1]);
    TestValidator.predicate(
      "same point from both faces",
      where[0]!.every((x: number, k: number): boolean =>
        nclose(x, where[1]![k]!, 1e-6),
      ),
    );
    TestValidator.predicate("on the junction", nclose(where[0]![0]!, 0, 1e-6));
    TestValidator.predicate(
      "on the beam",
      nclose(Math.hypot(where[0]![1]!, where[0]![2]!), 30, 0.05),
    );
  }
  TestValidator.equals(
    "left beam alone between the crossings",
    crossing.filter(
      (point: IAutoMovieSolidClip.IRailPoint): boolean =>
        point.faces.length === 1 && point.faces[0] === 0,
    ).length,
    24,
  );
}
