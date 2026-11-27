import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalSpanPose } from "./physicalSpanPose";
import type { preparePhysicalDisturbanceSpan } from "./internal/preparePhysicalDisturbanceSpan";
import { recordPhysicalContact } from "./internal/recordPhysicalContact";

/**
 * Record the floor's reaction on a body while its disturbance response plays
 * (`physicalSpanPose.play`), from the response's curves rather than the solver,
 * the body being kinematic there: each planted foot's share of the pendulum's
 * reaction (`preparePhysicalDisturbanceSpan.ISample.reaction`, `loads`) as one
 * floor contact sample over the substep, its normal impulse the share of the
 * weight times the substep, at the foot's endpoint moved by the pivot's offset
 * from the shares' weighted endpoint, so the shares' centre of pressure is the
 * pivot; and the cache's support wrench at its instants, the reaction asked and
 * borne whole, horizontal and vertical.
 *
 * @param input The simulation's input, the binding, the recovery states, the
 *   substep's time and its cache second, and the receipts with their open
 *   episodes and this frame's touched keys.
 */
export function recordPhysicalSpanContacts(input: {
  settings: Pick<
    IAutoMoviePhysicalSimulationInput.IInput,
    "rate" | "substeps"
  > & {
    bodies: readonly (physicalSpanPose.IBody &
      Pick<IAutoMoviePhysicalSimulationInput.IBody, "mode">)[];
  };
  bound: Pick<Bound, "colliders" | "supportWrenches" | "spans" | "segments">;
  recovery: Readonly<Record<string, IAutoMoviePhysicalRecoveryState>>;
  instant: number;
  seconds: number;
  step: number;
  contacts: IAutoMovieContactReceipt[];
  active: Map<string, IAutoMovieContactReceipt>;
  found: Set<string>;
}): void {
  const { bound, settings } = input;
  const dt: number = 1 / (settings.rate * settings.substeps!);
  const floor: IAutoMovieContactReceipt["a"] | undefined = [
    ...bound.colliders.values(),
  ].find(
    (collider: IAutoMovieContactReceipt["a"]): boolean =>
      collider.body === "floor",
  );
  if (!floor) return;
  for (const body of settings.bodies) {
    if (body.mode.kind === "kinematic") continue;
    const sample: preparePhysicalDisturbanceSpan.ISample | undefined =
      physicalSpanPose.play(
        bound,
        body,
        input.recovery[body.id],
        input.instant,
      );
    if (!sample) continue;
    const bones: string[] = Object.keys(sample.loads);
    const pivot: IAutoMovieVector3 = sample.reaction.point;
    // The shares' weighted endpoint, moved onto the pivot: each share acts
    // at its endpoint carried by the pivot's offset from that mean, so the
    // shares' centre of pressure is the pivot, for any number of limbs.
    const mean: IAutoMovieVector3 = bones.reduce(
      (sum: IAutoMovieVector3, bone: string): IAutoMovieVector3 =>
        Vector3.add(
          sum,
          Vector3.scale(sample.feet[bone]!, sample.loads[bone]!),
        ),
      { x: 0, y: 0, z: 0 },
    );
    const offset: IAutoMovieVector3 = Vector3.subtract(pivot, mean);
    for (const bone of bones) {
      const share: number = sample.loads[bone]!;
      const collider: IAutoMovieContactReceipt["a"] | undefined = [
        ...bound.colliders.values(),
      ].find(
        (candidate: IAutoMovieContactReceipt["a"]): boolean =>
          candidate.body === body.id && candidate.bone === bone,
      );
      if (!collider || !(share > 0)) continue;
      const point: IAutoMovieVector3 = Vector3.add(sample.feet[bone]!, offset);
      recordPhysicalContact({
        a: collider,
        b: floor,
        seconds: input.seconds,
        dt: 1 / settings.rate,
        point,
        normal: { x: 0, y: -1, z: 0 },
        impulse: share * sample.reaction.force.y * dt,
        separation: 0,
        contacts: input.contacts,
        active: input.active,
        found: input.found,
      });
    }
    if (
      Math.round(input.instant * settings.rate * settings.substeps!) %
        settings.substeps! ===
      0
    )
      bound.supportWrenches.push({
        body: body.id,
        seconds: input.step / settings.rate,
        origin: sample.center,
        requested: {
          force: sample.reaction.force,
          torque: Vector3.cross(
            Vector3.subtract(pivot, sample.center),
            sample.reaction.force,
          ),
        },
        allocated: {
          force: sample.reaction.force,
          torque: Vector3.cross(
            Vector3.subtract(pivot, sample.center),
            sample.reaction.force,
          ),
        },
        residual: { force: { x: 0, y: 0, z: 0 }, torque: { x: 0, y: 0, z: 0 } },
        pointCount: bones.length,
      });
  }
}
