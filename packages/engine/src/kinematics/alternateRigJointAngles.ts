import {
  AutoMovieJointTwistPlacement,
  type IAutoMovieResolvedJointAngles,
} from "@automovie/interface";

/**
 * The second Euler chart of a joint rotation, in rest-relative (rig) degrees:
 * the other triple that composes to the same rotation.
 *
 * A distal twist composes `Ry(a)·Rx(f)·Rz(t)`, whose second chart is `(180 − f,
 * a + 180, t + 180)`; a proximal twist composes `Rz(t)·Ry(a)·Rx(f)`, whose
 * second chart is `(f + 180, 180 − a, t + 180)`. A left-handed basis is
 * extracted against `−twist`, so its twist takes `−180` where a right-handed
 * one takes `+180`, the same rotation by a full turn. No angle is wrapped: the
 * caller chooses the full-turn alias it needs.
 *
 * @param rig The rest-relative angles of one chart, degrees.
 * @param placement Where the basis places the twist; absent means proximal.
 * @param handed `1` for a right-handed basis (`flexion × abduction = +twist`),
 *   `-1` for a left-handed one.
 * @returns The other chart's rest-relative angles, degrees.
 */
export const alternateRigJointAngles: (
  rig: IAutoMovieResolvedJointAngles,
  placement: AutoMovieJointTwistPlacement | undefined,
  handed: 1 | -1,
) => IAutoMovieResolvedJointAngles = (
  rig: IAutoMovieResolvedJointAngles,
  placement: AutoMovieJointTwistPlacement | undefined,
  handed: 1 | -1,
): IAutoMovieResolvedJointAngles => ({
  flexion: placement === "distal" ? 180 - rig.flexion : rig.flexion + 180,
  abduction: placement === "distal" ? rig.abduction + 180 : 180 - rig.abduction,
  twist: rig.twist + 180 * handed,
});
