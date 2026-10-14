import {
  AutoMovieHumanoidBone,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/** Metres per millimetre: the one conversion from Human's measurement unit to the model's. */
const METRES_PER_MILLIMETRE: number = 0.001;

/**
 * Stick radii as fractions of stature, so the figure reads alike at any age: limbs and trunk, and the small bones (fingers, thumb, toes, eyes, jaw). Joint markers are a sphere of {@link MARKER_PER_STICK} stick radii. Grade: conventional display sizes.
 */
const STICK_RADIUS: Record<"large" | "small", number> = {
  large: 0.006,
  small: 0.0022,
};

/** Joint marker radius over its bone's stick radius. */
const MARKER_PER_STICK: number = 1.6;

/** Bones drawn with the small radius. */
const SMALL: RegExp = /(Thumb|Index|Middle|Ring|Little|Toes|Eye)|^jaw$/;

/**
 * Display colours, linear RGB: the midline grey, the person's left red and right blue, so left and right read at a glance from any view. Grade: conventional.
 */
const COLOURS: Record<"axial" | "left" | "right", [number, number, number]> = {
  axial: [0.75, 0.75, 0.75],
  left: [0.8, 0.22, 0.18],
  right: [0.18, 0.35, 0.85],
};

/**
 * Emit the stick figure of a skeleton: one capsule per bone from its joint centre to its tail, and a sphere marker at every joint centre, each rigidly attached to its bone.
 *
 * This is the stick stage of Human's output, superseded part by part by the skin from #2795 on. Every bone of the skeleton is drawn, fingers, thumbs, toes, eyes and jaw included, so proportions and joint placement can be judged in the viewer. Capsules shorter than two radii shrink their radius to a third of their length, so every capsule keeps a positive body. Bone-local frames equal the model frame at rest, so a part's transform is its offset from the joint centre and the rotation that turns the capsule's local +Y onto the bone.
 *
 * @param skeleton Resolved skeleton in the rest pose
 * @param stature Stature, millimetres, which sizes the sticks
 * @returns Parts and the three materials they cite
 */
export function emitAutoMovieHumanStick(
  skeleton: IAutoMovieHumanSkeleton,
  stature: number,
): emitAutoMovieHumanStick.IOutput {
  const parts: IAutoMovieModelPart[] = [];
  for (const joint of skeleton.joints) {
    const radius: number =
      (SMALL.test(joint.bone) ? STICK_RADIUS.small : STICK_RADIUS.large) *
      stature;
    const length: number = AutoMovieHumanVector.distance(joint.position, joint.tail);
    const stick: number = Math.min(radius, length / 3);
    const material: string = materialOf(joint.bone);
    parts.push({
      id: `${joint.bone}.joint`,
      name: `${joint.bone} joint`,
      geometry: {
        type: "primitive",
        shape: {
          type: "sphere",
          radius: MARKER_PER_STICK * radius * METRES_PER_MILLIMETRE,
        },
      },
      material,
      attachedBone: joint.bone,
      transform: null,
    });
    if (length === 0) continue;
    const direction: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.offset(joint.tail, [joint.position, -1]),
    );
    parts.push({
      id: `${joint.bone}.stick`,
      name: `${joint.bone} stick`,
      geometry: {
        type: "primitive",
        shape: {
          type: "capsule",
          radius: stick * METRES_PER_MILLIMETRE,
          height: (length - 2 * stick) * METRES_PER_MILLIMETRE,
        },
      },
      material,
      attachedBone: joint.bone,
      transform: {
        translation: {
          x: ((joint.tail.x - joint.position.x) / 2) * METRES_PER_MILLIMETRE,
          y: ((joint.tail.y - joint.position.y) / 2) * METRES_PER_MILLIMETRE,
          z: ((joint.tail.z - joint.position.z) / 2) * METRES_PER_MILLIMETRE,
        },
        rotation: alignUp(direction),
        scale: { x: 1, y: 1, z: 1 },
      },
    });
  }
  return {
    parts,
    materials: (["axial", "left", "right"] as const).map(
      (key: "axial" | "left" | "right"): IAutoMovieMaterial => {
        const [r, g, b]: [number, number, number] = COLOURS[key];
        return {
          id: `stick.${key}`,
          name: `stick ${key}`,
          baseColor: { r, g, b, a: null, hex: null },
          metallic: 0,
          roughness: 0.6,
          emissive: null,
          opacity: 1,
          baseColorTexture: null,
        };
      },
    ),
  };
}
export namespace emitAutoMovieHumanStick {
  /**
   * The stick figure.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** A joint marker and a stick per bone. */
    parts: IAutoMovieModelPart[];

    /** Midline, left and right materials. */
    materials: IAutoMovieMaterial[];
  }
}

/**
 * Material of a bone by side.
 *
 * @param bone Bone
 * @returns Material id
 */
function materialOf(bone: AutoMovieHumanoidBone): string {
  return bone.startsWith("left")
    ? "stick.left"
    : bone.startsWith("right")
      ? "stick.right"
      : "stick.axial";
}

/**
 * Rotation turning +Y onto a unit direction by the shortest arc.
 *
 * @param d Unit direction
 * @returns Unit quaternion
 */
function alignUp(d: IAutoMovieVector3): IAutoMovieQuaternion {
  const w: number = 1 + d.y;
  if (w < 1e-9) return { x: 1, y: 0, z: 0, w: 0 };
  // cross((0, 1, 0), d) = (d.z, 0, -d.x)
  const length: number = Math.hypot(d.z, d.x, w);
  return { x: d.z / length, y: 0, z: -d.x / length, w: w / length };
}
