import { bodyCenterOfMass, deriveCenterOfMass } from "@automovie/engine";
import type { IAutoMovieBody } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeProp, primitivePart } from "../../../internal/fixtures";

/**
 * `bodyCenterOfMass` is the single entry for a model's centre of mass: an
 * explicit body centre wins, else it is derived from primitive volume;
 * `deriveCenterOfMass` is null when there is no volume to weigh.
 *
 * Scenarios:
 *
 * 1. A unit box with an explicit body centre (0.5, 0, 0) gives (0.5, 0, 0).
 * 2. The same box with a null body centre, and with no body at all, derives the
 *    origin.
 * 3. A plane-only model (zero volume) gives null, with or without a body.
 * 4. A mesh-only model (no primitive part) derives null.
 */
export function test_unit_engine_physics_center_of_mass(): void {
  const box = primitivePart("b", {
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  const body = (
    centerOfMass: IAutoMovieBody["centerOfMass"],
  ): IAutoMovieBody => ({
    mass: 1,
    centerOfMass,
    friction: 0.5,
    restitution: 0.5,
  });
  TestValidator.equals(
    "explicit",
    bodyCenterOfMass(makeProp([box], body({ x: 0.5, y: 0, z: 0 }))),
    { x: 0.5, y: 0, z: 0 },
  );
  TestValidator.equals(
    "derived with a null centre",
    bodyCenterOfMass(makeProp([box], body(null))),
    { x: 0, y: 0, z: 0 },
  );
  TestValidator.equals(
    "derived without a body",
    bodyCenterOfMass(makeProp([box])),
    { x: 0, y: 0, z: 0 },
  );
  const plane = primitivePart("p", { type: "plane", width: 2, depth: 2 });
  TestValidator.equals("plane only", bodyCenterOfMass(makeProp([plane])), null);
  TestValidator.equals(
    "plane derive",
    deriveCenterOfMass(makeProp([plane])),
    null,
  );
  TestValidator.equals(
    "mesh only",
    deriveCenterOfMass(
      makeProp([
        {
          id: "m",
          name: null,
          geometry: {
            type: "mesh",
            mesh: {
              positions: [0, 0, 0],
              normals: null,
              uvs: null,
              indices: null,
              skin: null,
            },
          },
          material: null,
          attachedBone: null,
          transform: null,
        },
      ]),
    ),
    null,
  );
}
