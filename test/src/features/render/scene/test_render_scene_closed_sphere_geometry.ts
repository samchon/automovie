import { AutoMovieRenderSceneLayout } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderSceneLayout.createClosedSphereGeometry` is a sphere whose seam
 * shares one exact
 * position and normal.
 *
 * Scenarios:
 *
 * 1. With 8 by 4 segments the last vertex of each row has the position and
 *    normal of the first, while their UVs differ.
 * 2. Every vertex lies at the radius.
 * 3. A radius of zero, a negative radius and one beyond Float32 are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names seam identity, differing UVs, radial placement and invalid inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Builds native sphere attributes through the scene geometry owner and reads every row's seam coordinates and normals, UV boundary and the vertex lengths. Calls the same owner with refused radii.
 * @evidence contracts/development/testing.md#independent-expectations Eight by four segmentation has paired row endpoints at the same geometric position and normal. Texture coordinates span the seam, and the radial norm is the supplied constant. Zero, negative and unrepresentable Float32 radii refuse.
 */
export function test_render_scene_closed_sphere_geometry(): void {
  const geometry = AutoMovieRenderSceneLayout.createClosedSphereGeometry({
    radius: 2,
    widthSegments: 8,
    heightSegments: 4,
  });
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
      AutoMovieRenderSceneLayout.createClosedSphereGeometry({ radius });
    });
}