import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { portraitPatch } from "../../mesh/portraitPatch";
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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Builds a numerical lash from its current margin root without reshaping skin or optics.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Preserves arc length under signed curl and mirrors the fan with anatomical side.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Carries the strand orientation with lid motion while leaving its current root fixed.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Applies observed-relative rigid radial transport independently of gaze and optical geometry.
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
  return portraitPatch(
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
