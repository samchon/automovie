import { nclose } from "../internal/nclose";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { measureAutoMovieMeshClearance } from "../../../../packages/engine/src/geometry/measureAutoMovieMeshClearance";
import { type IAutoMovieMesh } from "@automovie/interface";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Runs clearance over thirteen separated patches on each projected axis, asserting local gaps, retained touching vertices, absent gap relationships, the deepest covering plane and unchanged input. It catches BVH pruning that loses a relevant patch or imports unrelated depths.
 * @evidence contracts/testing.md#independent-expectations Each authored constant plane has depth i+10 below front depth 30, giving 20-i; a covering face must use the deepest intersected back plane regardless of enumeration. These depth-subtraction expectations and contact inclusion come from the fixtures, not hierarchy output; no timing or arbitrary spatial-completeness claim is measured.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both projected spread axes, thirteen local overlaps, a gap, exact vertex contact, a whole-population front face and reversed back enumeration. Sloped intersection extrema and malformed/overflow geometry remain in the companion clearance tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable clearance source on existing synthetic patches. It installs no consumer, starts no process, browser or GPU, builds no native artifact and dynamically registers no cases.
 */
export function test_geometry_mesh_clearance_spatial(): void {
  const mesh: (points: number[][]) => IAutoMovieMesh = (points: number[][]): IAutoMovieMesh => ({
    positions: points.flat(),
    indices: null,
    normals: null,
    uvs: null,
    skin: null,
  });
  const patch: (x: number, y: number, z: number) => number[][] = (x: number, y: number, z: number): number[][] => [
    [x, y, z],
    [x + 1, y, z],
    [x, y + 1, z],
  ];
  for (const spreadAxis of [0, 1]) {
    const patches: number[][][] = Array.from({ length: 13 }, (_: unknown, ordinal: number): number[][]  => {
      const i: number = ordinal - 6;
      return patch(
        spreadAxis === 0 ? 4 * i : 0,
        spreadAxis === 1 ? 4 * i : 0,
        i + 10,
      );
    });
    const back: IAutoMovieMesh = mesh(patches.flat());
    const original: IAutoMovieMesh = structuredClone(back);
    for (let i: number = -6; i <= 6; i++) {
      const front: IAutoMovieMesh = mesh(
        patch(spreadAxis === 0 ? 4 * i : 0, spreadAxis === 1 ? 4 * i : 0, 30),
      );
      const result: { triangle: number; minimum: number; }[] = measureAutoMovieMeshClearance(front, back, "z");
      TestValidator.equals("one matching projected patch", result.length, 1);
      TestValidator.predicate(
        "constant plane separation",
        (nclose(result[0].minimum - (20 - i), 0, 1e-12) && Math.abs(result[0].minimum - (20 - i)) < 1e-12),
      );
    }
    TestValidator.equals(
      "gap between patches",
      measureAutoMovieMeshClearance(mesh(patch(2, 2, 30)), back, "z"),
      [],
    );
    const touching: { triangle: number; minimum: number; }[] = measureAutoMovieMeshClearance(
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
      (nclose(touching[0].minimum - 20, 0, 1e-12) && Math.abs(touching[0].minimum - 20) < 1e-12),
    );
    const enclosing: IAutoMovieMesh = mesh([
      [-100, -100, 30],
      [100, -100, 30],
      [0, 100, 30],
    ]);
    for (const resident of [back, mesh([...patches].reverse().flat())]) {
      const result: { triangle: number; minimum: number; }[] = measureAutoMovieMeshClearance(enclosing, resident, "z");
      TestValidator.equals("one enclosing front face", result.length, 1);
      TestValidator.predicate(
        "deepest among all resident patches",
        (nclose(result[0].minimum - 14, 0, 1e-12) && Math.abs(result[0].minimum - 14) < 1e-12),
      );
    }
    TestValidator.predicate("caller-owned positions retained", equalGeometryTestValues(back, original));
  }
}
