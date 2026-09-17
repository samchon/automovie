import { measureAutoMovieMeshClearance } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Spatial rejection retains every overlapping plane and every touching edge.
 * The independently authored triangles have constant integer depths, so their
 * expected separations follow directly from subtraction. No source geometry,
 * portrait coordinates or implementation-generated oracle enters this case.
 *
 * Scenarios:
 * 1. Thirteen separated patches arranged along either projected axis yield
 *    their own depths; deeper patches elsewhere cannot change the local gap.
 * 2. A front triangle in a gap has no relationship, while exact vertex contact
 *    remains included. Both rejecting and visiting spatial regions are needed.
 * 3. One front face covers the whole population and reads its deepest plane,
 *    independent of back-face enumeration. All input buffers remain unchanged.
 */
export const test_geometry_mesh_clearance_spatial = (): void => {
  const mesh = (points: number[][]): IAutoMovieMesh => ({
    positions: points.flat(),
    indices: null,
    normals: null,
    uvs: null,
    skin: null,
  });
  const patch = (x: number, y: number, z: number): number[][] => [
    [x, y, z],
    [x + 1, y, z],
    [x, y + 1, z],
  ];
  for (const spreadAxis of [0, 1]) {
    const patches = Array.from({ length: 13 }, (_, ordinal) => {
      const i = ordinal - 6;
      return patch(
        spreadAxis === 0 ? 4 * i : 0,
        spreadAxis === 1 ? 4 * i : 0,
        i + 10,
      );
    });
    const back = mesh(patches.flat());
    const original = structuredClone(back);
    for (let i = -6; i <= 6; i++) {
      const front = mesh(
        patch(spreadAxis === 0 ? 4 * i : 0, spreadAxis === 1 ? 4 * i : 0, 30),
      );
      const result = measureAutoMovieMeshClearance(front, back, "z");
      TestValidator.equals("one matching projected patch", result.length, 1);
      TestValidator.predicate(
        "constant plane separation",
        Math.abs(result[0].minimum - (20 - i)) < 1e-12,
      );
    }
    TestValidator.equals(
      "gap between patches",
      measureAutoMovieMeshClearance(mesh(patch(2, 2, 30)), back, "z"),
      [],
    );
    const touching = measureAutoMovieMeshClearance(
      mesh(patch(1, 0, 30)),
      back,
      "z",
    );
    TestValidator.equals(
      "exact vertex contact is included",
      touching.length,
      1,
    );
    TestValidator.predicate(
      "touching patch depth",
      Math.abs(touching[0].minimum - 20) < 1e-12,
    );
    const enclosing = mesh([
      [-100, -100, 30],
      [100, -100, 30],
      [0, 100, 30],
    ]);
    for (const resident of [back, mesh([...patches].reverse().flat())]) {
      const result = measureAutoMovieMeshClearance(enclosing, resident, "z");
      TestValidator.equals("one enclosing front face", result.length, 1);
      TestValidator.predicate(
        "deepest among all resident patches",
        Math.abs(result[0].minimum - 14) < 1e-12,
      );
    }
    TestValidator.equals("caller-owned positions retained", back, original);
  }
};
