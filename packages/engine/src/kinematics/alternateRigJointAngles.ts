import { AutoMovieJointTwistPlacement } from "@automovie/interface";

import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";

/**
 * The second Euler chart of a joint rotation, in rest-relative (rig)
 * degrees: the other triple that composes to the same rotation.
 *
 * A distal twist composes `Ry(a)·Rx(f)·Rz(t)`, whose second chart is
 * `(180 − f, a + 180, t + 180)`; a proximal twist composes `Rz(t)·Ry(a)·Rx(f)`,
 * whose second chart is `(f + 180, 180 − a, t + 180)`. A left-handed basis is
 * extracted against `−twist`, so its twist takes `−180` where a right-handed
 * one takes `+180`, the same rotation by a full turn. No angle is wrapped:
 * the caller chooses the full-turn alias it needs.
 *
 * @param rig The rest-relative angles of one chart, degrees.
 * @param placement Where the basis places the twist; absent means proximal.
 * @param handed `1` for a right-handed basis (`flexion × abduction = +twist`), `-1` for a left-handed one.
 * @returns The other chart's rest-relative angles, degrees.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The two charts of a three-angle composition differ by a half turn of each outer angle and the reflection of the middle one about its right angle, which leaves every entry of the composed matrix unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of three sums; `decomposeJointRotationOnBasis` scores it against a range, so the chart rule is written once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle is wrapped or clamped and no bone is named.
 * @evidence contracts/development/common.md#meaningful-documentation States both composition orders with their second chart, the handedness term, the unit and that aliases are the caller's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three additions.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of three numbers with nothing to share between calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned angles.
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
