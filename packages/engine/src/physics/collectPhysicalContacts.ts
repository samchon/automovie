import type {
  AutoMoviePerformanceMode,
  IAutoMovieContactReceipt,
  IAutoMovieVector3,
} from "@automovie/interface";
import type {
  RigidBody,
  TempContactManifold,
  World,
} from "@dimforge/rapier3d-compat";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalNativeVector } from "./physicalNativeVector";
import { recordPhysicalContact } from "./recordPhysicalContact";
import { visitPhysicalNative } from "./visitPhysicalNative";

/**
 * Collect actual touching-surface native impulses in canonical shape-pair order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Collect actual touching-surface native impulses in canonical shape-pair order) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Collect actual touching-surface native impulses in canonical shape-pair order) directly over its typed inputs (`world`, `input`, `bound`, `seconds`, `contacts`, `active`, `found`) as nested iteration of depth 3 (for-of over bound.colliders; for loop bounded by i < manifold.numContacts(); for-of over [ [a, -1], [), delegating to `owner?.isSleeping`, `visitPhysicalNative`, `manifold.numContacts`, `manifold.contactImpulse`, `Math.min`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 77 lines and 1 top-level statements that reuses `owner?.isSleeping`, `visitPhysicalNative`, `manifold.numContacts`, `manifold.contactImpulse`, `Math.min` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `world`, `input`, `bound`, `seconds`, `contacts`, `active`, `found`; the dominant cost is nested iteration of depth 3 (for-of over bound.colliders; for loop bounded by i < manifold.numContacts(); for-of over [ [a, -1], [), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function collectPhysicalContacts(
  world: World,
  input: AutoMoviePhysicalSimulation.IInput,
  bound: Bound,
  seconds: number,
  contacts: IAutoMovieContactReceipt[],
  active: Map<string, IAutoMovieContactReceipt>,
  found: Set<string>,
): void {
  for (const [handle, a] of bound.colliders) {
    const owner: RigidBody | null | undefined = world.colliders
      .get(handle)
      ?.parent();
    if (owner?.isSleeping()) continue;
    visitPhysicalNative(
      (visitor: (other: number) => void): void =>
        world.narrowPhase.contactPairsWith(handle, visitor),
      (other: number): void => {
        if (other <= handle) return;
        const b: IAutoMovieContactReceipt["a"] | undefined =
          bound.colliders.get(other);
        if (!b || a.body === b.body) return;
        visitPhysicalNative(
          (
            visitor: (manifold: TempContactManifold, flipped: boolean) => void,
          ): void =>
            world.narrowPhase.contactPair(handle, other, world.bodies, visitor),
          (manifold: TempContactManifold, flipped: boolean): void => {
            let impulse: number = 0;
            let separation: number = Infinity;
            for (let i: number = 0; i < manifold.numContacts(); i++) {
              impulse += manifold.contactImpulse(i);
              separation = Math.min(separation, manifold.contactDist(i));
            }
            const point: IAutoMovieVector3 | null =
              manifold.numSolverContacts() === 0
                ? null
                : manifold.solverContactPoint(0);
            if (!(impulse > 0) || separation > 0 || !point) return;
            const normal: IAutoMovieVector3 = Vector3.scale(
              manifold.normal(),
              flipped ? -1 : 1,
            );
            recordPhysicalContact({
              a,
              b,
              seconds,
              dt: 1 / input.rate,
              point,
              normal,
              impulse,
              separation,
              contacts: contacts,
              active,
              found,
            });
            for (const [side, sign] of [
              [a, -1],
              [b, 1],
            ] as const) {
              const policy: AutoMoviePerformanceMode | undefined =
                input.bodies.find(
                  (candidate: (typeof input.bodies)[number]): boolean =>
                    candidate.id === side.body,
                )?.mode;
              if (policy?.kind === "exaggerated")
                bound.bodies
                  .get(`${side.body}/${side.bone}`)!
                  .applyImpulseAtPoint(
                    physicalNativeVector(
                      Vector3.scale(
                        normal,
                        sign * impulse * (policy.impulse - 1),
                      ),
                    ),
                    physicalNativeVector(point),
                    true,
                  );
            }
          },
        );
      },
    );
  }
}
