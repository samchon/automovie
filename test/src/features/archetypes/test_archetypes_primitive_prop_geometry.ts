import {
  AutoMoviePrimitiveShape,
  type IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieArchetypeGeometry, type IAutoMovieArchetypeParameterPlan, type IAutoMovieArchetypeRefusal, PRIMITIVE_PROP_ARCHETYPE } from "@automovie/archetypes";



import { namedFacts, nclose } from "../internal/predicates";

/** One accepted parameter map, as the design gate would have handed it over. */
type IParameters = Readonly<Record<string, number | string | boolean>>;

/** The bounding sphere the archetype states for one parameter map. */
const radiusOf: (
  parameters: Readonly<Record<string, string | number | boolean>>,
) => number = (parameters: IParameters): number =>
  PRIMITIVE_PROP_ARCHETYPE.projectionRadius(parameters);

/** The single primitive shape the archetype builds for one parameter map. */
const shapeOf: (
  parameters: Readonly<Record<string, string | number | boolean>>,
) => AutoMoviePrimitiveShape = (
  parameters: IParameters,
): Extract<IAutoMovieModelPart["geometry"], { type: "primitive" }>["shape"] => {
  const geometry: IAutoMovieArchetypeGeometry = PRIMITIVE_PROP_ARCHETYPE.build({
    parameters,
    material: "body",
    skeleton: "rig",
  });
  const part: IAutoMovieModelPart = geometry.parts[0]!;
  if (part.geometry.type !== "primitive")
    throw new Error("the primitive-prop archetype builds a primitive part");
  return part.geometry.shape;
};

/**
 * One shaft, stated once and read by three shapes.
 *
 * A capsule, a cylinder and a cone take the same two dimensions, so measuring all three from one pair is what separates the capsule's formula from the cylinder/cone formula: a capsule reaches its radius past each cap, a cylinder and a cone reach the corner of their own silhouette, and nothing about the pair itself distinguishes them.
 */
const SHAFT: { radius: number; height: number } = { radius: 3, height: 8 };

/**
 * A box whose three dimensions are all different, so none can stand for another.
 */
const BOX: { width: number; height: number; depth: number } = {
  width: 2,
  height: 3,
  depth: 6,
};

/** A plane whose two dimensions differ for the same reason. */
const PLANE: { width: number; depth: number } = { width: 6, depth: 8 };

/**
 * Build supported primitive props and check their root-centered radius estimates and ordinary output records.
 *
 * Scenarios:
 * 1. A sphere's bound is its own radius; a capsule reaches half its height past that radius; a cylinder and a cone reach the corner of their silhouette; a plane and a box reach half their own diagonal. Measured from one shared shaft, the capsule gives 7 while both cylinder and cone give 5, exercising the cap distinction and the shared radial silhouette formula.
 * 2. A parameter that is not a real measurement measures as zero rather than poisoning the bound with `NaN`, because selection runs before the design gate that would have refused it.
 * 3. Each shape is built with its own dimensions in its own keys: a box's width, height and depth are three different numbers and each lands where it belongs, and so do a plane's two.
 * 4. The built part is one primitive on the archetype's own material, carrying no bone and no local transform, and the archetype owns no skeleton.
 * 5. Inherited object keys and arbitrary names produce an unsupported-shape refusal; an ordinary box keeps its dimension list.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls PRIMITIVE_PROP_ARCHETYPE.plan, projectionRadius and build, observing refusal codes, required keys, numeric bounds, discriminated shape dimensions and part attachment/material records. A cylinder formula substituted for the capsule, swapped unequal box dimensions or inherited-property lookup would contradict these observations.
 * @evidence contracts/testing.md#independent-expectations Local dimensions give literal radii 2, 7, 5, 5, 5 and 3.5 for sphere/capsule/cylinder/cone/plane/box under the original nclose tolerance; copied build dimensions use tolerance zero. Missing, string and infinite radius fields must yield zero, while a readable capsule radius survives an unreadable height. These are pre-gate placeholder expectations, not certification of arbitrary malformed geometry or outward-rounded enclosure.
 * @evidence contracts/testing.md#distinguishing-cases Supported shapes, unequal dimensions, inherited-property shape names, unreadable fields and partly readable capsule parameters retain the existing positive and refusal cases; no rendered mesh or Human anatomy is inferred.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_archetypes_primitive_prop_geometry imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_archetypes_primitive_prop_geometry(): void {
  for (const shape of ["constructor", "toString", "__proto__", "unsupported"]) {
    const plan: IAutoMovieArchetypeParameterPlan =
      PRIMITIVE_PROP_ARCHETYPE.plan({ shape });
    TestValidator.equals(
      `unsupported shape ${shape} refuses instead of inherited lookup`,
      plan.refusals.map(
        (refusal: IAutoMovieArchetypeRefusal): string => refusal.code,
      ),
      ["model-parameter-invalid"],
    );
  }
  TestValidator.equals(
    "ordinary box dimensions remain admitted",
    PRIMITIVE_PROP_ARCHETYPE.plan({ shape: "box" }).required,
    ["shape", "width", "height", "depth"],
  );
  TestValidator.equals(
    "each shape's bound follows its formula, including the shared cylinder/cone result",
    namedFacts([
      [
        "sphere",
        (): boolean => nclose(radiusOf({ shape: "sphere", radius: 2 }), 2),
      ],
      // A capsule is a shaft with a hemisphere on each end, so it reaches its
      // radius past half its height: 3 + 4.
      [
        "capsule",
        (): boolean => nclose(radiusOf({ shape: "capsule", ...SHAFT }), 7),
      ],
      // A cylinder reaches the corner of its silhouette: hypot(3, 4).
      [
        "cylinder",
        (): boolean => nclose(radiusOf({ shape: "cylinder", ...SHAFT }), 5),
      ],
      ["cone", (): boolean => nclose(radiusOf({ shape: "cone", ...SHAFT }), 5)],
      // Half the diagonal of the rectangle: hypot(6, 8) / 2.
      [
        "plane",
        (): boolean => nclose(radiusOf({ shape: "plane", ...PLANE }), 5),
      ],
      // Half the diagonal of the box: hypot(2, 3, 6) / 2.
      ["box", (): boolean => nclose(radiusOf({ shape: "box", ...BOX }), 3.5)],
      // The three that take the same pair answer three different numbers, so
      // one formula standing in for another would be visible above.
      [
        "theShaftSeparatesThem",
        (): boolean =>
          new Set([
            radiusOf({ shape: "capsule", ...SHAFT }),
            radiusOf({ shape: "cylinder", ...SHAFT }),
            radiusOf({ shape: "sphere", radius: SHAFT.radius }),
          ]).size === 3,
      ],
    ]),
    {
      sphere: true,
      capsule: true,
      cylinder: true,
      cone: true,
      plane: true,
      box: true,
      theShaftSeparatesThem: true,
    },
  );

  TestValidator.equals(
    "a dimension nobody can read measures as zero rather than as nothing at all",
    namedFacts([
      ["absent", (): boolean => nclose(radiusOf({ shape: "sphere" }), 0, 0)],
      [
        "notANumber",
        (): boolean =>
          nclose(radiusOf({ shape: "sphere", radius: "big" }), 0, 0),
      ],
      [
        "notFinite",
        (): boolean =>
          nclose(
            radiusOf({ shape: "sphere", radius: Number.POSITIVE_INFINITY }),
            0,
            0,
          ),
      ],
      // And a partly readable map keeps the part it can read, rather than
      // discarding the whole bound.
      [
        "partlyReadable",
        (): boolean =>
          nclose(radiusOf({ shape: "capsule", radius: 3, height: "tall" }), 3),
      ],
    ]),
    {
      absent: true,
      notANumber: true,
      notFinite: true,
      partlyReadable: true,
    },
  );

  const box: AutoMoviePrimitiveShape = shapeOf({ shape: "box", ...BOX });
  const plane: AutoMoviePrimitiveShape = shapeOf({ shape: "plane", ...PLANE });
  TestValidator.equals(
    "each shape is built with its own dimensions in its own keys",
    namedFacts([
      [
        "box",
        (): boolean =>
          box.type === "box" &&
          nclose(box.width, BOX.width, 0) &&
          nclose(box.height, BOX.height, 0) &&
          nclose(box.depth, BOX.depth, 0),
      ],
      [
        "plane",
        (): boolean =>
          plane.type === "plane" &&
          nclose(plane.width, PLANE.width, 0) &&
          nclose(plane.depth, PLANE.depth, 0),
      ],
      [
        "sphere",
        (): boolean =>
          shapeOf({ shape: "sphere", radius: 2 }).type === "sphere",
      ],
      [
        "sphereRadius",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({
            shape: "sphere",
            radius: 2,
          });
          return shape.type === "sphere" && nclose(shape.radius, 2, 0);
        },
      ],
      [
        "capsule",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({
            shape: "capsule",
            ...SHAFT,
          });
          return (
            shape.type === "capsule" &&
            nclose(shape.radius, SHAFT.radius, 0) &&
            nclose(shape.height, SHAFT.height, 0)
          );
        },
      ],
      [
        "cylinder",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({
            shape: "cylinder",
            ...SHAFT,
          });
          return (
            shape.type === "cylinder" &&
            nclose(shape.radius, SHAFT.radius, 0) &&
            nclose(shape.height, SHAFT.height, 0)
          );
        },
      ],
      [
        "cone",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({
            shape: "cone",
            ...SHAFT,
          });
          return (
            shape.type === "cone" &&
            nclose(shape.radius, SHAFT.radius, 0) &&
            nclose(shape.height, SHAFT.height, 0)
          );
        },
      ],
    ]),
    {
      box: true,
      plane: true,
      sphere: true,
      sphereRadius: true,
      capsule: true,
      cylinder: true,
      cone: true,
    },
  );

  const built: IAutoMovieArchetypeGeometry = PRIMITIVE_PROP_ARCHETYPE.build({
    parameters: { shape: "box", ...BOX },
    material: "body",
    skeleton: "rig",
  });
  TestValidator.equals(
    "the built runtime is one primitive part on the builder's own material",
    namedFacts([
      ["one", (): boolean => built.parts.length === 1],
      ["noSkeleton", (): boolean => built.skeleton === null],
      ["material", (): boolean => built.parts[0]!.material === "body"],
      ["noBone", (): boolean => built.parts[0]!.attachedBone === null],
      ["noLocalTransform", (): boolean => built.parts[0]!.transform === null],
      // An archetype with no skeleton accepts no attachment, which is what the
      // empty bone list states.
      [
        "declaresNoBones",
        (): boolean => PRIMITIVE_PROP_ARCHETYPE.bones.length === 0,
      ],
    ]),
    {
      one: true,
      noSkeleton: true,
      material: true,
      noBone: true,
      noLocalTransform: true,
      declaresNoBones: true,
    },
  );
}
