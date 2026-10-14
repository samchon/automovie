import { STICKMAN_ARCHETYPE } from "../../../../packages/archetypes/src/STICKMAN_ARCHETYPE";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { type IAutoMovieModel, type IAutoMovieModelPart, type IAutoMovieVector3, type IAutoMovieSkeleton, type IAutoMovieBone, AutoMoviePrimitiveShape, AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose, vclose } from "../internal/predicates";
import type { IAutoMovieArchetypeGeometry } from "../../../../packages/archetypes/src/IAutoMovieArchetypeGeometry";
import type { IAutoMovieResolvedBone } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedBone";

/** The figure every case below reads, and the three numbers that shape it. */
const HEIGHT: number = 2;
const HEAD_RADIUS: number = 0.2;
const LIMB_RADIUS: number = 0.1;

const built: (parameters: { height: number; headRadius: number; limbRadius: number; }) => IAutoMovieArchetypeGeometry = (parameters: {
  height: number;
  headRadius: number;
  limbRadius: number;
}): IAutoMovieArchetypeGeometry =>
  STICKMAN_ARCHETYPE.build({
    parameters,
    material: "body",
    skeleton: "figure-rig",
  });

const figure: IAutoMovieArchetypeGeometry = built({
  height: HEIGHT,
  headRadius: HEAD_RADIUS,
  limbRadius: LIMB_RADIUS,
});

const skeleton: IAutoMovieSkeleton = figure.skeleton as NonNullable<IAutoMovieModel["skeleton"]>;

const boneOf: (name: string) => IAutoMovieBone | undefined = (name: string): IAutoMovieBone | undefined =>
  skeleton.bones.find((entry: IAutoMovieBone): boolean => entry.bone === name);

const partOf: (id: string) => IAutoMovieModelPart | undefined = (id: string): IAutoMovieModelPart | undefined =>
  figure.parts.find((part: IAutoMovieModelPart): boolean => part.id === id);

/** Read one existing primitive part's shape, throwing if it draws something else. */
const shapeOf: (id: string) => AutoMoviePrimitiveShape = (
  id: string,
): Extract<IAutoMovieModelPart["geometry"], { type: "primitive" }>["shape"] => {
  const part: IAutoMovieModelPart = partOf(id)!;
  if (part.geometry.type !== "primitive")
    throw new Error(`stickman part "${id}" is not a primitive`);
  return part.geometry.shape;
};

/** Where one bone rests relative to its parent. */
const restOf: (name: string) => IAutoMovieVector3 = (name: string): IAutoMovieVector3 =>
  boneOf(name)!.rest.translation;

/**
 * Every bone's parent, in the order the builder lists them.
 *
 * The parentage is the whole of what makes this a figure rather than thirteen loose transforms: an arm that hung off the hips instead of the spine would still have thirteen bones and still measure the same total height.
 */
const PARENTAGE: ReadonlyArray<readonly [string, string | null]> = [
  ["hips", null],
  ["spine", "hips"],
  ["head", "spine"],
  ["leftUpperArm", "spine"],
  ["leftLowerArm", "leftUpperArm"],
  ["leftHand", "leftLowerArm"],
  ["rightUpperArm", "spine"],
  ["rightLowerArm", "rightUpperArm"],
  ["rightHand", "rightLowerArm"],
  ["leftUpperLeg", "hips"],
  ["leftLowerLeg", "leftUpperLeg"],
  ["rightUpperLeg", "hips"],
  ["rightLowerLeg", "rightUpperLeg"],
];

/** Every part the builder emits, in the order it emits them. */
const PART_IDS: readonly string[] = [
  "pelvis",
  "torso",
  "head",
  "left-upper-arm",
  "left-lower-arm",
  "left-hand",
  "left-thigh",
  "left-shin",
  "right-upper-arm",
  "right-lower-arm",
  "right-hand",
  "right-thigh",
  "right-shin",
];

/** Which bone each of those parts rides. */
const PART_BONES: ReadonlyArray<readonly [string, string]> = [
  ["pelvis", "hips"],
  ["torso", "spine"],
  ["head", "head"],
  ["left-upper-arm", "leftUpperArm"],
  ["left-lower-arm", "leftLowerArm"],
  ["left-hand", "leftHand"],
  ["left-thigh", "leftUpperLeg"],
  ["left-shin", "leftLowerLeg"],
  ["right-upper-arm", "rightUpperArm"],
  ["right-lower-arm", "rightLowerArm"],
  ["right-hand", "rightHand"],
  ["right-thigh", "rightUpperLeg"],
  ["right-shin", "rightLowerLeg"],
];

/**
 * Build the schematic thirteen-bone stickman and check parentage, bilateral rest placement, primitive attachment and root-centered projection enclosure.
 *
 * Scenarios:
 * 1. The skeleton is the thirteen bones the archetype declares, in that order, each on the parent that makes the chain a body.
 * 2. The two sides of the rest pose mirror across `x` within the existing vector tolerance, and the arms leave the centre line.
 * 3. The parts are the thirteen the builder emits, in order, each riding its own bone and carrying the builder's material.
 * 4. The pelvis and torso boxes are wider than deep, the head is a sphere of the declared head radius, and the upper arm and shin are capsules of the declared limb radius.
 * 5. An arm is laid across the body rather than hanging from it: each upper arm is turned a quarter circle about `z`, in opposite senses left and right, while the head and hands ride their bones without a local transform.
 * 6. The model-root radius encloses independently transformed box corners, sphere support and capsule endpoint balls for twelve accepted dimension combinations at rest and two articulated poses.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls STICKMAN_ARCHETYPE.build/projectionRadius and resolvePose, inspecting ordered bones and parents, mirrored translations, part ids/attachments/materials, selected primitive radii and local quarter-turn components. Transformed box corners and sphere/capsule endpoint balls must remain within the model-root radius, exposing missing ancestral reach or primitive extent.
 * @evidence contracts/testing.md#independent-expectations Literal thirteen-row parent/part tables, authored dimensions, X reflection and quaternion components ±sqrt(1/2) determine the rig expectations under the existing nclose/vclose tolerances. Local support geometry is transformed through shared production Quaternion/Vector3 and resolved bone frames and compared with radius+1e-12, independently of the radius formula but not independently validating those shared transforms. Twelve dimension combinations at angles 0/43/-67 exercise enclosure without proving every pose or binary64 outward rounding.
 * @evidence contracts/testing.md#distinguishing-cases The default rig, twelve dimension combinations, three posed arm angles and an unreadable-height case expose omitted head/limb extent while allowing the existing readable-radius policy; this schematic archetype test supplies no Human anatomical asset or visual-quality judgment.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_archetypes_stickman_rig imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_archetypes_stickman_rig(): void {
  TestValidator.equals(
    "the skeleton is the declared thirteen bones on the parents that make a body",
    namedFacts([
      ["declared", (): boolean => STICKMAN_ARCHETYPE.bones.length === PARENTAGE.length],
      [
        "declaredOrder",
        (): boolean =>
          STICKMAN_ARCHETYPE.bones.join(",") ===
          PARENTAGE.map(([name]: readonly [string, string | null]): string => name).join(","),
      ],
      ["id", (): boolean => skeleton.id === "figure-rig"],
      [
        "builtOrder",
        (): boolean =>
          skeleton.bones.map((entry: IAutoMovieBone): string => entry.bone).join(",") ===
          PARENTAGE.map(([name]: readonly [string, string | null]): string => name).join(","),
      ],
      [
        "parentage",
        (): boolean =>
          PARENTAGE.every(([name, parent]: readonly [string, string | null]): boolean => boneOf(name)?.parent === parent),
      ],
      [
        "unconstrained",
        (): boolean => skeleton.bones.every((entry: IAutoMovieBone): boolean => entry.constraint === null),
      ],
    ]),
    {
      declared: true,
      declaredOrder: true,
      id: true,
      builtOrder: true,
      parentage: true,
      unconstrained: true,
    },
  );

  TestValidator.equals(
    "the two sides of the rest pose mirror across x",
    namedFacts([
      // The right side is the left side reflected, which is what makes a
      // mirrored sign a visible defect rather than a second plausible figure.
      [
        "mirrored",
        (): boolean =>
          (
            [
              ["leftUpperArm", "rightUpperArm"],
              ["leftLowerArm", "rightLowerArm"],
              ["leftHand", "rightHand"],
              ["leftUpperLeg", "rightUpperLeg"],
              ["leftLowerLeg", "rightLowerLeg"],
            ] as const
          ).every(([left, right]: readonly ["leftUpperArm", "rightUpperArm"] | readonly ["leftLowerArm", "rightLowerArm"] | readonly ["leftHand", "rightHand"] | readonly ["leftUpperLeg", "rightUpperLeg"] | readonly ["leftLowerLeg", "rightLowerLeg"]): boolean =>
            vclose(restOf(right), {
              x: -restOf(left).x,
              y: restOf(left).y,
              z: restOf(left).z,
            }),
          ),
      ],
      // And the arms really do leave the axis, or the mirror above would hold
      // of a figure whose limbs all stood on the centre line.
      ["armsLeaveTheAxis", (): boolean => restOf("leftUpperArm").x > 0],
    ]),
    {
      mirrored: true,
      armsLeaveTheAxis: true,
    },
  );

  TestValidator.equals(
    "the parts are the thirteen the builder emits, each on its own bone",
    namedFacts([
      ["count", (): boolean => figure.parts.length === PART_IDS.length],
      [
        "order",
        (): boolean =>
          figure.parts.map((part: IAutoMovieModelPart): string => part.id).join(",") === PART_IDS.join(","),
      ],
      [
        "bones",
        (): boolean =>
          PART_BONES.every(([id, bone]: readonly [string, string]): boolean => partOf(id)?.attachedBone === bone),
      ],
      [
        "material",
        (): boolean => figure.parts.every((part: IAutoMovieModelPart): boolean => part.material === "body"),
      ],
    ]),
    { count: true, order: true, bones: true, material: true },
  );

  const pelvis: AutoMoviePrimitiveShape = shapeOf("pelvis");
  const torso: AutoMoviePrimitiveShape = shapeOf("torso");
  const head: AutoMoviePrimitiveShape = shapeOf("head");
  const upperArm: AutoMoviePrimitiveShape = shapeOf("left-upper-arm");
  const shin: AutoMoviePrimitiveShape = shapeOf("left-shin");
  TestValidator.equals(
    "each part draws the dimensions its own parameters state",
    namedFacts([
      // A box wider than it is deep, so exchanging the two would show.
      [
        "wideNotDeep",
        (): boolean =>
          pelvis.type === "box" &&
          torso.type === "box" &&
          pelvis.width > pelvis.depth &&
          torso.width > torso.depth,
      ],
      [
        "head",
        (): boolean => head.type === "sphere" && nclose(head.radius, HEAD_RADIUS),
      ],
      [
        "upperArm",
        (): boolean =>
          upperArm.type === "capsule" && nclose(upperArm.radius, LIMB_RADIUS),
      ],
      [
        "shin",
        (): boolean => shin.type === "capsule" && nclose(shin.radius, LIMB_RADIUS),
      ],
    ]),
    {
      wideNotDeep: true,
      head: true,
      upperArm: true,
      shin: true,
    },
  );

  TestValidator.equals(
    "an arm is laid across the body, in opposite senses on the two sides",
    namedFacts([
      // A quarter turn about `z` is `(0, 0, sin(±45), cos(45))`, written out
      // rather than rebuilt through the same helper the builder used.
      [
        "leftTurned",
        (): boolean =>
          nclose(
            partOf("left-upper-arm")!.transform!.rotation.z,
            -Math.SQRT1_2,
          ) &&
          nclose(partOf("left-upper-arm")!.transform!.rotation.w, Math.SQRT1_2),
      ],
      [
        "rightTurned",
        (): boolean =>
          nclose(
            partOf("right-upper-arm")!.transform!.rotation.z,
            Math.SQRT1_2,
          ) &&
          nclose(
            partOf("right-upper-arm")!.transform!.rotation.w,
            Math.SQRT1_2,
          ),
      ],
      // The head and the hands ride their bones exactly.
      [
        "headAndHandsRideTheirBones",
        (): boolean =>
          partOf("head")!.transform === null &&
          partOf("left-hand")!.transform === null &&
          partOf("right-hand")!.transform === null,
      ],
    ]),
    {
      leftTurned: true,
      rightTurned: true,
      headAndHandsRideTheirBones: true,
    },
  );

  TestValidator.equals("signals remain advertised", STICKMAN_ARCHETYPE.capabilities.join(","), "signal");
  for (const height of [0.5, 2, 3])
    for (const headRadius of [0.05, 0.5])
      for (const limbRadius of [0.01, 0.25]) {
        const parameters: {height:number;headRadius:number;limbRadius:number} = {height,headRadius,limbRadius};
        const geometry: IAutoMovieArchetypeGeometry = built(parameters);
        const radius: number = STICKMAN_ARCHETYPE.projectionRadius(parameters);
        for (const angle of [0,43,-67]) {
          const bones: IAutoMovieResolvedBone[] = resolvePose({skeleton: geometry.skeleton!.id,root:null,joints:geometry.skeleton!.bones.map((bone: IAutoMovieBone): { bone: AutoMovieHumanoidBone; flexion: number; abduction: number; twist: number; } => ({bone:bone.bone,flexion:angle,abduction:angle,twist:-angle/2}))},geometry.skeleton!);
          for (const part of geometry.parts) {
            const bone: IAutoMovieResolvedBone = bones.find((candidate: IAutoMovieResolvedBone): boolean => candidate.bone === part.attachedBone)!;
            if (part.geometry.type !== "primitive") throw new Error("stickman enclosure fixture requires primitives");
            const shape: AutoMoviePrimitiveShape = part.geometry.shape;
            const world: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
              const placed: IAutoMovieVector3 = part.transform === null ? point : Vector3.add(part.transform.translation,Quaternion.rotateVector(part.transform.rotation,point));
              return Vector3.add(bone.worldPosition,Quaternion.rotateVector(bone.worldRotation,placed));
            };
            const check: (point: IAutoMovieVector3, padding: number) => void = (point:IAutoMovieVector3,padding:number):void => {
              const position:IAutoMovieVector3=world(point);
              const distance:number=Math.hypot(position.x,position.y,position.z)+padding;
              TestValidator.predicate(`model-root enclosure ${height}/${headRadius}/${limbRadius}/${angle}/${part.id}`, Number.isFinite(radius)&&distance<=radius+1e-12);
            };
            if(shape.type === "box")
              for(const x of [-shape.width/2,shape.width/2])
                for(const y of [-shape.height/2,shape.height/2])
                  for(const z of [-shape.depth/2,shape.depth/2]) check({x,y,z},0);
            else if(shape.type === "sphere") check({x:0,y:0,z:0},shape.radius);
            else if(shape.type === "capsule") {
              check({x:0,y:-shape.height/2,z:0},shape.radius);
              check({x:0,y:shape.height/2,z:0},shape.radius);
            } else throw new Error("stickman enclosure fixture lacks a primitive oracle");
          }
        }
      }
  TestValidator.predicate("unreadable height keeps readable head dimension in placeholder", Number.isFinite(STICKMAN_ARCHETYPE.projectionRadius({height:"tall",headRadius:HEAD_RADIUS,limbRadius:LIMB_RADIUS})) && STICKMAN_ARCHETYPE.projectionRadius({height:"tall",headRadius:HEAD_RADIUS,limbRadius:LIMB_RADIUS}) >= HEAD_RADIUS);
}
