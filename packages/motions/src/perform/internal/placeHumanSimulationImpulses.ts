import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanImpulse,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A performance's impulses on a simulated window's performers, as the solver's
 * impulses on its grid.
 *
 * An impulse at film second `s` lands on the boundary that opens step `k =
 * round((s - from) * rate) + 1`, the engine's convention that step k's impulse
 * is applied once before its first native step
 * (`IAutoMoviePhysicalSimulationInput.IInput.impulses`). Its point is the
 * site's world point in the displayed pose at that boundary: a region's point
 * (`resolveAutoMovieHumanoidSurfaces.place`) or a bone-local point; it acts on
 * the profile segment that carries the site's bone, the bone's own or its
 * nearest ancestor's.
 *
 * @param forces Every force of the performance.
 * @param bodies The simulated performers' bodies, by subject.
 * @param profiles The profiles the window solves, by subject: the bodies' with
 *   the hands welded.
 * @param bones Each simulated performer's displayed bones, by step.
 * @param clock The window's first film second, interval count and rate.
 * @returns The solver's impulses, in the performance's order.
 */
export function placeHumanSimulationImpulses(
  forces: readonly IAutoMovieMotionHumanForce[],
  bodies: ReadonlyMap<string, IAutoMovieMotionHumanBody>,
  profiles: ReadonlyMap<string, IAutoMoviePhysicalProfile>,
  bones: ReadonlyMap<
    string,
    readonly Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[]
  >,
  clock: placeHumanSimulationImpulses.IClock,
): IAutoMoviePhysicalSimulationInput.IInput["impulses"] {
  const end: number = clock.from + clock.count / clock.rate;
  return forces
    .filter(
      (
        force: IAutoMovieMotionHumanForce,
      ): force is IAutoMovieMotionHumanImpulse =>
        force.kind === "impulse" &&
        bodies.has(force.subject) &&
        clock.from <= force.seconds &&
        force.seconds < end,
    )
    .map(
      (
        impulse: IAutoMovieMotionHumanImpulse,
      ): IAutoMoviePhysicalSimulationInput.IInput["impulses"][number] => {
        const step: number = Math.min(
          clock.count,
          Math.round((impulse.seconds - clock.from) * clock.rate) + 1,
        );
        const body: IAutoMovieMotionHumanBody = bodies.get(impulse.subject)!;
        const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          bones.get(impulse.subject)![step - 1]!;
        const site: IAutoMovieMotionHumanImpulse["at"] = impulse.at;
        const bone: AutoMovieHumanoidBone =
          typeof site === "string"
            ? body.surfaces.regions[site].bone
            : site.bone;
        const frame: IAutoMovieResolvedBone = placed.get(bone)!;
        const point: IAutoMovieVector3 =
          typeof site === "string"
            ? resolveAutoMovieHumanoidSurfaces.place(
                body.surfaces.regions[site],
                frame,
              ).point
            : Vector3.add(
                frame.worldPosition,
                Quaternion.rotateVector(frame.worldRotation, site.point),
              );
        return {
          step,
          body: impulse.subject,
          bone: placeHumanSimulationImpulses.carrier(
            body,
            profiles.get(impulse.subject)!,
            bone,
          ),
          impulse: { ...impulse.impulse },
          point,
        };
      },
    );
}

/** Companion types and helpers of {@link placeHumanSimulationImpulses}. */
export namespace placeHumanSimulationImpulses {
  /**
   * A window's grid: its first film second, interval count and intervals per
   * second.
   */
  export interface IClock {
    /** First film second, step zero. */
    from: number;

    /** Intervals in the window. */
    count: number;

    /** Intervals per second. */
    rate: number;
  }

  /**
   * The profile segment carrying a rig bone: its own, or its nearest
   * ancestor's.
   *
   * @param body The body, for its rig's parents.
   * @param profile The profile whose segments carry the bone.
   * @param bone The rig bone.
   * @returns The segment's bone; the rig's root when no ancestor carries one.
   */
  export function carrier(
    body: IAutoMovieMotionHumanBody,
    profile: IAutoMoviePhysicalProfile,
    bone: AutoMovieHumanoidBone,
  ): string {
    const segments: ReadonlySet<string> = new Set(
      profile.segments.map(
        (segment: IAutoMoviePhysicalSegment): string => segment.bone,
      ),
    );
    let at: IAutoMovieBone = body.bones.get(bone)!;
    while (!segments.has(at.bone) && at.parent !== null)
      at = body.bones.get(at.parent)!;
    return at.bone;
  }
}
