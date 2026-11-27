import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { hingedArmSwivel } from "../../kinematics/hingedArmSwivel";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { prepareChainPlant } from "./prepareChainPlant";

/**
 * The swivel at which a hinged chain whose mid segment twists distally (a
 * forearm) needs the least end-joint articulation (the wrist's bend) to take a
 * requested world rotation, in closed form.
 *
 * On one bend branch the root's bone-local rotation is a first harmonic of the
 * half swivel, `upper(s) = cos(s/2) C + sin(s/2) S`
 * (`hingedArmSwivel.IHarmonic`), and the mid rotation is fixed, so the rotation
 * the mid segment's far end must still supply, `P(s) = (Lr lower)^-1
 * upper(s)^-1 W^-1 R base^-1`, is `cos(s/2) X + sin(s/2) Y` with `X` and `Y`
 * its values at swivels 0 and 180 degrees (conjugation is linear). The
 * segment's distal twist turns about its own long axis `a` for free inside its
 * range, so of `P` only the swing away from `a` is left to the end joint: with
 * `P = (w, v)` the swing's half angle has cosine `sqrt(w^2 + (v . a)^2)` (the
 * swing-twist decomposition). Both `w` and `v . a` are linear in `(cos(s/2),
 * sin(s/2))`, so that squared cosine is a quadratic form `[c s] M [c s]^T`
 * whose greatest value lies along `M`'s principal axis, at the half swivel
 * `atan2(2 M12, M11 - M22) / 2`.
 *
 * The rotation error a fit reads is measured after the twist's and the end
 * joint's range projections, so this swivel is a start for a local search, not
 * a certified minimum: the caller accepts the search's result only when the
 * rotation is then met.
 *
 * @param prepared The chain's preparation: the root's world rotation, the mid
 *   joint's rest rotation, the end joint's offset from the mid joint and its
 *   base rotation.
 * @param posed The branch's poser, bone-local root and mid rotations at a
 *   swivel in degrees.
 * @param wanted The requested world rotation of the end joint.
 * @returns The swivel, degrees in [0, 360); null when the mid segment has no
 *   length or the form is isotropic, so no swivel is preferred.
 */
export function hingedTwistStart(
  prepared: Pick<
    NonNullable<ReturnType<typeof prepareChainPlant>>,
    "upper" | "lowerRotation" | "effectorOffset" | "effectorBaseRotation"
  >,
  posed: ReturnType<typeof hingedArmSwivel.pose>,
  wanted: IAutoMovieQuaternion,
): number | null {
  const length: number = Vector3.length(prepared.effectorOffset);
  if (!(length > 1e-12)) return null;
  const axis: IAutoMovieVector3 = Vector3.scale(
    prepared.effectorOffset,
    1 / length,
  );
  const zero: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> = posed(0);

  // P(s) = out upper(s)^-1 into, read at the two swivels that span it.
  const into: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(
      Quaternion.inverse(prepared.upper.worldRotation),
      Quaternion.normalize(wanted),
    ),
    Quaternion.inverse(prepared.effectorBaseRotation),
  );
  const out: IAutoMovieQuaternion = Quaternion.inverse(
    Quaternion.multiply(prepared.lowerRotation, zero.lower),
  );
  const remaining = (upper: IAutoMovieQuaternion): IAutoMovieQuaternion =>
    Quaternion.multiply(
      out,
      Quaternion.multiply(Quaternion.inverse(upper), into),
    );
  const x: IAutoMovieQuaternion = remaining(zero.upper);
  const y: IAutoMovieQuaternion = remaining(posed(180).upper);
  const along = (q: IAutoMovieQuaternion): number =>
    q.x * axis.x + q.y * axis.y + q.z * axis.z;

  // The squared cosine of the swing's half angle as a form in
  // (cos(s/2), sin(s/2)).
  const m11: number = x.w * x.w + along(x) * along(x);
  const m22: number = y.w * y.w + along(y) * along(y);
  const m12: number = x.w * y.w + along(x) * along(y);
  if (!(Math.hypot(2 * m12, m11 - m22) > 1e-12)) return null;
  const half: number = Math.atan2(2 * m12, m11 - m22) / 2;
  return ((((2 * half * 180) / Math.PI) % 360) + 360) % 360;
}
