import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawCall,
  IAutoMovieDrawnMouth,
  IAutoMovieInspectionRequest,
  IAutoMovieInspectionTrail,
  IAutoMovieInspectionView,
  IAutoMovieMark,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";

import type { IAutoMovieSectionRenderer } from "../scene/IAutoMovieSectionRenderer.js";
import type { IAutoMovieInspectionHandle } from "../scene/inspection/IAutoMovieInspectionHandle.js";
import { markAutoMovieInspectionTrails } from "../scene/inspection/internal/markAutoMovieInspectionTrails.js";
import { planAutoMovieInspectionTrailTimes } from "../scene/inspection/planAutoMovieInspectionTrailTimes.js";
import { sampleAutoMovieInspectionTrails } from "../scene/inspection/sampleAutoMovieInspectionTrails.js";
import type { IAutoMovieViewerSubjectBounds } from "../scene/subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import { AutoMovieDialogueMouthRecorder } from "./AutoMovieDialogueMouthRecorder.js";
import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import { placeAutoMovieDrawLayer } from "./internal/placeAutoMovieDrawLayer.js";
import { AutoMovieRenderDraw } from "./AutoMovieRenderDraw.js";
import { replaceAutoMovieDrawInspection } from "./replaceAutoMovieDrawInspection.js";

/**
 * The draw page's placement of its subject: the current inspection, the framing
 * boxes of fitted views and the dialogue mouths handed to the subject.
 *
 * Every placement it makes is a shot planned by `AutoMovieRenderDraw.planPicture` and
 * placed on its own entry clock by `placeAutoMovieDrawLayer`: the drawn second
 * and each of its trail times as the shot the drawn second's picture shows, and
 * each framing second as the shot its own picture shows. So a trail at a cut's
 * first frame traces only the incoming shot, a trail of a transition's outgoing
 * shot traces that shot, through its handles past its ends, and a fitted view
 * in a dissolve's first half frames the outgoing shot the picture shows.
 *
 * `inspect` ends the current inspection before placement, so a subject may
 * replace its objects during a seek, samples each `trail` pattern of the
 * request over `planAutoMovieInspectionTrailTimes`, places the drawn second,
 * calls the caller's observation of the settled scene and binds a fresh
 * inspection to the resulting objects with their current marks and sampled
 * trails. `frame` places and inspects each framing second of a fitted view and
 * frames the union of what the inspection leaves drawn, or its focus, measured
 * once per view text, selection and span of seconds. `restore` ends the current
 * inspection before the host places the scene itself.
 *
 * `speak` hands a subject with `speak` the film's dialogue mouths through an
 * `AutoMovieDialogueMouthRecorder`, whose record is cleared right before the
 * drawn second is placed, so `mouths` are what the subject read for that
 * second.
 */
export class AutoMovieDrawPlacement {
  /** The current inspection, or null when none is applied. */
  private applied_: IAutoMovieInspectionHandle | null = null;

  /** Framing boxes, one per view text, selection and span of seconds. */
  private readonly framings_: Map<
    string,
    IAutoMovieViewerSubjectBounds | null
  > = new Map();

  /** The dialogue mouths handed to the subject, which record what it reads. */
  private spoken_: AutoMovieDialogueMouthRecorder | null = null;

  /**
   * Hold the subject, its name, which a refused plan names, and the renderer
   * the inspection measures with.
   */
  public constructor(
    private readonly name: string,
    private readonly scene: IAutoMovieDrawScene,
    private readonly renderer: IAutoMovieSectionRenderer,
  ) {}

  /** Hand a subject with `speak` the mouths of `track`. */
  public speak(track: IAutoMovieDialogueMouthTrack): void {
    if (this.scene.speak === undefined) return;
    this.spoken_ = new AutoMovieDialogueMouthRecorder(track);
    this.scene.speak(this.spoken_.mouths);
  }

  /** The mouths read for the drawn second, or undefined without `speak`. */
  public mouths(): IAutoMovieDrawnMouth[] | undefined {
    return this.spoken_?.drawn();
  }

  /** End the current inspection before the host places the scene itself. */
  public restore(): void {
    this.applied_?.restore();
    this.applied_ = null;
  }

  /**
   * Place the shot the picture at `seconds` shows, its trails included, and
   * bind a fresh inspection of `request`, calling `onPlaced` on the settled
   * scene before the inspection changes it. A refused plan rejects before
   * anything is placed.
   */
  public async inspect(
    request: IAutoMovieInspectionRequest,
    seconds: number,
    onPlaced?: () => void,
  ): Promise<IAutoMovieInspectionHandle> {
    const previous: IAutoMovieInspectionHandle | null = this.applied_;
    this.applied_ = null;
    const handle: IAutoMovieInspectionHandle =
      await replaceAutoMovieDrawInspection({
        previous,
        scene: this.scene.scene,
        request,
        renderer: this.renderer,
        markKinds: this.scene.markKinds,
        place: (): Promise<IAutoMovieMark[]> =>
          this.place(request, seconds, onPlaced),
      });
    this.applied_ = handle;
    return handle;
  }

  /** The framing box of a fitted view over the call's seconds. */
  public async frame(
    call: IAutoMovieDrawCall,
    view: IAutoMovieInspectionView.INamed,
  ): Promise<IAutoMovieViewerSubjectBounds | null> {
    const key: string = JSON.stringify([
      call.view,
      call.request.parts,
      call.request.hide,
      call.request.surface,
      call.request.marks,
      call.request.trail,
      call.request.reach,
      call.request.ticks,
      call.frame,
    ]);
    if (this.framings_.has(key)) return this.framings_.get(key)!;
    let union: IAutoMovieViewerSubjectBounds | null = null;
    for (const seconds of call.frame) {
      const handle: IAutoMovieInspectionHandle = await this.inspect(
        call.request,
        seconds,
      );
      union = unite(union, handle.bounds(view.focus));
    }
    this.framings_.set(key, union);
    return union;
  }

  /**
   * The subject placed at a second, with its own marks and the trails the
   * request asks for there.
   */
  private async place(
    request: IAutoMovieInspectionRequest,
    seconds: number,
    onPlaced?: () => void,
  ): Promise<IAutoMovieMark[]> {
    const scene: IAutoMovieDrawScene = this.scene;
    const placed: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null =
      AutoMovieRenderDraw.planPicture(this.name, scene, seconds).placed;
    const seek: (at: number) => Promise<void> = (at: number): Promise<void> =>
      placeAutoMovieDrawLayer(this.name, scene, placed, at);
    const trails: IAutoMovieInspectionTrail[] = [];
    if (request.trail.length !== 0) {
      const times: number[] = planAutoMovieInspectionTrailTimes({
        request,
        seconds,
        durationSeconds: scene.durationSeconds,
      });
      for (const pattern of request.trail)
        trails.push(
          ...(await sampleAutoMovieInspectionTrails({
            scene: scene.scene,
            pattern,
            times,
            seek,
          })),
        );
    }

    // The mouths read from here on are the ones placed at the drawn second.
    this.spoken_?.clear();
    await seek(seconds);
    onPlaced?.();
    return [
      ...(scene.marks?.(seconds) ?? []),
      ...markAutoMovieInspectionTrails(trails, seconds),
    ];
  }
}

/** The smallest box holding two boxes, either of which may be absent. */
function unite(
  a: IAutoMovieViewerSubjectBounds | null,
  b: IAutoMovieViewerSubjectBounds | null,
): IAutoMovieViewerSubjectBounds | null {
  if (a === null || b === null) return a ?? b;
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z),
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z),
    },
  };
}
