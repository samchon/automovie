import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import { IPortraitEyelashProfile } from "./IPortraitEyelashProfile";
import { assertPortraitEyelashProfile } from "./assertPortraitEyelashProfile";

/**
 * Sweep one constant-curvature lash with a frame that stays defined for a
 * straight anterior strand. The arc integral uses sinc at zero, so straight
 * and arbitrarily shallow curls do not divide by a tiny turn angle.
 * Optional motion supplies observed and current globe-to-lid directions in
 * the same frame. Their shortest rotation acts about the current root, without
 * changing length or radius. Antipodal directions have no unique transport.
 *
 * `origin` is the root in head millimetres (+X anatomical left, +Y superior,
 * +Z anterior) and the mesh is returned in the same millimetres, so the caller
 * converts to model metres once. `at` is the root's medial-to-lateral progress
 * along the lid in [0,1] for this eye's side, and `index` the strand's rank,
 * which seeds the deterministic length variation. A strand is 0.45 to 1 of the
 * profile length by `sin(pi at)^0.7`, longest at mid-lid and shortest at both
 * canthi, and is shortened by up to `variation` by `cos(2.4 index)^2`. Both
 * shapes are authoring conventions, not measured length distributions. The
 * emitted strand is a tube lattice of 8 columns by 12 rows whatever its length, so
 * the eye's lash population equals its strand count. A profile outside its
 * envelope, a non-finite root, an out-of-range progress or index, a radius not
 * below the centreline curvature radius and an antipodal transport all throw
 * before any geometry is returned.
 *
 * @evidence contracts/common.md#principled-implementation The centreline of constant curvature is integrated in closed form: for total turn c and arc length s, a point at fraction t lies at distance s*t*sinc(c*t/2) along the direction initial + c*t/2, which is the chord of a circular arc, and the sinc limit of one keeps the straight strand exact. The transport rotates the whole strand by the shortest arc between two unit directions (axis cross, angle atan2(|cross|, dot)), which preserves length and radius because it is rigid, and the one degenerate case, antipodal directions, has no unique rotation and is refused. A tube of radius above the curvature radius would self-intersect on the inside of the bend, which the radius guard refuses.
 * @evidence contracts/common.md#clear-and-simple-design One function turns one root and a profile into one strand: length law, frame, sweep and optional rigid transport in order, with the strand tessellation as its only fixed choice and no option beyond the optional motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased for a subject, a fixture or an expected answer; the strand is a function of the root, the profile, the side, the progress and the index. No foreign method is replaced and no compensating wrapper hides an earlier assumption.
 * @evidence contracts/common.md#meaningful-documentation The comment states the units and frame of the root and the mesh, what `at` and `index` mean, the length law and that it is a convention, the fixed tessellation, and every input that throws.
 * @evidence contracts/modeling.md#spatial-conventions Root and mesh share the head millimetre frame with one handedness (+X left, +Y up, +Z anterior); degrees are converted once through the named `radians` factor, and metres are produced by the caller's metric conversion, so the function converts no frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function emits one strand mesh and defines neither the part identity nor the group that composes strands; the eye builder names and groups them.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the profile as a whole and defines no channel.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The caller places the root on the lid margin; the function builds only the free strand and no boundary shared with another part.
 */
export function buildPortraitEyelash(
  origin: IAutoMovieVector3,
  profile: IPortraitEyelashProfile,
  side: "right" | "left",
  at: number,
  index: number,
  motion?: { from: IAutoMovieVector3; to: IAutoMovieVector3 },
): IAutoMovieMesh {
  assertPortraitEyelashProfile(profile);
  if (
    ![origin.x, origin.y, origin.z, at].every(Number.isFinite) ||
    at < 0 ||
    at > 1 ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    (side !== "left" && side !== "right")
  )
    throw new Error(
      "A lash needs a finite root, anatomical side, unit progress and nonnegative safe strand index.",
    );
  const radians = Math.PI / 180;
  const length =
    profile.length *
    (0.45 + 0.55 * Math.sin(Math.PI * at) ** 0.7) *
    (1 - profile.variation * Math.cos(index * 2.4) ** 2);
  const initial = profile.elevation * radians;
  const curl = profile.curl * radians;
  if (profile.radius * Math.abs(curl) >= length)
    throw new Error(
      "A lash radius must stay below its centreline curvature radius.",
    );
  const fan = (side === "left" ? 1 : -1) * (at - 0.45) * profile.fan * radians;
  const sinFan = Math.sin(fan),
    cosFan = Math.cos(fan);
  let rotation: IAutoMovieQuaternion | undefined;
  if (motion !== undefined) {
    const directions = [motion.from, motion.to].map((value) => {
      const size = Math.hypot(value.x, value.y, value.z);
      if (!Number.isFinite(size) || size === 0)
        throw new Error(
          "Lash transport needs finite nonzero radial directions.",
        );
      return { x: value.x / size, y: value.y / size, z: value.z / size };
    });
    const cross = Vector3.cross(directions[0], directions[1]);
    const sine = Vector3.length(cross),
      cosine = Vector3.dot(directions[0], directions[1]);
    if (sine === 0 && cosine < 0)
      throw new Error("Antipodal lash directions have no unique transport.");
    if (sine !== 0)
      rotation = Quaternion.fromAxisAngle(
        cross,
        (Math.atan2(sine, cosine) * 180) / Math.PI,
      );
  }
  return triangulateSurfaceLattice(
    (u, t) => {
      const half = (curl * t) / 2;
      const distance = length * t * (half === 0 ? 1 : Math.sin(half) / half);
      const forward = distance * Math.cos(initial + half);
      const upward = distance * Math.sin(initial + half);
      const angle = initial + curl * t;
      const radius = profile.radius * (1 - profile.taper * t);
      const a = radius * Math.cos(2 * Math.PI * u);
      const b = radius * Math.sin(2 * Math.PI * u);
      const offset = {
        x: sinFan * forward + cosFan * a - sinFan * Math.sin(angle) * b,
        y: upward + Math.cos(angle) * b,
        z: cosFan * forward - sinFan * a - cosFan * Math.sin(angle) * b,
      };
      return Vector3.add(
        origin,
        rotation === undefined
          ? offset
          : Quaternion.rotateVector(rotation, offset),
      );
    },
    8,
    12,
  );
}
