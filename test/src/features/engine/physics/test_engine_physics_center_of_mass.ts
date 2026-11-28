import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieBody,
  IAutoMoviePrimitiveShape,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeProp, primitivePart } from "../../internal/fixtures";
import { vclose } from "../../internal/predicates";

/** A transform at a point, uniformly scaled. */
function at(
  x: number,
  y: number,
  z: number,
  s: number = 1,
): IAutoMovieTransform {
  return {
    translation: { x, y, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: s, y: s, z: s },
  };
}

/** A unit box. */
const UNIT: IAutoMoviePrimitiveShape = {
  type: "box",
  width: 1,
  height: 1,
  depth: 1,
};

/**
 * A model's centre of mass. `bodyCenterOfMass` is the single entry: an explicit
 * body centre wins, else `deriveCenterOfMass`, the volume-weighted centroid of
 * the primitive parts at uniform density, each part weighed by its
 * transform-scaled solid volume at its transformed centroid, and null with no
 * volume to weigh.
 *
 * Scenarios:
 *
 * 1. A unit box with the explicit centre (0.5, 0, 0) gives it; with a null centre,
 *    or no body, it derives the origin; a plane-only model gives null either
 *    way, and a mesh-only model derives null.
 * 2. Derived: a box translated to (1, 2, 3) is there; two equal boxes at ±1 meet
 *    at the origin; a unit box at the origin and a 2 m box at x = 3, volumes 1
 *    and 8, balance at x = 24 / 9, as does a unit box scaled 2 at x = 3; a cone
 *    of height 4 at y = 5 has its centroid a quarter of its height up, at y =
 *    6.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the explicit-center override and the derived center for scaled solid parts, with no center for zero-volume or mesh-only models.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the center entry with explicit, null and omitted body centers, then derives centers directly from positioned primitives.
 * @evidence contracts/development/testing.md#independent-expectations Unit and 2 m cubes supply weights 1 and 8 and yield x = 24/9. Equal opposite boxes center at zero and a 4 m cone places its centroid 1 m above its base.
 */
export function test_engine_physics_center_of_mass(): void {
  // 1. The entry.
  const box = primitivePart("b", UNIT);
  const body = (
    centerOfMass: IAutoMovieBody["centerOfMass"],
  ): IAutoMovieBody => ({
    mass: 1,
    centerOfMass,
    friction: 0.5,
    restitution: 0.5,
  });
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const plane = primitivePart("p", { type: "plane", width: 2, depth: 2 });
  TestValidator.equals(
    "the entry",
    [
      AutoMovieEnginePhysics.centerOfMass(makeProp([box], body({ x: 0.5, y: 0, z: 0 }))),
      AutoMovieEnginePhysics.centerOfMass(makeProp([box], body(null))),
      AutoMovieEnginePhysics.centerOfMass(makeProp([box])),
      AutoMovieEnginePhysics.centerOfMass(makeProp([plane])),
      AutoMovieEnginePhysics.deriveCenterOfMass(makeProp([plane])),
    ],
    [{ x: 0.5, y: 0, z: 0 }, origin, origin, null, null],
  );
  TestValidator.equals(
    "mesh only",
    AutoMovieEnginePhysics.deriveCenterOfMass(
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

  // 2. Derived by volume.
  const derived = (parts: Parameters<typeof makeProp>[0]): IAutoMovieVector3 =>
    AutoMovieEnginePhysics.deriveCenterOfMass(makeProp(parts))!;
  TestValidator.predicate(
    "derived by volume",
    vclose(derived([primitivePart("b", UNIT, at(1, 2, 3))]), {
      x: 1,
      y: 2,
      z: 3,
    }) &&
      vclose(
        derived([
          primitivePart("l", UNIT, at(-1, 0, 0)),
          primitivePart("r", UNIT, at(1, 0, 0)),
        ]),
        origin,
      ) &&
      vclose(
        derived([
          primitivePart("small", UNIT, at(0, 0, 0)),
          primitivePart(
            "big",
            { type: "box", width: 2, height: 2, depth: 2 },
            at(3, 0, 0),
          ),
        ]),
        { x: 24 / 9, y: 0, z: 0 },
      ) &&
      vclose(
        derived([
          primitivePart("plain", UNIT, at(0, 0, 0)),
          primitivePart("scaled", UNIT, at(3, 0, 0, 2)),
        ]),
        { x: 24 / 9, y: 0, z: 0 },
      ) &&
      vclose(
        derived([
          primitivePart(
            "c",
            { type: "cone", radius: 1, height: 4 },
            at(0, 5, 0),
          ),
        ]),
        { x: 0, y: 6, z: 0 },
      ),
  );
}
