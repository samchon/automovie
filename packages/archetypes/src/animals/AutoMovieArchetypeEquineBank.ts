import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
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
import type { QuadrupedRidePose } from "./QuadrupedRidePose";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * A horse's slide down a steep bank on a supported route: on a face too steep for its loaded hooves to hold, the horse sits back on its haunches, its hind hooves planted under the body and sliding down the face, while its fore hooves keep walking to steer, then rises onto the run-out at the foot.
 *
 * A loaded hoof holds on a face while the slope's tangent stays under the hoof–surface friction coefficient; past it the hooves slide whatever the horse does, which is when a rider asks the horse to sit and slide rather than stumble (the technique's lower bound). The upper bound is an authored limit past which a slide becomes a fall. The trunk pitches nose-up against the face by `SIT`, about the root, and the hind hooves are brought `TUCK` of the hind limb's length forward under the body; held there in the body's frame they travel with it down the face, projected onto the face at every instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the technique, its physical admission, the authored bounds and the pose it adds.
 * @evidence contracts/development/design.md#principled-representation A face's friction and the course's own grade admit it; a window with its entry and exit carries it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `EquineFootwork`'s admission and hind goals and by the ride's pitch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The slide comes from the face's slope and friction, never a flag; the hooves stay on the authored face.
 */
export namespace AutoMovieArchetypeEquineBank {
  /** The trunk's nose-up pitch against the face while the horse sits, degrees, at most: authored, provisional; a rigid tail that would meet the face bounds it lower (`sit`). */
  export const SIT: number = 20;

  /** The clearance the rigid tail keeps over the face while the horse sits, metres: authored, provisional. */
  export const CLEAR: number = 0.03;

  /**
   * A rigid tail's lowest end in the neutral model and its radius.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation The end that hangs lowest and the bar's radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `tail`, read by `admit`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITail {
    /** The lower end of the tail bar's axis, model metres. */
    end: IAutoMovieVector3;
    /** The bar's radius, metres. */
    radius: number;
  }

  /** The share of the hind limb's length the sliding hind hooves come forward under the body: authored, provisional. */
  export const TUCK: number = 0.25;

  /** The sliding hind's hock fold beyond neutral while sat, degrees: authored, provisional, the hocks flexed deep under the haunches. */
  export const HOCK: number = 40;

  /** How far down the face the horse is before it sits, shares of its hind hooves' distance behind the root: authored, provisional, so the hindquarters and the tail are over the face, not the crest. */
  export const REAR: number = 1.5;

  /** How much higher a fore swings while the horse slides, shares of its gait's own lift and fold: authored, provisional, stepping down a steep face. */
  export const STEP: number = 1;

  /** The steepest face a slide is admitted on, as rise over run: authored, 45 degrees, past which a slide becomes a fall. */
  export const STEEPEST: number = 1;

  /**
   * A slide down the steep face a course leg descends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and source.
   * @evidence contracts/development/design.md#principled-representation The face's friction with its source and the two blends in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `EquineFootwork.Technique`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default friction: the face's author states it.
   */
  export interface ISlide {
    /** The discriminator. */
    kind: "bank-slide";
    /** The static friction coefficient between a loaded hoof and the face, dimensionless, nonnegative. */
    friction: number;
    /** Where the friction comes from: a citation, or "authored". */
    source: string;
    /** Seconds the horse takes to sit onto its haunches at the top of the face, positive. */
    entry: number;
    /** Seconds the horse takes to rise off its haunches at the foot, positive. */
    exit: number;
  }

  /**
   * An admitted slide on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation The leg's film interval and the two blends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `admit`, read by `sit` and `goal`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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
   * @throws {AutoMovieArchetypeRefusal} For a leg that is not a straight descent over footing with a run-out at its foot, a face its hooves hold or one steeper than `STEEPEST`, and nonfinite or overlapping blends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The face's grade is the leg's own rise over its length; a loaded hoof slides once that tangent exceeds the friction coefficient. The sit begins once the hindquarters are REAR hind-hoof distances down the face.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Leg shape, face, run-out, blends, then the window.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A face outside the technique's bounds is refused, never flattened.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two plan reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The course plan's own leg span and clock.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one window.
   */
  export function admit(
    archetype: string,
    index: number,
    leg: rideQuadruped.ILeg,
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
    if (
      !(Number.isFinite(friction) && friction >= 0) ||
      typeof technique.source !== "string" ||
      technique.source.length === 0
    )
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
    if (
      ![entry, exit].every(Number.isFinite) ||
      !(entry > 0 && exit > 0 && entry + exit <= to - from)
    )
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the range and the blends.
   * @evidence contracts/development/implementation.md#principled-implementation Minimum jerk in, held, minimum jerk out, so the pitch and the hooves change smoothly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One window lookup and one blend.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the few windows.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
   */
  export function share(windows: readonly IWindow[], seconds: number): number {
    for (const window of windows) {
      if (seconds <= window.from || seconds >= window.to) continue;
      return minimumJerk.share(
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
   * The trunk's pitch the slides add at a film second, degrees, positive nose-down: the active slide's sit by its share.
   *
   * @param windows The admitted slides.
   * @param seconds The film second.
   * @returns The pitch, zero outside a slide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and sign.
   * @evidence contracts/development/implementation.md#principled-implementation The window's own sit, bounded by its tail, by the sit's share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the few windows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation The bar's two axis ends from its transform and length; the lower one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and two ends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing tail refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts, once per ride.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
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
    const half: IAutoMovieVector3 = Quaternion.rotateVector(
      bar.transform.rotation,
      { x: 0, y: geometry.shape.height / 2, z: 0 },
    );
    const top: IAutoMovieVector3 = Vector3.add(bar.transform.translation, half);
    const bottom: IAutoMovieVector3 = Vector3.subtract(
      bar.transform.translation,
      half,
    );
    return {
      end: top.y < bottom.y ? top : bottom,
      radius: geometry.shape.radius,
    };
  }

  /**
   * A hind hoof's goal while the horse slides: held `TUCK` forward under the body in its frame, so it travels with the body down the face, laid on the face beneath it, its hock folded `HOCK` beyond neutral.
   *
   * @param windows The admitted slides.
   * @param seconds The film second.
   * @param neutral The hoof's neutral point, model metres.
   * @param attachment The limb's attachment, model metres, whose height over the hoof is the limb's length.
   * @param goal The gait's goal for the hoof.
   * @param placement The body's world placement.
   * @param footing The course's prepared footing.
   * @returns The goal, the gait's outside a slide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, units and when the gait's goal is kept.
   * @evidence contracts/development/implementation.md#principled-implementation A hoof fixed in the body's frame moves with the body, which descends the face; the face's own landing at the hoof's world point gives its support plane and turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Blend the model position, land it on the face, express the plane in model space.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hoof is laid on the authored face, never at a nominal floor.
   * @evidence contracts/development/implementation.md#efficient-algorithms One landing query per sliding hoof.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The footing's own landing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one goal.
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
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      placement.rotation,
    );
    const landing: AutoMovieArchetypeQuadrupedFooting.ILanding =
      footing.landing(
        Vector3.add(
          placement.translation,
          Quaternion.rotateVector(placement.rotation, { x, y: neutral.y, z }),
        ),
        placement.rotation,
      );
    return {
      ...goal,
      x,
      z,
      orientation: Quaternion.slerp(
        goal.orientation ?? Quaternion.identity(),
        Quaternion.multiply(inverse, landing.rotation),
        amount,
      ),
      surface: {
        point: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(landing.point, placement.translation),
        ),
        normal: Quaternion.rotateVector(inverse, landing.normal),
      },
      lift: (1 - amount) * goal.lift,
      fold: (1 - amount) * goal.fold + amount * HOCK,
    };
  }

  /**
   * A fore hoof's goal while the horse slides: its gait's own step, swung `STEP` higher and folded `STEP` more, stepping down the steep face to steer.
   *
   * @param windows The admitted slides.
   * @param seconds The film second.
   * @param goal The gait's goal for the hoof.
   * @returns The goal, the gait's outside a slide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what changes and when.
   * @evidence contracts/development/implementation.md#principled-implementation The gait keeps the footfalls and their world footholds; only the swing's clearance and fold grow with the sit's share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two scalings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A standing hoof, lift zero, is unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `share`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one goal.
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
