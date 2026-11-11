import type { AutoMoviePhysicsCache, IAutoMovieMark } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * A mounted film's scene, camera and exact-time performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment names what one mount holds; each member states what it owns and when it runs.
 * @evidence contracts/development/design.md#principled-representation Playback, seeking and capture all place the scene through one seek per second, so a second reached by any path draws the same state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the Viewer entry reads to draw, seek and release a film, plus the three optional review sources it reads only when a review overlay, a named view or inspection marks are requested.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No playback-only or capture-only member exists; named views move only a separate inspection camera, so the film camera and delivered captures are unchanged.
 */
export interface IFilmProduction {
  /** Scene the Viewer renders, owned by this mount. */
  scene: THREE.Scene;

  /** Camera the Viewer renders through; camera entities move it in `seek`. */
  camera: THREE.PerspectiveCamera;

  /** Optional shared physical review source, used only when a review overlay is requested. */
  performance?: {
    /** Scene ids and profiles for the displayed bodies. */
    bodies: { id: string; profile: IAutoMoviePhysicalProfile }[];
    /** Exact world state used by the current displayed frame. */
    frame: () => AutoMoviePhysicsCache.IFrame;
    /** Actual geometric or solved contact episodes. */
    contacts: () => readonly IAutoMovieContactReceipt[];
    /** Explicit simultaneous contact-overlay budget. */
    maximumContacts: number;
    /** Inspection vector length per newton of step-mean force. */
    metresPerNewton: number;
  };

  /**
   * Optional named review cameras that the Viewer's `view` parameter selects,
   * such as a side-on view, one behind each subject or a high 45° view; each
   * places the inspection camera for the drawn second and leaves the film
   * camera untouched.
   */
  views?: Readonly<
    Record<
      string,
      (seconds: number) => {
        /** Camera position in world metres. */
        position: readonly [number, number, number];
        /** Point the camera looks at, in world metres. */
        target: readonly [number, number, number];
      }
    >
  >;

  /**
   * Optional inspection marks of the film at an exact second: what its owners locate, such as the construction curves of its built forms from `markAutoMovieConstructionCurves`. They are drawn only when an inspection's `marks` parameter names their kinds, in the Viewer and in a capture alike, and the drawn second's marks are asked for after `seek`.
   */
  marks?: (seconds: number) => readonly IAutoMovieMark[];

  /**
   * Places every displayed object and the camera for an exact film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the call places every displayed object and the camera for one exact second.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  seek(seconds: number): void;

  /**
   * Releases the scene's resources when the Viewer page closes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the call releases and when.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  dispose(): void;
}
