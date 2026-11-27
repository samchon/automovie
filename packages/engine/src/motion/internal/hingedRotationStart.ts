import type { IAutoMovieQuaternion } from "@automovie/interface";

import { hingedArmSwivel } from "../../kinematics/hingedArmSwivel";
import { Quaternion } from "../../math/Quaternion";
import { prepareChainPlant } from "./prepareChainPlant";

/*
 * The swivel at which a hinged chain's end joint needs the least articulation
 * to take a requested world rotation, in closed form.
 *
 * On one bend branch the root's bone-local rotation is a first harmonic of the
 * half swivel, `upper(s) = cos(s/2) C + sin(s/2) S`
 * (`hingedArmSwivel.IHarmonic`), and the mid rotation is fixed. A unit
 * quaternion's inverse is its conjugate, which is linear, so the end joint's
 * required bone-local articulation `restInv (W upper(s) Lr lower)^-1 R` is
 * `cos(s/2) X + sin(s/2) Y`, with `X` and `Y` its values at swivels 0 and 180
 * degrees. Its angle from the identity (no articulation) is least where
 * `|cos(s/2) X.w + sin(s/2) Y.w|` is greatest, at `s = 2 atan2(Y.w, X.w)`. The
 * rotation error a fit reads is measured after the end joint's range
 * projection, so this swivel is a start for a local search, not a certified
 * minimum: the caller accepts the search's result only when the rotation is
 * then met.
 * Parameter prepared: The chain's preparation: the root's world rotation, the mid
 * joint's rest rotation and the end joint's base rotation.
 * Parameter posed: The branch's poser, bone-local root and mid rotations at a
 * swivel in degrees.
 * Parameter wanted: The requested world rotation of the end joint.
 * Returns: The swivel, degrees in [0, 360); null when the articulation's scalar
 * part vanishes at both swivels read, so no direction is preferred.
 */
export function hingedRotationStart(
  prepared: Pick<
    NonNullable<ReturnType<typeof prepareChainPlant>>,
    "upper" | "lowerRotation" | "effectorBaseRotation"
  >,
  posed: ReturnType<typeof hingedArmSwivel.pose>,
  wanted: IAutoMovieQuaternion,
): number | null {
  const zero: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> = posed(0);
  const into: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(prepared.upper.worldRotation),
    Quaternion.normalize(wanted),
  );
  const out: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(prepared.effectorBaseRotation),
    Quaternion.inverse(Quaternion.multiply(prepared.lowerRotation, zero.lower)),
  );
  const local = (upper: IAutoMovieQuaternion): IAutoMovieQuaternion =>
    Quaternion.multiply(
      out,
      Quaternion.multiply(Quaternion.inverse(upper), into),
    );
  const a: number = local(zero.upper).w;
  const b: number = local(posed(180).upper).w;
  if (!(Math.hypot(a, b) > 1e-12)) return null;
  return ((((2 * Math.atan2(b, a) * 180) / Math.PI) % 360) + 360) % 360;
}
