import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMeasureModelContacts,
  IAutoMovieMesh,
  IAutoMovieModelContact,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { geometryModelPart } from "../../internal/geometryModelPart";
import { geometryPartsModel } from "../../internal/geometryPartsModel";
import { outwardBoxMesh } from "../../internal/outwardBoxMesh";
import { throwsError } from "../../internal/predicates";

/**
 * `measureModelContacts` reports every part pair of a model as
 * crossing, contained, touching or apart, with its least gap and the share of
 * each part inside the other.
 *
 * Fixture: part A the unit cube [0, 1]^3 as a mesh; contact distance 1e-6 m.
 * Every gap is the distance between the stated faces.
 *
 * Scenarios:
 *
 * 1. B the cube moved +1.5 m in x: apart, gap 0.5, both shares 0.
 * 2. Moved +1.0000005 m: touching, gap 5e-7.
 * 3. Moved +0.5 m: crossing, gap 0, both shares strictly between 0 and 1.
 * 4. B the cube [0.25, 0.75]^3: contained, B wholly inside A, A's share 0, gap
 *    0.25.
 * 5. B a unit box primitive centred at (2, 0.5, 0.5), its near face at x = 1.5:
 *    apart, gap 0.5.
 * 6. Three parts give the pairs a-b, a-c, b-c in part order.
 * 7. A negative contact distance throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names all contact classes, actual metre gaps, containment shares, primitive conversion and pair order.
 * @evidence contracts/development/testing.md#behavioral-verification Measures actual model part pairs with mesh and primitive geometries, translating one cube across separation and contact thresholds.
 * @evidence contracts/development/testing.md#independent-expectations The authored interval endpoints give gaps 0.5 and 5e−7. The [0.25,0.75] cube is enclosed by a 0.25 margin. Overlapping cubes cross with gap zero.
 */
export function test_engine_geometry_model_contacts(): void {
  const options: IAutoMovieMeasureModelContacts.IOptions = { contact: 1e-6 };
  const unit: IAutoMovieMesh = outwardBoxMesh({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
  const a: IAutoMovieModelPart = geometryModelPart("a", { type: "mesh", mesh: unit });
  const moved = (x: number): IAutoMovieModelPart =>
    geometryModelPart("b", { type: "mesh", mesh: unit }, { x, y: 0, z: 0 });
  const pair = (b: IAutoMovieModelPart): IAutoMovieModelContact =>
    AutoMovieEngineGeometry.measureModelContacts(geometryPartsModel([a, b]), options)[0]!;
  const close = (x: number, y: number): boolean => Math.abs(x - y) <= 1e-12;

  // 1.
  const apart: IAutoMovieModelContact = pair(moved(1.5));
  TestValidator.predicate(
    "apart",
    apart.relation === "apart" && close(apart.gap, 0.5) && apart.inside === 0 && apart.otherInside === 0,
  );

  // 2.
  const touching: IAutoMovieModelContact = pair(moved(1.0000005));
  TestValidator.predicate("touching", touching.relation === "touching" && close(touching.gap, 5e-7));

  // 3.
  const crossing: IAutoMovieModelContact = pair(moved(0.5));
  TestValidator.predicate(
    "crossing",
    crossing.relation === "crossing" &&
      crossing.gap === 0 &&
      crossing.inside > 0 &&
      crossing.inside < 1 &&
      crossing.otherInside > 0 &&
      crossing.otherInside < 1,
  );

  // 4.
  const contained: IAutoMovieModelContact = pair(
    geometryModelPart("b", {
      type: "mesh",
      mesh: outwardBoxMesh({ x: 0.25, y: 0.25, z: 0.25 }, { x: 0.75, y: 0.75, z: 0.75 }),
    }),
  );
  TestValidator.predicate(
    "contained",
    contained.relation === "contained" &&
      contained.otherInside === 1 &&
      contained.inside === 0 &&
      close(contained.gap, 0.25),
  );

  // 5.
  const primitive: IAutoMovieModelContact = pair(
    geometryModelPart(
      "b",
      { type: "primitive", shape: { type: "box", width: 1, height: 1, depth: 1 } },
      { x: 2, y: 0.5, z: 0.5 },
    ),
  );
  TestValidator.predicate("primitive", primitive.relation === "apart" && close(primitive.gap, 0.5));

  // 6.
  const c: IAutoMovieModelPart = geometryModelPart("c", { type: "mesh", mesh: unit }, { x: 0, y: 3, z: 0 });
  TestValidator.equals(
    "pairs",
    AutoMovieEngineGeometry.measureModelContacts(geometryPartsModel([a, moved(1.5), c]), options).map(
      (e: IAutoMovieModelContact): string[] => [e.part, e.other],
    ),
    [
      ["a", "b"],
      ["a", "c"],
      ["b", "c"],
    ],
  );

  // 7.
  TestValidator.predicate(
    "negative contact",
    throwsError((): unknown => AutoMovieEngineGeometry.measureModelContacts(geometryPartsModel([a, moved(1.5)]), { contact: -1 })),
  );
}
