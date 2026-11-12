import {
  type IApplyAutoMovieInspectionProps,
  type IAutoMovieCapturePlanRequest,
  type IAutoMovieDrawScene,
  type IAutoMovieDrawSubject,
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionLabel,
  type IAutoMovieInspectionView,
  type IAutoMovieViewerViewpoint,
  applyAutoMovieInspection,
  autoMovieViewerNamedViewpoints,
  formatAutoMovieInspectionRequest,
  listAutoMovieInspectionPaths,
  parseAutoMovieInspectionView,
  resolveAutoMovieInspectionView,
} from "@automovie/render";
import type * as THREE from "three";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorScene } from "./IAutoMovieInspectorScene.js";
import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";
import { readAutoMovieInspectorAddress } from "./readAutoMovieInspectorAddress.js";

/** What a mount holds once its instance is ready. */
interface ILive {
  instance: IAutoMovieDrawScene;
  renderer: IAutoMovieInspectorSceneHost.IRenderer;
  inspection: IAutoMovieInspectionHandle;
  applied: IAutoMovieCapturePlanRequest;
  frame: number | undefined;
  lastMs: number | undefined;
  drawn: AutoMovieInspectorPlayhead.ISnapshot | undefined;
  size: IAutoMovieInspectorSceneHost.ISize | undefined;
  dirty: boolean;
  seeking: boolean;
  error: string | null;
  labelled: boolean;
}

/**
 * Mount a subject on the inspector's canvas: build an instance, apply the request's inspection, and draw it every animation frame at the playhead's second through the request's first view.
 *
 * The instance is created at once and arrives later. When it arrives the mount checks its clock and raster, seeks it to the request's first second and waits until it is ready there, lists its paths and the marks of its first second, applies the inspection of the newest request (or, when the scene refuses it, of the request that asks for nothing, reported through `refused`), sets the playhead's duration and second, reports `ready` and schedules the first frame. Each frame advances a playing playhead by the wall time since the last frame, follows the host's size, and redraws when the playhead's snapshot or the request changed: seek the instance and, once its promise resolves, update the inspection with the second's marks, resolve the view and render. While a seek is pending no other is started, and the next frame seeks the newest second, so a slow subject drops intermediate seconds instead of queueing them. A drawing error pauses playback and is reported once until a frame draws again.
 *
 * The picture's aspect is the subject's raster, not the canvas's, so a view frames what a capture of the same subject frames; the page gives the canvas that aspect. The mount adds no listener and holds at most one pending frame, so a mount, dispose and mount again on one canvas, as React's StrictMode runs an effect, leaves one renderer and one frame loop; a mount disposed before its instance arrives or is ready disposes the instance then and creates no renderer, and a seek that resolves after dispose draws nothing.
 *
 * The page draws the first view and the first pass of the request; the capture command draws them all. While paused, the labels the request asks for are placed by the inspection on the picture's pixels, with the stamp's font pixel at least one CSS pixel of the canvas as a capture keeps it at least one sheet pixel, and reported in CSS pixels; a named view with a focus is framed on what the focus selects.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the arrival sequence, the fallback on refusal, what a frame does and when it redraws, the error rule, the aspect rule, the lifecycle guarantees, which view and pass are drawn, and how labels and focus are placed.
 * @evidence contracts/development/implementation.md#principled-implementation The scene is changed only through render's inspection, which restores before re-applying; views are resolved by render's view resolver on the inspection's drawn bounds, and the delivery camera takes the raster's aspect as the capture does. Wall time comes from the frame callback's own timestamp, so a frame's advance is the time actually elapsed. The subject's seek promise is the draw contract's readiness signal, so a picture is drawn only once the subject reports it can be.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure owns one mount: arrival, apply, frame, seek, paint, failure and dispose are local steps over one record of what is held; React, the DOM and WebGL stay with the component and the host.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused request is reported with the request still drawn rather than drawn half-applied, an instance that arrives after dispose is released rather than drawn, and no frame is drawn from a size that is not positive.
 * @evidence contracts/development/implementation.md#efficient-algorithms A frame that changed nothing costs one size read and one snapshot comparison; a redraw costs the subject's seek, the inspection's update linear in its marks, one view resolution and the render. Paths and the first second's marks are listed once per mount.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The applied inspection, the renderer and the instance live for the whole mount; an inspection is re-applied only when its written text changes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mount owns one instance, one renderer, one applied inspection and at most one pending frame, released by `dispose` in reverse order, each attempted even when another fails; the playhead is borrowed and gains no listener.
 */
export function mountAutoMovieInspectorScene(props: {
  /** The subject to build. */
  subject: IAutoMovieDrawSubject;

  /** The subject's name, as the request's `subject` key and the refusals name it. */
  name: string;

  /** The request in force when the mount starts. */
  request: IAutoMovieCapturePlanRequest;

  /** The playhead the loop advances and reads, borrowed for the mount's life. */
  playhead: AutoMovieInspectorPlayhead;

  /** Renderer, frame clock and size. */
  host: IAutoMovieInspectorSceneHost;

  /** Where the mount reports what it learns. */
  report: IAutoMovieInspectorScene.IReport;
}): IAutoMovieInspectorScene {
  const { host, playhead, report } = props;
  let disposed: boolean = false;
  let wanted: IAutoMovieCapturePlanRequest = props.request;
  let live: ILive | undefined;

  // The instance arrives later; one that arrives after dispose is released at once.
  props.subject
    .create()
    .then(async (instance: IAutoMovieDrawScene): Promise<void> => {
      if (disposed) instance.dispose();
      else await arrive(instance);
    })
    .catch((error: unknown): void => {
      if (!disposed) report.error(messageOf(error));
    });

  /** Take an arrived instance into use once it is ready at its first second, releasing it if anything fails. */
  async function arrive(instance: IAutoMovieDrawScene): Promise<void> {
    let seconds: number;
    try {
      for (const [name, value] of [
        ["duration", instance.durationSeconds],
        ["fps", instance.fps],
        ["width", instance.width],
        ["height", instance.height],
      ] as const)
        if (!(Number.isFinite(value) && value > 0))
          throw new Error(
            `Subject "${props.name}" ${name} ${value} is not positive`,
          );
      playhead.setDuration(instance.durationSeconds);
      playhead.seek(firstSecond(wanted));
      seconds = playhead.getSnapshot().seconds;
      await instance.seek(seconds);
    } catch (error) {
      if (!disposed) report.error(messageOf(error));
      instance.dispose();
      return;
    }

    // A mount disposed while the subject got ready releases it unused.
    if (disposed) {
      instance.dispose();
      return;
    }
    const held: (() => void)[] = [(): void => instance.dispose()];
    try {
      // Paths are listed before the inspection adds its own objects to the scene.
      const marks: NonNullable<IApplyAutoMovieInspectionProps["marks"]> =
        instance.marks?.(seconds) ?? [];
      const facts: IAutoMovieInspectorScene.IFacts = {
        paths: [
          ...listAutoMovieInspectionPaths(instance.scene).map(
            ({ path }: { path: string }): string => path,
          ),
          ...marks.map(({ path }: { path: string }): string => path),
        ],
        marks,

        views: [
          ...Object.keys(instance.views ?? {}),
          ...autoMovieViewerNamedViewpoints().map(
            ({ id }: IAutoMovieViewerViewpoint): string => id,
          ),
        ],
        width: instance.width,
        height: instance.height,
        durationSeconds: instance.durationSeconds,
        fps: instance.fps,
      };

      const renderer: IAutoMovieInspectorSceneHost.IRenderer =
        host.createRenderer();
      held.push((): void => renderer.dispose());
      const inspect: (
        request: IAutoMovieCapturePlanRequest,
      ) => IAutoMovieInspectionHandle = (
        request: IAutoMovieCapturePlanRequest,
      ): IAutoMovieInspectionHandle =>
        applyAutoMovieInspection({
          scene: instance.scene,
          request: request.inspection,
          renderer,
          marks,
        });

      // The newest request, or the one that asks for nothing when the scene refuses it.
      let applied: IAutoMovieCapturePlanRequest = wanted;
      let inspection: IAutoMovieInspectionHandle;
      let refusal: string | null = null;
      try {
        inspection = inspect(applied);
      } catch (error) {
        refusal = messageOf(error);
        applied = {
          ...readAutoMovieInspectorAddress(""),
          subject: wanted.subject,
        };
        inspection = inspect(applied);
      }
      held.push((): void => inspection.restore());
      wanted = applied;
      live = {
        instance,
        renderer,
        inspection,
        applied,
        frame: undefined,
        lastMs: undefined,
        drawn: undefined,
        size: undefined,
        dirty: true,
        seeking: false,
        error: null,
        labelled: false,
      };
      report.ready(facts);
      if (refusal !== null) report.refused(applied, refusal);
      report.legend([...inspection.legend]);
      live.frame = host.requestFrame(frame);
    } catch (error) {
      live = undefined;
      report.error(messageOf(error));
      release(held.reverse());
    }
  }

  /** One animation frame: advance, follow the size, redraw when something changed, schedule the next. */
  function frame(nowMs: number): void {
    const now: ILive | undefined = live;
    if (disposed || now === undefined) return;
    now.frame = undefined;
    const wall: number =
      now.lastMs === undefined ? 0 : (nowMs - now.lastMs) / 1000;
    now.lastMs = nowMs;
    playhead.advance(wall);

    const size: IAutoMovieInspectorSceneHost.ISize = host.size();
    const drawable: boolean = [size.width, size.height, size.pixelRatio].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    );
    if (
      drawable &&
      (now.size === undefined ||
        now.size.width !== size.width ||
        now.size.height !== size.height ||
        now.size.pixelRatio !== size.pixelRatio)
    ) {
      now.renderer.setPixelRatio(size.pixelRatio);
      now.renderer.setSize(size.width, size.height, false);
      now.size = size;
      now.dirty = true;
    }

    const snapshot: AutoMovieInspectorPlayhead.ISnapshot =
      playhead.getSnapshot();
    if (drawable && !now.seeking && (now.dirty || snapshot !== now.drawn))
      draw(now, snapshot);
    now.frame = host.requestFrame(frame);
  }

  /** Seek one second and draw it once the subject is ready there; frames skip drawing while a seek is pending. */
  function draw(
    now: ILive,
    snapshot: AutoMovieInspectorPlayhead.ISnapshot,
  ): void {
    now.dirty = false;
    now.drawn = snapshot;
    now.seeking = true;
    let ready: Promise<void>;
    try {
      ready = now.instance.seek(snapshot.seconds);
    } catch (error) {
      ready = Promise.reject(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
    ready
      .then((): void => {
        now.seeking = false;
        if (live === now) paint(now, snapshot);
      })
      .catch((error: unknown): void => {
        now.seeking = false;
        if (live === now) fail(now, snapshot, error);
      });
  }

  /** Draw the second the subject is now at through the applied request's first view. */
  function paint(
    now: ILive,
    snapshot: AutoMovieInspectorPlayhead.ISnapshot,
  ): void {
    const { instance } = now;
    try {
      now.inspection.update(instance.marks?.(snapshot.seconds));

      // The delivery camera takes the raster's aspect, as a capture of the subject does.
      const aspect: number = instance.width / instance.height;
      if (instance.camera.aspect !== aspect) {
        instance.camera.aspect = aspect;
        instance.camera.updateProjectionMatrix();
      }
      const text: string = now.applied.views[0]!;
      const view: IAutoMovieInspectionView = parseAutoMovieInspectionView(text);
      const camera: THREE.Camera = resolveAutoMovieInspectionView({
        view,
        text,
        bounds:
          view.type === "named" ? now.inspection.bounds(view.focus) : null,
        camera: instance.camera,
        ...(instance.views === undefined ? {} : { views: instance.views }),
        seconds: snapshot.seconds,
        width: instance.width,
        height: instance.height,
      }).camera;
      now.renderer.render(instance.scene, camera);
      if (!snapshot.playing) {
        report.legend([...now.inspection.legend]);
        report.labels(place(now, camera));
        now.labelled = true;
      } else if (now.labelled) {
        report.labels({ labels: [], lineHeight: 0, dropped: 0 });
        now.labelled = false;
      }
      if (now.error !== null) {
        now.error = null;
        report.error(null);
      }
    } catch (error) {
      fail(now, snapshot, error);
    }
  }

  /** Report a drawing error once until a frame draws again, and stop playback on it. */
  function fail(
    now: ILive,
    snapshot: AutoMovieInspectorPlayhead.ISnapshot,
    error: unknown,
  ): void {
    if (snapshot.playing) playhead.pause();
    const message: string = messageOf(error);
    if (message !== now.error) {
      now.error = message;
      report.error(message);
    }
  }

  return {
    apply: (request: IAutoMovieCapturePlanRequest): void => {
      if (disposed || request === wanted) return;
      wanted = request;
      const now: ILive | undefined = live;
      if (now === undefined) return;

      // The inspection is re-applied only when its text changed; a refusal re-applies the previous one.
      if (written(request) !== written(now.applied)) {
        const seconds: number = playhead.getSnapshot().seconds;
        const inspect: (
          next: IAutoMovieCapturePlanRequest,
        ) => IAutoMovieInspectionHandle = (
          next: IAutoMovieCapturePlanRequest,
        ): IAutoMovieInspectionHandle =>
          applyAutoMovieInspection({
            scene: now.instance.scene,
            request: next.inspection,
            renderer: now.renderer,
            marks: now.instance.marks?.(seconds) ?? [],
          });
        now.inspection.restore();
        try {
          now.inspection = inspect(request);
        } catch (error) {
          now.inspection = inspect(now.applied);
          wanted = now.applied;
          now.dirty = true;
          report.refused(now.applied, messageOf(error));
          return;
        }
        report.legend([...now.inspection.legend]);
      }
      if (firstSecond(request) !== firstSecond(now.applied))
        playhead.seek(firstSecond(request));
      now.applied = request;
      now.dirty = true;
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      const now: ILive | undefined = live;
      live = undefined;
      if (now === undefined) return;
      release([
        (): void => {
          if (now.frame !== undefined) host.cancelFrame(now.frame);
          now.frame = undefined;
        },
        (): void => now.inspection.restore(),
        (): void => now.renderer.dispose(),
        (): void => now.instance.dispose(),
      ]);
    },
  };
}

/** The labels of a paused picture in CSS pixels of the canvas. */
function place(
  now: ILive,
  camera: THREE.Camera,
): IAutoMovieInspectorScene.ILabels {
  const { width, height } = now.instance;
  const shown: IAutoMovieInspectorSceneHost.ISize = now.size!;

  // The stamp's font pixel stays at least one CSS pixel, as a capture keeps it at least one sheet pixel.
  const scale: number = Math.max(1, Math.ceil(height / shown.height));
  const placed: ReturnType<IAutoMovieInspectionHandle["labels"]> =
    now.inspection.labels(camera, width, height, scale);
  return {
    labels: placed.labels.map(
      (
        label: IAutoMovieInspectionLabel,
      ): IAutoMovieInspectorScene.ILabels["labels"][number] => ({
        path: label.path,
        text: label.text,
        left: (label.x * shown.width) / width,
        top: (label.y * shown.height) / height,
      }),
    ),
    // The stamp's box is nine font pixels high.
    lineHeight: (9 * scale * shown.height) / height,
    dropped: placed.dropped.length,
  };
}

/** The first second a request draws: its first explicit second, or the start of its sampling. */
function firstSecond(request: IAutoMovieCapturePlanRequest): number {
  return request.sampling.kind === "at"
    ? request.sampling.seconds[0]!
    : request.sampling.from;
}

/** A request's inspection as the text it writes, the identity an applied inspection is reused by. */
function written(request: IAutoMovieCapturePlanRequest): string {
  return JSON.stringify(formatAutoMovieInspectionRequest(request.inspection));
}

/** Run every step, then throw every failure together. */
function release(steps: readonly (() => void)[]): void {
  const failures: unknown[] = [];
  for (const step of steps)
    try {
      step();
    } catch (error) {
      failures.push(error);
    }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "The inspector mount failed to release");
}

/** The text of a thrown value. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
