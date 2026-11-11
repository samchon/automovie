import type { IAutoMovieMark } from "@automovie/engine";
import type * as THREE from "three";

/**
 * A subject made ready to draw: its scene, its delivery camera, its clock and raster, and how to put it at a second.
 *
 * The draw function holds one for the life of the page. Before every picture it calls `seek` and waits for it, then asks `marks` for the same second, applies the cell's inspection to `scene`, and draws through the camera the cell's view resolves to. A production's film and a motion case both fit it; nothing in it names what kind of subject it is.
 *
 * @evidence contracts/development/design.md#principled-representation Seconds are the subject's own timebase, the raster is whole pixels, and `seek` returns a promise that resolves when the subject is ready, such as once a texture has loaded, so the draw function waits for exactly that and nothing else; a subject that is ready at once resolves at once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Every member is read by `installAutoMovieDraw`: the scene and camera to draw, the clock, raster and named instants for the capture plan, `views` and `marks` for the inspection, `seek` and `dispose` for its life. View placements and marks use the shapes `resolveAutoMovieInspectionView` and `IAutoMovieMark` already own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a film, a figure or a case. A positive clock and raster are checked by the capture planner at runtime.
 * @evidence contracts/development/common.md#meaningful-documentation States who holds it, the order the draw function calls its members in, and each member's unit and absent meaning.
 */
export interface IAutoMovieDrawScene {
  /** The scene drawn, owned by the subject until `dispose`. */
  scene: THREE.Scene;

  /** The delivery camera, which the `film` view draws through and whose field of view and clips the other views take. */
  camera: THREE.PerspectiveCamera;

  /** Running time in seconds. */
  durationSeconds: number;

  /** Frames per second of the subject's own grid. */
  fps: number;

  /** Width in pixels of every picture drawn of the subject. */
  width: number;

  /** Height in pixels of every picture drawn of the subject. */
  height: number;

  /** The subject's own named views, each placing a camera in world metres at a second; absent when it has none. */
  views?: Readonly<
    Record<
      string,
      (seconds: number) => {
        /** Camera position, world metres. */
        position: readonly [number, number, number];

        /** Point looked at, world metres. */
        target: readonly [number, number, number];
      }
    >
  >;

  /** Instants the subject names, such as a motion case's beats, which captions and records of cells drawn at them carry; absent when it names none. */
  instants?: readonly { seconds: number; label: string }[];

  /**
   * The marks the subject's owners supply at a second, asked for after `seek`; absent when it supplies none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned, when it is asked for, and what absence means.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
   */
  marks?: (seconds: number) => readonly IAutoMovieMark[];

  /**
   * Put every object and the delivery camera at a second; the returned promise resolves once the subject is ready to be drawn at it, such as when its textures for that second have loaded.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is placed and what the promise means.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
   */
  seek(seconds: number): Promise<void>;

  /**
   * Release the scene's resources when the page is done with it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is released and when.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
   */
  dispose(): void;
}
