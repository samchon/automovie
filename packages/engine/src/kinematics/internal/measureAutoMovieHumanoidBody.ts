import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { physicalShapeBoundsImplementation } from "../../physics/internal/physicalShapeBoundsImplementation";
import { physicalShapeHull } from "../../physics/internal/physicalShapeHull";
import { AutoMovieHumanoidNeutralBounds } from "./AutoMovieHumanoidNeutralBounds";
import { resolveAutoMovieHumanoidSurfaces } from "./resolveAutoMovieHumanoidSurfaces";

/*
 * Sequential measure and surface derivation share only exact neutral bounds.
 */
export namespace measureAutoMovieHumanoidBody {
  /*
   * Execute the operation without merging a callable with this namespace.
   */
  export const run = measureHumanoidBodyRun;
  /*
   * Derive measure then surfaces with one synchronous unchanged-profile scope.
   * Bound preparation performs no shape work before its original observation;
   * source geometry must remain unchanged for the duration of this call. Both
   * returned records retain their ordinary independent ownership.
   */
  export function withSurfaces(
    skeleton: IAutoMovieSkeleton,
    profile: IAutoMoviePhysicalProfile,
  ): {
    measure: IAutoMovieBodyMeasure;
    surfaces: IAutoMovieHumanoidSurfaces.ISurfaces;
  } {
    const neutral: AutoMovieHumanoidNeutralBounds.IPrepared =
      AutoMovieHumanoidNeutralBounds.prepare(profile);
    try {
      const measure: IAutoMovieBodyMeasure = measureAutoMovieHumanoidBody.run(
        skeleton,
        profile,
        neutral,
      );
      const surfaces: IAutoMovieHumanoidSurfaces.ISurfaces =
        resolveAutoMovieHumanoidSurfaces.run(skeleton, profile, neutral);
      return { measure, surfaces };
    } finally {
      AutoMovieHumanoidNeutralBounds.release(neutral);
    }
  }
}

/*
 * Read the anthropometric measure of a canonical humanoid from its rig and
 * physical profile at rest, whatever produced them: a generated Human, a
 * parametric humanoid or an imported character.
 *
 * The rig must be in the canonical VRM 1.0 frame at its T-pose rest (+Y up,
 * facing +Z, the left toward +X, the floor at Y = 0). Heights and spacings are
 * read from rest joint centres (sides averaged); segment lengths are
 * joint-to-joint distances; the stature, the head radius, the foot extents
 * (over the foot and, when the profile jointed them, the toes), the chest
 * extents and the limb radii are read from the colliders of the matching
 * profile segments by their exact axis bounds at rest (`physicalShapeBounds`).
 * The hand runs from the wrist to the farthest point along the forearm of the
 * hand segment's colliders and its finger segments' when the profile has them,
 * the middle fingertip. A limb radius is the largest sphere or capsule radius
 * on its segment, or half the smaller transverse extent of a box. The eye
 * height falls back to the head joint when the rig has no eyes.
 * Parameter skeleton: The canonical rig.
 * Parameter profile: Its physical profile, segments keyed by rig bones.
 * Parameter neutral: Optional genuine internal bounds epoch for this unchanged
 * profile; withSurfaces owns its preparation and release.
 * Returns: The measure, metres and kilograms.
 * When a bone or segment the measure needs is missing.
 */
function measureHumanoidBodyRun(
  skeleton: IAutoMovieSkeleton,
  profile: IAutoMoviePhysicalProfile,
  neutral?: AutoMovieHumanoidNeutralBounds.IPrepared,
): IAutoMovieBodyMeasure {
  const segments: Map<string, IAutoMoviePhysicalSegment> = new Map();
  for (const part of profile.segments)
    if (!segments.has(part.bone)) segments.set(part.bone, part);
  const extents: Map<
    IAutoMoviePhysicalSegment,
    ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds>
  > = new Map();
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const bone of skeleton.bones as IAutoMovieBone[])
    rest.set(
      bone.bone,
      AutoMovieEngineVector3.add(
        bone.parent === null ? AutoMovieEngineVector3.create(0, 0, 0) : rest.get(bone.parent)!,
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
  ): number => AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(at(a), at(b)));
  const segment: (name: AutoMovieHumanoidBone) => IAutoMoviePhysicalSegment = (
    name: AutoMovieHumanoidBone,
  ): IAutoMoviePhysicalSegment => {
    const s: IAutoMoviePhysicalSegment | undefined = segments.get(name);
    if (s === undefined) throw new Error(`The humanoid profile lacks ${name}`);
    return s;
  };
  const segmentBounds: (
    s: IAutoMoviePhysicalSegment,
  ) => ReturnType<
    typeof physicalShapeBoundsImplementation.physicalShapeBounds
  > = (
    s: IAutoMoviePhysicalSegment,
  ): ReturnType<
    typeof physicalShapeBoundsImplementation.physicalShapeBounds
  > => {
    const known:
      | ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds>
      | undefined = extents.get(s);
    if (known !== undefined) return known;
    const out: ReturnType<
      typeof physicalShapeBoundsImplementation.physicalShapeBounds
    > = AutoMovieHumanoidNeutralBounds.read(profile, s, neutral);
    extents.set(s, out);
    return out;
  };
  const bounds: (
    name: AutoMovieHumanoidBone,
  ) => ReturnType<
    typeof physicalShapeBoundsImplementation.physicalShapeBounds
  > = (
    name: AutoMovieHumanoidBone,
  ): ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds> =>
    segmentBounds(segment(name));
  const radius = (name: AutoMovieHumanoidBone): number =>
    Math.max(
      ...segment(name).shapes.map((shape: IAutoMoviePhysicalShape): number => {
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
          const hull: IAutoMoviePhysicalHullFaces.IHull =
            physicalShapeHull(shape);
          let width: number = Infinity;
          for (const face of hull.faces) {
            let back: number = Infinity;
            for (const vertex of hull.vertices)
              back = Math.min(back, AutoMovieEngineVector3.dot(face.normal, vertex));
            width = Math.min(width, face.offset - back);
          }
          return width / 2;
        }
        shape satisfies never;
        throw new Error("Unknown physical shape kind");
      }),
    );
  let top: number = -Infinity;
  for (const part of profile.segments)
    top = Math.max(top, segmentBounds(part).max.y);
  const head: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
    bounds("head");
  const chest: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
    bounds("chest");
  const hand = (side: "left" | "right"): number => {
    const wrist: IAutoMovieVector3 = at(bone(side, "Hand"));
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(wrist, at(bone(side, "LowerArm"))),
    );
    // The hand's colliders and, when the profile has them, its fingers'.
    const parts: AutoMovieHumanoidBone[] = [
      bone(side, "Hand"),
      ...profile.segments
        .map(
          (x: IAutoMoviePhysicalSegment): AutoMovieHumanoidBone =>
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
              AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract({ x, y, z }, wrist), axis),
            );
    }
    return far;
  };
  // Length, heel and breadth read the same foot/toe union; keep its numeric
  // bounds once rather than rebuilding that fixed union for every measure.
  const feet: Map<
    "left" | "right",
    ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds>
  > = new Map();
  const foot: (
    side: "left" | "right",
  ) => ReturnType<
    typeof physicalShapeBoundsImplementation.physicalShapeBounds
  > = (
    side: "left" | "right",
  ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
    const known:
      | ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds>
      | undefined = feet.get(side);
    if (known !== undefined) return known;
    const rear: { min: IAutoMovieVector3; max: IAutoMovieVector3 } = bounds(
      bone(side, "Foot"),
    );
    if (!segments.has(bone(side, "Toes"))) {
      feet.set(side, rear);
      return rear;
    }
    const toes: { min: IAutoMovieVector3; max: IAutoMovieVector3 } = bounds(
      bone(side, "Toes"),
    );
    const extent: ReturnType<
      typeof physicalShapeBoundsImplementation.physicalShapeBounds
    > = {
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
    feet.set(side, extent);
    return extent;
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
