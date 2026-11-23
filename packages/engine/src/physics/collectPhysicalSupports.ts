import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieContactReceipt,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * Read each limb's actual floor support: the rigid floor contacts the
 * world's last step solved on the limb's patch colliders, then recent
 * positive compliant-surface impulses on the same patch. No projected sole
 * or future contact is invented; a limb with no sample returns nothing.
 *
 * A rigid floor manifold supports the limb when its normal, taken from the
 * limb's collider toward the floor, points down by more than 60 degrees
 * (`y < -0.5`, the cosine of that cone). Each of its points the step found
 * pressing (separation not positive where the contact was found) is a sample carrying the pair's
 * combined friction as the step used it (`manifold.friction`), and a point
 * that received a positive normal impulse marks the limb loaded. A
 * compliant receipt counts only while its latest sample at or before
 * `seconds` is still within its duration plus one substep, pressed with a
 * positive impulse that the limb's side actually received, with the floor
 * on the other side of the same 60-degree cone; it carries the mean of its
 * material's friction and the floor's 0.7, the coefficient the binding
 * gives the floor collider, and marks the limb loaded. Samples at the same
 * horizontal position on the same carrier are one application point.
 *
 * @param input The world, owner, patch pattern, segment bodies, collider identities, receipts and clock.
 * @returns One support per limb with samples: the limb's declared world point, its sample points and samples, and whether it is loaded.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both sources, the cone and its cosine, the pressing and loaded tests, the friction each sample carries, the receipt window and the merge of equal points.
 * @evidence contracts/development/implementation.md#principled-implementation The manifold points and impulses are those the world's position solve applied (Mueller et al. 2020, sec. 3.5), so a pressing point is a real floor constraint and a positive impulse a real load; the compliant law's receipts carry the impulse each side received. 0.5 is the cone's cosine and 0.7 the binding's floor friction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Per limb, one pass over the step's manifolds and one over the receipts, with a local patch-owner test and point merge; contact detection is the world's and receipts are recordPhysicalContact's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the body's own patch colliders against the floor count; no pattern, scene or shape kind has its own rule. Non-null assertions read receipt samples the loop bounds and the segment body the binding created for the limb's bone.
 * @evidence contracts/development/implementation.md#efficient-algorithms Per limb, linear in the step's manifold points and in the receipts with their samples, plus the material lookups.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads one completed step's manifolds, which the next step replaces; nothing is reusable across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the returned supports and their copied points are the caller's.
 */
export function collectPhysicalSupports(
  input: collectPhysicalSupports.IInput,
): IAutoMovieCollectPhysicalSupports.ISupport[] {
  return input.pattern.limbs.flatMap(
    (
      limb: IAutoMovieFootfallPattern["limbs"][number],
    ): IAutoMovieCollectPhysicalSupports.ISupport[] => {
      const patches: readonly string[] = limb.contacts ?? [limb.bone];
      const samples: IAutoMovieCollectPhysicalSupports.IPoint[] = [];
      const seen: Set<string> = new Set();
      let loaded: boolean = false;
      let impulse: number = 0;
      let pressure: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      let weighted: number = 0;
      for (const manifold of input.world.manifolds()) {
        const first: IAutoMovieContactReceipt["a"] | undefined =
          input.colliders.get(manifold.a.handle);
        const second: IAutoMovieContactReceipt["a"] | undefined =
          input.colliders.get(manifold.b.handle);
        const ours: boolean = owns(first) && second?.body === "floor";
        if (!ours && !(owns(second) && first?.body === "floor")) continue;

        // The manifold normal runs from the first collider to the second.
        if (manifold.normal.y * (ours ? 1 : -1) >= -0.5) continue;
        const carrier: string = (ours ? first : second)!.bone;
        for (const point of manifold.points) {
          if (point.separation > 0) continue;
          if (point.impulse > 0) {
            loaded = true;
            impulse += point.impulse;
            pressure = Vector3.add(
              pressure,
              Vector3.scale(point.point, point.impulse),
            );
            weighted += point.impulse;
          }
          append(point.point, manifold.friction, carrier);
        }
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
        const material: IAutoMoviePhysicalMaterial | undefined =
          input.profile.materials.find(
            (candidate: IAutoMoviePhysicalMaterial): boolean =>
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
        impulse +=
          (sample.appliedImpulse![first ? "a" : "b"]! * input.dt) /
          Math.max(input.dt, sample.duration);
        append(
          sample.point,
          (material.friction + 0.7) / 2,
          first ? receipt.a.bone : receipt.b.bone,
        );
      }
      const rigid: AutoMovieXpbdBody = input.segments.get(limb.bone)!;
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
              impulse,
              ...(weighted > 0
                ? { pressure: Vector3.scale(pressure, 1 / weighted) }
                : {}),
            },
          ]
        : [];

      /** Whether an identified collider is one of this limb's patch colliders on the body. */
      function owns(
        identity: IAutoMovieContactReceipt["a"] | undefined,
      ): boolean {
        return (
          identity !== undefined &&
          identity.body === input.body &&
          patches.includes(identity.bone)
        );
      }

      /** Equal horizontal witnesses on one carrier describe the same floor application point. */
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

/**
 * The input {@link collectPhysicalSupports} reads: one body's limbs against
 * the world's last step and the run's compliant receipts at one local time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each input member with its owner, frame, unit and timebase.
 * @evidence contracts/development/design.md#principled-representation The world and segment bodies as the binding built them, scene identities as strings, receipts as the interface records, local seconds and the solver substep in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Built by trackPhysicalWorld and advancePhysicalBalance; every member is read, the substep widening the receipt window by one step.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member, any, unknown or cast; the profile, pattern and receipts are the interface's own types.
 */
export namespace collectPhysicalSupports {
  /** What one support reading needs. */
  export interface IInput {
    /** The world, between steps; its last step's manifolds are read. */
    world: AutoMovieXpbdWorld;

    /** Scene identity of the body whose limbs are read. */
    body: string;

    /** The body's profile: its materials' friction and compliance. */
    profile: IAutoMoviePhysicalProfile;

    /** The limbs, their patch colliders' bones and declared local points. */
    pattern: IAutoMovieFootfallPattern;

    /** The body's segment bodies by bone. */
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;

    /** Scene identity of every bound collider, by handle. */
    colliders: ReadonlyMap<number, IAutoMovieContactReceipt["a"]>;

    /** The run's completed contact receipts. */
    contacts: readonly IAutoMovieContactReceipt[];

    /** Local seconds of the reading. */
    seconds: number;

    /** The solver substep, seconds. */
    dt: number;
  }
}
