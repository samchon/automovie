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

/** Read touching upward native floor constraints before recent positive surface impulses. Native points retain their actual combined friction; receipt-only compliant contacts use the declared average with the floor's friction 0.7. No projected sole or future contact is invented. */
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
          input.world.narrowPhase.contactPairsWith(
            handle,
            (other: number): void => {
              if (input.colliders.get(other)?.body !== "floor") return;
              input.world.narrowPhase.contactPair(
                handle,
                other,
                input.world.bodies,
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

/** Actual support geometry is shared by balance classification and force allocation. */
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
