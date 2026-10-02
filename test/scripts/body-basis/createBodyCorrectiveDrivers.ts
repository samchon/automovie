import { humanBodyShoulderOrientationDistance } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";
import { interpolateBodyShoulderPose } from "./interpolateBodyShoulderPose";
import type { readBodyCorrectiveShoulderMotion } from "./readBodyCorrectiveShoulderMotion";
import type { BodyCorrectiveDriver } from "./withBodyCorrective";

/**
 * Construct the actual solver's conditional inputs, retaining complete TT pose.
 * Clinical/channel ramps keep their prior definitions. A shoulder input uses
 * the existing SO(3) kernel centred on this visit's sampled endpoint, with its
 * zero radius at the measured onset. Rests belong to the same shaped builder.
 * A motionless shoulder contributes no kernel; no activation authority rejects
 * rather than emitting an unconditional row. Ranges/geometry remain separate.
 *
 * @evidence contracts/common.md#principled-implementation Full orientation and the actual shaped rest determine TT kernel support instead of a fixed neutral or elevation-only surrogate.
 * @evidence contracts/common.md#clear-and-simple-design Shape, clinical and shoulder inputs are three explicit families using existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rest and unconditional publication are refused; no invented support radius substitutes for absent motion.
 * @evidence contracts/common.md#meaningful-documentation States real session consumer, endpoint/onset authority and separate admission/geometry obligations.
 */
export function createBodyCorrectiveDrivers(input: {
  state: IBodyCorrectiveState;
  macros: ReadonlySet<string>;
  axes: readonly { bone: AutoMovieHumanoidBone; axis: "flexion" | "abduction" | "twist"; angle: number; rest: number }[];
  shoulderMotion: ReturnType<typeof readBodyCorrectiveShoulderMotion>;
  onset: number;
  full: number;
  from: number;
  to: number;
}): BodyCorrectiveDriver[] {
  const drivers: BodyCorrectiveDriver[] = [
    ...Object.entries(input.state.shape)
      .filter(([channel, weight]) => weight !== 0 && ((input.state.set !== "bodies" && input.state.set !== "bodyposes") || input.macros.has(channel)))
      .map(([channel, weight]) => ({ channel, side: weight < 0 ? "negative" as const : "positive" as const, onset: input.from * Math.abs(weight), full: input.to * Math.abs(weight) })),
    ...input.axes.map((axis) => ({
      bone: axis.bone, axis: axis.axis, side: axis.angle > axis.rest ? "positive" as const : "negative" as const,
      onset: input.onset * Math.abs(axis.angle - axis.rest), full: input.full * Math.abs(axis.angle - axis.rest),
    })),
  ];
  for (const { target, rest } of input.shoulderMotion) {
    const centre = interpolateBodyShoulderPose({ from: rest, to: target, fraction: input.full });
    const onset = interpolateBodyShoulderPose({ from: rest, to: target, fraction: input.onset });
    const outerDegrees = humanBodyShoulderOrientationDistance(centre, onset);
    if (outerDegrees === 0) continue;
    drivers.push({ shoulder: target.bone, orientation: { plane: centre.plane, elevation: centre.elevation, axialRotation: centre.axialRotation }, innerDegrees: 0, outerDegrees });
  }
  if (drivers.length === 0) throw new Error("A corrective has no conditional activation authority.");
  return drivers;
}
