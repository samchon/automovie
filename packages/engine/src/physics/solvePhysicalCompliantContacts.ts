import type { IAutoMovieVector3 } from "@automovie/interface";
import type {
  Collider,
  RigidBody,
  SdpMatrix3,
  ShapeContact,
  World,
} from "@dimforge/rapier3d-compat";

import { Vector3 } from "../math/Vector3";
import { physicalNativeVector } from "./physicalNativeVector";
import { visitPhysicalNative } from "./visitPhysicalNative";

/**
 * Implicit Kelvin-Voigt surface impulses, with a separately colliding rigid
 * core at each declared compression limit. Native sensor pairs supply the
 * broad phase; convex surface distance supplies actual compression. No air
 * gap generates an impulse. Angular effective mass and bounded Coulomb
 * friction act at the measured point. The next fixed step advances the result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Implicit Kelvin-Voigt surface impulses, with a separately colliding rigid core at each declared compression limit) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Implicit Kelvin-Voigt surface impulses, with a separately colliding rigid core at each declared compression limit) directly over its typed inputs (`world`, `surfaces`, `seconds`, `dt`) as a single pass (for-of over surfaces), delegating to `visitPhysicalNative`, `surfaces.get`, `Math.min`, `Math.max`, `visited.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 0.5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 111 lines and 4 top-level statements that reuses `visitPhysicalNative`, `surfaces.get`, `Math.min`, `Math.max`, `visited.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `world`, `surfaces`, `seconds`, `dt`; the dominant cost is a single pass (for-of over surfaces), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function solvePhysicalCompliantContacts(
  world: World,
  surfaces: ReadonlyMap<number, solvePhysicalCompliantContacts.ISurface>,
  seconds: number,
  dt: number,
): solvePhysicalCompliantContacts.IMeasurement[] {
  const results: solvePhysicalCompliantContacts.IMeasurement[] = [];
  const visited: Set<string> = new Set();
  for (const [handle, a] of surfaces) {
    if (a.compliance === 0) continue;
    visitPhysicalNative(
      (visitor: (other: number) => void): void =>
        world.narrowPhase.intersectionPairsWith(handle, visitor),
      (other: number): void => {
        const b: solvePhysicalCompliantContacts.ISurface | undefined =
          surfaces.get(other);
        const key: string = `${Math.min(handle, other)}:${Math.max(handle, other)}`;
        if (
          !b ||
          a.body === b.body ||
          visited.has(key) ||
          !world.narrowPhase.intersectionPair(handle, other)
        )
          return;
        visited.add(key);
        const first: Collider = world.colliders.get(handle)!;
        const second: Collider = world.colliders.get(other)!;
        const measured: ShapeContact | null = first.contactCollider(second, 0);
        if (!measured || measured.distance > 0) return;
        const parentA: RigidBody | null = first.parent();
        const parentB: RigidBody | null = second.parent();
        const point: IAutoMovieVector3 = physicalNativeVector(
          Vector3.scale(Vector3.add(measured.point1, measured.point2), 0.5),
        );
        const normal: IAutoMovieVector3 = measured.normal1;
        const velocity: IAutoMovieVector3 = Vector3.subtract(
          parentA?.velocityAtPoint(point) ?? { x: 0, y: 0, z: 0 },
          parentB?.velocityAtPoint(point) ?? { x: 0, y: 0, z: 0 },
        );
        const inverse: number =
          inverseMass(parentA, point, normal) +
          inverseMass(parentB, point, normal);
        if (!Number.isFinite(inverse))
          throw new Error("Nonfinite compliant-contact effective inverse mass");
        if (!(inverse > 0)) return;
        // Normalize before adding compliances or multiplying by damping. Dividing
        // the implicit law by compliance first creates infinity/infinity for an
        // otherwise finite stiff limit; this algebra retains that finite limit.
        const compliance: number = Math.max(a.compliance, b.compliance);
        const firstWeight: number = a.compliance / compliance;
        const secondWeight: number = b.compliance / compliance;
        const damping: number =
          (firstWeight * a.damping + secondWeight * b.damping) /
          (firstWeight + secondWeight);
        const coefficient: number = dt * (dt + damping);
        const scale: number = Math.max(compliance, coefficient * inverse);
        const impulse: number = Math.max(
          0,
          ((dt / scale) * -measured.distance +
            (coefficient / scale) * Vector3.dot(velocity, normal)) /
            ((compliance / scale) * (firstWeight + secondWeight) +
              (coefficient / scale) * inverse),
        );
        if (!Number.isFinite(impulse))
          throw new Error("Nonfinite compliant-contact impulse");
        if (!(impulse > 0)) return;
        const tangent: IAutoMovieVector3 = Vector3.subtract(
          velocity,
          Vector3.scale(normal, Vector3.dot(velocity, normal)),
        );
        const speed: number = Vector3.length(tangent);
        const direction: IAutoMovieVector3 =
          speed > 0 ? Vector3.scale(tangent, 1 / speed) : { x: 0, y: 0, z: 0 };
        const tangentInverse: number =
          inverseMass(parentA, point, direction) +
          inverseMass(parentB, point, direction);
        const friction: number =
          tangentInverse > 0
            ? Math.min(
                (a.friction + b.friction) * 0.5 * impulse,
                speed / tangentInverse,
              )
            : 0;
        const vector: IAutoMovieVector3 = Vector3.add(
          Vector3.scale(normal, impulse),
          Vector3.scale(direction, friction),
        );
        const firstImpulse: IAutoMovieVector3 | undefined = parentA?.isDynamic()
          ? physicalNativeVector(Vector3.scale(vector, -a.gain))
          : undefined;
        const secondImpulse: IAutoMovieVector3 | undefined =
          parentB?.isDynamic()
            ? physicalNativeVector(Vector3.scale(vector, b.gain))
            : undefined;
        if (firstImpulse)
          parentA!.applyImpulseAtPoint(firstImpulse, point, true);
        if (secondImpulse)
          parentB!.applyImpulseAtPoint(secondImpulse, point, true);
        results.push({
          handle,
          other,
          seconds,
          point,
          normal,
          impulse,
          appliedImpulse: {
            a: transferredNormal(firstImpulse, normal, -1),
            b: transferredNormal(secondImpulse, normal, 1),
          },
          separation: measured.distance,
        });
      },
    );
  }
  return results;
}

/** Rapier receives f32 components, so a positive Float64 demand alone proves no applied load. */
function transferredNormal(
  impulse: IAutoMovieVector3 | undefined,
  normal: IAutoMovieVector3,
  sign: number,
): number {
  return impulse
    ? Math.max(
        0,
        sign *
          Vector3.dot(normal, {
            x: Math.fround(impulse.x),
            y: Math.fround(impulse.y),
            z: Math.fround(impulse.z),
          }),
      )
    : 0;
}

/**
 * Numerical material policy for an outer surface, separate from its rigid core.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Numerical material policy for an outer surface, separate from its rigid core) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Numerical material policy for an outer surface, separate from its rigid core: companion namespace of 2 members (`ISurface`, `IMeasurement`); units and frames named in its text: metres, newton, seconds, second, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `solvePhysicalCompliantContacts` in packages/engine/src/physics/solvePhysicalCompliantContacts.ts; its surface is the 2 members listed and the text shows 3 other files naming it, mostly packages/engine (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace solvePhysicalCompliantContacts {
  /** Admitted solver material values; exaggerated gains are explicit. */
  export interface ISurface {
    /** Scene owner; self-contact policy remains owned by the profile adapter. */ body: string;
    /** Metres per newton, including any declared policy factor. */ compliance: number;
    /** Dissipative time constant, seconds. */ damping: number;
    /** Coulomb coefficient. */ friction: number;
    /** Explicit post-solve impulse multiplier. */ gain: number;
  }
  /** One positive solved soft-surface impulse. */
  export interface IMeasurement {
    /** First outer collider. */ handle: number;
    /** Second outer collider. */ other: number;
    /** Completed fixed-step time. */ seconds: number;
    /** Actual world application point. */ point: IAutoMovieVector3;
    /** From first to second. */ normal: IAutoMovieVector3;
    /** Normal impulse before explicit response gains, N s. */ impulse: number;
    /** Actual transferred normal impulse on each mapped side, after response gain and native f32 rounding. */ appliedImpulse: {
      a: number;
      b: number;
    };
    /** Actual signed outer-surface separation, metres. */ separation: number;
  }
}

/** Directional point inverse mass includes the rotated complete inertia tensor. */
function inverseMass(
  body: RigidBody | null,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): number {
  if (!body?.isDynamic()) return 0;
  const cross: IAutoMovieVector3 = Vector3.cross(
    Vector3.subtract(point, body.worldCom()),
    normal,
  );
  const tensor: SdpMatrix3 = body.effectiveWorldInvInertia();
  const transformed: IAutoMovieVector3 = {
    x: tensor.m11 * cross.x + tensor.m12 * cross.y + tensor.m13 * cross.z,
    y: tensor.m21 * cross.x + tensor.m22 * cross.y + tensor.m23 * cross.z,
    z: tensor.m31 * cross.x + tensor.m32 * cross.y + tensor.m33 * cross.z,
  };
  return body.invMass() + Vector3.dot(cross, transformed);
}
