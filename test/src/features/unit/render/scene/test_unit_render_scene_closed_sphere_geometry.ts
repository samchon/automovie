import { createAutoMovieClosedSphereGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `createAutoMovieClosedSphereGeometry` is a sphere whose seam shares one exact
 * position and normal.
 *
 * Scenarios:
 *
 * 1. With 8 by 4 segments the last vertex of each row has the position and
 *    normal of the first, while their UVs differ.
 * 2. Every vertex lies at the radius.
 * 3. A radius of zero, a negative radius and one beyond Float32 are refused.
 */
export function test_unit_render_scene_closed_sphere_geometry(): void {
  const geometry = createAutoMovieClosedSphereGeometry(2, 8, 4);
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  for (let row: number = 0; row <= 4; ++row) {
    const first: number = row * 9;
    const last: number = first + 8;
    TestValidator.equals(
      `seam ${row}`,
      [
        position.getX(last) === position.getX(first) &&
          position.getY(last) === position.getY(first) &&
          position.getZ(last) === position.getZ(first),
        normal.getX(last) === normal.getX(first) &&
          normal.getY(last) === normal.getY(first) &&
          normal.getZ(last) === normal.getZ(first),
        uv.getX(last) !== uv.getX(first),
      ],
      [true, true, true],
    );
  }
  TestValidator.predicate(
    "on the sphere",
    Array.from({ length: position.count }, (_: unknown, index: number): number =>
      Math.hypot(position.getX(index), position.getY(index), position.getZ(index)),
    ).every((distance: number): boolean => Math.abs(distance - 2) < 1e-5),
  );
  for (const radius of [0, -1, 1e39])
    TestValidator.error(`radius ${radius}`, (): void => {
      createAutoMovieClosedSphereGeometry(radius);
    });
}