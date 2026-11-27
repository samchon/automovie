import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { physicalShapeHull } from "./physicalShapeHull";

/*
 * Collect every range, reference, mass and tree defect before simulation. This
 * gate never repairs inputs. Mass/centre comparisons allow 1e-8 relative
 * floating-point accumulation; length is in metres. Reference searches and
 * ancestor walks can be quadratic in the declared segment/joint population.
 */
export function validatePhysicalProfile(
  profile: IAutoMoviePhysicalProfile,
): string[] {
  const errors: string[] = [];
  const fail: (ok: boolean, path: string) => void = (
    ok: boolean,
    path: string,
  ): void => {
    if (!ok) errors.push(path);
  };
  const rotation: (q: IAutoMovieQuaternion) => boolean = (
    q: IAutoMovieQuaternion,
  ): boolean => Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) <= 1e-6;
  const transform: (t: IAutoMovieRigidTransform, path: string) => void = (
    t: IAutoMovieRigidTransform,
    path: string,
  ): void => fail(rotation(t.rotation), `${path}.rotation`);
  fail(profile.id.trim().length > 0, "id");
  fail(profile.mass > 0, "mass");
  fail(profile.provenance.trim().length > 0, "provenance");
  fail(profile.segments.length > 0, "segments");
  const materials: Set<string> = new Set();
  for (const [i, material] of profile.materials.entries()) {
    const path: string = `materials[${i}]`;
    fail(
      material.id.trim().length > 0 && !materials.has(material.id),
      `${path}.id`,
    );
    materials.add(material.id);
    fail(material.friction >= 0 && material.friction <= 1, `${path}.friction`);
    fail(
      material.restitution >= 0 && material.restitution <= 1,
      `${path}.restitution`,
    );
    fail(material.compliance >= 0, `${path}.compliance`);
    fail(
      material.compliance === 0 || material.maximumCompression! > 0,
      `${path}.maximumCompression`,
    );
    fail(material.damping >= 0, `${path}.damping`);
  }
  const bones: Set<string> = new Set();
  let mass: number = 0;
  let moment: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const [i, segment] of profile.segments.entries()) {
    const path: string = `segments[${i}]`;
    fail(
      segment.bone.trim().length > 0 && !bones.has(segment.bone),
      `${path}.bone`,
    );
    bones.add(segment.bone);
    fail(segment.mass > 0, `${path}.mass`);
    fail(rotation(segment.inertiaRotation), `${path}.inertiaRotation`);
    const inertia: IAutoMovieVector3 = segment.inertia;
    fail(
      inertia.x > 0 &&
        inertia.y > 0 &&
        inertia.z > 0 &&
        inertia.x <= inertia.y + inertia.z &&
        inertia.y <= inertia.x + inertia.z &&
        inertia.z <= inertia.x + inertia.y,
      `${path}.inertia`,
    );
    transform(segment.neutral, `${path}.neutral`);
    fail(segment.shapes.length > 0, `${path}.shapes`);
    const shapes: Set<string> = new Set();
    // The simulation-only colliders are admitted as the shapes are, their
    // ids unique across both lists.
    const lists: IShapeList[] = [
      { key: "shapes", shapes: segment.shapes },
      { key: "contactShapes", shapes: segment.contactShapes ?? [] },
    ];
    for (const list of lists)
      for (const [j, shape] of list.shapes.entries()) {
        const location: string = `${path}.${list.key}[${j}]`;
        fail(
          shape.id.trim().length > 0 && !shapes.has(shape.id),
          `${location}.id`,
        );
        shapes.add(shape.id);
        fail(materials.has(shape.material), `${location}.material`);
        transform(shape.transform, `${location}.transform`);
        let hull: IAutoMoviePhysicalHullFaces.IHull | null = null;
        if (shape.kind === "box")
          fail(
            shape.halfExtents.x > 0 &&
              shape.halfExtents.y > 0 &&
              shape.halfExtents.z > 0,
            `${location}.halfExtents`,
          );
        else if (shape.kind === "sphere" || shape.kind === "capsule") {
          fail(shape.radius > 0, `${location}.radius`);
          if (shape.kind === "capsule")
            fail(shape.halfLength >= 0, `${location}.halfLength`);
        } else {
          // Convex by contract: the points span a volume and none lies inside.
          hull = shape.points.length >= 4 ? physicalShapeHull(shape) : null;
          fail(
            hull !== null &&
              hull.faces.length >= 4 &&
              hull.buried <= hull.tolerance,
            `${location}.points`,
          );
        }
        const material: IAutoMoviePhysicalMaterial | undefined =
          profile.materials.find(
            (candidate: IAutoMoviePhysicalMaterial): boolean =>
              candidate.id === shape.material,
          );
        if (material && material.compliance > 0)
          fail(
            shape.kind === "box"
              ? material.maximumCompression! <
                  Math.min(
                    shape.halfExtents.x,
                    shape.halfExtents.y,
                    shape.halfExtents.z,
                  )
              : shape.kind === "hull"
                ? hull !== null && hull.depth > material.maximumCompression!
                : shape.radius > material.maximumCompression!,
            `${location}.rigidCore`,
          );
      }
    mass += segment.mass;
    moment = Vector3.add(
      moment,
      Vector3.scale(
        Vector3.add(
          segment.neutral.position,
          Quaternion.rotateVector(
            segment.neutral.rotation,
            segment.centerOfMass,
          ),
        ),
        segment.mass,
      ),
    );
  }
  fail(
    Math.abs(mass - profile.mass) <= 1e-8 * Math.max(1, profile.mass),
    "mass: segment sum",
  );
  const exclusions: Set<string> = new Set();
  for (const [index, exclusion] of (
    profile.collisionExclusions ?? []
  ).entries()) {
    const key: string = JSON.stringify(
      [exclusion.a, exclusion.b].sort((a: string, b: string): number =>
        a.localeCompare(b),
      ),
    );
    fail(
      bones.has(exclusion.a) &&
        bones.has(exclusion.b) &&
        exclusion.a !== exclusion.b &&
        exclusion.reason.trim().length > 0 &&
        !exclusions.has(key),
      `collisionExclusions[${index}]`,
    );
    exclusions.add(key);
  }
  if (mass > 0)
    fail(
      Vector3.length(
        Vector3.subtract(Vector3.scale(moment, 1 / mass), profile.centerOfMass),
      ) <= 1e-8,
      "centerOfMass: segment sum",
    );
  const parents: Map<string, string> = new Map();
  const ids: Set<string> = new Set();
  for (const [i, joint] of profile.joints.entries()) {
    const path: string = `joints[${i}]`;
    fail(joint.id.trim().length > 0 && !ids.has(joint.id), `${path}.id`);
    ids.add(joint.id);
    fail(bones.has(joint.parent), `${path}.parent`);
    fail(
      bones.has(joint.child) &&
        joint.child !== joint.parent &&
        !parents.has(joint.child),
      `${path}.child`,
    );
    parents.set(joint.child, joint.parent);
    transform(joint.parentFrame, `${path}.parentFrame`);
    transform(joint.childFrame, `${path}.childFrame`);
    const parent: IAutoMoviePhysicalSegment | undefined = profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        segment.bone === joint.parent,
    );
    const child: IAutoMoviePhysicalSegment | undefined = profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        segment.bone === joint.child,
    );
    if (parent && child) {
      const first: IAutoMovieVector3 = Vector3.add(
        parent.neutral.position,
        Quaternion.rotateVector(
          parent.neutral.rotation,
          joint.parentFrame.position,
        ),
      );
      const second: IAutoMovieVector3 = Vector3.add(
        child.neutral.position,
        Quaternion.rotateVector(
          child.neutral.rotation,
          joint.childFrame.position,
        ),
      );
      fail(
        Vector3.length(Vector3.subtract(first, second)) <= 1e-8,
        `${path}.neutralAnchors`,
      );
    }
    const axes: Set<string> = new Set();
    // A sequential chart names each joint-frame axis once.
    if (joint.order !== undefined)
      fail(
        joint.order.length === 3 && new Set(joint.order).size === 3,
        `${path}.order`,
      );
    for (const [j, axis] of joint.axes.entries()) {
      const location: string = `${path}.axes[${j}]`;
      fail(!axes.has(axis.axis), `${location}.axis`);
      axes.add(axis.axis);
      fail(
        axis.minimum >= -Math.PI &&
          axis.maximum <= Math.PI &&
          axis.minimum <= axis.maximum,
        `${location}.limits`,
      );
      fail(axis.stiffness >= 0, `${location}.stiffness`);
      fail(axis.damping >= 0, `${location}.damping`);
      fail(
        axis.passiveDamping === undefined || axis.passiveDamping >= 0,
        `${location}.passiveDamping`,
      );
      fail(axis.maximumTorque > 0, `${location}.maximumTorque`);
      fail(
        axis.reverseTorque === undefined || axis.reverseTorque > 0,
        `${location}.reverseTorque`,
      );
      fail(axis.channel.trim().length > 0, `${location}.channel`);
      if (axis.sourceDomain !== undefined) {
        const sign: number = axis.coordinateSign ?? 1;
        const low: number = sign === 1 ? axis.minimum : -axis.maximum;
        const high: number = sign === 1 ? axis.maximum : -axis.minimum;
        fail(
          axis.sourceDomain.minimum <= low && high <= axis.sourceDomain.maximum,
          `${location}.sourceDomain`,
        );
      }
    }
  }
  const roots: string[] = [...bones].filter(
    (bone: string): boolean => !parents.has(bone),
  );
  fail(roots.length === 1, "joints: exactly one root");
  for (const bone of bones) {
    const visited: Set<string> = new Set();
    let current: string | undefined = bone;
    while (current !== undefined && !visited.has(current)) {
      visited.add(current);
      current = parents.get(current);
    }
    fail(current === undefined, `joints: cycle at ${bone}`);
  }
  return errors;
}

/*
 * One of a segment's collider lists with the key its defects are reported
 * under.
 */
interface IShapeList {
  /*
   * The list's field name in the segment.
   */
  key: string;

  /*
   * The list's colliders.
   */
  shapes: readonly IAutoMoviePhysicalShape[];
}
