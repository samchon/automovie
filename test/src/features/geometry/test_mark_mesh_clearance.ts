import {
  type IAutoMovieMark,
  type IAutoMovieMeshClearanceWitness,
  markAutoMovieMeshClearance,
  measureAutoMovieMeshClearance,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The witnesses of a clearance measurement become segments from the front surface to the back surface along the measured axis, flagged where the back lies in front.
 *
 * Scenarios:
 *
 * 1. A front triangle at z = 0.1 over a back triangle at z = 0, measured along Z, gives witnesses whose segments start on the front plane, end on the back plane at the same x and y, and are unflagged.
 * 2. The same triangles with the front at z = -0.1 give segments of length 0.1 that end above their start, flagged.
 * 3. The marks carry kind `clearance`, paths `<path>/clearance/<ordinal>` and the anchor given.
 * 4. A witness naming a vertex outside the front mesh, or without three weights, is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the engine's clearance measurement on two triangles, hands its witnesses to the producer and reads the returned segments, flags, kinds, paths and anchors.
 * @evidence contracts/development/testing.md#independent-expectations The planes are the authored heights, so every segment must start at the front height and end at the back height whatever witness points the measurement chooses.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a clear pair against a crossed one and well-formed against malformed witnesses. The measurement itself belongs to the clearance tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own meshes and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A front triangle at z = 0.1 over a back triangle at z = 0, measured along Z).
 */
export function test_mark_mesh_clearance(): void {
  const triangle = (z: number): IAutoMovieMesh =>
    ({
      positions: [0, 0, z, 1, 0, z, 0, 1, z],
      normals: null,
      uvs: null,
      indices: [0, 1, 2],
      skin: null,
    }) as IAutoMovieMesh;
  const measure = (front: IAutoMovieMesh): IAutoMovieMark[] => {
    const witnesses: IAutoMovieMeshClearanceWitness[] = [];
    measureAutoMovieMeshClearance(front, triangle(0), "z", (witness: IAutoMovieMeshClearanceWitness): void => {
      witnesses.push(witness);
    });
    return markAutoMovieMeshClearance({ path: "lid", front, axis: "z", witnesses, anchor: "box" });
  };
  const ends = (mark: IAutoMovieMark): number[] => (mark.shape as IAutoMovieMark.ISegments).points;

  // 1. Clear.
  const clear: IAutoMovieMark[] = measure(triangle(0.1));
  TestValidator.predicate(
    `clear witnesses run from the front plane to the back plane: ${clear.length}`,
    clear.length > 0 &&
      clear.every((mark: IAutoMovieMark): boolean => {
        const p: number[] = ends(mark);
        return (
          !mark.flagged &&
          nclose(p[2]!, 0.1) &&
          nclose(p[5]!, 0) &&
          nclose(p[0]!, p[3]!) &&
          nclose(p[1]!, p[4]!)
        );
      }),
  );

  // 2. Crossed.
  const crossed: IAutoMovieMark[] = measure(triangle(-0.1));
  TestValidator.predicate(
    "crossed witnesses end above their start and are flagged",
    crossed.length > 0 &&
      crossed.every((mark: IAutoMovieMark): boolean => mark.flagged && nclose(ends(mark)[2]!, -0.1) && nclose(ends(mark)[5]!, 0)),
  );

  // 3. Identity.
  TestValidator.equals(
    "kind, path and anchor",
    [clear[0]!.kind, clear[0]!.path, clear[0]!.anchor],
    ["clearance", "lid/clearance/0", "box"],
  );

  // 4. Malformed witnesses.
  for (const [title, witness] of [
    ["a vertex outside the mesh", { triangle: 0, backTriangle: 0, vertices: [0, 1, 7], weights: [1, 0, 0], gap: 0 }],
    ["two weights", { triangle: 0, backTriangle: 0, vertices: [0, 1, 2], weights: [1, 0], gap: 0 }],
  ] as const)
    TestValidator.error(`${title} is refused`, (): void => {
      markAutoMovieMeshClearance({
        path: "lid",
        front: triangle(0.1),
        axis: "z",
        witnesses: [witness as unknown as IAutoMovieMeshClearanceWitness],
        anchor: null,
      });
    });
}
