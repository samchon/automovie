import {
  resolveAutoMovieFraming,
  type IAutoMovieSchedule,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { SightLaw } from "../../laws/cinematography/SightLaw";
import { BoutLaws } from "../kickboxing/BoutLaws";
import type { IRingCast } from "../kickboxing/IRingCast";
import { RefereeTrack } from "../officiating/RefereeTrack";
import type { FinishSight } from "./FinishSight";

/**
 * The camera's path through the film, resolved once at a fixed step: the
 * size follows the action (wide in resets, medium in exchanges, close on a
 * landed blow's receiver), each size holding at least the law's minimum; the
 * bearing orbits toward side-on, opposite the referee, at no more than the
 * law's rate; the framing comes from the subjects' bounding spheres by the
 * engine; the operator follows with lag; the lens stays inside the ropes.
 * From the screenplay's finish decision the camera widens to hold A, B and
 * the referee, turning at the orbit rate to the view the visibility law
 * chooses for the finishing strike: the open side's side-on view, or the
 * least turn or rise from it that keeps the striking surface, the struck
 * region and the descending path clear of every body, measured by the given
 * sight reader on the lens the track actually delivers at the contact. It holds that view through the fall, the
 * count and the celebration.
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
    const height = (measure: {
      hip: number;
      shoulder: number;
      head: number;
    }): {
      body: number;
      upper: number;
      bodyRadius: number;
      upperRadius: number;
    } => ({
      body: measure.head / 2,
      upper: (measure.shoulder + measure.head) / 2,
      bodyRadius: measure.head / 2 + measure.head * 0.1,
      upperRadius: (measure.head - measure.hip) / 2,
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
        "a-upper": {
          center: { x: a.x, y: ha.upper, z: a.z },
          radius: ha.upperRadius,
        },
        "b-upper": {
          center: { x: b.x, y: hb.upper, z: b.z },
          radius: hb.upperRadius,
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
        const hit = landed.find(
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
        const subjects: string[] =
          s.size === "wide" || s.size === "finish"
            ? wide
            : s.size === "close"
              ? [
                  hit?.receiver === cast.b.id ? "b-upper" : "a-upper",
                  hit?.receiver === cast.b.id ? "a-upper" : "b-upper",
                ]
              : ["a-upper", "b-upper"];
        // Side-on opposite the referee; from the finish, the visibility law's view.
        const aim: SightLaw.IView =
          s.size === "finish" && view !== undefined
            ? view
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
          state,
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
    for (const view of candidates(
      cast,
      scene,
      (v: SightLaw.IView, t: number) =>
        place(
          cast,
          CoverageLaw.goal("finish", wide, v.bearing, v.elevation),
          states.get(t) ?? spheres(t),
        ),
      hold,
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

  /**
   * The visibility law's candidate views whose own lens is clear: the open
   * side's views nearest the side-on view first, up to the lens height a
   * ringside operator reaches with the camera overhead (shoulder height plus
   * arm reach, taken from the referee's adult build). A wide view holds all
   * three men only while its lens stands at its framing distance inside the
   * ropes, so the views whose lens has that room at every second of the hold
   * come first, then those with room at the contact, then the rest.
   */
  function* candidates(
    cast: IRingCast,
    scene: SightLaw.IScene,
    lens: (
      view: SightLaw.IView,
      seconds: number,
    ) => {
      position: IAutoMovieVector3;
      target: IAutoMovieVector3;
      clamped: boolean;
    },
    hold: readonly number[],
  ): Generator<SightLaw.IView> {
    const open: number = SightLaw.open(
      scene.attacker,
      scene.receiver,
      scene.contact,
    );
    const reach: number =
      cast.referee.body.measure.shoulder + cast.referee.body.measure.armReach;
    const base = lens(
      { bearing: open, elevation: CoverageLaw.ELEVATION },
      scene.seconds,
    );
    const highest: number = Math.atan2(
      reach - base.target.y,
      Math.hypot(
        base.position.x - base.target.x,
        base.position.z - base.target.z,
      ),
    );
    const views: SightLaw.IView[] = SightLaw.views(
      open,
      CoverageLaw.ELEVATION,
      CoverageLaw.ORBIT * STEP,
      highest,
    );
    const room = (view: SightLaw.IView): number =>
      hold.every((t) => !lens(view, t).clamped)
        ? 0
        : !lens(view, scene.seconds).clamped
          ? 1
          : 2;
    for (const level of [0, 1, 2])
      for (const view of views) {
        const placed = lens(view, scene.seconds);
        if (placed.position.y > reach || room(view) !== level) continue;
        if (SightLaw.clearance(placed.position, scene) > 0) yield view;
      }
  }

  /** A framing goal's lens, held inside the ropes at the goal's elevation from where it stands, and whether the ropes held it back. */
  function place(
    cast: IRingCast,
    goal: ReturnType<typeof CoverageLaw.goal>,
    spheres: Record<string, { center: IAutoMovieVector3; radius: number }>,
  ): {
    position: IAutoMovieVector3;
    target: IAutoMovieVector3;
    clamped: boolean;
  } {
    const frame = resolveAutoMovieFraming(goal, spheres);
    const limit: number = cast.ring.half - LENS_MARGIN;
    const x: number = Math.max(-limit, Math.min(limit, frame.position.x));
    const z: number = Math.max(-limit, Math.min(limit, frame.position.z));
    return {
      position: {
        x,
        y:
          frame.target.y +
          Math.hypot(x - frame.target.x, z - frame.target.z) *
            Math.tan(goal.elevation),
        z,
      },
      target: frame.target,
      clamped: x !== frame.position.x || z !== frame.position.z,
    };
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
