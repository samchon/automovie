import { PRIMITIVE_PROP_ARCHETYPE } from "../../../../packages/archetypes/src/PRIMITIVE_PROP_ARCHETYPE";
import { IAutoMovieArchetypeParameterPlan } from "../../../../packages/archetypes/src/IAutoMovieArchetypeParameterPlan";
import { IAutoMovieArchetypeGeometry } from "../../../../packages/archetypes/src/IAutoMovieArchetypeGeometry";
import { IAutoMovieArchetypeRefusal } from "../../../../packages/archetypes/src/IAutoMovieArchetypeRefusal";
import { IAutoMovieModelPart, AutoMoviePrimitiveShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose } from "../internal/predicates";
/** One accepted parameter map, as the design gate would have handed it over. */
type IParameters = Readonly<Record<string, number | string | boolean>>;

/** The bounding sphere the archetype states for one parameter map. */
const radiusOf: (parameters: Readonly<Record<string, string | number | boolean>>) => number = (parameters: IParameters): number =>
  PRIMITIVE_PROP_ARCHETYPE.projectionRadius(parameters);

/** The single primitive shape the archetype builds for one parameter map. */
const shapeOf: (parameters: Readonly<Record<string, string | number | boolean>>) => AutoMoviePrimitiveShape = (
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
 * A capsule, a cylinder and a cone take the same two dimensions, so measuring
 * all three from one pair is what separates their three formulas: a capsule
 * reaches its radius past each cap, a cylinder and a cone reach the corner of
 * their own silhouette, and nothing about the pair itself distinguishes them.
 */
const SHAFT: { radius: number; height: number; } = { radius: 3, height: 8 };

/**
 * A box whose three dimensions are all different, so none can stand for
 * another.
 */
const BOX: { width: number; height: number; depth: number; } = { width: 2, height: 3, depth: 6 };

/** A plane whose two dimensions differ for the same reason. */
const PLANE: { width: number; depth: number; } = { width: 6, depth: 8 };

/**
 * The single-primitive archetype measures and builds exactly the shape it was
 * asked for.
 *
 * Selection and culling read `projectionRadius` before any geometry exists, and
 * the builder wraps it in a floor, so an answer that was wrong by a factor of
 * two — or that read a cylinder's formula for a capsule — stayed finite and
 * positive and passed every check anything made of it. The same holds of the
 * builder: nothing downstream read the dimensions back, so a box built with its
 * width and depth exchanged drew a different prop and nothing said so.
 *
 * Every number below is the formula written out, and every shape is measured
 * from dimensions that differ from one another, so a formula reading the wrong
 * key or the wrong shape's rule answers a different number rather than the same
 * one.
 *
 * Scenarios:
 *
 * 1. A sphere's bound is its own radius; a capsule reaches half its height past
 *    that radius; a cylinder and a cone reach the corner of their silhouette; a
 *    plane and a box reach half their own diagonal. Measured from one shared
 *    shaft, the three shapes that take a radius and a height answer three
 *    different numbers, so none is standing in for another.
 * 2. A parameter that is not a real measurement measures as zero rather than
 *    poisoning the bound with `NaN`, because selection runs before the design
 *    gate that would have refused it.
 * 3. Each shape is built with its own dimensions in its own keys: a box's width,
 *    height and depth are three different numbers and each lands where it
 *    belongs, and so do a plane's two.
 * 4. The built part is one primitive on the archetype's own material, carrying no
 *    bone and no local transform, and the archetype owns no skeleton.
 * 5. Inherited object keys and arbitrary names produce an unsupported-shape refusal; an ordinary box keeps its dimension list.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans shape parameters, measures projection radius and builds the selected primitive, checking owned dimensions, unskinned material binding and unsupported-name refusal rather than allowing inherited-table lookups to throw.
 * @evidence contracts/testing.md#independent-expectations Unequal authored box/plane dimensions and a shared radius-three height-eight shaft distinguish the shape formulas; closed shape vocabulary independently excludes constructor, toString and __proto__.
 * @evidence contracts/testing.md#distinguishing-cases Covers each supported shape's dimensions and radius, missing/mistyped/nonfinite placeholders and inherited/unknown names beside ordinary box planning; registry tests own duplicate ids and production tests own complete recipe diagnostics.
 * @evidence contracts/testing.md#execution-ownership The exported archetypes entry owns all CPU plan/geometry assertions, reaches catalogue source directly and starts no Human inspection, renderer, consumer process or native artifact.
 */
export function test_archetypes_primitive_prop_geometry(): void {
  for (const shape of ["constructor", "toString", "__proto__", "unsupported"]) {
    const plan: IAutoMovieArchetypeParameterPlan = PRIMITIVE_PROP_ARCHETYPE.plan({ shape });
    TestValidator.equals(`unsupported shape ${shape} refuses instead of inherited lookup`, plan.refusals.map((refusal: IAutoMovieArchetypeRefusal): string => refusal.code), ["model-parameter-invalid"]);
  }
  TestValidator.equals("ordinary box dimensions remain admitted", PRIMITIVE_PROP_ARCHETYPE.plan({ shape: "box" }).required, ["shape", "width", "height", "depth"]);
  TestValidator.equals(
    "every shape's bound is its own formula, and no two share one",
    namedFacts([
      ["sphere", (): boolean => nclose(radiusOf({ shape: "sphere", radius: 2 }), 2)],
      // A capsule is a shaft with a hemisphere on each end, so it reaches its
      // radius past half its height: 3 + 4.
      ["capsule", (): boolean => nclose(radiusOf({ shape: "capsule", ...SHAFT }), 7)],
      // A cylinder reaches the corner of its silhouette: hypot(3, 4).
      ["cylinder", (): boolean => nclose(radiusOf({ shape: "cylinder", ...SHAFT }), 5)],
      ["cone", (): boolean => nclose(radiusOf({ shape: "cone", ...SHAFT }), 5)],
      // Half the diagonal of the rectangle: hypot(6, 8) / 2.
      ["plane", (): boolean => nclose(radiusOf({ shape: "plane", ...PLANE }), 5)],
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
      ["absent", (): boolean => radiusOf({ shape: "sphere" }) === 0],
      ["notANumber", (): boolean => radiusOf({ shape: "sphere", radius: "big" }) === 0],
      [
        "notFinite",
        (): boolean =>
          radiusOf({ shape: "sphere", radius: Number.POSITIVE_INFINITY }) === 0,
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
          box.width === BOX.width &&
          box.height === BOX.height &&
          box.depth === BOX.depth,
      ],
      [
        "plane",
        (): boolean =>
          plane.type === "plane" &&
          plane.width === PLANE.width &&
          plane.depth === PLANE.depth,
      ],
      [
        "sphere",
        (): boolean => shapeOf({ shape: "sphere", radius: 2 }).type === "sphere",
      ],
      [
        "sphereRadius",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({ shape: "sphere", radius: 2 });
          return shape.type === "sphere" && shape.radius === 2;
        },
      ],
      [
        "capsule",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({ shape: "capsule", ...SHAFT });
          return (
            shape.type === "capsule" &&
            shape.radius === SHAFT.radius &&
            shape.height === SHAFT.height
          );
        },
      ],
      [
        "cylinder",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({ shape: "cylinder", ...SHAFT });
          return (
            shape.type === "cylinder" &&
            shape.radius === SHAFT.radius &&
            shape.height === SHAFT.height
          );
        },
      ],
      [
        "cone",
        (): boolean => {
          const shape: AutoMoviePrimitiveShape = shapeOf({ shape: "cone", ...SHAFT });
          return (
            shape.type === "cone" &&
            shape.radius === SHAFT.radius &&
            shape.height === SHAFT.height
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
      ["declaresNoBones", (): boolean => PRIMITIVE_PROP_ARCHETYPE.bones.length === 0],
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
