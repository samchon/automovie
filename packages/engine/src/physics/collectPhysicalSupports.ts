import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieContactReceipt,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";
import type {
  RigidBody,
  TempContactManifold,
  World,
} from "@dimforge/rapier3d-compat";

import { physicalSupportPoint } from "./physicalSupportPoint";
import { visitPhysicalNative } from "./visitPhysicalNative";

/**
 * Read touching upward native floor constraints before recent positive surface impulses. Native points retain their actual combined friction; receipt-only compliant contacts use the declared average with the floor's friction 0.7. No projected sole or future contact is invented.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Read touching upward native floor constraints before recent positive surface impulses) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Read touching upward native floor constraints before recent positive surface impulses) directly over its typed inputs (`input`) as nested iteration of depth 3 (flatMap over input.pattern.limbs; for-of over input.colliders; for loop bounded by i < manifold.numContacts()), delegating to `patches.includes`, `visitPhysicalNative`, `manifold.normal`, `manifold.numContacts`, `manifold.contactDist`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.5, 0.7, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 131 lines and 1 top-level statements that reuses `patches.includes`, `visitPhysicalNative`, `manifold.normal`, `manifold.numContacts`, `manifold.contactDist` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (flatMap over input.pattern.limbs; for-of over input.colliders; for loop bounded by i < manifold.numContacts()), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function collectPhysicalSupports(input: {
  /** Current native world, outside a solver invocation. */ world: World;
  /** Source body identity. */ body: string;
  /** Source material and shape ownership. */ profile: IAutoMoviePhysicalProfile;
  /** Explicit support paths and patch owners. */ pattern: IAutoMovieFootfallPattern;
  /** Actual segment wrappers. */ segments: ReadonlyMap<string, RigidBody>;
  /** Scene collider ownership. */ colliders: ReadonlyMap<
    number,
    IAutoMovieContactReceipt["a"]
  >;
  /** Completed contact samples. */ contacts: readonly IAutoMovieContactReceipt[];
  /** Current local seconds and native timestep. */ seconds: number;
  dt: number;
}): IAutoMovieCollectPhysicalSupports.ISupport[] {
  return input.pattern.limbs.flatMap(
    (
      limb: IAutoMovieFootfallPattern["limbs"][number],
    ): IAutoMovieCollectPhysicalSupports.ISupport[] => {
      const patches: readonly string[] = limb.contacts ?? [limb.bone];
      const samples: IAutoMovieCollectPhysicalSupports.IPoint[] = [];
      const seen: Set<string> = new Set();
      let loaded: boolean = false;
      for (const [handle, identity] of input.colliders)
        if (identity.body === input.body && patches.includes(identity.bone)) {
          visitPhysicalNative(
            (visitor: (other: number) => void): void =>
              input.world.narrowPhase.contactPairsWith(handle, visitor),
            (other: number): void => {
              if (input.colliders.get(other)?.body !== "floor") return;
              visitPhysicalNative(
                (
                  visitor: (
                    manifold: TempContactManifold,
                    flipped: boolean,
                  ) => void,
                ): void =>
                  input.world.narrowPhase.contactPair(
                    handle,
                    other,
                    input.world.bodies,
                    visitor,
                  ),
                (manifold: TempContactManifold, flipped: boolean): void => {
                  if (manifold.normal().y * (flipped ? -1 : 1) >= -0.5) return;
                  for (let i: number = 0; i < manifold.numContacts(); i++)
                    if (
                      manifold.contactDist(i) <= 0 &&
                      manifold.contactImpulse(i) > 0
                    )
                      loaded = true;
                  for (
                    let i: number = 0;
                    i < manifold.numSolverContacts();
                    i++
                  ) {
                    if (manifold.solverContactDist(i) > 0) continue;
                    const point: IAutoMovieVector3 | null =
                      manifold.solverContactPoint(i);
                    if (point)
                      append(point, manifold.friction(), identity.bone);
                  }
                },
              );
            },
          );
        }
      for (const receipt of input.contacts) {
        const first: boolean =
          receipt.a.body === input.body &&
          patches.includes(receipt.a.bone) &&
          receipt.b.body === "floor";
        const second: boolean =
          receipt.b.body === input.body &&
          patches.includes(receipt.b.bone) &&
          receipt.a.body === "floor";
        const material: IAutoMoviePhysicalProfile.IMaterial | undefined =
          input.profile.materials.find(
            (candidate: IAutoMoviePhysicalProfile.IMaterial): boolean =>
              candidate.id ===
              (first
                ? receipt.a.material
                : second
                  ? receipt.b.material
                  : undefined),
          );
        if (
          receipt.source !== "solver" ||
          !material ||
          !(material.compliance > 0)
        )
          continue;

        // Receipts use their enclosing cache-frame clock. A just-appended future
        // tail must not hide the latest causal sample still carrying soft force.
        let sample:
          | NonNullable<IAutoMovieContactReceipt["samples"]>[number]
          | undefined;
        for (
          let index: number = (receipt.samples?.length ?? 0) - 1;
          index >= 0;
          index--
        )
          if (receipt.samples![index]!.seconds <= input.seconds) {
            sample = receipt.samples![index];
            break;
          }
        if (
          !sample ||
          input.seconds - sample.seconds > sample.duration + input.dt ||
          !(sample.impulse > 0) ||
          !((sample.appliedImpulse?.[first ? "a" : "b"] ?? 0) > 0) ||
          sample.separation > 0 ||
          (first ? sample.normal.y >= -0.5 : sample.normal.y <= 0.5)
        )
          continue;
        loaded = true;
        append(
          sample.point,
          (material.friction + 0.7) / 2,
          first ? receipt.a.bone : receipt.b.bone,
        );
      }
      const rigid: RigidBody = input.segments.get(limb.bone)!;
      return samples.length
        ? [
            {
              bone: limb.bone,
              position: physicalSupportPoint(
                { position: rigid.translation(), rotation: rigid.rotation() },
                limb.localPoint,
              ),
              points: samples.map(
                (
                  sample: IAutoMovieCollectPhysicalSupports.IPoint,
                ): IAutoMovieVector3 => sample.point,
              ),
              samples,
              loaded,
            },
          ]
        : [];

      /** Equal horizontal native witnesses describe the same floor application point. */
      function append(
        point: IAutoMovieVector3,
        friction: number,
        carrier: string,
      ): void {
        const key: string = `${carrier}/${point.x}/${point.z}`;
        if (seen.has(key)) return;
        seen.add(key);
        samples.push({ point: { ...point }, friction, carrier });
      }
    },
  );
}
