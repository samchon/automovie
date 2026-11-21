import { Quaternion, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeCourse, ArchetypeRefusal } from "../core";
import { EquineJump } from "./EquineJump";
import { EquineLateral } from "./EquineLateral";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedGait } from "./QuadrupedGait";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * Admission and sample goals for individually authored equine footwork.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the supported film techniques, trust boundary and existing body/ground ownership.
 * @evidence contracts/development/design.md#principled-representation Rein-back is a diagonal phase choice. An arena stop is an authored finite interval and a geometric displacement within the actual floor-support solve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps equine-specific authored positions and times out of the general gait table and Engine. Only the existing ride calls this planning seam.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Supplies no anatomical limits, clinical measurements or real-horse guidance.
 */
export namespace EquineFootwork {
  /**
   * Named equine film-animation technique on one course leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines both techniques and the authored slide values and units.
   * @evidence contracts/development/design.md#principled-representation Each legal variant has the fields necessary for its motion and no fields for the other variant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ride already declares travel and speed. This type adds only the footwork performed over it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies the brief motion window. The documented kinematic form does not imply a default measured duration or fit.
   */
  export type Technique =
    | IReinBack
    | ISlideStop
    | EquineLateral.Technique
    | EquineJump.Technique;

  /**
   * A named film-second cue a technique adds to the ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
   * @evidence contracts/development/design.md#principled-representation The shape of a ride's instants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's instant list.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IInstant {
    /** Film second. */
    seconds: number;
    /** The cue's name. */
    label: string;
  }

  /**
   * Backing on alternating diagonals from rest to rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the technique.
   * @evidence contracts/development/design.md#principled-representation A marker; the reversed walk leg carries the travel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `Technique`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IReinBack {
    /** The discriminator. */
    kind: "rein-back";
  }

  /**
   * A terminal arena slide on both hind feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each authored value's unit.
   * @evidence contracts/development/design.md#principled-representation Two durations in seconds and an advance in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `Technique`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies the window; no measured duration is implied.
   */
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

  /** An admitted slide interval with its terminal stop already fixed by the route. */
  interface ISlide {
    /** Slide entry begins at this film second, on the original route. */
    from: number;
    /** Both hind feet reach their authored slide targets at this film second. */
    contact: number;
    /** Model-space offset of the two hind footprints, metres. */
    advance: number;
  }

  /**
   * Admit a reusable individual film-footwork plan and its authored timed cues.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines phase and goal sampling as well as event ownership.
   * @evidence contracts/development/design.md#principled-representation A fixed set of per-leg rein-back flags and an optional terminal slide replace only the contact pattern that the author requests.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The horse phase reader and pose emitter share one admitted technique plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The flag and geometric goals come from the admitted course. No call inspects eventual render output to select a result.
   */
  export interface IPlan {
    /** Original course leg numbers, zero-based, explicitly authored for rein-back. */
    readonly backing: ReadonlySet<number>;
    /** Additional named film-second cues owned by the authored technique. */
    readonly instants: readonly IInstant[];
    /** Authored interval if the route ends with an arena slide. */
    readonly slide?: ISlide;
    /** Admitted lateral figures, in leg order. */
    readonly lateral: readonly EquineLateral.IWindow[];
    /** The admitted jump, when a leg names one. */
    readonly jump?: EquineJump.IRequest;
  }

  /**
   * Freeze authored equine technique choices after validating their route context.
   *
   * @param archetype Exact source archetype identity.
   * @param course Caller-owned course before sampling.
   * @param plan Its actual admitted geometry and speed profile.
   * @param gait Optional fixed gait in the public ride request.
   * @param hooves The actual neutral hoof endpoints in model metres, which fix the pirouette heading.
   * @param centred The moving stance centres, under each attachment, which fix the shoulder-in heading.
   * @returns Independent registration for the gait selector, event reader, goal sampler, lateral headings and the jump request.
   * @throws {ArchetypeRefusal} For an unsupported animal, travel context, inconsistent authored timing, an inadmissible lateral figure, jump or baulk, or a second jump.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the source identity, route and typed refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Read actual route boundaries and ensure the diagonal backing is on a reversed level straight walk leg and a slide consumes only an independently authored terminal deceleration.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Inspect each explicitly authored technique at its own typed leg and use the native plan to validate its applicability.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No generated measurements substitute for authored input and no other species receives horse footwork.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(L) pass over L legs plus the bounded native plan queries for explicitly selected techniques.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the checked course plan's times and speeds rather than constructing another trajectory.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one flag per backing leg and at most one terminal slide and its three cues.
   */
  export function prepare(
    archetype: string,
    course: rideQuadruped.ICourse,
    plan: ArchetypeCourse.IPlan,
    gait: QuadrupedGait.Gait | undefined,
    hooves: Readonly<Record<QuadrupedBody.Limb, IAutoMovieVector3>>,
    centred: Readonly<Record<QuadrupedBody.Limb, IAutoMovieVector3>>,
  ): IPlan {
    const backing: Set<number> = new Set();
    const lateral: EquineLateral.IWindow[] = [];
    const cues: IInstant[] = [];
    let jump: EquineJump.IRequest | undefined;
    let slide: ISlide | undefined;
    for (let index: number = 0; index < course.legs.length; ++index) {
      const leg: rideQuadruped.ILeg = course.legs[index]!;
      const technique: Technique | undefined = leg.equineFootwork;
      if (technique === undefined) continue;
      if (technique === null || typeof technique !== "object")
        refuse(index, "Equine footwork requires an authored technique record");
      if (archetype !== "horse" && archetype !== "pony")
        refuse(index, "Equine footwork requires a horse or pony source");
      const span: ArchetypeCourse.ILegSpan = plan.legSpans[index]!;
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
            ![seconds, entry, advance].every(Number.isFinite) ||
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
      ...(jump === undefined ? {} : { jump }),
    };

    /** Report the authored leg that cannot supply the requested footwork. */
    function refuse(index: number, reason: string): never {
      throw new ArchetypeRefusal({
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
   * @param limb The named actual hoof.
   * @returns Stride fraction, zero for the left fore and right hind, one half for the opposite diagonal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the origin and normalized phases.
   * @evidence contracts/development/implementation.md#principled-implementation FEI Dressage Rules Article 406 defines a two-beat rearward diagonal without aerial time. The ride uses a duty greater than one half to retain ground support. https://inside.fei.org/system/files/FEI_Dressage_Rules_2022_Clean_Version_V2.pdf
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One division into the two named diagonal pairs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The result names contact order. It supplies no invented measured speed or stride period.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the actual quadruped limb vocabulary.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds no sample or external resource.
   */
  export function reinBackPhase(limb: QuadrupedBody.Limb): number {
    return limb === "leftFore" || limb === "rightHind" ? 0 : 0.5;
  }

  /**
   * Blend a hind hoof into an explicitly moving floor contact and retain it through the stop.
   *
   * @param slide Admitted sliding window, if supplied.
   * @param second The film second for the current pose.
   * @param neutral The neutral terminal point in model metres.
   * @param goal Current gait's actual candidate foot goal.
   * @returns Current foot goal, with the two stance channels blended only inside the authored slide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States time, model metres and the scope of the slide.
   * @evidence contracts/development/implementation.md#principled-implementation The NRHA Judges' Guide depicts sliding ground contact at both hind feet while the horse proceeds straight into the stop. Minimum-jerk progress transitions the existing gait into that authored model-space stance. The admitted deceleration carries it to zero world speed. https://nrha.com/wp-content/uploads/2026/05/2026-NRHA-Handbook.pdf
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute one blend and retain a fixed terminal pose after contact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The candidate still goes through the actual geometric contact solver and will refuse an infeasible foot placement.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and output per hind hoof.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Blends the existing gait goal and uses the same prepared terminal solver.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Changes no history and retains no caller state.
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
        : minimumJerk((second - slide.from) / (slide.contact - slide.from)).s;
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
}
