import {
  assertPortraitInteriorBindings,
  buildPortraitOralLining,
  preparePortraitMouth,
  preparePortraitOralLining,
  subdivideControlMesh,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { portraitOralLiningFixture } from "../internal/portraitOralLiningFixture";

/**
 * A lining carries the actual skin rim identities through native preparation.
 * A hand-authored square annulus gives the original four vertex IDs; one Loop
 * refinement inserts four new rim vertices whose coordinates must be retained.
 *
 * Scenarios:
 * 1. Both resolutions retain exact rim IDs and independently copied coordinates;
 *    the compatibility mesh and native mesh coincide without inverse scaling.
 * 2. The actual mouth producer maps each initial native vertex to the skin ID,
 *    while a detached backdrop declares no shared attachment.
 * 3. Legacy crowns retain their constructor-owned cervical loops, and mutating
 *    a returned boundary or mesh cannot alter source data or a later result.
 */
export const test_subject_native_lining = (): void => {
  const source = portraitOralLiningFixture();
  const saved = structuredClone(source);
  const socket = {
    outer: [4, 5, 6, 7],
    upper: [0, 1],
    lower: [3, 2],
    lipSeed: 4,
  };
  const shape = {
    ...humanFaceFixture().basis.recipe.mouth,
    crowns: [],
    cavityWall: 0.75,
    cavityDepth: 10,
  };
  for (const rounds of [0, 1]) {
    const skin = subdivideControlMesh(
      { ...source, groups: new Array(8).fill(0) },
      rounds,
    );
    const native = preparePortraitOralLining(skin, 0, 10, 0.75);
    const before = structuredClone(native);
    TestValidator.equals(
      "one boundary midpoint per refined edge",
      native.boundary.length,
      rounds === 0 ? 4 : 8,
    );
    if (rounds === 0)
      TestValidator.equals(
        "hand-authored skin cycle",
        native.boundary,
        [0, 1, 2, 3],
      );
    else
      TestValidator.equals(
        "new resident rim IDs",
        native.boundary.filter((id) => id >= source.positions.length).length,
        4,
      );
    TestValidator.equals(
      "boundary-to-native exact positions",
      native.mesh.positions.slice(0, 3 * native.boundary.length),
      native.boundary.flatMap((id) => skin.positions[id]),
    );
    TestValidator.equals(
      "standalone mesh retained",
      native.mesh,
      buildPortraitOralLining(skin, 0, 10, 0.75),
    );
    const parts = preparePortraitMouth(
      skin.positions,
      socket,
      shape,
      undefined,
      skin.indices,
    );
    TestValidator.equals(
      "mouth retains actual producer IDs",
      parts[0].attachments,
      native.boundary.map((id, vertex) => ({
        vertex,
        target: { part: null, vertex: id },
      })),
    );
    assertPortraitInteriorBindings(skin, parts);
    native.boundary[0] = 999;
    native.mesh.positions[0] = 999;
    TestValidator.equals(
      "native lining owns buffers",
      preparePortraitOralLining(skin, 0, 10, 0.75),
      before,
    );
  }
  const detached = preparePortraitMouth(source.positions, socket, {
    ...shape,
    cavityWall: undefined,
  });
  TestValidator.equals(
    "detached backdrop has no fabricated join",
    detached[0].attachments,
    undefined,
  );
  const legacy = preparePortraitMouth(
    [...source.positions, [0, 1, 0]],
    { ...socket, upper: [0, 8, 1] },
    { ...shape, crowns: [{ width: 0.5, height: 1 }] },
    undefined,
    source.indices,
  );
  TestValidator.equals(
    "legacy crown has a cervical cycle",
    legacy[1].loops?.map((loop) => loop.name),
    ["cervical"],
  );
  assertPortraitInteriorBindings(source, legacy);
  TestValidator.equals("lining retains source mesh", source, saved);
};
