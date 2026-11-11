import type { IApplyAutoMovieInspectionProps } from "@automovie/render";
import type * as THREE from "three";

/**
 * One subject the inspector can show: a name and the call that builds an instance of it.
 *
 * A subject is whatever a page offers for inspection, such as one film of a production or one motion case. Nothing here names what kind of thing it is: the inspector reads a scene, a camera, a clock, a raster, the subject's own views and the marks its owners supply. This is the inspector's minimal reading of the subject contract of the draw-only page (#3311), which a production's film registry and a motions case both satisfy, and the two are to be aligned when that contract lands in `@automovie/render`.
 *
 * @evidence contracts/development/design.md#principled-representation A subject is a name plus a factory, because building a scene acquires resources the page must release; the instance holds what one mount owns. Seconds are subject seconds, the raster is pixels, view poses are world metres and marks are the engine's plain-data marks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the viewer as the inspector's input and read only by `mountAutoMovieInspectorScene` and `selectAutoMovieInspectorSubject`; marks are the engine's mark list as `applyAutoMovieInspection` takes it, read through render's props so the viewer adds no engine dependency, and the view pose shape is the one `resolveAutoMovieInspectionView` takes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a film, a figure or a case. Optional `views` and `marks` mean the subject has none, not an empty default. That the duration and raster are positive is checked by the mount at runtime.
 * @evidence contracts/development/common.md#meaningful-documentation States what a subject is, who reads it, which contract it mirrors and that alignment with #3311 is pending.
 */
export interface IAutoMovieInspectorSubject {
  /**
   * Name the request's `subject` key selects, unique among the subjects one inspector is given.
   */
  name: string;

  /**
   * Build one instance of the subject. Each mount of the inspector's canvas calls it once and disposes the instance when the mount ends, including a mount that ends before the instance arrives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when it is called and who releases what it returns.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the mount releases the instance through its `dispose`.
   */
  create(): Promise<IAutoMovieInspectorSubject.IInstance>;
}
export namespace IAutoMovieInspectorSubject {
  /**
   * One built instance of a subject, owned by one mount of the inspector until its `dispose`.
   *
   * @evidence contracts/development/design.md#principled-representation The scene and the delivery camera are three.js objects the renderer draws; the clock is subject seconds, the raster is the pixel size every still of the subject is drawn at, view poses are world metres at a subject second, and marks are the engine's plain data at a subject second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member is read by the mount: the scene and camera to draw, the duration for the playhead, the raster for the picture's aspect, `seek` and `marks` per drawn second, `views` for view names and their poses, `dispose` at the end.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The raster is the subject's, not the canvas's, so the page frames a view with the aspect a capture of the same subject uses.
   * @evidence contracts/development/common.md#meaningful-documentation States who owns the instance and each member's unit and meaning.
   */
  export interface IInstance {
    /** Scene drawn, owned by this instance. */
    scene: THREE.Scene;

    /** Delivery camera; the `film` view draws through it and the other views take its field of view and clips. */
    camera: THREE.PerspectiveCamera;

    /** Running time in seconds, positive. */
    durationSeconds: number;

    /** Width in pixels of a still of the subject, positive; with `height` it fixes the picture's aspect. */
    width: number;

    /** Height in pixels of a still of the subject, positive. */
    height: number;

    /**
     * The subject's own named views, each placing a camera in world metres at a subject second.
     */
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

    /**
     * The marks the subject's owners supply at a subject second, asked for after `seek` to that second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what is returned and when it is asked for.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
     */
    marks?: (
      seconds: number,
    ) => NonNullable<IApplyAutoMovieInspectionProps["marks"]>;

    /**
     * Place every drawn object and the delivery camera for an exact subject second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what the call places and for which time.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
     */
    seek(seconds: number): void;

    /**
     * Release everything the instance holds. The mount calls it once, after restoring the inspection it applied.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what is released and when it is called.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
     */
    dispose(): void;
  }
}
