import {
  Quaternion,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "../../core";
import { AutoMovieArchetypeEquineBank } from "../AutoMovieArchetypeEquineBank";
import { AutoMovieArchetypeEquineScramble } from "../AutoMovieArchetypeEquineScramble";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import { EquineEdge } from "./EquineEdge";
import { EquineJump } from "./EquineJump";
import { EquineLateral } from "./EquineLateral";
import type { QuadrupedRidePose } from "../quadruped/QuadrupedRidePose";
import type { AutoMovieArchetypeQuadruped } from "../AutoMovieArchetypeQuadruped";

/** Admission and sample goals for individually authored equine footwork. */
export namespace EquineFootwork {
  /** Named equine film-animation technique on one course leg. */
  export type Technique =
    | IReinBack
    | ISlideStop
    | EquineLateral.Technique
    | EquineJump.Technique
    | AutoMovieArchetypeEquineBank.ISlide
    | AutoMovieArchetypeEquineScramble.IScramble;

  /** A named film-second cue a technique adds to the ride. */
  export interface IInstant {
    /** Film second. */
    seconds: number;
    /** The cue's name. */
    label: string;
  }

  /** Backing on alternating diagonals from rest to rest. */
  export interface IReinBack {
    /** The discriminator. */
    kind: "rein-back";
  }

  /** A terminal arena slide on both hind feet. */
  export interface ISlideStop {
    /** The discriminator. */
    kind: "slide-stop";
    /** Seconds from the first slide cue through the terminal stop. */
    seconds: number;
    /** Seconds allotted to blend from the stride to the two-hindfoot slide. */
    entry: number;
    /** Authored model-space advance of the hind footprints, metres. */
    advance: number;
  }

  /**
   * An admitted slide interval with its terminal stop already fixed by the
   * route.
   */
  interface ISlide {
    /** Slide entry begins at this film second, on the original route. */
    from: number;
    /** Both hind feet reach their authored slide targets at this film second. */
    contact: number;
    /** Model-space offset of the two hind footprints, metres. */
    advance: number;
  }

  /** Admit a reusable individual film-footwork plan and its authored timed cues. */
  export interface IPlan {
    /**
     * Original course leg numbers, zero-based, explicitly authored for
     * rein-back.
     */
    readonly backing: ReadonlySet<number>;
    /** Additional named film-second cues owned by the authored technique. */
    readonly instants: readonly IInstant[];
    /** Authored interval if the route ends with an arena slide. */
    readonly slide?: ISlide;
    /** Admitted lateral figures, in leg order. */
    readonly lateral: readonly EquineLateral.IWindow[];
    /** The admitted jump, when a leg names one. */
    readonly jump?: EquineJump.IRequest;
    /** Admitted slides down steep banks, in leg order. */
    readonly bank: readonly AutoMovieArchetypeEquineBank.IWindow[];
    /** Admitted scrambles up steep banks, in leg order. */
    readonly scramble: readonly AutoMovieArchetypeEquineScramble.IWindow[];
    /**
     * The bank faces' edges, whose crossing pitches the trunk along its
     * support.
     */
    readonly edges: readonly EquineEdge.IEdge[];
    /** The root's course distance at a film second. */
    readonly distance: (second: number) => number;
  }

  /**
   * Freeze authored equine technique choices after validating their route
   * context.
   *
   * @param archetype Exact source archetype identity.
   * @param course Caller-owned course before sampling.
   * @param plan Its admitted geometry and speed profile.
   * @param gait Optional fixed gait in the public ride request.
   * @param hooves The neutral hoof endpoints in model metres, which fix the
   *   pirouette heading.
   * @param centred The moving stance centres, under each attachment, which fix
   *   the shoulder-in heading.
   * @param reach The fore limb's length, attachment to hoof, metres, which
   *   bounds a scramble's climb per bound.
   * @param tail The rigid tail, which bounds a bank slide's sit.
   * @returns Independent registration for the gait selector, event reader, goal
   *   sampler, lateral headings and the jump request.
   * @throws {AutoMovieArchetypeRefusal} For an unsupported animal, travel
   *   context, inconsistent authored timing, an inadmissible lateral figure,
   *   jump or baulk, or a second jump.
   */
  export function prepare(
    archetype: string,
    course: AutoMovieArchetypeQuadruped.IRideCourse,
    plan: AutoMovieArchetypeCourse.IPlan,
    gait: AutoMovieArchetypeQuadrupedGait.Gait | undefined,
    hooves: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
    >,
    centred: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
    >,
    reach: number,
    tail: AutoMovieArchetypeEquineBank.ITail,
  ): IPlan {
    const backing: Set<number> = new Set();
    const lateral: EquineLateral.IWindow[] = [];
    const bank: AutoMovieArchetypeEquineBank.IWindow[] = [];
    const scramble: AutoMovieArchetypeEquineScramble.IWindow[] = [];
    const edges: EquineEdge.IEdge[] = [];
    const cues: IInstant[] = [];
    let jump: EquineJump.IRequest | undefined;
    let slide: ISlide | undefined;
    for (let index: number = 0; index < course.legs.length; ++index) {
      const leg: AutoMovieArchetypeQuadruped.IRideLeg = course.legs[index]!;
      const technique: Technique | undefined = leg.equineFootwork;
      if (technique === undefined) continue;
      if (technique === null)
        refuse(index, "Equine footwork requires an authored technique record");
      if (archetype !== "horse" && archetype !== "pony")
        refuse(index, "Equine footwork requires a horse or pony source");
      const span: AutoMovieArchetypeCourse.ILegSpan = plan.legSpans[index]!;
      const first: number = plan.when(span.from);
      const end: number = plan.when(span.from + span.span);
      if (
        technique.kind === "shoulder-in" ||
        technique.kind === "leg-yield" ||
        technique.kind === "half-pass" ||
        technique.kind === "pirouette"
      ) {
        const window: EquineLateral.IWindow = EquineLateral.admit(
          archetype,
          index,
          leg,
          technique,
          plan,
          hooves,
          centred,
        );
        lateral.push(window);
        cues.push(
          { seconds: window.from, label: `${window.kind}Start` },
          { seconds: window.to, label: `${window.kind}End` },
        );
        continue;
      }
      if (technique.kind === "jump" || technique.kind === "baulk") {
        const request: EquineJump.IRequest | undefined = EquineJump.admit(
          archetype,
          index,
          leg,
          technique,
          plan,
          course.footing,
        );
        if (request === undefined)
          cues.push(
            { seconds: end, label: "baulkStop" },
            { seconds: end + leg.pause!, label: "baulkSettle" },
          );
        else if (jump !== undefined) refuse(index, "One ride plans one jump");
        else jump = request;
        continue;
      }
      if (technique.kind === "bank-slide") {
        const window: AutoMovieArchetypeEquineBank.IWindow =
          AutoMovieArchetypeEquineBank.admit(
            archetype,
            index,
            leg,
            technique,
            course.legs.length,
            plan,
            course.footing,
            hooves.leftHind.z,
            tail,
          );
        bank.push(window);
        edges.push(...EquineEdge.of(course.legs, index, plan, hooves));
        cues.push(
          { seconds: window.from, label: "bankSlideStart" },
          { seconds: window.from + window.entry, label: "bankSlideSat" },
          { seconds: window.to - window.exit, label: "bankSlideRise" },
          { seconds: window.to, label: "bankSlideEnd" },
        );
        continue;
      }
      if (technique.kind === "bank-scramble") {
        const window: AutoMovieArchetypeEquineScramble.IWindow =
          AutoMovieArchetypeEquineScramble.admit(
            archetype,
            index,
            leg,
            technique,
            course.legs.length,
            plan,
            course.footing,
            reach,
          );
        scramble.push(window);
        edges.push(...EquineEdge.of(course.legs, index, plan, hooves));
        cues.push(
          { seconds: window.from, label: "bankScrambleStart" },
          ...window.bounds
            .slice(1, -1)
            .map(
              (seconds: number): IInstant => ({ seconds, label: "bankBound" }),
            ),
          { seconds: window.to, label: "bankScrambleEnd" },
        );
        continue;
      }
      if (leg.kind !== "straight" || (leg.rise ?? 0) !== 0)
        refuse(index, "Equine footwork requires a level straight course leg");
      switch (technique.kind) {
        case "rein-back": {
          if (
            !leg.reverse ||
            (leg.gait ?? gait ?? "walk") !== "walk" ||
            plan.at(first).speed !== 0 ||
            plan.at(end).speed !== 0
          )
            refuse(
              index,
              "Rein-back requires a backward walk from rest to rest",
            );
          backing.add(index);
          break;
        }
        case "slide-stop": {
          const { seconds, entry, advance } = technique;
          const from: number = end - seconds;
          const contact: number = from + entry;
          if (
            leg.reverse ||
            index !== course.legs.length - 1 ||
            !(
              advance > 0 &&
              from >= first &&
              contact > from &&
              end > contact
            ) ||
            plan.at(end).speed !== 0 ||
            !(
              plan.at(from).speed > plan.at(contact).speed &&
              plan.at(contact).speed > 0
            )
          )
            refuse(
              index,
              "A slide needs a finite entry and positive stance advance inside a terminal deceleration to rest",
            );
          slide = { from, contact, advance };
          break;
        }
        default:
          refuse(index, "Unknown equine footwork");
      }
    }
    return {
      backing,
      instants: [
        ...cues,
        ...(slide === undefined
          ? []
          : [
              { seconds: slide.from, label: "slideStopEntry" },
              { seconds: slide.contact, label: "slideStopContact" },
              { seconds: slide.contact, label: "leftHindOn" },
              { seconds: slide.contact, label: "rightHindOn" },
              { seconds: plan.duration, label: "slideStopEnd" },
            ]),
      ],
      slide,
      lateral,
      bank,
      scramble,
      edges,
      distance: (second: number): number => plan.at(second).distance,
      ...(jump === undefined ? {} : { jump }),
    };

    /** Report the authored leg that cannot supply the requested footwork. */
    function refuse(index: number, reason: string): never {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `legs[${index}].equineFootwork`,
        value: null,
        feasible: null,
        reason,
        fix: "Choose a matching route and finite film-animation parameters.",
      });
    }
  }

  /**
   * Return the two alternating diagonal phases of a rein-back stride.
   *
   * @param limb The named hoof.
   * @returns Stride fraction, zero for the left fore and right hind, one half
   *   for the opposite diagonal.
   */
  export function reinBackPhase(
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): number {
    return limb === "leftFore" || limb === "rightHind" ? 0 : 0.5;
  }

  /**
   * Blend a hind hoof into an explicitly moving floor contact and retain it
   * through the stop.
   *
   * @param slide Admitted sliding window, if supplied.
   * @param second The film second for the current pose.
   * @param neutral The neutral terminal point in model metres.
   * @param goal Current gait's candidate foot goal.
   * @returns Current foot goal, with the two stance channels blended only
   *   inside the authored slide.
   */
  export function slideGoal(
    slide: ISlide | undefined,
    second: number,
    neutral: IAutoMovieVector3,
    goal: QuadrupedRidePose.IGoal,
  ): QuadrupedRidePose.IGoal {
    if (slide === undefined || second <= slide.from) return goal;
    const amount: number =
      second >= slide.contact
        ? 1
        : AutoMovieEngineMotionSampling.minimumJerk((second - slide.from) / (slide.contact - slide.from)).s;
    return {
      ...goal,
      ...(goal.x === undefined
        ? {}
        : { x: goal.x + (neutral.x - goal.x) * amount }),
      ...(goal.orientation === undefined
        ? {}
        : {
            orientation: Quaternion.slerp(
              goal.orientation,
              { x: 0, y: 0, z: 0, w: 1 },
              amount,
            ),
          }),
      z: goal.z + (neutral.z + slide.advance - goal.z) * amount,
      lift: (1 - amount) * goal.lift,
      fold: (1 - amount) * goal.fold,
    };
  }

  /**
   * The trunk's pitch a technique adds at a film second, degrees, positive
   * nose-down: a bank slide sits the horse back on its haunches by
   * `AutoMovieArchetypeEquineBank.SIT`, and a bank face's edges pitch the trunk
   * along its support as it crosses them (`EquineEdge`).
   *
   * @param plan The admitted technique plan.
   * @param second The film second.
   * @returns The pitch, zero outside a slide.
   */
  export function sit(plan: IPlan, second: number): number {
    return (
      AutoMovieArchetypeEquineBank.pitch(plan.bank, second) +
      (plan.edges.length === 0
        ? 0
        : EquineEdge.pitch(plan.edges, plan.distance(second)))
    );
  }

  /**
   * A hoof's goal under the admitted techniques: a scramble's bounds for either
   * pair, then, for a hind, an arena slide's moving contact and a bank slide's
   * sliding seat.
   *
   * @param plan The admitted technique plan.
   * @param second The film second.
   * @param fore Whether the hoof is a fore.
   * @param neutral The hoof's neutral point, model metres.
   * @param attachment The limb's attachment, model metres.
   * @param goal The gait's goal.
   * @param placement The body's world placement.
   * @param footing The course's prepared footing.
   * @returns The goal.
   */
  export function limbGoal(
    plan: IPlan,
    second: number,
    fore: boolean,
    neutral: IAutoMovieVector3,
    attachment: IAutoMovieVector3,
    goal: QuadrupedRidePose.IGoal,
    placement: IAutoMovieTransform,
    footing: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined,
  ): QuadrupedRidePose.IGoal {
    const bounding: QuadrupedRidePose.IGoal =
      AutoMovieArchetypeEquineScramble.goal(
        plan.scramble,
        second,
        fore,
        neutral,
        attachment,
        goal,
        placement,
        footing,
      );
    return fore
      ? AutoMovieArchetypeEquineBank.step(plan.bank, second, bounding)
      : AutoMovieArchetypeEquineBank.goal(
          plan.bank,
          second,
          neutral,
          attachment,
          slideGoal(plan.slide, second, neutral, bounding),
          placement,
          footing,
        );
  }
}
