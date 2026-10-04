import { clearHumanPersonHair } from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Generated hair is cleared against the body, and only generated hair.
 *
 * The body is the horizontal quad of half-width one at height zero, facing +Y.
 * A hair layer asks for a clearance of 0.009 with a step of 0.002, so the
 * head's contact rule (half a step plus the clearance) is 0.01. The strand is
 * a root vertex and one station whose corners are 0.005 above the quad.
 *
 * Scenarios:
 * 1. The generated part's strand rises to 0.01 (its root, 0.05 above, stays),
 *    and the part that is not generated is untouched.
 * 2. With no layers the clearance is zero: a station with corners at 0.005
 *    and -0.02 rises as one by 0.02, so its corners end at 0.025 and zero.
 * 3. With no generated part nothing is asked of the query and every mesh keeps
 *    its positions.
 * 4. A raised station changes the card normal by the independently calculated
 *    root-to-station slope; an unused vertex retains its old direction.
 * 5. A card that stays clear retains its original normal buffer.
 * 6. An additional generated non-hair part is excluded by the actual emitted
 *    hair membership, even with no layers and zero clearance.
 */
export const test_human_person_hair_part = (): void => {
  const body = {
    positions: [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1],
    indices: [0, 2, 1, 0, 3, 2],
  };
  const mesh = (lift: number, third: number): IAutoMovieMesh => ({
    positions: [0, 0.05, 0, -0.01, lift, 0.1, 0.01, third, 0.1],
    normals: null,
    uvs: null,
    indices: [0, 1, 2],
    skin: null,
  });
  const part = (id: string, geometry: IAutoMovieMesh) => ({
    id,
    name: id,
    material: "m",
    geometry: { type: "mesh" as const, mesh: geometry },
    attachedBone: null,
    transform: null,
  });
  const parts = (): IAutoMovieModel["parts"] => [
    part("skin", mesh(0.005, 0.005)),
    part("hair", mesh(0.005, 0.005)),
  ];
  const positionsOf = (list: IAutoMovieModel["parts"], id: string): number[] =>
    (list.find((one) => one.id === id)!.geometry as { mesh: IAutoMovieMesh })
      .mesh.positions;

  const layered = parts();
  clearHumanPersonHair({
    parts: layered,
    isGenerated: (id) => id === "hair",
    layers: [{ clearance: 0.009, samplingStep: 0.002 }],
    ...body,
  });
  TestValidator.predicate(
    "the generated strand rises to the head's rule",
    [0, 0.05, 0, -0.01, 0.01, 0.1, 0.01, 0.01, 0.1].every((value, at) =>
      nclose(positionsOf(layered, "hair")[at], value, 1e-9),
    ),
  );
  TestValidator.equals(
    "a part that is not generated is untouched",
    positionsOf(layered, "skin"),
    mesh(0.005, 0.005).positions,
  );

  const bare = [
    part("hair", mesh(0.005, -0.02)),
  ] as IAutoMovieModel["parts"];
  clearHumanPersonHair({
    parts: bare,
    isGenerated: () => true,
    layers: [],
    ...body,
  });
  const after = positionsOf(bare, "hair");
  TestValidator.predicate(
    "with no layers the station still moves whole by its deepest corner's need",
    nclose(after[4], 0.025, 1e-9) && nclose(after[7], 0, 1e-9),
  );

  const none = parts();
  clearHumanPersonHair({
    parts: none,
    isGenerated: () => false,
    layers: [{ clearance: 0.009, samplingStep: 0.002 }],
    ...body,
  });
  TestValidator.equals(
    "with nothing generated nothing moves",
    positionsOf(none, "hair"),
    mesh(0.005, 0.005).positions,
  );

  const oldSlope = Math.hypot(0.1, 0.045);
  const oldNormal = [0, 0.1 / oldSlope, 0.045 / oldSlope];
  const contact = part("hair", {
    ...mesh(0.005, 0.005),
    positions: [...mesh(0.005, 0.005).positions, 0, 0.15, 0],
    normals: [...oldNormal, ...oldNormal, ...oldNormal, 1, 0, 0],
  });
  clearHumanPersonHair({ parts: [contact], isGenerated: () => true, layers: [{ clearance: 0.009, samplingStep: 0.002 }], ...body });
  const expectedSlope = Math.hypot(0.1, 0.04);
  const expectedNormal = [0, 0.1 / expectedSlope, 0.04 / expectedSlope];
  TestValidator.predicate("a raised card normal follows its new plane", [0, 1, 2].every((vertex) => expectedNormal.every((value, axis) => nclose(contact.geometry.mesh.normals![vertex * 3 + axis], value, 1e-9))));
  TestValidator.equals("an unused vertex keeps its admitted direction", contact.geometry.mesh.normals!.slice(9), [1, 0, 0]);

  const free = part("hair", {
    ...mesh(0.105, 0.105),
    positions: [0, 0.15, 0, -0.01, 0.105, 0.1, 0.01, 0.105, 0.1],
    normals: [...oldNormal, ...oldNormal, ...oldNormal],
  });
  const sameNormals = free.geometry.mesh.normals;
  clearHumanPersonHair({ parts: [free], isGenerated: () => true, layers: [{ clearance: 0.009, samplingStep: 0.002 }], ...body });
  TestValidator.predicate("a clear card retains its exact normal buffer", free.geometry.mesh.normals === sameNormals);

  const nonHair = part("generated-optical-surrogate", {
    ...mesh(-0.02, -0.02),
    normals: [...oldNormal, ...oldNormal, ...oldNormal],
  });
  const nonHairPositions = nonHair.geometry.mesh.positions;
  const nonHairNormals = nonHair.geometry.mesh.normals;
  const actualHair = part("actual-hair", mesh(-0.02, -0.02));
  const emittedHairIds = new Set([actualHair.id]);
  clearHumanPersonHair({
    parts: [nonHair, actualHair],
    isGenerated: (id) => emittedHairIds.has(id),
    layers: [],
    ...body,
  });
  TestValidator.predicate("non-hair generated positions keep their buffer", nonHair.geometry.mesh.positions === nonHairPositions);
  TestValidator.predicate("non-hair generated normals keep their buffer", nonHair.geometry.mesh.normals === nonHairNormals);
  TestValidator.predicate("selected hair is still cleared at zero clearance", nclose(actualHair.geometry.mesh.positions[4], 0, 1e-9) && nclose(actualHair.geometry.mesh.positions[7], 0, 1e-9));
};
