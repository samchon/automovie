import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalSpanPose } from "./physicalSpanPose";
import type { preparePhysicalDisturbanceSpan } from "./preparePhysicalDisturbanceSpan";
import { recordPhysicalContact } from "./recordPhysicalContact";

/**
 * Record the floor's reaction on a body while its disturbance response plays
 * (`physicalSpanPose.play`), from the response's curves rather than the solver,
 * the body being kinematic there: each planted foot's share of the pendulum's
 * reaction (`preparePhysicalDisturbanceSpan.ISample.reaction`, `loads`) as one
 * floor contact sample over the substep, its normal impulse the share of the
 * weight times the substep, at the foot's endpoint moved by the pivot's offset
 * from the line the shares are taken along, so the shares' centre of pressure
 * is the pivot; and the cache's support wrench at its instants, the reaction
 * asked and borne whole, horizontal and vertical.
 *
 * @param input The simulation's input, the binding, the recovery states, the
 *   substep's time and its cache second, and the receipts with their open
 *   episodes and this frame's touched keys.
 */
export function recordPhysicalSpanContacts(input: {
  settings: IAutoMoviePhysicalSimulationInput.IInput;
  bound: Bound;
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
    const line: IAutoMovieVector3 | undefined =
      bones.length === 2
        ? Vector3.subtract(sample.feet[bones[1]!]!, sample.feet[bones[0]!]!)
        : undefined;
    const along: IAutoMovieVector3 = line
      ? Vector3.add(
          sample.feet[bones[0]!]!,
          Vector3.scale(line, sample.loads[bones[1]!]!),
        )
      : pivot;
    const offset: IAutoMovieVector3 = line
      ? Vector3.subtract(pivot, along)
      : { x: 0, y: 0, z: 0 };
    for (const bone of bones) {
      const share: number = sample.loads[bone]!;
      const collider: IAutoMovieContactReceipt["a"] | undefined = [
        ...bound.colliders.values(),
      ].find(
        (candidate: IAutoMovieContactReceipt["a"]): boolean =>
          candidate.body === body.id && candidate.bone === bone,
      );
      if (!collider || !(share > 0)) continue;
      const point: IAutoMovieVector3 =
        bones.length === 1 ? pivot : Vector3.add(sample.feet[bone]!, offset);
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
