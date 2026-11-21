import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMark,
} from "@automovie/interface";
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

  /** Optional source intent for auditing the delivered file. */
  delivery?: IAutoMovieDeliveryContentAudit.IIntent;

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

  /** Kind names the subject declares for its lifetime. Capture planning, drawing and Viewer controls admit them at empty frames. `marks` supplies geometry and styles at each second and can supply additional kinds. */
  markKinds?: readonly string[];

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
   * Optional production diagnostics, read synchronously after the outer seek is ready and before any inspection changes the scene.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the observation's position relative to placement and inspection, and that participation is optional.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The producer implements this signature using the supplied placed sample.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature has no body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The producer owns its check. The host supplies the unmasked settled sample.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The producer owns its budget.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The host supplies the already placed sample.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer borrows inputs for the call.
   */
  inspectPlaced?: (
    sample: IAutoMovieDrawScene.IPlacedSample,
  ) => IAutoMovieInspectionDiagnostics;

  /**
   * Put every object and the delivery camera at a second; objects may be replaced. The returned promise resolves once the subject is ready, including its textures. The draw host binds inspection after this placement, so no removed object's masks or measurements stand in for the current geometry.
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
   * Place the scene at a second synchronously, leaving it exactly as an
   * awaited `seek` to the same second would. Offered only by a subject whose
   * placement needs nothing asynchronous; inspection uses it to sample motion
   * between output frames and then places the drawn second again.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the equivalence with `seek` and who uses it.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
   */
  place?(seconds: number): void;

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

/** Types shared by the draw and review hosts of a placed subject. */
export namespace IAutoMovieDrawScene {
  /**
   * The same settled delivery scene for any host, before the view or overlays select what the audience sees.
   *
   * @evidence contracts/development/design.md#principled-representation The clock, world scene, camera and delivery raster describe a single evaluated sample.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the placed inputs and the capture and delivery renderer access that diagnostics use.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Review views never determine the delivery projection. Full raster inspection is available only where the offscreen capture or delivery host supplies its renderer and sample factor.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the origin of the projection, the raster dimensions and when the renderer is available.
   */
  export interface IPlacedSample {
    /** Film time with an exact delivery frame when available. */
    readonly time: IAutoMovieInspectionDiagnostics.ITime;

    /** The subject's settled world scene. Borrowed for this sample. */
    readonly scene: THREE.Scene;

    /** The delivery camera and its projection at the subject's raster. */
    readonly camera: THREE.PerspectiveCamera;

    /** Delivery raster width in pixels before supersampling. */
    readonly width: number;

    /** Delivery raster height in pixels before supersampling. */
    readonly height: number;

    /** Which host placed this scene. The Viewer samples actual painted frames. */
    readonly mode: "viewer" | "capture" | "delivery";

    /** The subject's synchronous placement, when it offers one. A caller that places another second must place this sample's second again before returning. */
    readonly place?: (seconds: number) => void;

    /** Scratch render access for the offscreen capture and delivery audits, absent in the Viewer. Restore renderer and scene state before returning. */
    readonly auditRaster?: {
      /** The renderer used for the actual offscreen delivery. */
      readonly renderer: THREE.WebGLRenderer;

      /** Native samples along each side of an output pixel. */
      readonly factor: 1 | 2;
    };
  }
}
