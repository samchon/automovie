import { createAutoMoviePrimitiveProp } from "@automovie/archetypes";
import {
  AutoMoviePrimitiveShape,
  type IAutoMovieMaterial,
  type IAutoMovieModel,
  type IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/material";
import { namedFacts, throwsError } from "../internal/predicates";

/** The material every prop below wears. */
const SURFACE: IAutoMovieMaterial = material("surface");

/** Every supported primitive, each with unequal dimensions so none can stand for another. */
const SHAPES: readonly AutoMoviePrimitiveShape[] = [
  { type: "box", width: 2, height: 3, depth: 6 },
  { type: "sphere", radius: 2 },
  { type: "capsule", radius: 3, height: 8 },
  { type: "cylinder", radius: 3, height: 8 },
  { type: "cone", radius: 3, height: 8 },
  { type: "plane", width: 6, depth: 8 },
];

/**
 * Produce one skeletonless primitive prop per supported shape and check that the model group carries exactly the authored shape and material.
 *
 * Scenarios:
 * 1. For each of the six primitive shapes, the model is one generated, skeletonless group whose id is the requested id and whose only material is the supplied record.
 * 2. The single part is named `primitive`, cites the supplied material id, rides no bone, has no local transform and draws a shape equal to the authored one.
 * 3. The part's shape is a copy: mutating the authored shape after production leaves the model unchanged.
 * 4. A whitespace id is refused before any model is returned.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls createAutoMoviePrimitiveProp for every primitive kind and inspects the returned model's identity, origin, skeleton, material list and its one part's name, material, attachment, transform and shape fields, then mutates the input shape and rereads the part. A dropped or swapped dimension, an aliased shape, a lost material or an accepted blank id contradicts these observations.
 * @evidence contracts/testing.md#independent-expectations The authored literal shapes and the documented single-part layout determine every expected value; the shape comparison reads each authored key against the produced part without deriving expectations from the producer.
 * @evidence contracts/testing.md#distinguishing-cases Six shape kinds with unequal dimensions, the post-production mutation and a whitespace id separate a faithful copy from aliasing, dimension swaps and missing refusal; numeric domain admission belongs to engine model validation tests.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_archetypes_primitive_prop_geometry imports the actual archetype producer and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_archetypes_primitive_prop_geometry(): void {
  for (const authored of SHAPES) {
    const shape: AutoMoviePrimitiveShape = { ...authored };
    const model: IAutoMovieModel = createAutoMoviePrimitiveProp({
      id: `prop-${shape.type}`,
      shape,
      material: SURFACE,
    });
    const part: IAutoMovieModelPart | undefined = model.parts[0];
    const drawn: AutoMoviePrimitiveShape | null =
      part !== undefined && part.geometry.type === "primitive"
        ? part.geometry.shape
        : null;
    const sameShape: (expected: AutoMoviePrimitiveShape) => boolean = (
      expected: AutoMoviePrimitiveShape,
    ): boolean =>
      drawn !== null &&
      Object.keys(drawn).length === Object.keys(expected).length &&
      Object.entries(expected).every(
        ([key, value]: [string, unknown]): boolean =>
          (drawn as unknown as Record<string, unknown>)[key] === value,
      );
    TestValidator.equals(
      `${shape.type} is one skeletonless group carrying the authored shape and material`,
      namedFacts([
        ["id", (): boolean => model.id === `prop-${shape.type}`],
        ["generated", (): boolean => model.origin === "generated"],
        ["skeletonless", (): boolean => model.skeleton === null],
        [
          "material",
          (): boolean =>
            model.materials.length === 1 && model.materials[0] === SURFACE,
        ],
        ["onePart", (): boolean => model.parts.length === 1],
        [
          "part",
          (): boolean =>
            part?.name === "primitive" &&
            part.material === "surface" &&
            part.attachedBone === null &&
            part.transform === null,
        ],
        ["shape", (): boolean => sameShape(authored)],
      ]),
      {
        id: true,
        generated: true,
        skeletonless: true,
        material: true,
        onePart: true,
        part: true,
        shape: true,
      },
    );
    (shape as unknown as Record<string, unknown>).type = "mutated";
    TestValidator.predicate(
      `${authored.type} shape is copied rather than aliased`,
      sameShape(authored),
    );
  }
  TestValidator.predicate(
    "a blank id is refused",
    throwsError(
      (): IAutoMovieModel =>
        createAutoMoviePrimitiveProp({
          id: "\t",
          shape: { type: "sphere", radius: 1 },
          material: SURFACE,
        }),
      "non-whitespace",
    ),
  );
}
