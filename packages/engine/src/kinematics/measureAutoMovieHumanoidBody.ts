import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "../physics/physicalHullFaces";
import { physicalShapeBounds } from "../physics/physicalShapeBounds";

/**
 * Read the anthropometric measure of a canonical humanoid from its rig and
 * physical profile at rest, whatever produced them: a generated Human, a
 * parametric humanoid or an imported character.
 *
 * The rig must be in the canonical VRM 1.0 frame at its T-pose rest (+Y up,
 * facing +Z, the left toward +X, the floor at Y = 0). Heights and spacings are
 * read from rest joint centres (sides averaged); segment lengths are
 * joint-to-joint distances; the stature, the head radius, the foot extents
 * (over the foot and, when the profile jointed them, the toes), the chest
 * extents and the limb radii are read from the colliders of the
 * matching profile segments by their exact axis bounds at rest
 * (`physicalShapeBounds`). The hand runs from the wrist to the farthest point
 * along the forearm of the hand segment's colliders and its finger segments'
 * when the profile has them, the middle fingertip. A limb radius is the
 * largest sphere or capsule radius on its segment, or half the smaller
 * transverse extent of a box. The eye height falls back to the head joint
 * when the rig has no eyes.
 *
 * @param skeleton The canonical rig.
 * @param profile Its physical profile, segments keyed by rig bones.
 * @returns The measure, metres and kilograms.
 * @throws {Error} When a bone or segment the measure needs is missing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame premise, where each family of measures is read and the fallbacks.
 * @evidence contracts/development/implementation.md#principled-implementation Joint-centre anthropometry on the rest rig and exact collider bounds, the segment definitions of Winter ch. 4.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass for rest positions, then direct reads per measure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone or segment throws rather than being guessed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones plus colliders.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and retains nothing.
 */
export function measureAutoMovieHumanoidBody(
  skeleton: IAutoMovieSkeleton,
  profile: P,
): IAutoMovieBodyMeasure {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const bone of skeleton.bones as IAutoMovieBone[])
    rest.set(
      bone.bone,
      Vector3.add(
        bone.parent === null ? Vector3.create(0, 0, 0) : rest.get(bone.parent)!,
        bone.rest.translation,
      ),
    );
  const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 | undefined = rest.get(bone);
    if (p === undefined) throw new Error(`The humanoid lacks ${bone}`);
    return p;
  };
  const sides = (read: (side: "left" | "right") => number): number =>
    (read("left") + read("right")) / 2;
  const bone = (side: string, name: string): AutoMovieHumanoidBone =>
    `${side}${name}` as AutoMovieHumanoidBone;
  const distance = (
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): number => Vector3.length(Vector3.subtract(at(a), at(b)));
  const segment = (name: AutoMovieHumanoidBone): P.ISegment => {
    const s: P.ISegment | undefined = profile.segments.find(
      (x: P.ISegment): boolean => x.bone === name,
    );
    if (s === undefined) throw new Error(`The humanoid profile lacks ${name}`);
    return s;
  };
  const bounds = (
    name: AutoMovieHumanoidBone,
  ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
    const s: P.ISegment = segment(name);
    const out: { min: IAutoMovieVector3; max: IAutoMovieVector3 } = {
      min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity },
    };
    for (const shape of s.shapes) {
      const b: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
        physicalShapeBounds(s.neutral, shape);
      for (const k of ["x", "y", "z"] as const) {
        out.min[k] = Math.min(out.min[k], b.min[k]);
        out.max[k] = Math.max(out.max[k], b.max[k]);
      }
    }
    return out;
  };
  const radius = (name: AutoMovieHumanoidBone): number =>
    Math.max(
      ...segment(name).shapes.map((shape: P.IShape): number => {
        if (shape.kind === "box")
          return Math.min(
            shape.halfExtents.x,
            shape.halfExtents.y,
            shape.halfExtents.z,
          );
        if (shape.kind === "sphere" || shape.kind === "capsule")
          return shape.radius;
        if (shape.kind === "hull") {
          // Half the hull's least width: the narrowest slab between a face
          // plane and the vertex farthest behind it.
          const hull: physicalHullFaces.IHull = physicalHullFaces(shape.points);
          return (
            Math.min(
              ...hull.faces.map(
                (face: physicalHullFaces.IFace): number =>
                  face.offset -
                  Math.min(
                    ...hull.vertices.map((vertex: IAutoMovieVector3): number =>
                      Vector3.dot(face.normal, vertex),
                    ),
                  ),
              ),
            ) / 2
          );
        }
        shape satisfies never;
        throw new Error("Unknown physical shape kind");
      }),
    );
  const top: number = Math.max(
    ...profile.segments.flatMap((s: P.ISegment): number[] =>
      s.shapes.map(
        (shape: P.IShape): number =>
          physicalShapeBounds(s.neutral, shape).max.y,
      ),
    ),
  );
  const head: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
    bounds("head");
  const chest: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
    bounds("chest");
  const hand = (side: "left" | "right"): number => {
    const wrist: IAutoMovieVector3 = at(bone(side, "Hand"));
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(wrist, at(bone(side, "LowerArm"))),
    );
    // The hand's colliders and, when the profile has them, its fingers'.
    const parts: AutoMovieHumanoidBone[] = [
      bone(side, "Hand"),
      ...profile.segments
        .map(
          (x: P.ISegment): AutoMovieHumanoidBone =>
            x.bone as AutoMovieHumanoidBone,
        )
        .filter(
          (x: AutoMovieHumanoidBone): boolean =>
            x.startsWith(side) && /(Thumb|Index|Middle|Ring|Little)/.test(x),
        ),
    ];
    let far: number = 0;
    for (const part of parts) {
      const b: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
        bounds(part);
      for (const x of [b.min.x, b.max.x])
        for (const y of [b.min.y, b.max.y])
          for (const z of [b.min.z, b.max.z])
            far = Math.max(
              far,
              Vector3.dot(Vector3.subtract({ x, y, z }, wrist), axis),
            );
    }
    return far;
  };
  // The foot's extents span the toes too when the profile gives them their own segment.
  const foot = (
    side: "left" | "right",
  ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
    const rear: { min: IAutoMovieVector3; max: IAutoMovieVector3 } = bounds(
      bone(side, "Foot"),
    );
    if (
      !profile.segments.some(
        (x: P.ISegment): boolean => x.bone === bone(side, "Toes"),
      )
    )
      return rear;
    const toes: { min: IAutoMovieVector3; max: IAutoMovieVector3 } = bounds(
      bone(side, "Toes"),
    );
    return {
      min: {
        x: Math.min(rear.min.x, toes.min.x),
        y: Math.min(rear.min.y, toes.min.y),
        z: Math.min(rear.min.z, toes.min.z),
      },
      max: {
        x: Math.max(rear.max.x, toes.max.x),
        y: Math.max(rear.max.y, toes.max.y),
        z: Math.max(rear.max.z, toes.max.z),
      },
    };
  };
  const eyes: boolean = rest.has("leftEye") && rest.has("rightEye");
  return {
    stature: top,
    mass: profile.mass,
    hipHeight: sides(
      (s: "left" | "right"): number => at(bone(s, "UpperLeg")).y,
    ),
    hipHalfWidth: distance("leftUpperLeg", "rightUpperLeg") / 2,
    waistHeight: at("spine").y,
    chestHeight: at("chest").y,
    neckHeight: at("neck").y,
    headHeight: at("head").y,
    eyeHeight: eyes ? (at("leftEye").y + at("rightEye").y) / 2 : at("head").y,
    headRadius:
      Math.min(
        head.max.x - head.min.x,
        head.max.y - head.min.y,
        head.max.z - head.min.z,
      ) / 2,
    shoulderHeight: sides(
      (s: "left" | "right"): number => at(bone(s, "UpperArm")).y,
    ),
    shoulderHalfWidth: distance("leftUpperArm", "rightUpperArm") / 2,
    upperArm: sides((s: "left" | "right"): number =>
      distance(bone(s, "UpperArm"), bone(s, "LowerArm")),
    ),
    forearm: sides((s: "left" | "right"): number =>
      distance(bone(s, "LowerArm"), bone(s, "Hand")),
    ),
    hand: sides(hand),
    thigh: sides((s: "left" | "right"): number =>
      distance(bone(s, "UpperLeg"), bone(s, "LowerLeg")),
    ),
    shank: sides((s: "left" | "right"): number =>
      distance(bone(s, "LowerLeg"), bone(s, "Foot")),
    ),
    ankleHeight: sides((s: "left" | "right"): number => at(bone(s, "Foot")).y),
    footLength: sides(
      (s: "left" | "right"): number => foot(s).max.z - foot(s).min.z,
    ),
    heel: sides(
      (s: "left" | "right"): number => at(bone(s, "Foot")).z - foot(s).min.z,
    ),
    footBreadth: sides(
      (s: "left" | "right"): number => foot(s).max.x - foot(s).min.x,
    ),
    chestDepth: chest.max.z - chest.min.z,
    chestBreadth: chest.max.x - chest.min.x,
    upperArmRadius: sides((s: "left" | "right"): number =>
      radius(bone(s, "UpperArm")),
    ),
    forearmRadius: sides((s: "left" | "right"): number =>
      radius(bone(s, "LowerArm")),
    ),
    thighRadius: sides((s: "left" | "right"): number =>
      radius(bone(s, "UpperLeg")),
    ),
    shankRadius: sides((s: "left" | "right"): number =>
      radius(bone(s, "LowerLeg")),
    ),
  };
}
