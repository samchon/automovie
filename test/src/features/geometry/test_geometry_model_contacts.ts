import { measureAutoMovieModelContacts } from "@automovie/engine";
import type {
  IAutoMovieMeasureModelContacts,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelContact,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { geometryModelPart } from "../internal/geometryModelPart";
import { geometryPartsModel } from "../internal/geometryPartsModel";
import { outwardBoxMesh } from "../internal/outwardBoxMesh";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Every part pair of a model is reported as crossing, contained, touching or
 * apart, with its least gap and the share of each part inside the other.
 *
 * A is the unit cube [0,1]^3 as a mesh part, and the contact distance is 1e-6
 * m. Every expected gap is the distance between the stated faces: a cube moved
 * +1.5 m in X stands 0.5 m from A, one moved +1.0000005 m stands 5e-7 m from
 * it, and the cube [0.25,0.75]^3 stands 0.25 m inside every face of A.
 *
 * Scenarios:
 *
 * 1. B moved +1.5 m in X is `apart`, gap 0.5, both shares 0.
 * 2. B moved +1.0000005 m in X is `touching`, gap 5e-7, below the contact
 *    distance.
 * 3. B moved +0.5 m in X is `crossing`, gap 0, both shares strictly between 0 and
 *    1.
 * 4. B as the cube [0.25,0.75]^3 is `contained`: B's share inside A is 1, A's
 *    inside B is 0, gap 0.25.
 * 5. B as a box primitive of 1 m sides whose near face stands at X 1.5 is reported
 *    `apart` with gap 0.5.
 * 6. A model of three parts gives three records in part order.
 * 7. A missing or negative contact distance throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public contact report on made models and checks relation, gap, shares and pair order. It catches a report that skips primitives or far pairs, a gap that is not the least surface distance, containment missed because the surfaces never cross, touching confused with crossing, and an accepted invalid contact distance.
 * @evidence contracts/development/testing.md#independent-expectations Gaps are face separations of the stated cubes and box, within 1e-12; shares are 0 or 1 where one cube lies wholly outside or inside the other, and strictly between where they overlap by half. Nothing is read back from the implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Apart, touching just inside the contact distance, crossing, contained in both directions, a primitive part, a three-part order and both refusals. Strict crossing detection is pinned by test_geometry_model_crossings and directional clearance by test_geometry_mesh_clearance.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test of engine geometry with in-memory models; no process, browser, GPU or dynamic registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the pair and its expected relation, gap and shares.
 */
export function test_geometry_model_contacts(): void {
  const options: IAutoMovieMeasureModelContacts.IOptions = { contact: 1e-6 };
  const unit: IAutoMovieMesh = outwardBoxMesh(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1 },
  );
  const a: IAutoMovieModelPart = geometryModelPart("a", {
    type: "mesh",
    mesh: unit,
  });
  const moved: (x: number) => IAutoMovieModelPart = (
    x: number,
  ): IAutoMovieModelPart =>
    geometryModelPart("b", { type: "mesh", mesh: unit }, { x, y: 0, z: 0 });
  const pair: (b: IAutoMovieModelPart) => IAutoMovieModelContact = (
    b: IAutoMovieModelPart,
  ): IAutoMovieModelContact =>
    measureAutoMovieModelContacts(geometryPartsModel([a, b]), options)[0]!;

  const apart: IAutoMovieModelContact = pair(moved(1.5));
  TestValidator.predicate(
    "a cube half a metre away is apart",
    apart.relation === "apart" &&
      nclose(apart.gap, 0.5, 1e-12) &&
      apart.inside === 0 &&
      apart.otherInside === 0,
  );

  const touching: IAutoMovieModelContact = pair(moved(1.0000005));
  TestValidator.predicate(
    "a cube half a micrometre away touches",
    touching.relation === "touching" && nclose(touching.gap, 5e-7, 1e-12),
  );

  const crossing: IAutoMovieModelContact = pair(moved(0.5));
  TestValidator.predicate(
    "a cube moved half a metre crosses",
    crossing.relation === "crossing" &&
      crossing.gap === 0 &&
      crossing.inside > 0 &&
      crossing.inside < 1 &&
      crossing.otherInside > 0 &&
      crossing.otherInside < 1,
  );

  const contained: IAutoMovieModelContact = pair(
    geometryModelPart("b", {
      type: "mesh",
      mesh: outwardBoxMesh(
        { x: 0.25, y: 0.25, z: 0.25 },
        { x: 0.75, y: 0.75, z: 0.75 },
      ),
    }),
  );
  TestValidator.predicate(
    "a cube inside another is contained, with its gap",
    contained.relation === "contained" &&
      contained.otherInside === 1 &&
      contained.inside === 0 &&
      nclose(contained.gap, 0.25, 1e-12),
  );

  // The box primitive is centred on its origin, so a 2 m offset puts its
  // near face at X 1.5.
  const primitive: IAutoMovieModelContact = pair(
    geometryModelPart(
      "b",
      {
        type: "primitive",
        shape: { type: "box", width: 1, height: 1, depth: 1 },
      },
      { x: 2, y: 0.5, z: 0.5 },
    ),
  );
  TestValidator.predicate(
    "a primitive part is measured",
    primitive.relation === "apart" && nclose(primitive.gap, 0.5, 1e-12),
  );

  const c: IAutoMovieModelPart = geometryModelPart(
    "c",
    { type: "mesh", mesh: unit },
    { x: 0, y: 3, z: 0 },
  );
  TestValidator.equals(
    "three parts give three records in part order",
    measureAutoMovieModelContacts(
      geometryPartsModel([a, moved(1.5), c]),
      options,
    ).map((entry: IAutoMovieModelContact): string[] => [
      entry.part,
      entry.other,
    ]),
    [
      ["a", "b"],
      ["a", "c"],
      ["b", "c"],
    ],
  );

  const model: IAutoMovieModel = geometryPartsModel([a, moved(1.5)]);
  TestValidator.predicate(
    "a missing or negative contact distance is refused",
    throwsError(() =>
      measureAutoMovieModelContacts(
        model,
        {} as IAutoMovieMeasureModelContacts.IOptions,
      ),
    ) &&
      throwsError(() => measureAutoMovieModelContacts(model, { contact: -1 })),
  );
}
