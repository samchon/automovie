
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieMotionHumanAuditMeasure, IAutoMovieMotionHumanAuditMotion, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieResolveCenterOfMass, IAutoMovieVector3 } from "@automovie/interface";

import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditStatics } from "./AutoMovieMotionHumanAuditStatics";

/*
 * Whether a body standing on both feet alone keeps its balance: the margin of
 * stability of Hof, Gazendam and Sinke (2005) at every instant where both feet
 * are declared planted on the ground and nothing else bears the body.
 *
 * The extrapolated centre of mass is the engine's whole-body centre plus its
 * velocity over the eigenfrequency of an inverted pendulum 1.34 hip heights
 * long (Hof et al.'s length). The velocity is a central difference: over the
 * grid's two neighbouring instants when a whole motion is measured, so the
 * reading resolves no pose the audit's other checks have not, and over `2 *
 * STEP` when one instant is asked for alone. The margin is its distance inside
 * the base of support, the convex hull of the outlines of both feet where they
 * bear on the floor (`HumanFoot.base`, Winter's definition). A person whose
 * extrapolated centre leaves that hull must step or fall, so a motion that
 * keeps both feet planted while it lies outside shows a body no one could hold.
 * While a part other than a foot bears on the ground (a `bear` window, a knee
 * or a shin, or the `plant` of a palm laid on the floor), the base is the
 * planted feet's outlines and those parts' contact points
 * (`AutoMovieMotionHumanAuditStatics.point`), and the instant is read when
 * every open window bears on the ground through the hold. An instant where a
 * hand grips, a seat or a back bears, or a foot is not planted is not read: the
 * feet are not the only support there. Nor is an instant within the pendulum's
 * own time constant (the square root of its length over gravity, about a third
 * of a second) of a foot leaving the ground or of another support taking the
 * body (the seat a person lowers onto): that body is taking the step Hof et
 * al.'s condition demands, and in steady walking the extrapolated centre does
 * lie ahead of the leading foot through the double support (Hof 2008, Hum Mov
 * Sci 27:112). An instant is read only inside an action whose balance is its
 * content (`HumanPhysics.judged`: a staged physical outcome, or physics its
 * caller asked for); a posed action on planted feet computes no balance and is
 * not judged by it.
 */
export namespace AutoMovieMotionHumanAuditBalance {
  /*
   * Half the span of the velocity's central difference when one instant is read
   * alone, seconds.
   */
  export const STEP: number = 1 / 240;

  /*
   * How far the extrapolated centre of mass leaves the feet's hull over the
   * instants where both feet alone bear the body.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter body: Their body.
   * Parameter rate: Grid samples per second.
   * Returns: Metres outside the hull (zero when it never leaves, or when no
   * instant is read), with `both feet` and the second.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    let worst: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: "none",
    };
    // Select the plans that can ask for a balance judgement before reading
    // any support geometry or mass data.
    const spans: readonly HumanPhysics.ISpan[] = motion.segments(subject);
    const candidates: ISampledInterval[] = [];
    const times: HumanAuditMotion.IGrid = HumanAuditMotion.lattice(
      0,
      motion.duration,
      rate,
    );
    for (const span of spans)
      for (const interval of HumanPhysics.intervals(span)) {
        // Preserve the exact action-clock comparison at an endpoint even
        // when reversing the offset rounds onto the adjacent grid tick.
        const from: number = Math.max(
          0,
          locate(times, interval.from, false) - 1,
        );
        const to: number = Math.min(
          times.length - 1,
          locate(times, interval.to, true),
        );
        if (from <= to) candidates.push({ span, from, to });
      }
    if (candidates.length === 0) return worst;
    candidates.sort(
      (a: ISampledInterval, b: ISampledInterval): number => a.from - b.from,
    );
    const windows: IAutoMovieMotionHumanAuditMotion.IWindow[] =
      HumanAuditMotion.windows(motion, subject);
    const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    const hold: number =
      1 /
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency(
        AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
      );
    const samples: Map<number, IStencilSample> = new Map();
    const sampleAt: StencilAt = (
      seconds: number,
      bones?: Bones,
    ): IStencilSample => {
      const known: IStencilSample | undefined = samples.get(seconds);
      if (known !== undefined) return known;
      const read: Bones = bones ?? motion.bones(subject, seconds);
      const sample: IStencilSample = {
        bones: read,
        centre: AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, read),
      };
      samples.set(seconds, sample);
      return sample;
    };
    const centreAt: CentreAt = (
      seconds: number,
      bones?: Bones,
    ): IAutoMovieVector3 => {
      return sampleAt(seconds, bones).centre;
    };
    const active: ISampledInterval[] = [];
    let next: number = 0;
    for (let i: number = candidates[0]!.from; i < times.length; ++i) {
      for (let j: number = active.length - 1; j >= 0; --j)
        if (active[j]!.to < i) active.splice(j, 1);
      if (active.length === 0) {
        if (next === candidates.length) break;
        i = Math.max(i, candidates[next]!.from);
      }
      while (next < candidates.length && candidates[next]!.from <= i)
        active.push(candidates[next++]!);
      const t: number = times.at(i);
      if (
        !active.some(
          ({ span }: ISampledInterval): boolean =>
            span.entryTime <= t &&
            t <= span.end &&
            HumanPhysics.judged(span, t),
        )
      )
        continue;
      // A foot that lifts within the pendulum's own time is a step being
      // taken: the body is walking there, not standing.
      if (!standing(windows, t, Math.min(motion.duration, t + hold))) continue;
      const before: number = times.at(Math.max(0, i - 1));
      const after: number = times.at(Math.min(times.length - 1, i + 1));

      // The three-point stencil advances monotonically. A mass centre can
      // serve later stencils only while its time remains in this span.
      for (const known of samples.keys())
        if (known < before) samples.delete(known);
      const value: number = -marginAt(
        body,
        windows,
        sampleAt(t).bones,
        centreAt,
        t,
        before,
        after,
      );
      if (value > worst.value)
        worst = { value, seconds: t, where: "both feet" };
    }
    return worst;
  }

  /*
   * Locate the first sample at (or strictly after) a second on the film grid.
   */
  function locate(
    times: HumanAuditMotion.IGrid,
    seconds: number,
    strict: boolean,
  ): number {
    let from: number = 0;
    let to: number = times.length;
    while (from < to) {
      const middle: number = from + Math.floor((to - from) / 2);
      const at: number = times.at(middle);
      if (at < seconds || (strict && at === seconds)) from = middle + 1;
      else to = middle;
    }
    return from;
  }

  /*
   * The margin of stability at one instant, whatever the contacts.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter body: Their body.
   * Parameter model: The body's mass model.
   * Parameter seconds: Film seconds.
   * Parameter before: The earlier instant of the velocity's difference; `STEP`
   * before, clamped into the motion, by default.
   * Parameter after: The later instant of the velocity's difference; `STEP` after,
   * clamped into the motion, by default.
   * Returns: Metres, positive inside the feet's hull.
   */
  export function margin(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    model: IAutoMovieResolveCenterOfMass.IModel,
    seconds: number,
    before: number = Math.max(0, seconds - STEP),
    after: number = Math.min(motion.duration, seconds + STEP),
  ): number {
    return marginAt(
      body,
      HumanAuditMotion.windows(motion, subject),
      motion.bones(subject, seconds),
      (at: number, bones?: Bones): IAutoMovieVector3 =>
        AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
          model,
          bones ?? motion.bones(subject, at),
        ),
      seconds,
      before,
      after,
    );
  }

  /*
   * Read the support and three-point Hof margin on the current bone frames.
   */
  function marginAt(
    body: IAutoMovieMotionHumanBody,
    windows: readonly IAutoMovieMotionHumanAuditMotion.IWindow[],
    bones: Bones,
    centre: CentreAt,
    seconds: number,
    before: number,
    after: number,
  ): number {
    // The base of support: the planted feet's outlines and the contact point
    // of every other part bearing on the ground, whether its window is a
    // `bear` (a knee, a shin) or a `plant` (a palm laid on the floor), or
    // both feet when no window says otherwise. The instants `standing` reads
    // admit both kinds, so the base takes both.
    const open: IAutoMovieMotionHumanAuditMotion.IWindow[] = windows.filter(
      (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
        seconds >= w.from &&
        seconds <= w.to &&
        w.contact.support.kind === "ground",
    );
    const borne: IAutoMovieMotionHumanAuditMotion.IWindow[] = open.filter(
      (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
        w.contact.kind === "bear" ||
        (w.contact.kind === "plant" &&
          w.contact.part !== "leftFoot" &&
          w.contact.part !== "rightFoot"),
    );
    const feet: AutoMovieHumanSide[] =
      borne.length === 0
        ? ["left", "right"]
        : (["left", "right"] as const).filter(
            (side: AutoMovieHumanSide): boolean =>
              open.some(
                (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
                  w.contact.part === `${side}Foot` &&
                  w.contact.kind === "plant",
              ),
          );
    const support: IAutoMovieVector3[] = [
      ...HumanFoot.base(body, bones, feet),
      ...borne.map(
        (w: IAutoMovieMotionHumanAuditMotion.IWindow): IAutoMovieVector3 =>
          AutoMovieMotionHumanAuditStatics.point(body, bones, w.contact),
      ),
    ];
    const a: IAutoMovieVector3 = centre(
      before,
      before === seconds ? bones : undefined,
    );
    const b: IAutoMovieVector3 =
      after === before
        ? a
        : centre(after, after === seconds ? bones : undefined);
    const span: number = after - before;
    const velocity: IAutoMovieVector3 =
      span > 0
        ? {
            x: (b.x - a.x) / span,
            y: (b.y - a.y) / span,
            z: (b.z - a.z) / span,
          }
        : { x: 0, y: 0, z: 0 };
    return AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(
        seconds === before ? a : seconds === after ? b : centre(seconds, bones),
        velocity,
        AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
      ),
      support,
    );
  }

  /*
   * The feet, the parts a standing base bears on.
   */
  const FEET: ReadonlySet<IAutoMovieMotionHumanContactWindow["part"]> = new Set<
    IAutoMovieMotionHumanContactWindow["part"]
  >(["leftFoot", "rightFoot"]);

  /*
   * Whether another support takes the body within the hold: a bearing window of
   * a part not bearing now (a seat the body is lowered onto, a hand put down)
   * opens after the instant and by its end. That is the same case as a step
   * being taken: the parts bearing now will not be alone for the hold, whether
   * they are planted feet or feet and knees bearing together.
   * Parameter windows: The person's contact windows, film seconds.
   * Parameter seconds: Film seconds.
   * Parameter until: The hold's end, film seconds.
   * Parameter bearing: The parts bearing at the instant.
   * Returns: Whether such a support arrives.
   */
  function arriving(
    windows: readonly IAutoMovieMotionHumanAuditMotion.IWindow[],
    seconds: number,
    until: number,
    bearing: ReadonlySet<IAutoMovieMotionHumanContactWindow["part"]>,
  ): boolean {
    return (
      until > seconds &&
      windows.some(
        (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
          !bearing.has(w.contact.part) &&
          w.contact.kind !== "grip" &&
          w.contact.kind !== "strike" &&
          w.from > seconds &&
          w.from <= until + 1e-9,
      )
    );
  }

  /*
   * Whether both feet alone bear the body at an instant: each foot inside a
   * plant window on the ground, and no other contact window open.
   * Parameter windows: The person's contact windows, film seconds.
   * Parameter seconds: Film seconds.
   * Parameter until: The second both feet must stay planted to, without a gap;
   * `seconds` itself when absent.
   * Returns: Whether the instant is read.
   */
  export function standing(
    windows: readonly IAutoMovieMotionHumanAuditMotion.IWindow[],
    seconds: number,
    until: number = seconds,
  ): boolean {
    // A part bearing on the ground besides the feet (a knee, a palm): the
    // body is read while every open window bears on the ground and one of
    // them is such a part, its base those contacts and the planted feet.
    const open: IAutoMovieMotionHumanAuditMotion.IWindow[] = windows.filter(
      (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
        seconds >= w.from && seconds <= w.to,
    );
    if (
      open.some(
        (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
          w.contact.kind === "bear",
      )
    )
      return (
        open.every(
          (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
            w.contact.support.kind === "ground" &&
            (w.contact.kind === "bear" || w.contact.kind === "plant") &&
            (until <= seconds || w.to >= until - 1e-9),
        ) &&
        !arriving(
          windows,
          seconds,
          until,
          new Set<IAutoMovieMotionHumanContactWindow["part"]>(
            open.map(
              (
                w: IAutoMovieMotionHumanAuditMotion.IWindow,
              ): IAutoMovieMotionHumanContactWindow["part"] => w.contact.part,
            ),
          ),
        )
      );
    if (until > seconds) {
      if (arriving(windows, seconds, until, FEET)) return false;
      for (const part of ["leftFoot", "rightFoot"] as const) {
        // How long this foot stays planted from the instant on, through
        // plant windows that follow one another without a gap.
        let kept: number = seconds;
        for (let grown: boolean = true; grown && kept < until; ) {
          grown = false;
          for (const window of windows)
            if (
              window.contact.part === part &&
              window.contact.kind === "plant" &&
              window.from <= kept + 1e-9 &&
              window.to > kept + 1e-9
            ) {
              kept = window.to;
              grown = true;
            }
        }
        if (kept < until - 1e-9) return false;
      }
    }
    let left: boolean = false;
    let right: boolean = false;
    for (const window of windows) {
      if (seconds < window.from || seconds > window.to) continue;
      const foot: boolean =
        window.contact.part === "leftFoot" ||
        window.contact.part === "rightFoot";
      if (
        !foot ||
        window.contact.kind !== "plant" ||
        window.contact.support.kind !== "ground"
      )
        return false;
      if (window.contact.part === "leftFoot") left = true;
      else right = true;
    }
    return left && right;
  }

  /*
   * One action's candidate interval as indices into the original film grid.
   */
  interface ISampledInterval {
    span: HumanPhysics.ISpan;
    from: number;
    to: number;
  }

  /*
   * Displayed bones and their mass centre at one instant of the stencil.
   */
  interface IStencilSample {
    /*
     * The displayed bones.
     */
    bones: Bones;

    /*
     * Their centre of mass, world metres.
     */
    centre: IAutoMovieVector3;
  }

  /*
   * Read or allocate the one sample shared by overlapping stencils.
   */
  type StencilAt = (seconds: number, bones?: Bones) => IStencilSample;
}

/*
 * The displayed bones as owned by the audit's motion.
 */
type Bones = ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]>;

/*
 * The mass centre at an actual film second, reusing displayed frames when
 * supplied.
 */
type CentreAt = (seconds: number, bones?: Bones) => IAutoMovieVector3;
