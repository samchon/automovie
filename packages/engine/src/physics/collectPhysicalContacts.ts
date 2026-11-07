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

/** Collect actual touching-surface native impulses in canonical shape-pair order. */
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
