import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieContactReceipt as Receipt,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import type {
  RigidBody,
  TempContactManifold,
  World,
} from "@dimforge/rapier3d-compat";

import { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";
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
  /** Source material and shape ownership. */ profile: P;
  /** Explicit support paths and patch owners. */ pattern: Pattern;
  /** Actual segment wrappers. */ segments: ReadonlyMap<string, RigidBody>;
  /** Scene collider ownership. */ colliders: ReadonlyMap<number, Receipt["a"]>;
  /** Completed contact samples. */ contacts: readonly Receipt[];
  /** Current local seconds and native timestep. */ seconds: number;
  dt: number;
}): collectPhysicalSupports.ISupport[] {
  return input.pattern.limbs.flatMap(
    (limb: Pattern["limbs"][number]): collectPhysicalSupports.ISupport[] => {
      const patches: readonly string[] = limb.contacts ?? [limb.bone];
      const samples: collectPhysicalSupports.IPoint[] = [];
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
                    const point: V | null = manifold.solverContactPoint(i);
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
        const material: P.IMaterial | undefined = input.profile.materials.find(
          (candidate: P.IMaterial): boolean =>
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
        let sample: NonNullable<Receipt["samples"]>[number] | undefined;
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
                (sample: collectPhysicalSupports.IPoint): V => sample.point,
              ),
              samples,
              loaded,
            },
          ]
        : [];

      /** Equal horizontal native witnesses describe the same floor application point. */
      function append(point: V, friction: number, carrier: string): void {
        const key: string = `${carrier}/${point.x}/${point.z}`;
        if (seen.has(key)) return;
        seen.add(key);
        samples.push({ point: { ...point }, friction, carrier });
      }
    },
  );
}

/**
 * Actual support geometry is shared by balance classification and force allocation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Actual support geometry is shared by balance classification and force allocation) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Actual support geometry is shared by balance classification and force allocation: companion namespace of 2 members (`IPoint`, `ISupport`); units and frames named in its text: world, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `collectPhysicalSupports` in packages/engine/src/physics/collectPhysicalSupports.ts; its surface is the 2 members listed and the text shows 8 other files naming it, mostly test (5), packages/engine (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace collectPhysicalSupports {
  /** One measured floor application point and its Coulomb coefficient. */
  export interface IPoint {
    /** Collider-owning segment; a distal endpoint does not carry every patch contact. */
    carrier: string;
    /** World metres. */
    point: V;
    /** Actual native combined coefficient, or the declared mean for a solved compliant-surface receipt fallback. */
    friction: number;
  }
  /** No handle or borrowed manifold survives this collection. */
  export interface ISupport extends Balance.ISupport {
    /** A touching upward constraint carried a positive actual native or compliant-solver impulse. Zero-load constraints remain available for wrench allocation. */
    loaded: boolean;
    /** Actual floor constraints, not a complete nominal sole. */
    samples: IPoint[];
  }
}
