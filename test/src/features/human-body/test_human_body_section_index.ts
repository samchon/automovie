import {
  indexHumanBodySectionTriangles,
  measureHumanBodySection,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * A stack of section planes cut through a triangle index gives exactly the
 * sections a full walk gives.
 *
 * The subject is an open lathe of five rings (radius 0.2, 0.3, 0.25, 0.35,
 * 0.3 at heights 0, 0.25, 0.5, 0.75, 1) of sixteen segments, cut by
 * horizontal planes and by a tilted normal.
 *
 * Scenarios:
 * 1. A station between rings lists its band of 32 triangles; a station
 *    exactly on a ring (0.25, where the vertices' distance is exactly zero
 *    and the cut counts them positive) lists both bands that meet it; one
 *    a nanometre under a ring still lists the band it cuts; the top ring's
 *    level lists the band below it; a station outside lists none; every
 *    list ascends and is smaller than the surface.
 * 2. Every station's section walked over its list equals, in every field,
 *    the section of a full walk, for the horizontal stack and for a tilted
 *    normal with its own stack.
 * 3. An unordered stack lists the same triangles per station as an ordered
 *    one, and an empty stack lists nothing.
 * 4. A negative twin: a list missing one straddling triangle changes the
 *    section, so the equality above measures the list and not the cut.
 */
export const test_human_body_section_index = (): void => {
  const segments = 16;
  const heights = [0, 0.25, 0.5, 0.75, 1];
  const radii = [0.2, 0.3, 0.25, 0.35, 0.3];
  const positions: number[] = [];
  for (const [ring, y] of heights.entries())
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * 2 * Math.PI;
      positions.push(
        radii[ring] * Math.cos(angle),
        y,
        radii[ring] * Math.sin(angle),
      );
    }
  const indices: number[] = [];
  for (let ring = 0; ring + 1 < heights.length; ring++)
    for (let s = 0; s < segments; s++) {
      const a = ring * segments + s;
      const b = ring * segments + ((s + 1) % segments);
      indices.push(a, b, a + segments, b, b + segments, a + segments);
    }
  const total = indices.length / 3;
  const up = { x: 0, y: 1, z: 0 };
  const levels = [0.1, 0.25, 0.25 - 1e-9, 0.6, 1, 1.5];
  const lists = indexHumanBodySectionTriangles(positions, indices, up, levels);
  TestValidator.equals("one list per station", lists.length, levels.length);
  const band = (ring: number): number[] =>
    Array.from({ length: 2 * segments }, (_, at) => ring * 2 * segments + at);
  TestValidator.predicate(
    "each list ascends and is smaller than the surface",
    lists.every(
      (list) => list.every((t, at) => at === 0 || list[at - 1] < t) && list.length < total,
    ),
  );
  TestValidator.equals("a station between rings lists its band", lists[0], band(0));
  TestValidator.equals(
    "a station on a ring lists both bands that meet it",
    lists[1],
    [...band(0), ...band(1)],
  );
  TestValidator.predicate(
    "a station a nanometre under a ring still lists the band it cuts",
    band(0).every((t) => lists[2].includes(t)),
  );
  TestValidator.equals("a mid station lists its band", lists[3], band(2));
  TestValidator.equals("the top ring's level lists the band below it", lists[4], band(3));
  TestValidator.equals("a station outside lists none", lists[5], []);
  const seed = (y: number) => ({ x: 0, y, z: 0 });
  for (const [station, level] of levels.entries()) {
    const plane = { point: seed(level), normal: up };
    TestValidator.equals(
      "horizontal station " + station,
      measureHumanBodySection(
        positions,
        indices,
        plane,
        plane.point,
        lists[station],
      ),
      measureHumanBodySection(positions, indices, plane, plane.point),
    );
  }
  const length = Math.hypot(0.2, 1, 0.1);
  const tilt = { x: 0.2 / length, y: 1 / length, z: 0.1 / length };
  const tiltedLevels = [0.05, 0.3, 0.55, 0.9];
  const tilted = indexHumanBodySectionTriangles(
    positions,
    indices,
    tilt,
    tiltedLevels,
  );
  for (const [station, level] of tiltedLevels.entries()) {
    const point = { x: level * tilt.x, y: level * tilt.y, z: level * tilt.z };
    const plane = { point, normal: tilt };
    TestValidator.equals(
      "tilted station " + station,
      measureHumanBodySection(positions, indices, plane, point, tilted[station]),
      measureHumanBodySection(positions, indices, plane, point),
    );
  }
  TestValidator.equals(
    "stack order does not change a station's list",
    indexHumanBodySectionTriangles(
      positions,
      indices,
      up,
      [...levels].reverse(),
    ),
    [...lists].reverse(),
  );
  TestValidator.equals(
    "an empty stack lists nothing",
    indexHumanBodySectionTriangles(positions, indices, up, []),
    [],
  );
  const plane = { point: seed(0.6), normal: up };
  const complete = measureHumanBodySection(
    positions,
    indices,
    plane,
    plane.point,
    lists[3],
  );
  const missing = measureHumanBodySection(
    positions,
    indices,
    plane,
    plane.point,
    lists[3].slice(1),
  );
  TestValidator.equals("the complete list closes its loop", complete !== null, true);
  TestValidator.equals("a list missing a triangle opens it", missing, null);
};
