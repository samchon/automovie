import type { IAutoMovieTransform } from "@automovie/interface";

/**
 * Preserve the source rig's existing identity-rotation/unit-scale rest transform.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the original caller-authored rest translation to the imported-node skeleton fixture used by actual lowering.
 * @evidence contracts/testing.md#independent-expectations Returns only input coordinates and literal identity/unit fields; it derives no expected clinical angle or lowered result.
 * @evidence contracts/testing.md#distinguishing-cases The same original constructor supplies hips and spine rest offsets, which consumers mutate for the existing malformed/rest-relative twins.
 * @evidence contracts/testing.md#execution-ownership Returns fresh caller-owned vectors/transform and acquires no file, host, browser, GPU or foreign-method replacement.
 */
export function importedNodeMotionTestTransform(x: number, y: number, z: number): IAutoMovieTransform {
  return {
    translation: { x, y, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
}
