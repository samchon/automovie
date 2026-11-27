import type { IAutoMovieMesh } from "@automovie/interface";
import { AutoMovieRenderSceneLayout } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type { BufferGeometry } from "three";

import { nclose } from "../../internal/nclose";

/** Zero rounding error for entirely dyadic Float32 morph data. */
const DELTA_TOLERANCE: number = 0;

/** Compare the packed components of one morph attribute with its expected row. */
function deltasMatch(
  attribute: NonNullable<BufferGeometry["morphAttributes"]["position"]>[number],
  expected: readonly number[],
): boolean {
  return (
    attribute.array.length === expected.length &&
    expected.every((value: number, index: number): boolean =>
      nclose(attribute.array[index]!, value, DELTA_TOLERANCE),
    )
  );
}

/**
 * A triangle with two authored morphs preserves their relative deltas and
 * supplies a zero normal delta for the target that leaves normals alone.
 *
 * Scenarios:
 *
 * 1. Two position rows pair with a supplied and a zero-filled normal row.
 * 2. A single target with only positions leaves the normal channel absent.
 *
 * The glTF morph model adds each target's delta. This raw triangle verifies
 * the uploaded attributes and relative flag before any shader execution.
 */
export function test_render_scene_build_geometry_morph_attributes(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
    skin: null,
    uvs: null,
    targets: [
      {
        name: "bend",
        positions: [0, 0, 0, 0, 0, 0.5, 0, 0, 0],
        normals: [0, 0, 0, 0.25, 0, -0.125, 0, 0, 0],
      },
      {
        name: "shift",
        positions: [0.25, 0, 0, 0.25, 0, 0, 0.25, 0, 0],
        normals: null,
      },
    ],
  };
  const geometry: BufferGeometry = AutoMovieRenderSceneLayout.buildGeometry({ type: "mesh", mesh });
  const positions: NonNullable<BufferGeometry["morphAttributes"]["position"]> =
    geometry.morphAttributes.position!;
  const normals: NonNullable<BufferGeometry["morphAttributes"]["normal"]> =
    geometry.morphAttributes.normal!;
  TestValidator.predicate(
    "position rows are relative displacements",
    () =>
      geometry.morphTargetsRelative &&
      positions.length === 2 &&
      positions[0]!.name === "bend" &&
      positions[1]!.name === "shift" &&
      deltasMatch(positions[0]!, [0, 0, 0, 0, 0, 0.5, 0, 0, 0]) &&
      deltasMatch(positions[1]!, [0.25, 0, 0, 0.25, 0, 0, 0.25, 0, 0]),
  );
  TestValidator.predicate(
    "normal slots retain target order",
    () =>
      normals.length === 2 &&
      normals[0]!.name === "bend" &&
      normals[1]!.name === "shift" &&
      deltasMatch(normals[0]!, [0, 0, 0, 0.25, 0, -0.125, 0, 0, 0]) &&
      deltasMatch(normals[1]!, [0, 0, 0, 0, 0, 0, 0, 0, 0]),
  );

  const positionOnly: BufferGeometry = AutoMovieRenderSceneLayout.buildGeometry({
    type: "mesh",
    mesh: { ...mesh, targets: [mesh.targets![1]!] },
  });
  TestValidator.equals(
    "no normal target creates no shader channel",
    positionOnly.morphAttributes.normal,
    undefined,
  );
}
