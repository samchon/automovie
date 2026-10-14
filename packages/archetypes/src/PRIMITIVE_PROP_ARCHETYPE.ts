import { IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieArchetypeParameters } from "./AutoMovieArchetypeParameters";
import { IAutoMovieArchetypeBuildInput } from "./IAutoMovieArchetypeBuildInput";
import { IAutoMovieArchetypeGeometry } from "./IAutoMovieArchetypeGeometry";
import { IAutoMovieArchetypeParameterPlan } from "./IAutoMovieArchetypeParameterPlan";
import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";
import { numberOf } from "./numberOf";
import { numberParameter } from "./numberParameter";
import { stringParameter } from "./stringParameter";

/** Dimension keys each supported shape consumes, and no others. */
const DIMENSIONS: Readonly<Record<string, readonly string[]>> = {
  box: ["width", "height", "depth"],
  sphere: ["radius"],
  capsule: ["radius", "height"],
  cylinder: ["radius", "height"],
  cone: ["radius", "height"],
  plane: ["width", "depth"],
};

/**
 * The catalogue's static single primitive: one shape and its own dimensions.
 *
 * `shape` discriminates the parameter map, so the plan below narrows both the
 * required and the accepted keys to the ones that shape actually consumes. A
 * dimension the selected shape ignores is refused rather than stored, because a
 * stored value nothing reads is a claim the render never honours.
 * Metre dimensions are admitted by the production design gate before build;
 * planning treats inherited object keys as unsupported shape names. Radius
 * queries do fixed arithmetic over at most three dimensions, while build
 * allocates one part and shape. The module-owned schema and definition are
 * shared through registries; each plan and geometry result is newly allocated.
 *
 * @author Samchon
 */
export const PRIMITIVE_PROP_ARCHETYPE: IAutoMovieModelArchetype = {
  id: "primitive-prop",
  capabilities: [],
  bones: [],
  parameters: {
    shape: { kind: "string" },
    width: { kind: "number", minimum: 0.001, maximum: 100 },
    height: { kind: "number", minimum: 0.001, maximum: 100 },
    depth: { kind: "number", minimum: 0.001, maximum: 100 },
    radius: { kind: "number", minimum: 0.001, maximum: 50 },
  },
  plan: (
    parameters: AutoMovieArchetypeParameters,
  ): IAutoMovieArchetypeParameterPlan => {
    const shape: string | null =
      typeof parameters.shape === "string" ? parameters.shape : null;
    const dimensions: readonly string[] | undefined =
      shape !== null && Object.hasOwn(DIMENSIONS, shape)
        ? DIMENSIONS[shape]
        : undefined;
    return {
      required: ["shape", ...(dimensions ?? [])],
      accepted: dimensions === undefined ? null : ["shape", ...dimensions],
      refusals:
        shape !== null && dimensions === undefined
          ? [
              {
                code: "model-parameter-invalid",
                message: `Primitive-prop shape "${shape}" is unsupported. Use box, sphere, capsule, cylinder, cone, or plane in the tracked model recipe record.`,
              },
            ]
          : [],
    };
  },
  projectionRadius: (parameters: AutoMovieArchetypeParameters): number =>
    projectionRadius(parameters),
  build: (input: IAutoMovieArchetypeBuildInput): IAutoMovieArchetypeGeometry =>
    build(input),
};

/**
 * Measure the accepted primitive's enclosing radius in metres without building a part. The formulas enclose each shape in exact arithmetic; binary64 sums and hypot are not rounded outward. Ungated missing/nonfinite dimensions read as zero through numberOf, so their answer is a placeholder; very large finite malformed dimensions may still overflow a radius sum. At most three dimension reads and fixed arithmetic allocate only one call-local reader closure.
 */
const projectionRadius: (parameters: AutoMovieArchetypeParameters) => number = (
  parameters: AutoMovieArchetypeParameters,
): number => {
  const shape: AutoMovieArchetypeParameters[string] = parameters.shape;
  const number: (key: string) => number = (key: string): number =>
    numberOf(parameters, key);
  if (shape === "sphere") return number("radius");
  if (shape === "capsule") return number("radius") + number("height") / 2;
  if (shape === "cylinder" || shape === "cone")
    return Math.hypot(number("radius"), number("height") / 2);
  if (shape === "plane")
    return Math.hypot(number("width"), number("depth")) / 2;
  return Math.hypot(number("width"), number("height"), number("depth")) / 2;
};

/** Build one fresh unskinned part with the accepted shape dimensions and compiler-owned material id; the skeleton id is unused because this catalogue member has no bones. */
const build: (
  input: IAutoMovieArchetypeBuildInput,
) => IAutoMovieArchetypeGeometry = (
  input: IAutoMovieArchetypeBuildInput,
): IAutoMovieArchetypeGeometry => ({
  skeleton: null,
  parts: [
    {
      id: "primitive",
      name: "primitive",
      geometry: {
        type: "primitive",
        shape: shapeOf(
          input.parameters,
          stringParameter(input.parameters, "shape"),
        ),
      },
      material: input.material,
      attachedBone: null,
      transform: null,
    },
  ],
});

/** Copy only the selected shape's dimensions from a gated map; the final plane branch relies on plan having refused unsupported shape names. Returned shape records are fresh and retain no parameter-map reference. */
const shapeOf: (
  parameters: AutoMovieArchetypeParameters,
  shape: string,
) => Extract<
  IAutoMovieModelPart["geometry"],
  { type: "primitive" }
>["shape"] = (
  parameters: AutoMovieArchetypeParameters,
  shape: string,
): Extract<IAutoMovieModelPart["geometry"], { type: "primitive" }>["shape"] => {
  if (shape === "box")
    return {
      type: "box",
      width: numberParameter(parameters, "width"),
      height: numberParameter(parameters, "height"),
      depth: numberParameter(parameters, "depth"),
    };
  if (shape === "sphere")
    return { type: "sphere", radius: numberParameter(parameters, "radius") };
  if (shape === "capsule")
    return {
      type: "capsule",
      radius: numberParameter(parameters, "radius"),
      height: numberParameter(parameters, "height"),
    };
  if (shape === "cylinder")
    return {
      type: "cylinder",
      radius: numberParameter(parameters, "radius"),
      height: numberParameter(parameters, "height"),
    };
  if (shape === "cone")
    return {
      type: "cone",
      radius: numberParameter(parameters, "radius"),
      height: numberParameter(parameters, "height"),
    };
  return {
    type: "plane",
    width: numberParameter(parameters, "width"),
    depth: numberParameter(parameters, "depth"),
  };
};
