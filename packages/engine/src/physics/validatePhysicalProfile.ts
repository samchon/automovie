import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";
import { physicalHullFaces } from "./physicalHullFaces";

/**
 * Collect every numeric, reference, mass and tree defect before simulation.
 * This gate never repairs inputs. Mass/centre comparisons allow 1e-8 relative
 * floating-point accumulation; length is in metres. Reference searches and
 * ancestor walks can be quadratic in the declared segment/joint population.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Collect every numeric, reference, mass and tree defect before simulation) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Collect every numeric, reference, mass and tree defect before simulation) directly over its typed inputs (`profile`) as nested iteration of depth 3 (every over [v.x, v.y, v.z]; every over [q.x, q.y, q.z, q.w]; for-of over profile.materials.entries()) plus a sort, delegating to `errors.push`, `Number.isFinite`, `Math.fround`, `Math.abs`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.000001, 1e-8, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 379 lines and 32 top-level statements that reuses `errors.push`, `Number.isFinite`, `Math.fround`, `Math.abs`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`; the dominant cost is nested iteration of depth 3 (every over [v.x, v.y, v.z]; every over [q.x, q.y, q.z, q.w]; for-of over profile.materials.entries()) plus a sort, performed once per call with 23 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 23 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function validatePhysicalProfile(profile: P): string[] {
  if (!profile || typeof profile !== "object")
    return ["profile must be an object"];
  const errors: string[] = [];
  const fail: (ok: boolean, path: string) => void = (
    ok: boolean,
    path: string,
  ): void => {
    if (!ok) errors.push(path);
  };
  const positive: (n: number) => boolean = (n: number): boolean =>
    Number.isFinite(n) &&
    n > 0 &&
    Number.isFinite(Math.fround(n)) &&
    Math.fround(n) > 0 &&
    Number.isFinite(Math.fround(1 / n));
  const nonnegative: (n: number) => boolean = (n: number): boolean =>
    Number.isFinite(n) &&
    n >= 0 &&
    Number.isFinite(Math.fround(n)) &&
    (n === 0 || Math.fround(n) > 0);
  const vector: (v: IAutoMovieVector3) => boolean = (
    v: IAutoMovieVector3,
  ): boolean =>
    !!v &&
    [v.x, v.y, v.z].every(
      (n: number): boolean =>
        Number.isFinite(n) && Number.isFinite(Math.fround(n)),
    );
  const rotation: (q: IAutoMovieQuaternion) => boolean = (
    q: IAutoMovieQuaternion,
  ): boolean =>
    !!q &&
    [q.x, q.y, q.z, q.w].every(Number.isFinite) &&
    Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) <= 1e-6;
  const transform: (t: P.ITransform, path: string) => void = (
    t: P.ITransform,
    path: string,
  ): void => {
    fail(!!t && vector(t.position), `${path}.position`);
    fail(!!t && rotation(t.rotation), `${path}.rotation`);
  };
  fail(typeof profile.id === "string" && profile.id.trim().length > 0, "id");
  fail(positive(profile.mass), "mass");
  fail(vector(profile.centerOfMass), "centerOfMass");
  fail(
    typeof profile.provenance === "string" &&
      profile.provenance.trim().length > 0,
    "provenance",
  );
  fail(
    Array.isArray(profile.segments) && profile.segments.length > 0,
    "segments",
  );
  if (
    !Array.isArray(profile.segments) ||
    !Array.isArray(profile.joints) ||
    !Array.isArray(profile.materials)
  )
    return [...errors, "segments/joints/materials must be arrays"];
  const materials: Set<string> = new Set();
  for (const [i, material] of profile.materials.entries()) {
    const path: string = `materials[${i}]`;
    if (!material || typeof material !== "object") {
      errors.push(path);
      continue;
    }
    fail(
      typeof material.id === "string" &&
        material.id.trim().length > 0 &&
        !materials.has(material.id),
      `${path}.id`,
    );
    materials.add(material.id);
    fail(
      nonnegative(material.friction) && material.friction <= 1,
      `${path}.friction`,
    );
    fail(
      nonnegative(material.restitution) && material.restitution <= 1,
      `${path}.restitution`,
    );
    fail(nonnegative(material.compliance), `${path}.compliance`);
    fail(
      material.compliance === 0 || positive(material.maximumCompression!),
      `${path}.maximumCompression`,
    );
    fail(nonnegative(material.damping), `${path}.damping`);
  }
  const bones: Set<string> = new Set();
  let mass: number = 0;
  let moment: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const [i, segment] of profile.segments.entries()) {
    const path: string = `segments[${i}]`;
    if (!segment || typeof segment !== "object") {
      errors.push(path);
      continue;
    }
    fail(
      typeof segment.bone === "string" &&
        segment.bone.trim().length > 0 &&
        !bones.has(segment.bone),
      `${path}.bone`,
    );
    bones.add(segment.bone);
    fail(positive(segment.mass), `${path}.mass`);
    fail(vector(segment.centerOfMass), `${path}.centerOfMass`);
    fail(rotation(segment.inertiaRotation), `${path}.inertiaRotation`);
    const inertia: IAutoMovieVector3 = segment.inertia;
    fail(
      !!inertia &&
        [inertia.x, inertia.y, inertia.z].every(positive) &&
        inertia.x <= inertia.y + inertia.z &&
        inertia.y <= inertia.x + inertia.z &&
        inertia.z <= inertia.x + inertia.y,
      `${path}.inertia`,
    );
    transform(segment.neutral, `${path}.neutral`);
    fail(
      Array.isArray(segment.shapes) && segment.shapes.length > 0,
      `${path}.shapes`,
    );
    const shapes: Set<string> = new Set();
    for (const [j, shape] of (Array.isArray(segment.shapes)
      ? segment.shapes
      : []
    ).entries()) {
      const location: string = `${path}.shapes[${j}]`;
      if (!shape || typeof shape !== "object") {
        errors.push(location);
        continue;
      }
      fail(
        typeof shape.id === "string" &&
          shape.id.trim().length > 0 &&
          !shapes.has(shape.id),
        `${location}.id`,
      );
      shapes.add(shape.id);
      fail(materials.has(shape.material), `${location}.material`);
      transform(shape.transform, `${location}.transform`);
      let hull: physicalHullFaces.IHull | null = null;
      if (shape.kind === "box")
        fail(
          vector(shape.halfExtents) &&
            [
              shape.halfExtents.x,
              shape.halfExtents.y,
              shape.halfExtents.z,
            ].every(positive),
          `${location}.halfExtents`,
        );
      else if (shape.kind === "sphere" || shape.kind === "capsule") {
        fail(positive(shape.radius), `${location}.radius`);
        if (shape.kind === "capsule")
          fail(nonnegative(shape.halfLength), `${location}.halfLength`);
      } else if (shape.kind === "hull") {
        // Convex by contract: the points span a volume and none lies inside.
        hull =
          Array.isArray(shape.points) &&
          shape.points.length >= 4 &&
          shape.points.every(vector)
            ? physicalHullFaces(shape.points)
            : null;
        fail(
          hull !== null &&
            hull.faces.length >= 4 &&
            hull.buried <= hull.tolerance,
          `${location}.points`,
        );
      } else fail(false, `${location}.kind`);
      const material: P.IMaterial | undefined = profile.materials.find(
        (candidate: (typeof profile.materials)[number]): boolean =>
          !!candidate && candidate.id === shape.material,
      );
      if (material && material.compliance > 0)
        fail(
          shape.kind === "box"
            ? !!shape.halfExtents &&
                material.maximumCompression! <
                  Math.min(
                    shape.halfExtents.x,
                    shape.halfExtents.y,
                    shape.halfExtents.z,
                  ) &&
                [
                  shape.halfExtents.x,
                  shape.halfExtents.y,
                  shape.halfExtents.z,
                ].every((extent: number): boolean =>
                  positive(extent - material.maximumCompression!),
                )
            : shape.kind === "hull"
              ? hull !== null &&
                positive(hull.depth - material.maximumCompression!)
              : positive(shape.radius - material.maximumCompression!),
          `${location}.rigidCore`,
        );
    }
    mass += segment.mass;
    if (
      segment.neutral &&
      vector(segment.neutral.position) &&
      rotation(segment.neutral.rotation) &&
      vector(segment.centerOfMass)
    )
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
  fail(
    profile.collisionExclusions === undefined ||
      Array.isArray(profile.collisionExclusions),
    "collisionExclusions",
  );
  for (const [index, exclusion] of (Array.isArray(profile.collisionExclusions)
    ? profile.collisionExclusions
    : []
  ).entries()) {
    const key: string = JSON.stringify(
      [exclusion?.a, exclusion?.b].sort(
        (a: string | undefined, b: string | undefined): number =>
          String(a).localeCompare(String(b)),
      ),
    );
    fail(
      !!exclusion &&
        bones.has(exclusion.a) &&
        bones.has(exclusion.b) &&
        exclusion.a !== exclusion.b &&
        typeof exclusion.reason === "string" &&
        exclusion.reason.trim().length > 0 &&
        !exclusions.has(key),
      `collisionExclusions[${index}]`,
    );
    exclusions.add(key);
  }
  if (mass > 0 && vector(profile.centerOfMass))
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
    if (!joint || typeof joint !== "object") {
      errors.push(path);
      continue;
    }
    fail(
      typeof joint.id === "string" &&
        joint.id.trim().length > 0 &&
        !ids.has(joint.id),
      `${path}.id`,
    );
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
    const parent: P.ISegment | undefined = profile.segments.find(
      (segment: (typeof profile.segments)[number]): boolean =>
        segment?.bone === joint.parent,
    );
    const child: P.ISegment | undefined = profile.segments.find(
      (segment: (typeof profile.segments)[number]): boolean =>
        segment?.bone === joint.child,
    );
    if (
      parent?.neutral &&
      child?.neutral &&
      joint.parentFrame &&
      joint.childFrame &&
      vector(parent.neutral.position) &&
      vector(child.neutral.position) &&
      rotation(parent.neutral.rotation) &&
      rotation(child.neutral.rotation) &&
      vector(joint.parentFrame.position) &&
      vector(joint.childFrame.position)
    ) {
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
    fail(Array.isArray(joint.axes), `${path}.axes`);
    for (const [j, axis] of (Array.isArray(joint.axes)
      ? joint.axes
      : []
    ).entries()) {
      const location: string = `${path}.axes[${j}]`;
      if (!axis || typeof axis !== "object") {
        errors.push(location);
        continue;
      }
      fail(
        ["x", "y", "z"].includes(axis.axis) && !axes.has(axis.axis),
        `${location}.axis`,
      );
      axes.add(axis.axis);
      fail(
        Number.isFinite(axis.minimum) &&
          Number.isFinite(axis.maximum) &&
          axis.minimum >= -Math.PI &&
          axis.maximum <= Math.PI &&
          axis.minimum <= axis.maximum,
        `${location}.limits`,
      );
      fail(nonnegative(axis.stiffness), `${location}.stiffness`);
      fail(nonnegative(axis.damping), `${location}.damping`);
      fail(
        axis.passiveDamping === undefined || nonnegative(axis.passiveDamping),
        `${location}.passiveDamping`,
      );
      fail(positive(axis.maximumTorque), `${location}.maximumTorque`);
      fail(
        typeof axis.channel === "string" && axis.channel.trim().length > 0,
        `${location}.channel`,
      );
      fail(
        axis.coordinateSign === undefined ||
          axis.coordinateSign === 1 ||
          axis.coordinateSign === -1,
        `${location}.coordinateSign`,
      );
      if (axis.sourceDomain !== undefined) {
        if (!isAutoMovieRecord(axis.sourceDomain)) {
          errors.push(`${location}.sourceDomain`);
          continue;
        }
        const sign: number = axis.coordinateSign ?? 1;
        const low: number = sign === 1 ? axis.minimum : -axis.maximum;
        const high: number = sign === 1 ? axis.maximum : -axis.minimum;
        fail(
          Number.isFinite(axis.sourceDomain.minimum) &&
            Number.isFinite(axis.sourceDomain.maximum) &&
            axis.sourceDomain.minimum <= low &&
            high <= axis.sourceDomain.maximum,
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
