import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { SightLaw } from "../../laws/cinematography/SightLaw";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RefereeTrack } from "../officiating/RefereeTrack";
import { CountCoverage } from "./CountCoverage";
import { FinishHold } from "./FinishHold";
import type { FinishSight } from "./FinishSight";
import { LensStandpoint } from "./LensStandpoint";
import { LensZoom } from "./LensZoom";

/**
 * The camera's path through the film, resolved once at a fixed step: the
 * size follows the action (wide in resets, medium in exchanges, pushed in
 * close on a landed blow), each size holding at least the law's minimum and
 * framing both fighters' whole bodies, the referee too while he officiates;
 * each man is framed where he stands and one operator's lag ahead, so the
 * following lens keeps his path; the bearing orbits toward side-on, opposite
 * the referee, at no more than the law's rate; the framing comes from the
 * subjects' bounding spheres by the engine; the lens works from the apron
 * outside the ropes, as a fight's handheld operators do, and the lens the
 * operator delivers after his follow still clears the ropes; it zooms from
 * where it actually stands, never so tight that a framed man leaves the
 * frame. A change between the wide camera and a handheld is a cut to the
 * other camera's standpoint, never a move through the ring.
 * From the screenplay's finish decision the camera widens to hold A, B and
 * the referee, turning at the orbit rate to the view the visibility law
 * chooses for the finishing strike: the open side's side-on view, or the
 * least turn or rise from it that keeps the striking surface, the struck
 * region and the descending path clear of every body, measured by the given
 * sight reader on the lens the track actually delivers at the contact. After
 * the blow it stays on that open side through the fall, the count and the
 * celebration, turning by the least amount that keeps all three men framed.
 *
 * ```ts
 * const track = CameraTrack.resolve(cast, schedule, referee, 180, sight);
 * CameraTrack.at(track, 72.5); // { position, target, size }
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#law The coverage law.
 * @evidence docs/research/cinematography/fight-coverage.md#targets The finishing strike unoccluded from the delivered camera.
 * @evidence docs/research/cinematography/fight-coverage.md#targets No rope fills the frame, no jump within a shot, every framed man in frame.
 * @evidence docs/body/settings/cinematography/ring-coverage.md#finish The finish view held to the end.
 */
export namespace CameraTrack {
  /** Resolution step, seconds: one frame of the film. */
  export const STEP: number = 1 / 30;

  /** Id suffix of a subject's sphere one operator's lag ahead. */
  const AHEAD: string = "-ahead";

  /** One resolved instant. */
  export interface ISample {
    /** Lens position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at target, world metres. */
    target: IAutoMovieVector3;

    /** The size held. */
    size: CoverageLaw.Size;

    /** The lens's vertical field of view, radians: its zoom. */
    fieldOfView: number;
  }

  /**
   * Resolve the path.
   *
   * @param cast The cast.
   * @param schedule The schedule.
   * @param referee The referee's resolved path.
   * @param duration Film seconds.
   * @param sight Reads the finishing strike's sight scene.
   * @returns Samples at every step.
   */
  export function resolve(
    cast: IRingCast,
    schedule: IAutoMovieSchedule,
    referee: RefereeTrack.ITrack,
    duration: number,
    sight: FinishSight.Reader,
  ): ISample[] {
    const finish: number =
      schedule.entries.find((e) => e.intent.capability === "frame")?.start ??
      Infinity;
    const landed: { contact: number; receiver: string }[] = schedule.entries
      .filter((e) => e.outcome === "landed")
      .map((e) => ({ contact: e.contact!, receiver: e.subject }));
    const exchanges: { start: number; end: number }[] = schedule.entries
      .filter(
        (e) =>
          e.intent.capability === "strike" || e.intent.capability === "answer",
      )
      .map((e) => ({ start: e.start, end: e.end }));
    const officiating: { start: number; end: number }[] = schedule.entries
      .filter((e) => e.subject === cast.referee.id && e.end > e.start)
      .map((e) => ({ start: e.start, end: e.end }));
    // The count is covered at medium from the apron at the neutral corner the
    // standing fighter was not sent to: the referee counting over the fallen
    // man, the winner in his corner behind them (fight-coverage.md#practice).
    const counting = CountCoverage.window(schedule, cast.referee.id);
    const counted = CountCoverage.shot(schedule, cast);
    const corner = counting
      ? CountCoverage.corner(
          cast,
          BoutLaws.origin(schedule, cast.a.id, counting.start, cast).point,
        )
      : undefined;
    const height = (measure: {
      head: number;
    }): {
      body: number;
      bodyRadius: number;
    } => ({
      body: measure.head / 2,
      bodyRadius: measure.head / 2 + measure.head * 0.1,
    });
    const ha = height(cast.a.body.measure);
    const hb = height(cast.b.body.measure);
    const hr = height(cast.referee.body.measure);
    const spheres = (
      t: number,
    ): Record<string, { center: IAutoMovieVector3; radius: number }> => {
      const a = BoutLaws.origin(schedule, cast.a.id, t, cast).point;
      const b = BoutLaws.origin(schedule, cast.b.id, t, cast).point;
      const r = RefereeTrack.at(referee, t).point;
      return {
        [cast.a.id]: {
          center: { x: a.x, y: ha.body, z: a.z },
          radius: ha.bodyRadius,
        },
        [cast.b.id]: {
          center: { x: b.x, y: hb.body, z: b.z },
          radius: hb.bodyRadius,
        },
        [cast.referee.id]: {
          center: { x: r.x, y: hr.body, z: r.z },
          radius: hr.bodyRadius,
        },
      };
    };
    const wide: string[] = [cast.a.id, cast.b.id, cast.referee.id];
    // The subjects' spheres at every step, shared by every candidate view.
    const cached: Record<
      string,
      { center: IAutoMovieVector3; radius: number }
    >[] = [];
    const at_ = (k: number) => (cached[k] ??= spheres(k * STEP));
    const last: number = Math.floor(duration / STEP + 1e-9);
    // The same spheres one operator's lag ahead, under suffixed ids.
    const lead: number = Math.round(CoverageLaw.LAG / STEP);
    const ahead = (k: number) =>
      Object.fromEntries(
        Object.entries(at_(Math.min(last, k + lead))).map(([id, sphere]) => [
          `${id}${AHEAD}`,
          sphere,
        ]),
      );
    // From the blow on, the finish view keeps every man framed.
    const blow: { release: number; scene?: SightLaw.IScene } = {
      release: Infinity,
    };
    const everyone: string[] = wide.flatMap((id) => [id, `${id}${AHEAD}`]);
    const holds = (
      bearing: number,
      elevation: number,
      framed: Record<string, { center: IAutoMovieVector3; radius: number }>,
    ): number =>
      FinishHold.margin(
        LensStandpoint.place(
          cast,
          "finish",
          CoverageLaw.goal("finish", everyone, bearing, elevation),
          framed,
        ),
        everyone.map((id) => framed[id]!),
        blow.scene!,
      );
    interface IState {
      size: CoverageLaw.Size;
      since: number;
      bearing: number | undefined;
      elevation: number;
      position: IAutoMovieVector3 | undefined;
      target: IAutoMovieVector3 | undefined;
      fieldOfView: number | undefined;
    }
    // Advance the operator from step `from` through step `to`, appending samples.
    const run = (
      view: SightLaw.IView | undefined,
      from: number,
      to: number,
      s: IState,
      samples: ISample[],
    ): void => {
      for (let k: number = from; k <= to; k++) {
        const t: number = k * STEP;
        const state = at_(k);
        // The size the action asks for; it changes only after the hold.
        const hit = landed.some(
          (l) => t >= l.contact && t < l.contact + CoverageLaw.HOLD,
        );
        const count: boolean =
          counting !== undefined &&
          counted !== undefined &&
          t >= counting.start &&
          t < counting.end;
        const shown: CoverageLaw.Size = s.size;
        const wanted: CoverageLaw.Size = count
          ? "medium"
          : t >= finish
            ? "finish"
            : hit
              ? "close"
              : exchanges.some((x) => t >= x.start && t < x.end)
                ? "medium"
                : "wide";
        if (
          wanted !== s.size &&
          (t - s.since >= CoverageLaw.HOLD || wanted === "finish" || count)
        ) {
          s.size = wanted;
          s.since = t;
        }
        // Every size frames both whole bodies, so the feet and stance read;
        // the referee joins while he officiates. Each man is framed where he
        // stands and where he will stand one operator's lag ahead, so the
        // following lens keeps his path.
        const men: string[] = count
          ? counted!.subjects
          : s.size === "wide" ||
              s.size === "finish" ||
              officiating.some((i) => t >= i.start && t < i.end)
            ? wide
            : [cast.a.id, cast.b.id];
        const subjects: string[] = men.flatMap((id) => [id, `${id}${AHEAD}`]);
        const framed = { ...state, ...ahead(k) };
        // A change between the wide camera and the apron handheld is a cut to
        // the other camera's standpoint, not a move through the ring.
        const cut: boolean =
          s.position === undefined || LensStandpoint.cuts(shown, s.size);
        // Side-on opposite the referee; from the finish, the visibility law's
        // view, which after the blow turns within its open side by the least
        // amount that keeps every man in frame.
        const aim: SightLaw.IView = count
          ? {
              bearing: CountCoverage.bearing(
                counted!.counted.map((id) => floor(state[id]!)),
                corner!,
              ),
              elevation: CoverageLaw.ELEVATION,
            }
          : s.size === "finish" && view !== undefined
            ? t <= blow.release || s.bearing === undefined
              ? view
              : {
                  bearing: FinishHold.bearing({
                    open: view.bearing,
                    current: s.bearing,
                    margin: (bearing: number): number =>
                      holds(bearing, s.elevation, framed),
                  }),
                  elevation: view.elevation,
                }
            : {
                bearing: CoverageLaw.unblocked(
                  CoverageLaw.bearing(
                    floor(state[cast.a.id]!),
                    floor(state[cast.b.id]!),
                    floor(state[cast.referee.id]!),
                  ),
                  floor(state[cast.a.id]!),
                  floor(state[cast.b.id]!),
                  floor(state[cast.referee.id]!),
                  cast.referee.body.measure.shoulderHalfWidth,
                ),
                elevation: CoverageLaw.ELEVATION,
              };
        s.bearing =
          s.bearing === undefined || cut
            ? aim.bearing
            : CoverageLaw.orbit(s.bearing, aim.bearing, STEP);
        s.elevation = cut
          ? aim.elevation
          : CoverageLaw.orbit(s.elevation, aim.elevation, STEP);
        const goal = CoverageLaw.goal(s.size, subjects, s.bearing, s.elevation);
        const wantedFrame = LensStandpoint.place(cast, s.size, goal, framed);
        const spheres = subjects.map((id) => framed[id]!);
        // The operator follows with his lag; the lens he delivers still
        // stands on the apron and clears the ropes.
        const follow: number = cut ? 1 : CoverageLaw.follow(STEP);
        s.target = cut
          ? wantedFrame.target
          : lerp(s.target!, wantedFrame.target, follow);
        s.position = cut
          ? wantedFrame.position
          : LensStandpoint.deliver(
              cast,
              s.size,
              lerp(s.position!, wantedFrame.position, follow),
              s.target,
              spheres,
            );
        // The lens zooms from where it actually stands and looks: toward the
        // size's fill with the operator's lag, never so tight that a subject
        // leaves the frame.
        const delivered = { position: s.position, target: s.target };
        const range = CoverageLaw.zoom(s.size);
        const zoom: number = LensZoom.fieldOfView(
          delivered,
          spheres,
          goal.fill,
          CoverageLaw.ASPECT,
          range,
        );
        s.fieldOfView =
          cut || s.fieldOfView === undefined
            ? zoom
            : Math.max(
                LensZoom.fieldOfView(
                  delivered,
                  spheres,
                  1,
                  CoverageLaw.ASPECT,
                  range,
                ),
                s.fieldOfView + (zoom - s.fieldOfView) * follow,
              );
        samples.push({
          position: s.position,
          target: s.target,
          size: s.size,
          fieldOfView: s.fieldOfView,
        });
      }
    };
    const fresh = (): IState => ({
      size: "wide",
      since: 0,
      bearing: undefined,
      elevation: CoverageLaw.ELEVATION,
      position: undefined,
      target: undefined,
      fieldOfView: undefined,
    });
    const finishing: IAutoMovieSchedule.IEntry | undefined = strike(schedule);
    if (finishing === undefined || !Number.isFinite(finish)) {
      const samples: ISample[] = [];
      run(undefined, 0, last, fresh(), samples);
      return samples;
    }
    // The path before the finish decision is the same for every view.
    const opening: number = Math.min(last + 1, Math.ceil(finish / STEP - 1e-9));
    const prefix: ISample[] = [];
    const before: IState = fresh();
    run(undefined, 0, opening - 1, before, prefix);
    const scene: SightLaw.IScene = sight(finishing);
    blow.scene = scene;
    blow.release = scene.seconds;
    const contact: number = Math.min(last, Math.ceil(scene.seconds / STEP) + 1);
    // The hold: the contact, then every second to the end of the film.
    const hold: number[] = [scene.seconds];
    for (let t: number = Math.ceil(scene.seconds); t <= duration; t++)
      if (!counting || t < counting.start || t >= counting.end) hold.push(t);
    const states = new Map(hold.map((t) => [t, spheres(t)]));
    const finishWith = (view: SightLaw.IView): ISample[] => {
      const samples: ISample[] = [...prefix];
      run(view, opening, last, { ...before }, samples);
      return samples;
    };
    // The first candidate whose own lens is clear, whose delivered lens,
    // after the orbit and the operator's lag, is clear and frames the blow,
    // and whose hold keeps all three men in frame; failing the last, the
    // first that frames the blow.
    let fallback: ISample[] | undefined;
    for (const view of FinishHold.views(
      scene,
      (v: SightLaw.IView, t: number) =>
        LensStandpoint.place(
          cast,
          "finish",
          CoverageLaw.goal("finish", wide, v.bearing, v.elevation),
          states.get(t) ?? spheres(t),
        ),
      hold,
      CoverageLaw.WIDE_HEIGHT - cast.ring.platform,
      CoverageLaw.ORBIT * STEP,
    )) {
      const trial: ISample[] = [...prefix];
      run(view, opening, contact, { ...before }, trial);
      if (!(clearance(trial, scene) > 0 && framing(trial, scene) > 0)) continue;
      // The wide view must also keep all three men inside the delivered
      // frame through the fall, the count and the celebration.
      const full: ISample[] = finishWith(view);
      if (
        hold.every((t: number): boolean => {
          const lens: ISample = at(full, t);
          const state = states.get(t) ?? spheres(t);
          return (
            SightLaw.framed(
              lens.position,
              lens.target,
              {
                ...scene,
                watched: wide.map((id: string) => ({
                  point: state[id]!.center,
                  seconds: t,
                  carriers: [],
                })),
              },
              lens.fieldOfView,
              CoverageLaw.ASPECT,
            ) > 0
          );
        })
      )
        return full;
      fallback ??= full;
    }
    return (
      fallback ??
      finishWith({
        bearing: SightLaw.open(scene.attacker, scene.receiver, scene.contact),
        elevation: CoverageLaw.ELEVATION,
      })
    );
  }

  /**
   * The camera at a second.
   *
   * @param samples The resolved path.
   * @param seconds Film seconds.
   * @returns The interpolated sample.
   */
  export function at(samples: readonly ISample[], seconds: number): ISample {
    const f: number = Math.max(0, Math.min(samples.length - 1, seconds / STEP));
    const i: number = Math.floor(f);
    const j: number = Math.min(samples.length - 1, i + 1);
    const w: number = f - i;
    return {
      position: lerp(samples[i]!.position, samples[j]!.position, w),
      target: lerp(samples[i]!.target, samples[j]!.target, w),
      size: samples[i]!.size,
      fieldOfView:
        samples[i]!.fieldOfView +
        (samples[j]!.fieldOfView - samples[i]!.fieldOfView) * w,
    };
  }

  /**
   * The visibility law's measure on the delivered lens: the least sight
   * clearance of the finish scene's watched points from the camera at the
   * contact.
   *
   * @param samples The resolved path.
   * @param scene The finish scene.
   * @returns Metres; positive means unoccluded.
   */
  export function clearance(
    samples: readonly ISample[],
    scene: SightLaw.IScene,
  ): number {
    return SightLaw.clearance(at(samples, scene.seconds).position, scene);
  }

  /**
   * The visibility law's framing measure on the delivered lens: how far
   * inside the delivered frame the striking surface over its descent and
   * the struck region fall at the contact, through the coverage law's lens
   * on the 16:9 frame.
   *
   * @param samples The resolved path.
   * @param scene The finish scene.
   * @returns The least normalized margin to the frame's edge; positive means in frame.
   */
  export function framing(
    samples: readonly ISample[],
    scene: SightLaw.IScene,
  ): number {
    const lens: ISample = at(samples, scene.seconds);
    return SightLaw.framed(
      lens.position,
      lens.target,
      scene,
      lens.fieldOfView,
      CoverageLaw.ASPECT,
    );
  }

  /**
   * The finishing strike the finish view keeps visible: the strike whose
   * anchor the framing decision names.
   *
   * @param schedule The schedule.
   * @returns The strike's entry, or undefined without a finish view.
   */
  export function strike(
    schedule: IAutoMovieSchedule,
  ): IAutoMovieSchedule.IEntry | undefined {
    const frame = schedule.entries.find((e) => e.intent.capability === "frame");
    const keep: unknown = (
      frame?.intent.parameters?.action as { keep?: unknown } | undefined
    )?.keep;
    return typeof keep === "string"
      ? schedule.entries.find((e) => e.intent.anchor === keep)
      : undefined;
  }

  function floor(sphere: { center: IAutoMovieVector3 }): {
    x: number;
    z: number;
  } {
    return { x: sphere.center.x, z: sphere.center.z };
  }

  function lerp(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    w: number,
  ): IAutoMovieVector3 {
    return {
      x: a.x + (b.x - a.x) * w,
      y: a.y + (b.y - a.y) * w,
      z: a.z + (b.z - a.z) * w,
    };
  }
}
