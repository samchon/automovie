import {
  Quaternion,
  Vector3,
  combinePhysicalMassProperties,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

/**
 * Human's physical profile moved onto the canonical humanoid rig: the
 * reflection from Human's registered frame, the arms' T-pose and the merge of
 * Human-only segments into the rig bone that carries them.
 *
 * Every Human segment frame is reflected by `(x, y, z) -> (z, y, x)` and then
 * moved by the rigid map its joint underwent while the arms were straightened.
 * Segments of joints the humanoid vocabulary lacks (atlas, scapula, subtalar,
 * midfoot) merge into their carrier by the parallel-axis theorem
 * (`combinePhysicalMassProperties`) and their shapes into the carrier's
 * frame. Joints between merged segments are dropped; the rest move their
 * frames into their carrier's frame, and each physical axis follows the
 * reflection: a rotation about a reflected frame's axis is the reflected
 * rotation about the image axis with its sense reversed, so x and z exchange,
 * every limit reverses and the coordinate sign flips, which keeps every
 * clinical channel's meaning. The body's centre of mass is recomputed at the
 * T-pose.
 */
export namespace AutoMovieHumanCanonicalProfile {
  /** A rigid map `x -> rotation x + translation`, metres. */
  export interface IRigid {
    /** Rotation. */
    rotation: IAutoMovieQuaternion;

    /** Translation, metres. */
    translation: IAutoMovieVector3;
  }

  /**
   * Convert a Human profile.
   *
   * @param source Human's profile at its neutral, registered frame.
   * @param carrier The rig bone carrying every Human joint.
   * @param rigid The canonical-frame rigid map each Human joint underwent into the T-pose.
   * @returns The canonical profile, segments keyed by rig bones.
   */
  export function convert(
    source: P,
    carrier: ReadonlyMap<string, AutoMovieHumanoidBone>,
    rigid: ReadonlyMap<string, IRigid>,
  ): P {
    const frame: Map<string, P.ITransform> = new Map();
    for (const s of source.segments) {
      const g: IRigid = rigid.get(s.bone)!;
      frame.set(s.bone, {
        position: Vector3.add(
          Quaternion.rotateVector(g.rotation, reflect(s.neutral.position)),
          g.translation,
        ),
        rotation: Quaternion.multiply(g.rotation, reflectRotation(s.neutral.rotation)),
      });
    }
    const local = (bone: string): P.ITransform =>
      compose(inverse(frame.get(carrier.get(bone)!)!), frame.get(bone)!);
    const owners: AutoMovieHumanoidBone[] = [
      ...new Set(source.segments.map((s: P.ISegment): AutoMovieHumanoidBone => carrier.get(s.bone)!)),
    ];
    const segments: P.ISegment[] = owners.map((owner: AutoMovieHumanoidBone): P.ISegment => {
      const members: P.ISegment[] = source.segments.filter(
        (s: P.ISegment): boolean => carrier.get(s.bone) === owner,
      );
      const parts: combinePhysicalMassProperties.IPart[] = members.map(
        (s: P.ISegment): combinePhysicalMassProperties.IPart => {
          const x: P.ITransform = local(s.bone);
          return {
            mass: s.mass,
            centerOfMass: apply(x, reflect(s.centerOfMass)),
            inertia: s.inertia,
            inertiaRotation: Quaternion.multiply(x.rotation, reflectRotation(s.inertiaRotation)),
          };
        },
      );
      const mass: combinePhysicalMassProperties.IPart =
        parts.length === 1 ? parts[0]! : combinePhysicalMassProperties(parts);
      return {
        bone: owner,
        neutral: frame.get(owner)!,
        mass: mass.mass,
        centerOfMass: mass.centerOfMass,
        inertia: mass.inertia,
        inertiaRotation: mass.inertiaRotation,
        shapes: members.flatMap((s: P.ISegment): P.IShape[] => {
          const x: P.ITransform = local(s.bone);
          return s.shapes.map(
            (shape: P.IShape): P.IShape => ({
              ...shape,
              id: s.bone === owner ? shape.id : `${s.bone}.${shape.id}`,
              transform: compose(x, reflectTransform(shape.transform)),
            }),
          );
        }),
      };
    });
    const joints: P.IJoint[] = source.joints
      .filter((j: P.IJoint): boolean => carrier.get(j.parent) !== carrier.get(j.child))
      .map(
        (j: P.IJoint): P.IJoint => ({
          id: j.id,
          parent: carrier.get(j.parent)!,
          child: carrier.get(j.child)!,
          parentFrame: compose(local(j.parent), reflectTransform(j.parentFrame)),
          childFrame: compose(local(j.child), reflectTransform(j.childFrame)),
          axes: j.axes.map(
            (a: P.IAxis): P.IAxis => ({
              ...a,
              axis: a.axis === "x" ? "z" : a.axis === "z" ? "x" : "y",
              minimum: -a.maximum,
              maximum: -a.minimum,
              coordinateSign: (a.coordinateSign ?? 1) === 1 ? -1 : 1,
            }),
          ),
        }),
      );
    const pairs: Map<string, { a: string; b: string; reason: string }> = new Map();
    for (const e of source.collisionExclusions ?? []) {
      const a: string = carrier.get(e.a)!;
      const b: string = carrier.get(e.b)!;
      if (a === b) continue;
      const key: string = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!pairs.has(key)) pairs.set(key, { a, b, reason: e.reason });
    }
    const total: number = segments.reduce((sum: number, s: P.ISegment): number => sum + s.mass, 0);
    return {
      id: source.id,
      mass: total,
      centerOfMass: segments.reduce(
        (sum: IAutoMovieVector3, s: P.ISegment): IAutoMovieVector3 =>
          Vector3.add(sum, Vector3.scale(apply(s.neutral, s.centerOfMass), s.mass / total)),
        Vector3.create(0, 0, 0),
      ),
      segments,
      joints,
      collisionExclusions: [...pairs.values()],
      materials: source.materials,
      provenance: `${source.provenance} Reflected into the canonical VRM frame at its T-pose rest; Human-only segments merged into their carrier bones.`,
    };
  }

  /** The reflection `(x, y, z) -> (z, y, x)` from Human's frame to the canonical one. */
  export function reflect(v: IAutoMovieVector3): IAutoMovieVector3 {
    return { x: v.z, y: v.y, z: v.x };
  }

  /** A rotation conjugated by the reflection: its axis reflects and its sense reverses. */
  export function reflectRotation(q: IAutoMovieQuaternion): IAutoMovieQuaternion {
    return { x: -q.z, y: -q.y, z: -q.x, w: q.w };
  }
}

/** A local transform conjugated by the reflection. */
function reflectTransform(t: P.ITransform): P.ITransform {
  return {
    position: AutoMovieHumanCanonicalProfile.reflect(t.position),
    rotation: AutoMovieHumanCanonicalProfile.reflectRotation(t.rotation),
  };
}

/** `a ∘ b`: apply b, then a. */
function compose(a: P.ITransform, b: P.ITransform): P.ITransform {
  return { position: apply(a, b.position), rotation: Quaternion.multiply(a.rotation, b.rotation) };
}

/** The inverse rigid transform. */
function inverse(t: P.ITransform): P.ITransform {
  const rotation: IAutoMovieQuaternion = Quaternion.inverse(t.rotation);
  return { position: Vector3.scale(Quaternion.rotateVector(rotation, t.position), -1), rotation };
}

/** A point under a rigid transform. */
function apply(t: P.ITransform, p: IAutoMovieVector3): IAutoMovieVector3 {
  return Vector3.add(t.position, Quaternion.rotateVector(t.rotation, p));
}
