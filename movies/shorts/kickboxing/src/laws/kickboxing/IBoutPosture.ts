import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One performer's posture at an instant, in his own frame (+X forward, +Y
 * up, +Z own left, origin on the floor under his stance origin before any
 * shift): the shape laws write it, and the performance resolves it into a
 * clinical pose by limb fitting against the floor and the opponent.
 * Channels are clinical degrees; hands are glove-centre goals and lifted
 * feet ankle goals, both in the body frame; a planted foot stays on its
 * stance placement in the world.
 *
 * @evidence docs/research/kickboxing/techniques.md#laws Shapes are stated in the performer's own body frame.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, origin, units and the planted-foot meaning.
 * @evidence contracts/development/design.md#principled-representation Lengths in metres, angles in radians for the root and clinical degrees for joints; a planted foot is `null`, so a lifted foot always carries its point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the shape laws write and the performance reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No technique or fighter is named.
 */
export interface IBoutPosture {
  /** Root lowered below standing, metres. */
  drop: number;

  /** Root offset in the facing frame: forward and own-left, metres. */
  shift: { forward: number; left: number };

  /** Body yaw added to the facing direction, radians: a right-handed turn about +Y, so positive turns the front toward the own right. */
  yaw: number;

  /** Whole-body pitch forward, radians (fall). */
  pitch: number;

  /** Whole-body roll toward the own right, radians (fall). */
  roll: number;

  /** Pelvis channels, degrees. */
  pelvis: { tilt: number; obliquity: number; rotation: number };

  /** Thoracic channels, degrees. */
  thoracic: { flexion: number; lateralFlexion: number; rotation: number };

  /** Lumbar channels, degrees. */
  lumbar: { flexion: number; lateralFlexion: number };

  /** Cervical channels, degrees. */
  cervical: { flexion: number; lateralFlexion: number; rotation: number };

  /** Glove-centre goals and optional elbow aims, body frame, metres. */
  hands: Record<
    "left" | "right",
    { point: IAutoMovieVector3; elbow?: IAutoMovieVector3 }
  >;

  /** Ankle goals of lifted feet and optional knee aims, body frame, metres; null keeps the stance placement. */
  feet: Record<
    "left" | "right",
    { point: IAutoMovieVector3; knee?: IAutoMovieVector3 } | null
  >;

  /** Turn of the support foot about the floor normal, radians, positive toward the own left. */
  pivot: number;

  /** Jaw opening, millimetres at the incisors. */
  jaw: number;

  /** Strain shown on the face, in [0, 1]. */
  wince: number;
}
