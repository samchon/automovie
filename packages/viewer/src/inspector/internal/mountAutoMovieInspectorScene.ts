import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  type IAutoMovieInspectionHandle,
  createAutoMovieInspectionDiagnosticOverlay,
  observeAutoMoviePlacedInspection,
} from "@automovie/render";
import type * as THREE from "three";

import type { AutoMovieViewerInspector } from "../AutoMovieViewerInspector.js";
import { AutoMovieInspectorBeauty } from "./AutoMovieInspectorBeauty.js";
import { AutoMovieInspectorDiagnosticLog } from "./AutoMovieInspectorDiagnosticLog.js";
import type { AutoMovieInspectorPlayhead } from "../AutoMovieInspectorPlayhead.js";
import { AutoMovieInspectorTransition } from "../AutoMovieInspectorTransition.js";
import type { IAutoMovieInspectorLive } from "./IAutoMovieInspectorLive.js";
import type { IAutoMovieInspectorScene } from "../IAutoMovieInspectorScene.js";
import type { IAutoMovieInspectorSceneHost } from "../IAutoMovieInspectorSceneHost.js";
import { assertAutoMovieInspectorRaster } from "../assertAutoMovieInspectorRaster.js";
import { changesAutoMovieObservedScene } from "../changesAutoMovieObservedScene.js";
import { firstAutoMovieInspectorSecond } from "../firstAutoMovieInspectorSecond.js";
import { followAutoMovieInspectorSize } from "./followAutoMovieInspectorSize.js";
import { inspectAutoMovieInspectorRequest } from "./inspectAutoMovieInspectorRequest.js";
import { installAutoMovieInspectorRequest } from "./installAutoMovieInspectorRequest.js";
import { messageOfAutoMovieInspectorError } from "../messageOfAutoMovieInspectorError.js";
import { readAutoMovieInspectorAddress } from "../readAutoMovieInspectorAddress.js";
import { readAutoMovieInspectorFacts } from "./readAutoMovieInspectorFacts.js";
import { readsAutoMovieInspectorPlacedScene } from "../readsAutoMovieInspectorPlacedScene.js";
import { releaseAutoMovieInspectorSteps } from "./releaseAutoMovieInspectorSteps.js";
import { reportAutoMovieInspectorLabels } from "./reportAutoMovieInspectorLabels.js";
import { resolveAutoMovieInspectorCamera } from "./resolveAutoMovieInspectorCamera.js";
import { writeAutoMovieInspectorInspection } from "../writeAutoMovieInspectorInspection.js";

/**
 * Mount a subject on the inspector's canvas: build an instance, apply the
 * request's inspection, and draw it every animation frame at the playhead's
 * second through the request's first view.
 *
 * The instance is created at once and arrives later. When it arrives the mount
 * checks its clock and raster, seeks it to the request's first second and waits
 * until it is ready there, lists its paths and the marks of its first second,
 * applies the inspection of the newest request (or, when the scene refuses it,
 * of the request that asks for nothing, reported through `refused`), sets the
 * playhead's duration and second, reports `ready` and schedules the first
 * frame. Each frame advances a playing playhead by the wall time since the last
 * frame, follows the host's size, and redraws when the playhead's snapshot or
 * the request changed: place the instance and, once it is ready, run the
 * subject's `beforeDraw` on a WebGL renderer, as the draw host does, so its
 * surface feeds show the second drawn with the scene's own materials, then
 * update the inspection with the second's marks, resolve the view and render.
 * An inspection that changes the scene's materials or layers is lifted around
 * the seek of a subject with `beforeDraw` or `inspectPlaced` and applied again
 * after them. Beauty pictures draw through `AutoMovieInspectorBeauty`, the
 * subject's optics and indirect shading as delivery draws one sample. While a
 * seek is pending no other is started, and the next frame seeks the newest
 * second, so a slow subject drops intermediate seconds instead of queueing
 * them. A drawing error pauses playback and is reported once until a frame
 * draws again.
 *
 * The picture's aspect is the subject's raster, not the canvas's, so a view
 * frames what a capture of the same subject frames; the page gives the canvas
 * that aspect. The mount adds no listener and holds at most one pending frame,
 * so a mount, dispose and mount again on one canvas, as React's StrictMode runs
 * an effect, leaves one renderer and one frame loop; a mount disposed before
 * its instance arrives or is ready disposes the instance then and creates no
 * renderer, and a seek that resolves after dispose draws nothing.
 *
 * An opted-in subject is observed at the second actually placed, before the
 * inspection changes the scene: an inspection that changes layers, materials,
 * mark geometry or clipping is restored before the seek and re-applied after
 * the observation, while one that changes none of them, as the default request,
 * stays applied and only updates its marks, as for any subject. Its findings
 * reach the report and the diagnostic log with the playhead's playing flag and
 * jump count, so uninterrupted playback can join painted samples into an
 * observed span. Its witness cubes are drawn under the beauty shade unless
 * `overlay(false)` hid them; hiding them stops no check and no report.
 *
 * `AutoMovieInspectorTransition` places the subject, the shown shot last, so
 * diagnostics, marks, camera and inspection pictures follow it as in the draw
 * page; a plain beauty transition paints and holds its other layers first and
 * composites them by their `playbackLayersAt` weights, under the witness cubes
 * at full strength, so a dissolve and a fade match delivery.
 *
 * The page draws the first view and the first pass of the request; the capture
 * command draws them all. While paused, the labels the request asks for are
 * placed by the inspection on the picture's pixels, with the stamp's font pixel
 * at least one CSS pixel of the canvas as a capture keeps it at least one sheet
 * pixel, and reported in CSS pixels; a named view with a focus is framed on
 * what the focus selects.
 */
export function mountAutoMovieInspectorScene(
  props: AutoMovieViewerInspector.ISceneProps,
): IAutoMovieInspectorScene {
  const { host, playhead, report } = props;
  const diagnosticLog: AutoMovieInspectorDiagnosticLog =
    new AutoMovieInspectorDiagnosticLog(report);
  const witnessCubes: ReturnType<
    typeof createAutoMovieInspectionDiagnosticOverlay
  > = createAutoMovieInspectionDiagnosticOverlay();
  let disposed: boolean = false;
  let witnesses: boolean = true;
  let wanted: IAutoMovieCapturePlanRequest = props.request;
  let live: IAutoMovieInspectorLive | undefined;

  // The instance arrives later; one that arrives after dispose is released at once.
  props.subject
    .create()
    .then(async (instance: IAutoMovieDrawScene): Promise<void> => {
      if (disposed) instance.dispose();
      else await arrive(instance);
    })
    .catch((error: unknown): void => {
      if (!disposed) report.error(messageOfAutoMovieInspectorError(error));
    });

  /**
   * Take an arrived instance into use once it is ready at its first second,
   * releasing it if anything fails.
   */
  async function arrive(instance: IAutoMovieDrawScene): Promise<void> {
    let seconds: number;
    try {
      assertAutoMovieInspectorRaster(props.name, instance);
      playhead.setDuration(instance.durationSeconds);
      playhead.seek(firstAutoMovieInspectorSecond(wanted));
      seconds = playhead.getSnapshot().seconds;
      await instance.seek(seconds);
    } catch (error) {
      if (!disposed) report.error(messageOfAutoMovieInspectorError(error));
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
      // Facts are read before the inspection adds its own objects to the scene.
      const facts: IAutoMovieInspectorScene.IFacts =
        readAutoMovieInspectorFacts({ instance, seconds });
      const { marks } = facts;

      const { renderer, compositor }: IAutoMovieInspectorSceneHost.ICreated =
        host.createRenderer();
      held.push((): void => renderer.dispose());
      const beauty: AutoMovieInspectorBeauty = new AutoMovieInspectorBeauty();
      held.push((): void => beauty.dispose());
      const transition: AutoMovieInspectorTransition =
        new AutoMovieInspectorTransition();
      held.push((): void => transition.dispose());

      // The newest request, or the one that asks for nothing when the scene refuses it.
      let applied: IAutoMovieCapturePlanRequest = wanted;
      let inspection: IAutoMovieInspectionHandle;
      let refusal: string | null = null;
      try {
        inspection = inspectAutoMovieInspectorRequest({
          ...{ instance, renderer, marks },
          request: applied,
        });
      } catch (error) {
        refusal = messageOfAutoMovieInspectorError(error);
        applied = {
          ...readAutoMovieInspectorAddress(""),
          subject: wanted.subject,
        };
        inspection = inspectAutoMovieInspectorRequest({
          ...{ instance, renderer, marks },
          request: applied,
        });
      }
      held.push((): void => inspection.restore());
      wanted = applied;
      live = {
        instance,
        renderer,
        compositor,
        beauty,
        transition,
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
      report.error(messageOfAutoMovieInspectorError(error));
      releaseAutoMovieInspectorSteps(held.reverse());
    }
  }

  /**
   * One animation frame: advance, follow the size, redraw when something
   * changed, schedule the next.
   */
  function frame(nowMs: number): void {
    const now: IAutoMovieInspectorLive | undefined = live;
    if (disposed || now === undefined) return;
    now.frame = undefined;
    const wall: number =
      now.lastMs === undefined ? 0 : (nowMs - now.lastMs) / 1000;
    now.lastMs = nowMs;
    playhead.advance(wall);

    const drawable: boolean = followAutoMovieInspectorSize(now, host.size());

    const snapshot: AutoMovieInspectorPlayhead.ISnapshot =
      playhead.getSnapshot();
    if (drawable && !now.seeking && (now.dirty || snapshot !== now.drawn))
      draw(now, snapshot);
    now.frame = host.requestFrame(frame);
  }

  /**
   * Place one second and draw it once the subject is ready there; frames skip
   * drawing while a placement is pending.
   */
  function draw(
    now: IAutoMovieInspectorLive,
    snapshot: AutoMovieInspectorPlayhead.ISnapshot,
  ): void {
    now.dirty = false;
    now.drawn = snapshot;
    now.seeking = true;
    let ready: Promise<void>;
    try {
      // An observation and the subject's feeds read the scene as placed, without what the inspection changed.
      if (
        readsAutoMovieInspectorPlacedScene(now.instance) &&
        changesAutoMovieObservedScene(now.applied.inspection)
      )
        now.inspection.restore();
      // A transition's other layers are placed, painted and held, and the shot the picture shows most of is placed last.
      ready = now.transition.place({
        name: props.name,
        instance: now.instance,
        request: now.applied.inspection,
        compositor: now.compositor,
        seconds: snapshot.seconds,
        paint: (): void =>
          beauty(now, filmCamera(now, snapshot.seconds), snapshot.seconds),
      });
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

  /**
   * Draw the second the subject is now at through the applied request's first
   * view.
   */
  function paint(
    now: IAutoMovieInspectorLive,
    snapshot: AutoMovieInspectorPlayhead.ISnapshot,
  ): void {
    const { instance } = now;
    try {
      const diagnostics: IAutoMovieInspectionDiagnostics | undefined =
        observeAutoMoviePlacedInspection(
          instance,
          snapshot.seconds,
          "viewer",
          undefined,
          now.transition.byShot,
        );
      // The subject's render-target work, such as surface feeds, runs once on the placed scene's own materials before any shade applies, as the draw host runs it; only a WebGL renderer has render targets.
      if (now.compositor !== null)
        instance.beforeDraw?.(now.compositor, snapshot.seconds);
      // Re-apply only an inspection that was restored for the scene's readers or changed; otherwise update its marks.
      if (
        readsAutoMovieInspectorPlacedScene(instance) &&
        (changesAutoMovieObservedScene(now.applied.inspection) ||
          changesAutoMovieObservedScene(wanted.inspection) ||
          writeAutoMovieInspectorInspection(wanted) !==
            writeAutoMovieInspectorInspection(now.applied))
      ) {
        now.inspection.restore();
        if (installInspection(now, wanted, snapshot.seconds))
          now.applied = wanted;
      } else now.inspection.update(instance.marks?.(snapshot.seconds));

      const camera: THREE.Camera = filmCamera(now, snapshot.seconds);
      const shaded: boolean = now.applied.inspection.shade === "beauty";
      const shown: () => void = (): void =>
        beauty(now, camera, snapshot.seconds);
      // A composited transition takes its witness cubes over the composite, at full strength.
      const composited: boolean = shaded && now.transition.finish(shown);
      const diagnosticLegend: ReturnType<typeof witnessCubes.render> =
        witnessCubes.render({
          scene: composited ? now.transition.overlay : instance.scene,
          diagnostics: witnesses && shaded ? diagnostics : undefined,
          render: (): void => {
            // The beauty shade shows the delivered picture: the subject's optics, through the stage delivery draws with.
            if (composited) now.transition.over(camera);
            else if (shaded) shown();
            else now.renderer.render(instance.scene, camera);
          },
          width: now.size!.width,
          height: now.size!.height,
          stroke: now.applied.inspection.stroke,
        });
      if (diagnostics !== undefined) {
        diagnosticLog.observe(diagnostics, snapshot);
        report.diagnostics?.(diagnostics);
      }
      reportAutoMovieInspectorLabels({
        ...{ now, report, camera, diagnosticLegend },
        playing: snapshot.playing,
      });
      if (now.error !== null) {
        now.error = null;
        report.error(null);
      }
    } catch (error) {
      fail(now, snapshot, error);
    }
  }

  /** The applied view's camera at a placed second. */
  function filmCamera(
    now: IAutoMovieInspectorLive,
    seconds: number,
  ): THREE.Camera {
    return resolveAutoMovieInspectorCamera({
      instance: now.instance,
      text: now.applied.views[0]!,
      inspection: now.inspection,
      seconds,
    });
  }

  /**
   * Paint the placed scene's beauty picture through the stages delivery draws
   * one sample with.
   */
  function beauty(
    now: IAutoMovieInspectorLive,
    camera: THREE.Camera,
    seconds: number,
  ): void {
    now.beauty.draw({
      renderer: now.renderer,
      instance: now.instance,
      camera,
      seconds,
      width: Math.floor(now.size!.width * now.size!.pixelRatio),
      height: Math.floor(now.size!.height * now.size!.pixelRatio),
    });
  }

  /**
   * Report a drawing error once until a frame draws again, and stop playback on
   * it.
   */
  function fail(
    now: IAutoMovieInspectorLive,
    snapshot: AutoMovieInspectorPlayhead.ISnapshot,
    error: unknown,
  ): void {
    if (snapshot.playing) playhead.pause();
    const message: string = messageOfAutoMovieInspectorError(error);
    if (message !== now.error) {
      now.error = message;
      report.error(message);
    }
  }

  /**
   * Install a request on the live subject; on refusal keep the applied one in
   * force and report the refusal.
   */
  function installInspection(
    now: IAutoMovieInspectorLive,
    request: IAutoMovieCapturePlanRequest,
    seconds: number,
  ): boolean {
    return installAutoMovieInspectorRequest({
      ...{ now, request, seconds },
      refused: (error: unknown): void => {
        wanted = now.applied;
        report.refused(now.applied, messageOfAutoMovieInspectorError(error));
      },
    });
  }
  return {
    apply: (request: IAutoMovieCapturePlanRequest): void => {
      if (disposed || request === wanted) return;
      wanted = request;
      const now: IAutoMovieInspectorLive | undefined = live;
      if (now === undefined) return;

      // Opted-in subjects apply each request only after the current settled scene is observed.
      if (now.instance.inspectPlaced !== undefined) {
        if (
          firstAutoMovieInspectorSecond(request) !==
          firstAutoMovieInspectorSecond(now.applied)
        )
          playhead.seek(firstAutoMovieInspectorSecond(request));
        now.dirty = true;
        return;
      }

      // A generic subject keeps its inspection until its request changes.
      if (
        writeAutoMovieInspectorInspection(request) !==
        writeAutoMovieInspectorInspection(now.applied)
      ) {
        now.inspection.restore();
        const accepted: boolean = installInspection(
          now,
          request,
          playhead.getSnapshot().seconds,
        );
        if (!accepted) {
          now.dirty = true;
          return;
        }
        report.legend([...now.inspection.legend]);
      }
      if (
        firstAutoMovieInspectorSecond(request) !==
        firstAutoMovieInspectorSecond(now.applied)
      )
        playhead.seek(firstAutoMovieInspectorSecond(request));
      now.applied = request;
      now.dirty = true;
    },
    overlay: (show: boolean): void => {
      if (disposed || show === witnesses) return;
      witnesses = show;
      if (live !== undefined) live.dirty = true;
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      const now: IAutoMovieInspectorLive | undefined = live;
      live = undefined;
      if (now === undefined) return;
      releaseAutoMovieInspectorSteps([
        (): void => {
          if (now.frame !== undefined) host.cancelFrame(now.frame);
          now.frame = undefined;
        },
        (): void => now.inspection.restore(),
        (): void => now.transition.dispose(),
        (): void => now.beauty.dispose(),
        (): void => now.renderer.dispose(),
        (): void => now.instance.dispose(),
        (): void => diagnosticLog.dispose(),
        (): void => witnessCubes.dispose(),
      ]);
    },
  };
}
