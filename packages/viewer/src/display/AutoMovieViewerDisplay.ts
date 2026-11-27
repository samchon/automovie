import type * as THREE from "three";
import { applyCaptureCanvasSize as applyViewerCaptureCanvasSize } from "./internal/applyCaptureCanvasSize.js";
import { createViewerCameraState } from "./internal/createViewerCameraState.js";
import { createViewerViewportResize } from "./internal/createViewerViewportResize.js";

import { createViewerDisplayClock } from "./internal/createViewerDisplayClock.js";
import { createViewerDisplayPublication } from "./internal/createViewerDisplayPublication.js";
import { createViewerDisplaySave } from "./internal/createViewerDisplaySave.js";
import { createViewerFrameControl } from "./internal/createViewerFrameControl.js";
import { publishViewerCompletedFrame } from "./internal/publishViewerCompletedFrame.js";
import { redrawViewerCompletedFrame } from "./internal/redrawViewerCompletedFrame.js";

/** Owns Viewer display clocks, completed-frame publication and saving. */
export namespace AutoMovieViewerDisplay {
  /** A completed display clock that distinguishes requests from drawn frames. */
  export interface IClock {
    /** Last committed display time in seconds. */
    current(): number;
    /** Run a producer under its requested scene time. */
    run(seconds: number, produce: () => void): void;
    /** Commit the requested time, or the active producer time, as completed. */
    complete(seconds?: number): number;
  }

  /** Ports for staging and publishing completed display generations. */
  export interface IPublicationRequest {
    /** Copy the original completed snapshot; false leaves pending state intact. */
    copy(): boolean;
    /** Start encoding/upload after a successful copy. */
    start(session: string, generation: number): void;
    /** Release the caller's pending snapshot and close publication. */
    release(): void;
  }

  /** Lifecycle controls for a completed display publication. */
  export interface IPublication {
    /** Whether publication remains available, including while staged. */
    active(): boolean;
    /** Stage an original snapshot without publishing its generation. */
    prepare(): boolean;
    /** Commit a staged snapshot or copy and publish the active display. */
    commit(session: string, generation: number): boolean;
    /** Copy and publish a changed display using its current identity. */
    changed(): boolean;
    /** Release resources and forbid further publication. */
    dispose(): void;
  }

  /** Inputs for copying and asynchronously saving completed display frames. */
  export interface ISaveRequest {
    /** Display canvas to copy when no custom paint port is supplied. */
    canvas: HTMLCanvasElement;
    /** Metadata observed at the completed draw boundary. */
    observe(): IDisplayMetadata | undefined;
    /** Paint existing visible layers onto the owned copy surface, when needed. */
    paint?(surface: HTMLCanvasElement): void;
    /** Retain the encoded completed bitmap for graphics recovery, when needed. */
    retain?(blob: Blob): void;
  }

  /** Native canvas event methods used to publish a completed frame. */
  export interface IFrameCanvas {
    /** Read the opt-in observer attribute. */
    getAttribute?(name: string): string | null;
    /** Dispatch the completed-frame event. */
    dispatchEvent?(event: HTMLElementEventMap["automovie:completed-frame"]): boolean;
  }

  /** Inputs for publishing one completed frame to an opted-in canvas. */
  export interface IPublishCompletedFrameRequest {
    /** Canvas whose observer attribute controls event delivery. */
    canvas: IFrameCanvas;
    /** Facts read from the draw-completion owner. */
    frame: ICompletedFrame;
    /** Mark an explicit original redraw as changed. */
    explicitDraw?: boolean;
  }

  /** Inputs for a validated original-producer redraw. */
  export interface IRedrawCompletedFrameRequest {
    /** Requested scene time, seconds. */
    seconds: number;
    /** Completed-frame observations and callbacks owned by the mount. */
    options: IRedrawCompletedFrameOptions;
  }

  /** Producer observations and callbacks used to validate one redraw. */
  export interface IRedrawCompletedFrameOptions {
    /** Actual completed publication count. */
    completedCount(): number;
    /** Actual last completed scene seconds. */
    completedSeconds(): number;
    /** Current original-producer observation, absent before a completed draw. */
    readFrame(): Omit<ICompletedFrame, "control"> | undefined;
    /** Original draw; must throw if it refuses the requested state. */
    produce(seconds: number): void;
    /** Publish a newly supplied legacy observation at these seconds. */
    publish(
      frame: Omit<ICompletedFrame, "control">,
      seconds: number,
    ): void;
  }

  /** Frame controller inputs and the borrowed mount collaborators. */
  export interface IFrameControlRequest {
    /** Native camera owned by this mount. */
    camera: THREE.Camera;
    /** Actual completed scene time, in seconds. */
    currentSeconds(): number;
    /** Refuse operations after the mounted owner has stopped. */
    assertActive(): void;
    /** Rebase the mount clock before a restored draw or resumed tick. */
    rebase(seconds: number): void;
    /** Complete an original draw at these authoritative scene seconds. */
    redraw(seconds: number): void;
    /** Optional source pause; release(true) resumes, release(false) retires. */
    freezeCompleted?(): (resume: boolean) => void;
  }

  /** Frame operations and the state controller returned by frame control. */
  export interface IFrameControl {
    /** Typed capture and restoration controls. */
    control: NonNullable<ICompletedFrame["control"]>;
    /** Run one ordinary producer frame unless frozen. */
    frame(produce: () => void): void;
    /** Close the controller and retire a held producer without resuming it. */
    dispose(): void;
  }

  /** Create the clock, staging, saving and frame-control owners. */
  export function createClock(): IClock {
    return createViewerDisplayClock();
  }

  /** Stage or commit a completed display through the supplied lifecycle ports. */
  export function createPublication(
    request: IPublicationRequest,
  ): IPublication {
    return createViewerDisplayPublication(request);
  }

  /** Copy completed pixels and save them asynchronously with bounded work. */
  export function createSave(request: ISaveRequest): IPublication {
    return createViewerDisplaySave(request);
  }

  /** Create controls for mounted frame playback, restoration and freezing. */
  export function createFrameControl(
    request: IFrameControlRequest,
  ): IFrameControl {
    return createViewerFrameControl(request);
  }

  /** Notify an opted-in canvas that the original producer completed a frame. */
  export function publishCompletedFrame(
    request: IPublishCompletedFrameRequest,
  ): void {
    publishViewerCompletedFrame(request);
  }

  /** Validate and perform an original synchronous redraw at one scene time. */
  export function redrawCompletedFrame(
    request: IRedrawCompletedFrameRequest,
  ): void {
    redrawViewerCompletedFrame(request);
  }


  /**
   * Detached native camera state admitted by AutoMovieViewerDisplay.createCameraState.restore.
   * Vectors and lens values are local native camera data, not a world hierarchy.
   */
  export interface ICameraStateSnapshot {
    /** Native camera class identity; restore requires the same current class. */
    type: string;

    /** Local metre translation, x/y/z. */
    position: THREE.Vector3Tuple;

    /** Local x/y/z/w orientation copied without implicit normalization. */
    quaternion: THREE.QuaternionTuple;

    /** Nonzero dimensionless local axis scales. */
    scale: THREE.Vector3Tuple;

    /** Nonzero camera-up vector used by controls. */
    up: THREE.Vector3Tuple;

    /** Native 32-bit layer bitmask. */
    layers: number;

    /** Native column-major projection values, checked against restored lens state. */
    projection: THREE.Matrix4Tuple;

    /** Full-raster view offset, including its enabled flag, or omission by null. */
    view: THREE.PerspectiveCamera["view"];

    /** Native lens scalars: degree fov, metre clip/focus, millimetre film fields. */
    lens:
      | {
          kind: "perspective";
          fov: number;
          aspect: number;
          near: number;
          far: number;
          zoom: number;
          filmGauge: number;
          filmOffset: number;
          focus: number;
        }
      | {
          kind: "orthographic";
          left: number;
          right: number;
          top: number;
          bottom: number;
          near: number;
          far: number;
          zoom: number;
        };
  }

  /**
   * A mounted frame's transfer state, captured and restored by its frame
   * controller: the native camera and the scene time it was drawn at.
   */
  export interface IFrameTransfer {
    /** Native camera state of the completed view. */
    camera: ICameraStateSnapshot;

    /** Scene seconds of the completed view, finite and nonnegative. */
    elapsedSeconds: number;
  }

  /**
   * The original scene/camera at an owning producer's completed draw boundary. A
   * controller, when supplied, owns typed state capture/restoration. Consumers
   * observe synchronously and must not treat requested state as rendered facts.
   */
  export interface ICompletedFrame {
    /**
     * Native camera used by the original draw; composite layer cameras belong in
     * facts.
     */
    camera: THREE.Camera;

    /** Original drawn scene; composite facts retain each layer's observed objects. */
    scene: THREE.Scene;

    /** Pass actually drawn, including the original producer's handled composite. */
    pass: string;

    /**
     * Seconds of this completed producer state, when its owner exposes a clock.
     * Idle requests do not advance it; a guide redraw preserves the last time.
     * Absence means no clock was supplied, rather than an observed zero.
     */
    elapsedSeconds?: number;

    /** Additional actual frame facts supplied by a handled-composite owner. */
    facts?: object;

    /** Numerical editors require their application transaction before admission. */
    requiresApplication?: boolean;

    /**
     * True when the producer's native controls or model/display transitions
     * changed this view, including an explicit redraw. False marks an idle draw
     * whose exact facts still remain observable; absent preserves eager saving.
     * Application-document changes independently require updated display facts.
     */
    changed?: boolean;

    /** Actual application controller; its state is serialized only by its owner. */
    control?: {
      /** Capture application-owned state corresponding to the live completed view. */
      capture: () => IFrameTransfer;

      /** Restore a state this controller captured. */
      restore: (state: IFrameTransfer) => void;

      /** Synchronously redraw through the original producer or report failure. */
      redraw?: () => void;

      /**
       * Hold animation while retaining the completed view. Nested leases release
       * independently; only the last normal release resumes the owning clock.
       * Explicit redraw/restoration remains available during the hold.
       */
      freeze?: () => () => void;
    };
  }

  /**
   * Facts from the owner of an actually completed interactive display.
   * Application identity and requested values remain separate from observations.
   * This transport record establishes no review acceptance.
   */
  export interface IDisplayMetadata {
    /** Actual loaded application source identity. */
    revision: string;

    /** Native device reported by the completed producer. */
    renderer: string;

    /** Application-owned displayed document, model, pass and view identity. */
    address: object;

    /** Actual camera pose and projection sampled at completion. */
    camera: object;

    /** Separately identified requests or other application-owned facts. */
    [key: string]: unknown;
  }

  /** Camera state capture and restoration through its native lens and transform. */
  export interface ICameraState {
    /** Capture supported camera state. */
    capture(): ICameraStateSnapshot;
    /** Restore a compatible snapshot without mutating on refusal. */
    restore(state: ICameraStateSnapshot): void;
  }

  /** Camera supplied to its native transfer owner. */
  export interface ICameraStateRequest {
    /** Detached auto-updating perspective or orthographic camera. */
    camera: THREE.Camera;
  }

  /** Renderer and perspective camera whose viewport are synchronized. */
  export interface IViewportResizeRequest {
    /** Renderer whose drawing buffer is resized. */
    renderer: Pick<THREE.WebGLRenderer, "getSize" | "getPixelRatio" | "setDrawingBufferSize">;
    /** Perspective camera whose aspect follows the CSS dimensions. */
    camera: THREE.PerspectiveCamera;
  }

  /** Reports whether a viewport resize changed the raster or projection. */
  export type IViewportResizer = (width: number, height: number, pixelRatio: number) => boolean;

  /** Canvas style and CSS dimensions for a capture host. */
  export interface IApplyCaptureCanvasSizeRequest {
    /** Canvas-like object whose CSS dimensions are set. */
    canvas: { style: Pick<HTMLCanvasElement["style"], "width" | "height"> };
    /** CSS width in pixels. */
    width: number;
    /** CSS height in pixels. */
    height: number;
  }

  /** Create a native camera capture/restore controller. */
  export function createCameraState(request: ICameraStateRequest): ICameraState {
    return createViewerCameraState(request);
  }

  /** Create a synchronizer for CSS viewport dimensions and renderer raster. */
  export function createViewportResize(request: IViewportResizeRequest): IViewportResizer {
    return createViewerViewportResize(request);
  }

  /** Apply positive CSS dimensions to the capture canvas; nonpositive dimensions leave it unchanged. */
  export function applyCaptureCanvasSize(request: IApplyCaptureCanvasSizeRequest): void {
    applyViewerCaptureCanvasSize(request);
  }
}

declare global {
  interface HTMLElementEventMap {
    /**
     * A frame the viewer completed, sent to a canvas whose
     * `data-automovie-frame-observer` attribute is `on`.
     */
    "automovie:completed-frame": CustomEvent<AutoMovieViewerDisplay.ICompletedFrame>;
  }
}
