import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieFilmOptics,
  IAutoMovieFilmShading,
  IAutoMovieFilmSound,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMark,
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * A subject made ready to draw: its scene, its delivery camera, its clock and
 * raster, and how to put it at a second.
 *
 * The draw function holds one for the life of the page. Before every picture it
 * places the subject by `seek`, or by `seekShot` for a transition's outgoing
 * shot, and waits for it, then asks `marks` for the same second, applies the
 * cell's inspection to `scene`, and draws through the camera the cell's view
 * resolves to. A production's film and a motion case both fit it; nothing in it
 * names what kind of subject it is.
 *
 * Every reader, `marks`, `views`, `optics`, `shading`, `inspectPlaced` and
 * `beforeDraw`, describes the subject as last placed, by `seek` or `seekShot`,
 * and is asked right after that placement; its `seconds` is the output second
 * drawn. After `seekShot` it describes the placed shot at its own shot-local
 * time, so a transition's outgoing tail takes its own exposure, white balance,
 * focus and feeds, not the live entry's. Only what follows the output clock,
 * such as the dialogue mouths, follows `seconds`: after each placement the draw
 * page shows each speaking actor's mouth at that second on the figures bound
 * under the actor's scene node, the object named by the speaker binding's
 * `actor` (`bindAutoMovieDialogueMouth`), so the subject writes no mouth code
 * of its own.
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
   * The sequence `cut` was laid from by `sequenceTimeline`, whose entries'
   * transitions the film picture draws; absent, or without `cut`, every picture
   * is the live placement alone.
   *
   * With it, a delivered or plain `beauty` picture, in the draw page and the
   * interactive viewer alike, and the draw page's `graphics` plate draw the
   * layers `playbackLayersAt` gives at their second: the live entry placed by
   * `seek` and a transition's outgoing entry placed by `seekShot`, each with
   * its own optics and shading read after its placement, composited by
   * `renderAutoMovieFilmFrame`. A cross dissolve mixes the two shots and a fade
   * dips through black, or through alpha 0 over a transparent background and
   * for the plate, as `IAutoMovieTransition` states. Inspection pictures,
   * structural passes, marks, labels, the camera record and diagnostics follow
   * the shot `playbackShownLayer` names, placed last, and the witness cubes
   * stand over a composite at full strength.
   */
  sequence?: IAutoMovieSequence;

  /**
   * The subject's own named views, each placing a camera in world metres for
   * the last placement at a second; absent when it has none.
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
   * The marks the subject's owners supply for the last placement at a second,
   * asked for right after it; absent when it supplies none.
   */
  marks?: (seconds: number) => readonly IAutoMovieMark[];

  /**
   * The film's camera response for the last placement at a second, asked for
   * right after `seek` or `seekShot` before each beauty draw; absent draws the
   * beauty pass straight to the canvas under the renderer's own curve, as
   * before optics existed.
   *
   * When present, the draw host and the inspector render the beauty pass into a
   * linear target with the renderer's curve at none and exposure at one, and
   * `AutoMovieFilmResponseStage` gives it this response; the draw host gives
   * the `graphics` plate the same response, so its graphics match the beauty
   * pass's. An out-of-range value throws, naming the second and the field. The
   * other structural passes never ask for it.
   */
  optics?: (seconds: number) => IAutoMovieFilmOptics;

  /**
   * The film's indirect shading for the last placement at a second, asked for
   * right after it before each beauty draw and each sub-frame sample; absent
   * leaves indirect light as the scene's image lighting gives it.
   *
   * `AutoMovieFilmIndirectStage` measures what it asks for and the lit
   * materials read it while the beauty pass draws. A member without `optics` at
   * the same second throws, naming `optics`. Structural passes never ask for
   * it.
   */
  shading?: (seconds: number) => IAutoMovieFilmShading;

  /**
   * Optional production diagnostics of the last placement, read synchronously
   * once the shown shot is placed and ready and before any inspection changes
   * the scene.
   */
  inspectPlaced?: (
    sample: IAutoMovieDrawScene.IPlacedSample,
  ) => IAutoMovieInspectionDiagnostics;

  /**
   * Optional work on the page's renderer after each placement and before any
   * pass's render mode applies, such as drawing surface feeds into their render
   * targets with `IAutoMovieSurfaceGraphicsObject.renderFeeds`: right after the
   * drawn second's placement, after each transition layer's and after each
   * sub-frame sample's, for that placement, with its output second. It sees the
   * scene's own materials, so every pass of a second, the graphics plate's
   * holdouts included, shows the feeds the beauty pass shows. It must leave the
   * renderer's render target as it found it.
   */
  beforeDraw?: (renderer: THREE.WebGLRenderer, seconds: number) => void;

  /**
   * Put every object and the delivery camera at a second; objects may be
   * replaced. The returned promise resolves once the subject is ready,
   * including its textures. The draw host binds inspection after this
   * placement, so no removed object's masks or measurements stand in for the
   * current geometry.
   */
  seek(seconds: number): Promise<void>;

  /**
   * Put every object and the delivery camera as one shot of `sequence` shows
   * them at its own shot-local `time`, during the output second `seconds`: a
   * transition's outgoing shot, whose tail `seek` cannot place because the
   * incoming entry is live there, or a shutter sample or trail time of an entry
   * outside its live span. Anything the subject reads on the output clock, such
   * as the dialogue mouths, is read at `seconds`; every other reader then
   * describes this shot. The returned promise resolves once the subject is
   * ready.
   *
   * `time` is the entry's clock, `playbackEntryTime`, at `seconds`. Outside the
   * entry's trimmed span, a shutter sample or trail time before the in-point,
   * or a trail time after the out-point, it asks for the shot's handles, its
   * source before the trim's start or after its end, and beyond the shot's own
   * ends the shot holds what its clips clamp to. The hosts place a transition's
   * layers in any order and the shot a picture shows last, so a fade's or a
   * dissolve's first half reads every record on this placement rather than on a
   * later `seek`.
   *
   * Required when `sequence` has a transition: a picture inside one is refused
   * without it, naming the subject, the entry and `seekShot`, and so is a
   * fitted view whose framing seconds include a second inside one. Without it a
   * second outside an entry's live span is placed by `seek` at the nearest
   * second the entry is live at, its start or its last second before the next
   * entry, instead of its handle.
   */
  seekShot?(shot: string, time: number, seconds: number): Promise<void>;

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
     * The subject's synchronous placement, when it offers one and this sample
     * was placed by `seek`; absent for a shot placed by `seekShot`, whose clock
     * it cannot reach. A caller that places another second must place this
     * sample's second again before returning.
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
