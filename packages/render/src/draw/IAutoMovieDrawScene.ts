import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDialogueMouths,
  IAutoMovieFilmOptics,
  IAutoMovieFilmShading,
  IAutoMovieFilmSound,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMark,
  IAutoMoviePlaybackTimeline,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * A subject made ready to draw: its scene, its delivery camera, its clock and
 * raster, and how to put it at a second.
 *
 * The draw function holds one for the life of the page. Before every picture it
 * calls `seek` and waits for it, then asks `marks` for the same second, applies
 * the cell's inspection to `scene`, and draws through the camera the cell's
 * view resolves to. A production's film and a motion case both fit it; nothing
 * in it names what kind of subject it is.
 */
export interface IAutoMovieDrawScene {
  /** The scene drawn, owned by the subject until `dispose`. */
  scene: THREE.Scene;

  /**
   * The delivery camera, which the `film` view draws through and whose field of
   * view and clips the other views take.
   */
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

  /**
   * Optional adopted sound list, which the render mixes into the delivered
   * soundtrack.
   */
  sound?: IAutoMovieFilmSound;

  /**
   * The film's cut on the output clock, the timeline of its sequence entries,
   * which the delivery render records against the frames it draws; absent when
   * the subject has no sequence.
   */
  cut?: IAutoMoviePlaybackTimeline;

  /**
   * The subject's own named views, each placing a camera in world metres at a
   * second; absent when it has none.
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
   * Instants the subject names, such as a motion case's beats, which captions
   * and records of cells drawn at them carry; absent when it names none.
   */
  instants?: readonly { seconds: number; label: string }[];

  /**
   * Kind names the subject declares for its lifetime. Capture planning, drawing
   * and Viewer controls admit them at empty frames. `marks` supplies geometry
   * and styles at each second and can supply additional kinds.
   */
  markKinds?: readonly string[];

  /**
   * The marks the subject's owners supply at a second, asked for after `seek`;
   * absent when it supplies none.
   */
  marks?: (seconds: number) => readonly IAutoMovieMark[];

  /**
   * The film's camera response at a second, asked for after `seek` before each
   * beauty draw; absent draws the beauty pass straight to the canvas under the
   * renderer's own curve, as before optics existed.
   *
   * When present, the draw host and the inspector render the beauty pass into a
   * linear target with the renderer's curve at none and exposure at one, and
   * `AutoMovieFilmResponseStage` gives it this response. An out-of-range value
   * throws, naming the second and the field. Structural passes never ask for
   * it.
   */
  optics?: (seconds: number) => IAutoMovieFilmOptics;

  /**
   * The film's indirect shading at a second, asked for after `seek` before each
   * beauty draw; absent leaves indirect light as the scene's image lighting
   * gives it.
   *
   * `AutoMovieFilmIndirectStage` measures what it asks for and the lit
   * materials read it while the beauty pass draws. A member without `optics` at
   * the same second throws, naming `optics`. Structural passes never ask for
   * it.
   */
  shading?: (seconds: number) => IAutoMovieFilmShading;

  /**
   * Optional production diagnostics, read synchronously after the outer seek is
   * ready and before any inspection changes the scene.
   */
  inspectPlaced?: (
    sample: IAutoMovieDrawScene.IPlacedSample,
  ) => IAutoMovieInspectionDiagnostics;

  /**
   * Optional work on the page's renderer before each picture is drawn, after
   * `seek` and any inspection, such as drawing surface feeds into their render
   * targets with `IAutoMovieSurfaceGraphicsObject.renderFeeds`. It must leave
   * the renderer's render target as it found it.
   */
  beforeDraw?: (renderer: THREE.WebGLRenderer, seconds: number) => void;

  /**
   * Take the film's dialogue mouths, handed once before the first picture by a
   * host that admitted the subject's sound list: the capture and the delivery
   * render. The subject reads each speaking actor's mouth in `seek` and `place`
   * for the second it places, in the form the actor's figure takes, and layers
   * it over the authored expression. Absent, no mouth follows the sound and the
   * delivery render lists each bound phoneme-driven line as `mouth-not-drawn`.
   *
   * The interactive inspector hands no mouths, because it reads no sound file;
   * it shows the authored mouth until the viewer gains a file host.
   */
  speak?(mouths: IAutoMovieDialogueMouths): void;

  /**
   * Put every object and the delivery camera at a second; objects may be
   * replaced. The returned promise resolves once the subject is ready,
   * including its textures. The draw host binds inspection after this
   * placement, so no removed object's masks or measurements stand in for the
   * current geometry.
   */
  seek(seconds: number): Promise<void>;

  /**
   * Place the scene at a second synchronously, leaving it exactly as an awaited
   * `seek` to the same second would. Offered only by a subject whose placement
   * needs nothing asynchronous; inspection uses it to sample motion between
   * output frames and then places the drawn second again.
   */
  place?(seconds: number): void;

  /** Release the scene's resources when the page is done with it. */
  dispose(): void;
}

/** Types shared by the draw and review hosts of a placed subject. */
export namespace IAutoMovieDrawScene {
  /**
   * The same settled delivery scene for any host, before the view or overlays
   * select what the audience sees.
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

    /**
     * The subject's synchronous placement, when it offers one. A caller that
     * places another second must place this sample's second again before
     * returning.
     */
    readonly place?: (seconds: number) => void;

    /**
     * Scratch render access for the offscreen capture and delivery audits,
     * absent in the Viewer. Restore renderer and scene state before returning.
     */
    readonly auditRaster?: {
      /** The renderer used for the actual offscreen delivery. */
      readonly renderer: THREE.WebGLRenderer;

      /** Native samples along each side of an output pixel. */
      readonly factor: 1 | 2;
    };
  }
}
