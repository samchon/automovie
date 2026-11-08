import {
  type IAutoMovieSchedule,
  resolveAutoMovieFraming,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { SightLaw } from "../../laws/cinematography/SightLaw";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RefereeTrack } from "../officiating/RefereeTrack";
import { FinishHold } from "./FinishHold";
import type { FinishSight } from "./FinishSight";
import { RopeLens } from "./RopeLens";

/**
 * The camera's path through the film, resolved once at a fixed step: the
 * size follows the action (wide in resets, medium in exchanges, pushed in
 * close on a landed blow), each size holding at least the law's minimum and
 * framing both fighters' whole bodies, the referee too while he officiates;
 * each man is framed where he stands and one operator's lag ahead, so the
 * following lens keeps his path; the bearing orbits toward side-on, opposite
 * the referee, at no more than the law's rate; the framing comes from the
 * subjects' bounding spheres by the engine; the lens stays inside the ropes.
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
 * @evidence docs/body/settings/cinematography/ring-coverage.md#finish The finish view held to the end.
 */
export namespace CameraTrack {
  /** Resolution step, seconds: one frame of the film. */
  export const STEP: number = 1 / 30;

  /** Clearance of the lens inside the rope line, metres: a camera operator's body depth (film choice). */
  const LENS_MARGIN: number = 0.3;

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
        a: { center: { x: a.x, y: ha.body, z: a.z }, radius: ha.bodyRadius },
        b: { center: { x: b.x, y: hb.body, z: b.z }, radius: hb.bodyRadius },
        referee: {
          center: { x: r.x, y: hr.body, z: r.z },
          radius: hr.bodyRadius,
        },
      };
    };
    const wide: string[] = ["a", "b", "referee"];
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
    ): boolean =>
      FinishHold.frames(
        place(
          cast,
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
        const wanted: CoverageLaw.Size =
          t >= finish
            ? "finish"
            : hit
              ? "close"
              : exchanges.some((x) => t >= x.start && t < x.end)
                ? "medium"
                : "wide";
        if (
          wanted !== s.size &&
          (t - s.since >= CoverageLaw.HOLD || wanted === "finish")
        ) {
          s.size = wanted;
          s.since = t;
        }
        // Every size frames both whole bodies, so the feet and stance read;
        // the referee joins while he officiates. Each man is framed where he
        // stands and where he will stand one operator's lag ahead, so the
        // following lens keeps his path.
        const men: string[] =
          s.size === "wide" || s.size === "finish" || busy(officiating, t)
            ? wide
            : ["a", "b"];
        const subjects: string[] = men.flatMap((id) => [id, `${id}${AHEAD}`]);
        const framed = { ...state, ...ahead(k) };
        // Side-on opposite the referee; from the finish, the visibility law's
        // view, which after the blow turns within its open side by the least
        // amount that keeps every man in frame.
        const aim: SightLaw.IView =
          s.size === "finish" && view !== undefined
            ? t <= blow.release || s.bearing === undefined
              ? view
              : {
                  bearing: FinishHold.bearing({
                    open: view.bearing,
                    current: s.bearing,
                    frames: (bearing: number): boolean =>
                      holds(bearing, s.elevation, framed),
                  }),
                  elevation: view.elevation,
                }
            : {
                bearing: CoverageLaw.bearing(
                  floor(state.a!),
                  floor(state.b!),
                  floor(state.referee!),
                ),
                elevation: CoverageLaw.ELEVATION,
              };
        s.bearing =
          s.bearing === undefined
            ? aim.bearing
            : CoverageLaw.orbit(s.bearing, aim.bearing, STEP);
        s.elevation = CoverageLaw.orbit(s.elevation, aim.elevation, STEP);
        const wantedFrame = place(
          cast,
          CoverageLaw.goal(s.size, subjects, s.bearing, s.elevation),
          framed,
        );
        const follow: number = k === 0 ? 1 : CoverageLaw.follow(STEP);
        s.position =
          s.position === undefined
            ? wantedFrame.position
            : lerp(s.position, wantedFrame.position, follow);
        s.target =
          s.target === undefined
            ? wantedFrame.target
            : lerp(s.target, wantedFrame.target, follow);
        samples.push({ position: s.position, target: s.target, size: s.size });
      }
    };
    const fresh = (): IState => ({
      size: "wide",
      since: 0,
      bearing: undefined,
      elevation: CoverageLaw.ELEVATION,
      position: undefined,
      target: undefined,
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
      hold.push(t);
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
        place(
          cast,
          CoverageLaw.goal("finish", wide, v.bearing, v.elevation),
          states.get(t) ?? spheres(t),
        ),
      hold,
      overhead(cast),
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
              CoverageLaw.FIELD_OF_VIEW,
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
      CoverageLaw.FIELD_OF_VIEW,
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

  /** A framing goal's lens held inside the ropes by {@link RopeLens.hold}. */
  function place(
    cast: IRingCast,
    goal: ReturnType<typeof CoverageLaw.goal>,
    spheres: Record<string, { center: IAutoMovieVector3; radius: number }>,
  ): RopeLens.IHeld {
    return RopeLens.hold(
      resolveAutoMovieFraming(goal, spheres),
      cast.ring.half - LENS_MARGIN,
      goal.elevation,
      overhead(cast),
    );
  }

  /** The highest lens an operator in the ring holds overhead: shoulder height plus arm reach of the referee's adult build. */
  function overhead(cast: IRingCast): number {
    return (
      cast.referee.body.measure.shoulder + cast.referee.body.measure.armReach
    );
  }

  /** Whether an instant falls inside any interval. */
  function busy(
    intervals: readonly { start: number; end: number }[],
    seconds: number,
  ): boolean {
    return intervals.some((i) => seconds >= i.start && seconds < i.end);
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
