import { AutoMovieHumanLandmarkSurface } from "../conic/AutoMovieHumanLandmarkSurface";
import type { AutoMovieHumanSegmentFrame } from "../frame/AutoMovieHumanSegmentFrame";

/**
 * The surface at the thumb's root, which divides the hand's skin from the thumb's.
 *
 * The thumb articulates on the hand at its carpometacarpal joint, and its metacarpal lies inside the thenar; the visible thumb leaves
 * the hand at its metacarpophalangeal joint, where the first web's floor stands. Proximal of that joint f1's sections square to the
 * thumb's course are no tube (the web's sheet runs along them), so the thumb is a part on the hand's side and its root is a landmark
 * surface about the metacarpophalangeal centre, as the armscye's is about the shoulder's
 * (`docs/techniques/joints-one-shot.md`, The thumb on the hand's side). The thenar is the hand's.
 *
 * The landmarks ride the thumb's metacarpal, so the surface follows opposition; the loop of the thumb on the hand is not stored: it is
 * generated at the pose from the posed thumb, the posed hand and this surface (`AutoMovieHumanJoinLoop`).
 */
export namespace AutoMovieHumanF1ThumbRoot {
  /**
   * The root's four landmarks on f1's skin, mm in the thumb metacarpal's frame: the skin's first point from the metacarpophalangeal
   * centre straight away from the index finger's knuckle (radial) and to either side of that line, in the plane through the centre
   * square to the thumb's proximal phalanx; and the first web's floor, the skin's crossing nearest the midpoint of the thumb's and
   * the index finger's knuckle centres on the line through it along the bisector of their proximal phalanges. They are read by rule
   * from f1's joint centres and skin (`test/src/reference-conics/FamilyConicThumbRoot.ts`, `FamilyConicJoints.ts --thumb-landmarks`),
   * 9.84, 13.47 and 8.51 mm from the centre and 2.78 mm from the midpoint. Stored in the metacarpal's frame they ride it; a law that
   * places them for a person from her measures is not written yet.
   */
  export const LANDMARKS_MM: readonly (readonly [number, number, number])[] = [
    [-4.67, -45.07, 8.49],
    [10.93, -39.4, 6.79],
    [-6.9, -45.92, -4.29],
    [9.84, -40.74, -17.66],
  ];

  /**
   * The surface: through the four landmarks, about the thumb's metacarpophalangeal centre, its far side toward the thumb's next joint.
   *
   * @param metacarpal The thumb metacarpal's frame at the person and the pose.
   * @param knuckle The metacarpophalangeal centre, mm in the figure's frame.
   * @param next The interphalangeal centre, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each landmark is carried from the metacarpal's frame to the figure's by the frame's origin and axes, and the surface is built about the knuckle as the fit's is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame map and one construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No landmark is read from a mesh or moved by a tolerance; the surface's own refusals pass through.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four points and one surface preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned surface serves every read of the loop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the surface's own closure only.
   * @evidence contracts/development/common.md#meaningful-documentation States frames and units.
   */
  export function surface(metacarpal: AutoMovieHumanSegmentFrame.IFrame, knuckle: readonly number[], next: readonly number[]): AutoMovieHumanLandmarkSurface.ISurface {
    const world = (local: readonly number[]): [number, number, number] => [0, 1, 2].map((k: number): number => metacarpal.origin[k]! + local[0]! * metacarpal.axes[0][k]! + local[1]! * metacarpal.axes[1][k]! + local[2]! * metacarpal.axes[2][k]!) as [number, number, number];
    return AutoMovieHumanLandmarkSurface.create(knuckle, LANDMARKS_MM.map(world), next);
  }
}
