import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaceRays,
  IAutoMovieHumanoidSurfaceReader,
  IAutoMovieHumanoidSurfaces,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * The tip and the pad of every digit of both hands, as bone-local frames on
 * each digit's distal phalanx.
 *
 * A digit's tip is where a ray from its last joint, along its distal phalanx
 * (the line from the joint before it), leaves the phalanx's colliders, with the
 * exited collider's outward normal: the index fingertip as
 * `resolveAutoMovieHumanoidSurfaces` has always placed it, now for every digit.
 * Its pad is the palmar face of the same phalanx: where a ray from the middle
 * of the phalanx, between the last joint and the tip, leaves the colliders
 * toward the palm's side. The palm faces -Y in the canonical rest
 * (`HUMANOID_REST_FRAME`), so the palmar direction is -Y made perpendicular to
 * the phalanx; the rig's thumb lies in the palm's plane with its nail up, so
 * its pad faces the same side. A profile with no segment for a phalanx reads
 * the hand's colliders instead, as the index tip did.
 *
 * Both sides are resolved; the caller replaces each left frame with its right
 * twin's mirror image, as it does for every region.
 *
 * @param rays The rest-pose readers of the body
 *   (`AutoMovieHumanoidSurfaceRays.tools`).
 * @param profile The body's physical profile, segments keyed by rig bones.
 * @returns The tip and pad frames of every digit, keyed by region.
 * @throws {Error} When a digit bone is missing or a ray misses its colliders.
 */
export function AutoMovieHumanoidDigitSurfaces(
  rays: Pick<IAutoMovieHumanoidSurfaceReader, "at" | "local" | "surface">,
  profile: IAutoMoviePhysicalProfile,
): Partial<Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>> {
  const out: Partial<
    Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>
  > = {};
  const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  for (const Side of ["Left", "Right"] as const) {
    const side: string = Side.toLowerCase();
    for (const digit of DIGITS) {
      const bone = (segment: string): AutoMovieHumanoidBone =>
        `${side}${digit}${segment}` as AutoMovieHumanoidBone;
      const distal: AutoMovieHumanoidBone = bone("Distal");
      const joint: IAutoMovieVector3 = rays.at(distal).worldPosition;
      const along: IAutoMovieVector3 = Vector3.subtract(
        joint,
        rays.at(bone(digit === "Thumb" ? "Proximal" : "Intermediate"))
          .worldPosition,
      );

      // The phalanx's own colliders, or the hand's when the profile gives
      // the phalanx none.
      const phalanx: AutoMovieHumanoidBone = profile.segments.some(
        (x: IAutoMoviePhysicalSegment): boolean => x.bone === distal,
      )
        ? distal
        : (`${side}Hand` as AutoMovieHumanoidBone);
      const name: string = digit.toLowerCase();
      const tip: IAutoMovieHumanoidSurfaceRays.ISurfacePoint = rays.surface(
        phalanx,
        joint,
        along,
      );
      out[`${name}Tip${Side}` as AutoMovieHumanoidRegion] = rays.local(
        distal,
        tip.point,
        tip.normal,
      );

      // The pad: from the phalanx's middle toward the palm's side.
      const unit: IAutoMovieVector3 = Vector3.normalize(along);
      const palmar: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(down, Vector3.scale(unit, Vector3.dot(down, unit))),
      );
      const pad: IAutoMovieHumanoidSurfaceRays.ISurfacePoint = rays.surface(
        phalanx,
        Vector3.lerp(joint, tip.point, 0.5),
        palmar,
      );
      out[`${name}Pad${Side}` as AutoMovieHumanoidRegion] = rays.local(
        distal,
        pad.point,
        pad.normal,
      );
    }
  }
  return out;
}

/** The digits, as their rig bone names spell them. */
const DIGITS = ["Thumb", "Index", "Middle", "Ring", "Little"] as const;
