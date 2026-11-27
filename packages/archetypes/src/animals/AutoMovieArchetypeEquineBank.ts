import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { QuadrupedRidePose } from "./quadruped/QuadrupedRidePose";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * A horse's slide down a steep bank on a supported route: on a face too steep
 * for its loaded hooves to hold, the horse sits back on its haunches, its hind
 * hooves planted under the body and sliding down the face, while its fore
 * hooves keep walking to steer, then rises onto the run-out at the foot.
 *
 * A loaded hoof holds on a face while the slope's tangent stays under the
 * hoof–surface friction coefficient; past it the hooves slide whatever the
 * horse does, which is when a rider asks the horse to sit and slide rather than
 * stumble (the technique's lower bound). The upper bound is an authored limit
 * past which a slide becomes a fall. The trunk pitches nose-up against the face
 * by `SIT`, about the root, and the hind hooves are brought `TUCK` of the hind
 * limb's length forward under the body; held there in the body's frame they
 * travel with it down the face, projected onto the face at every instant.
 */
export namespace AutoMovieArchetypeEquineBank {
  /**
   * The trunk's nose-up pitch against the face while the horse sits, degrees,
   * at most: authored, provisional; a rigid tail that would meet the face
   * bounds it lower (`sit`).
   */
  export const SIT: number = 20;

  /**
   * The clearance the rigid tail keeps over the face while the horse sits,
   * metres: authored, provisional.
   */
  export const CLEAR: number = 0.03;

  /** A rigid tail's lowest end in the neutral model and its radius. */
  export interface ITail {
    /** The lower end of the tail bar's axis, model metres. */
    end: IAutoMovieVector3;
    /** The bar's radius, metres. */
    radius: number;
  }

  /**
   * The share of the hind limb's length the sliding hind hooves come forward
   * under the body: authored, provisional.
   */
  export const TUCK: number = 0.25;

  /**
   * The sliding hind's hock fold beyond neutral while sat, degrees: authored,
   * provisional, the hocks flexed deep under the haunches.
   */
  export const HOCK: number = 40;

  /**
   * How far down the face the horse is before it sits, shares of its hind
   * hooves' distance behind the root: authored, provisional, so the
   * hindquarters and the tail are over the face, not the crest.
   */
  export const REAR: number = 1.5;

  /**
   * How much higher a fore swings while the horse slides, shares of its gait's
   * own lift and fold: authored, provisional, stepping down a steep face.
   */
  export const STEP: number = 1;

  /**
   * The steepest face a slide is admitted on, as rise over run: authored, 45
   * degrees, past which a slide becomes a fall.
   */
  export const STEEPEST: number = 1;

  /** A slide down the steep face a course leg descends. */
  export interface ISlide {
    /** The discriminator. */
    kind: "bank-slide";
    /**
     * The static friction coefficient between a loaded hoof and the face,
     * dimensionless, nonnegative.
     */
    friction: number;
    /** Where the friction comes from: a citation, or "authored". */
    source: string;
    /**
     * Seconds the horse takes to sit onto its haunches at the top of the face,
     * positive.
     */
    entry: number;
    /** Seconds the horse takes to rise off its haunches at the foot, positive. */
    exit: number;
  }

  /** An admitted slide on the film clock. */
  export interface IWindow {
    /** The film second the face begins. */
    from: number;
    /** The film second the face ends. */
    to: number;
    /** Seconds sitting down. */
    entry: number;
    /** Seconds rising. */
    exit: number;
    /** The nose-up pitch sat, degrees. */
    sit: number;
  }

  /**
   * Admit a slide on one course leg.
   *
   * @param archetype The source archetype's identity.
   * @param index The leg's index.
   * @param leg The leg.
   * @param technique The slide.
   * @param legs The course's leg count.
   * @param plan The course plan.
   * @param footing The course's authored footing.
   * @param behind The hind hooves' distance behind the root, metres.
   * @param tail The rigid tail, which bounds how far the horse sits.
   * @returns The window.
   * @throws {AutoMovieArchetypeRefusal} For a leg that is not a straight
   *   descent over footing with a run-out at its foot, a face its hooves hold
   *   or one steeper than `STEEPEST`, and nonfinite or overlapping blends.
   */
  export function admit(
    archetype: string,
    index: number,
    leg: AutoMovieArchetypeQuadruped.IRideLeg,
    technique: ISlide,
    legs: number,
    plan: AutoMovieArchetypeCourse.IPlan,
    footing: AutoMovieArchetypeQuadrupedFooting.IScene | undefined,
    behind: number,
    tail: ITail,
  ): IWindow {
    const refuse = (reason: string): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `legs[${index}].equineFootwork`,
        value: null,
        feasible: null,
        reason,
        fix: "Slide a straight descent over authored footing, steeper than the face's friction holds and no steeper than the technique's bound, with a run-out leg at its foot.",
      });
    };
    if (leg.kind !== "straight" || leg.reverse || !((leg.rise ?? 0) < 0))
      return refuse("A bank slide needs a straight forward descent");
    if (footing === undefined)
      return refuse("A bank slide needs the face as authored footing");
    if (index === legs - 1)
      return refuse("A bank slide needs a run-out leg at the face's foot");
    const { friction, entry, exit } = technique;
    if (!(friction >= 0) || technique.source.length === 0)
      return refuse("A bank slide states the face's friction and its source");
    const grade: number = -leg.rise! / leg.length;
    if (!(grade > friction))
      return refuse(
        `The face's grade ${grade} is held by its friction ${friction}: the hooves do not slide, so the horse walks down it`,
      );
    if (grade > STEEPEST)
      return refuse(
        `The face's grade ${grade} is steeper than a slide's ${STEEPEST}`,
      );
    const span: AutoMovieArchetypeCourse.ILegSpan = plan.legSpans[index]!;
    // The horse sits once its hindquarters and tail are over the face, and is risen by the foot.
    const from: number = plan.when(
      span.from + Math.min(span.span, REAR * Math.abs(behind)),
    );
    const to: number = plan.when(span.from + span.span);
    if (!(entry > 0 && exit > 0 && entry + exit <= to - from))
      return refuse(
        "A bank slide sits and rises over positive blends within the face, once the hindquarters are over it",
      );
    // The trunk turns nose-up about the root, which lowers the tail's end by its distance behind the root; the sit stops where the end keeps `CLEAR` over the face the body is aligned with.
    const reach: number = Math.hypot(tail.end.y, tail.end.z);
    const clear: number = tail.radius + CLEAR;
    const sit: number =
      clear >= tail.end.y
        ? 0
        : Math.min(
            SIT,
            ((Math.atan2(tail.end.z, tail.end.y) +
              Math.acos(Math.min(1, clear / reach))) *
              180) /
              Math.PI,
          );
    return { from, to, entry, exit, sit };
  }

  /**
   * How far the horse is sat back at a film second, from zero to one.
   *
   * @param windows The admitted slides.
   * @param seconds The film second.
   * @returns The share, by minimum jerk through each entry and exit.
   */
  export function share(windows: readonly IWindow[], seconds: number): number {
    for (const window of windows) {
      if (seconds <= window.from || seconds >= window.to) continue;
      return AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(
          1,
          (seconds - window.from) / window.entry,
          (window.to - seconds) / window.exit,
        ),
      );
    }
    return 0;
  }

  /**
   * The trunk's pitch the slides add at a film second, degrees, positive
   * nose-down: the active slide's sit by its share.
   *
   * @param windows The admitted slides.
   * @param seconds The film second.
   * @returns The pitch, zero outside a slide.
   */
  export function pitch(windows: readonly IWindow[], seconds: number): number {
    for (const window of windows)
      if (seconds > window.from && seconds < window.to)
        return -window.sit * share([window], seconds);
    return 0;
  }

  /**
   * The rigid tail of a neutral model: its bar's lower end and its radius.
   *
   * @param parts The model's parts.
   * @returns The tail.
   * @throws {RangeError} When the model has no tail bar.
   */
  export function tail(parts: readonly IAutoMovieModelPart[]): ITail {
    const bar: IAutoMovieModelPart | undefined = parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "tail",
    );
    const geometry: IAutoMovieModelPart["geometry"] | undefined = bar?.geometry;
    if (
      bar?.transform === undefined ||
      bar.transform === null ||
      geometry?.type !== "primitive" ||
      (geometry.shape.type !== "capsule" && geometry.shape.type !== "cylinder")
    )
      throw new RangeError("A bank slide needs the model's tail bar");
    const half: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      bar.transform.rotation,
      { x: 0, y: geometry.shape.height / 2, z: 0 },
    );
    const top: IAutoMovieVector3 = AutoMovieEngineVector3.add(bar.transform.translation, half);
    const bottom: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      bar.transform.translation,
      half,
    );
    return {
      end: top.y < bottom.y ? top : bottom,
      radius: geometry.shape.radius,
    };
  }

  /**
   * A hind hoof's goal while the horse slides: held `TUCK` forward under the
   * body in its frame, so it travels with the body down the face, laid on the
   * face beneath it, its hock folded `HOCK` beyond neutral.
   *
   * @param windows The admitted slides.
   * @param seconds The film second.
   * @param neutral The hoof's neutral point, model metres.
   * @param attachment The limb's attachment, model metres, whose height over
   *   the hoof is the limb's length.
   * @param goal The gait's goal for the hoof.
   * @param placement The body's world placement.
   * @param footing The course's prepared footing.
   * @returns The goal, the gait's outside a slide.
   */
  export function goal(
    windows: readonly IWindow[],
    seconds: number,
    neutral: IAutoMovieVector3,
    attachment: IAutoMovieVector3,
    goal: QuadrupedRidePose.IGoal,
    placement: IAutoMovieTransform,
    footing: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined,
  ): QuadrupedRidePose.IGoal {
    const amount: number = share(windows, seconds);
    if (amount === 0 || footing === undefined) return goal;
    const from: number = goal.x ?? neutral.x;
    const x: number = from + (neutral.x - from) * amount;
    const z: number =
      goal.z +
      (neutral.z + TUCK * (attachment.y - neutral.y) - goal.z) * amount;
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      placement.rotation,
    );
    const landing: AutoMovieArchetypeQuadrupedFooting.ILanding =
      footing.landing(
        AutoMovieEngineVector3.add(
          placement.translation,
          AutoMovieEngineQuaternion.rotateVector(placement.rotation, { x, y: neutral.y, z }),
        ),
        placement.rotation,
      );
    return {
      ...goal,
      x,
      z,
      orientation: AutoMovieEngineQuaternion.slerp(
        goal.orientation ?? AutoMovieEngineQuaternion.identity(),
        AutoMovieEngineQuaternion.multiply(inverse, landing.rotation),
        amount,
      ),
      surface: {
        point: AutoMovieEngineQuaternion.rotateVector(
          inverse,
          AutoMovieEngineVector3.subtract(landing.point, placement.translation),
        ),
        normal: AutoMovieEngineQuaternion.rotateVector(inverse, landing.normal),
      },
      lift: (1 - amount) * goal.lift,
      fold: (1 - amount) * goal.fold + amount * HOCK,
    };
  }

  /**
   * A fore hoof's goal while the horse slides: its gait's own step, swung
   * `STEP` higher and folded `STEP` more, stepping down the steep face to
   * steer.
   *
   * @param windows The admitted slides.
   * @param seconds The film second.
   * @param goal The gait's goal for the hoof.
   * @returns The goal, the gait's outside a slide.
   */
  export function step(
    windows: readonly IWindow[],
    seconds: number,
    goal: QuadrupedRidePose.IGoal,
  ): QuadrupedRidePose.IGoal {
    const amount: number = share(windows, seconds);
    return amount === 0
      ? goal
      : {
          ...goal,
          lift: goal.lift * (1 + STEP * amount),
          fold: goal.fold * (1 + STEP * amount),
        };
  }
}
