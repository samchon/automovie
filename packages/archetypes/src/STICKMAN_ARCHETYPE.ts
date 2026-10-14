import { Quaternion } from "@automovie/engine/math/Quaternion";
import { IAutoMovieModel, IAutoMovieModelPart, IAutoMovieTransform } from "@automovie/interface";
import { IAutoMovieArchetypeBuildInput } from "./IAutoMovieArchetypeBuildInput";
import { IAutoMovieArchetypeGeometry } from "./IAutoMovieArchetypeGeometry";
import { IAutoMovieArchetypeParameterPlan } from "./IAutoMovieArchetypeParameterPlan";
import { AutoMovieArchetypeParameters } from "./AutoMovieArchetypeParameters";
import { IAutoMovieModelArchetype } from "./IAutoMovieModelArchetype";
import { numberOf } from "./numberOf";
import { numberParameter } from "./numberParameter";
/**
 * The catalogue's articulated figure: one height-driven primitive rig.
 *
 * Height sets bone offsets and most dimensions; independent headRadius and limbRadius parameters set thickness and lower bounds on torso and arm lengths. The same three dimensions reproduce the same geometry. This upright figure is registered like any other catalogue entry.
 *
 * Dimensions are conventional metre proportions for this schematic catalogue, not measured Human anatomy. The design gate admits the three dimensions before build. Projection radius encloses every part around the model root under bone rotations, using rest-chain lengths, local offsets and primitive enclosing spheres from this same builder. Build emits thirteen bones and thirteen primitive parts in fixed order, allocating fresh geometry while retaining no recipe state.
 *
 * @author Samchon
 */
export const STICKMAN_ARCHETYPE: IAutoMovieModelArchetype = {
  id: "stickman",
  capabilities: ["signal"],
  bones: [
    "hips",
    "spine",
    "head",
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
    "leftUpperLeg",
    "leftLowerLeg",
    "rightUpperLeg",
    "rightLowerLeg",
  ],
  parameters: {
    height: { kind: "number", minimum: 0.5, maximum: 3 },
    headRadius: { kind: "number", minimum: 0.05, maximum: 0.5 },
    limbRadius: { kind: "number", minimum: 0.01, maximum: 0.25 },
  },
  plan: (): IAutoMovieArchetypeParameterPlan => ({
    required: ["height", "headRadius", "limbRadius"],
    accepted: null,
    refusals: [],
  }),
  projectionRadius: (parameters: AutoMovieArchetypeParameters): number => projectionRadius(parameters),
  build: (input: IAutoMovieArchetypeBuildInput): IAutoMovieArchetypeGeometry => build(input),
};

/**
 * Apply the triangle inequality to ancestral rest-offset lengths, part-local offsets and primitive radii to enclose generated parts around the model root for any unit bone rotations in exact arithmetic. Binary64 sums and hypot are not rounded outward. Geometry comes from the same build owner, so independent head/limb changes enter the measurement.
 *
 * Missing or nonfinite ungated parameters read as zero; out-of-range arithmetic is only a placeholder. Two thirteen-row scans and one fixed-size build allocate fresh temporary records with no cache or persistent geometry.
 */
const projectionRadius: (parameters: AutoMovieArchetypeParameters) => number = (parameters: AutoMovieArchetypeParameters): number => {
  const geometry: IAutoMovieArchetypeGeometry = build({
    parameters: {
      height: numberOf(parameters, "height"),
      headRadius: numberOf(parameters, "headRadius"),
      limbRadius: numberOf(parameters, "limbRadius"),
    },
    // Identity metadata does not enter the geometric bound and is never emitted.
    material: "",
    skeleton: "",
  });
  const reach: Map<string, number> = new Map();
  for (const bone of geometry.skeleton!.bones) {
    const offset: IAutoMovieTransform["translation"] = bone.rest.translation;
    reach.set(bone.bone, (bone.parent === null ? 0 : reach.get(bone.parent)!) + Math.hypot(offset.x, offset.y, offset.z));
  }
  let radius: number = 0;
  for (const part of geometry.parts) {
    if (part.geometry.type !== "primitive")
      throw new Error("Stickman radius requires its generated primitive geometry.");
    const shape: Extract<IAutoMovieModelPart["geometry"], { type: "primitive" }>["shape"] = part.geometry.shape;
    let primitiveRadius: number;
    if (shape.type === "box") primitiveRadius = Math.hypot(shape.width, shape.height, shape.depth) / 2;
    else if (shape.type === "sphere") primitiveRadius = shape.radius;
    else if (shape.type === "capsule") primitiveRadius = shape.radius + shape.height / 2;
    else throw new Error(`Stickman radius has no enclosing bound for ${shape.type}.`);
    const offset: IAutoMovieTransform["translation"] | undefined = part.transform?.translation;
    const offsetRadius: number = offset === undefined ? 0 : Math.hypot(offset.x, offset.y, offset.z);
    radius = Math.max(radius, reach.get(part.attachedBone!)! + offsetRadius + primitiveRadius);
  }
  return radius;
};

/** Assemble conventional height-derived parts from an admitted map and compiler-owned ids. The local part factory shares this call's material; none of its fresh records retain the parameter map. */
const build: (input: IAutoMovieArchetypeBuildInput) => IAutoMovieArchetypeGeometry = (
  input: IAutoMovieArchetypeBuildInput,
): IAutoMovieArchetypeGeometry => {
  const height: number = numberParameter(input.parameters, "height");
  const headRadius: number = numberParameter(input.parameters, "headRadius");
  const limbRadius: number = numberParameter(input.parameters, "limbRadius");
  /** One fresh material-bound primitive attached to its declared bone and local placement. */
  const part: (
    id: string,
    bone: IAutoMovieModelPart["attachedBone"],
    shape: Extract<IAutoMovieModelPart["geometry"], { type: "primitive" }>["shape"],
    local: IAutoMovieModelPart["transform"],
  ) => IAutoMovieModelPart = (
    id: string,
    bone: IAutoMovieModelPart["attachedBone"],
    shape: Extract<
      IAutoMovieModelPart["geometry"],
      { type: "primitive" }
    >["shape"],
    local: IAutoMovieModelPart["transform"],
  ): IAutoMovieModelPart => ({
    id,
    name: id,
    geometry: { type: "primitive", shape },
    material: input.material,
    attachedBone: bone,
    transform: local,
  });
  const torsoHeight: number = Math.max(headRadius * 2, height * 0.3);
  const upperLimb: number = Math.max(limbRadius * 2, height * 0.15);
  const lowerLimb: number = Math.max(limbRadius * 2, height * 0.14);
  return {
    skeleton: skeletonOf(input.skeleton, height),
    parts: [
      part(
        "pelvis",
        "hips",
        {
          type: "box",
          width: height * 0.19,
          height: height * 0.12,
          depth: height * 0.11,
        },
        transform(0, 0, 0),
      ),
      part(
        "torso",
        "spine",
        {
          type: "box",
          width: height * 0.25,
          height: torsoHeight,
          depth: height * 0.12,
        },
        transform(0, torsoHeight * 0.22, 0),
      ),
      part("head", "head", { type: "sphere", radius: headRadius }, null),
      ...(["left", "right"] as const).flatMap((side: "left" | "right"): IAutoMovieModelPart[] => {
        const sign: number = side === "left" ? 1 : -1;
        return [
          part(
            `${side}-upper-arm`,
            `${side}UpperArm`,
            {
              type: "capsule",
              radius: limbRadius,
              height: upperLimb,
            },
            horizontal(sign * upperLimb * 0.55),
          ),
          part(
            `${side}-lower-arm`,
            `${side}LowerArm`,
            {
              type: "capsule",
              radius: limbRadius * 0.85,
              height: lowerLimb,
            },
            horizontal(sign * lowerLimb * 0.55),
          ),
          part(
            `${side}-hand`,
            `${side}Hand`,
            { type: "sphere", radius: limbRadius * 1.05 },
            null,
          ),
          part(
            `${side}-thigh`,
            `${side}UpperLeg`,
            {
              type: "capsule",
              radius: limbRadius * 1.15,
              height: height * 0.19,
            },
            transform(0, -height * 0.105, 0),
          ),
          part(
            `${side}-shin`,
            `${side}LowerLeg`,
            {
              type: "capsule",
              radius: limbRadius,
              height: height * 0.19,
            },
            transform(0, -height * 0.105, 0),
          ),
        ];
      }),
    ],
  };
};

/** Construct the thirteen-bone conventional rest tree in metres, with symmetric X offsets and no ROM constraints; the caller owns every bone and transform. */
const skeletonOf: (id: string, height: number) => NonNullable<IAutoMovieModel["skeleton"]> = (
  id: string,
  height: number,
): NonNullable<IAutoMovieModel["skeleton"]> => {
  /** Copy one parent/name relation and metre rest offset into a new bone record. */
  const bone: (
    name: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["bone"],
    parent: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["parent"],
    x: number,
    y: number,
    z: number,
  ) => NonNullable<IAutoMovieModel["skeleton"]>["bones"][number] = (
    name: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["bone"],
    parent: NonNullable<IAutoMovieModel["skeleton"]>["bones"][number]["parent"],
    x: number,
    y: number,
    z: number,
  ): NonNullable<IAutoMovieModel["skeleton"]>["bones"][number] => ({
    bone: name,
    parent,
    rest: transform(x, y, z),
    constraint: null,
  });
  return {
    id,
    bones: [
      bone("hips", null, 0, height * 0.5, 0),
      bone("spine", "hips", 0, height * 0.18, 0),
      bone("head", "spine", 0, height * 0.24, 0),
      bone("leftUpperArm", "spine", height * 0.125, height * 0.15, 0),
      bone("leftLowerArm", "leftUpperArm", height * 0.17, 0, 0),
      bone("leftHand", "leftLowerArm", height * 0.16, 0, 0),
      bone("rightUpperArm", "spine", -height * 0.125, height * 0.15, 0),
      bone("rightLowerArm", "rightUpperArm", -height * 0.17, 0, 0),
      bone("rightHand", "rightLowerArm", -height * 0.16, 0, 0),
      bone("leftUpperLeg", "hips", height * 0.07, -height * 0.04, 0),
      bone("leftLowerLeg", "leftUpperLeg", 0, -height * 0.22, 0),
      bone("rightUpperLeg", "hips", -height * 0.07, -height * 0.04, 0),
      bone("rightLowerLeg", "rightUpperLeg", 0, -height * 0.22, 0),
    ],
  };
};

/** Create a unit-scale placement with a fresh translation and scale; an explicitly supplied quaternion is retained by reference within this build. */
const transform: (x: number, y: number, z: number, rotation?: IAutoMovieTransform["rotation"]) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
  rotation: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 },
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation,
  scale: { x: 1, y: 1, z: 1 },
});

/** Place a capsule along its side's horizontal arm axis, selecting the signed quarter-turn from its X offset. */
const horizontal: (x: number) => IAutoMovieTransform = (x: number): IAutoMovieTransform =>
  rotateZ(x < 0 ? 90 : -90, x, 0, 0);

/** Construct a right-handed Z-axis degree turn and a translated unit-scale placement in constant space. */
const rotateZ: (degrees: number, x: number, y: number, z: number) => IAutoMovieTransform = (
  degrees: number,
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform =>
  transform(x, y, z, Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, degrees));
