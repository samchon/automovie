import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanStageBladeFootwork,
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { HumanChain } from "../HumanChain";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { stageBladeFootwork } from "./stageBladeFootwork";

/**
 * Pair two marked shifts and read the screenplay's result from their
 * shared editing cue. Register stageBladeFootwork when playing the take.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the staged cast, cue and result owners and the required playback law.
 * @evidence contracts/development/design.md#principled-representation The call holds separately authored actor marks, a common cue and a script result. A placed result contains only film seconds and the declared result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Uses HumanChain and the existing stageBladeFootwork law. Keeps supported playback and result reading in the same public namespace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The supported choices are closed literals. Existing motion and schedule owners evaluate feet, stage marks and events.
 */
export namespace HumanStagePiste {
  /**
   * An equipment and stage cadence choice for the digital take.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the stage equipment families.
   * @evidence contracts/development/design.md#principled-representation Four stage profiles use explicit literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by compose for cadence and the screenplay result vocabulary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller chooses a stage profile. No props are guessed or created.
   */
  export type Kind = "foil" | "epee" | "sabre" | "kendo";

  /**
   * The result the screenplay gives the two cast roles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the role or roles represented by the result.
   * @evidence contracts/development/design.md#principled-representation Two individual roles, both together, and an unawarded beat are distinct literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carried from the take to the resolved result at the cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The script supplies the outcome before either actor is placed.
   */
  export type Result = "first" | "second" | "both" | "none";

  /**
   * The preparatory chain and marked shift for one performer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines preparatory action, body-relative orientation and horizontal travel units.
   * @evidence contracts/development/design.md#principled-representation Receives one existing chain and stage direction with a positive distance in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The paired layout reuses only the existing step direction, optional lead and mark distance.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Props and preparatory actions stay in the caller's own chain.
   */
  export interface IActor {
    /** Chain that prepares the actor on its opening mark. */
    chain: IAutoMovieMotionHumanChainCore;

    /** Direction from the actor's heading on its opening mark. */
    direction: IAutoMovieMotionHumanStageBladeFootwork.Direction;

    /** Forward lead, or the lead read by the existing step law when omitted. */
    lead?: "left" | "right";

    /** Positive horizontal distance to the actor's next mark, in metres. */
    distance: number;
  }

  /**
   * Two actor marks, an editing instant and a screenplay result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents role and cue identity, time and length units and the optional spacing check.
   * @evidence contracts/development/design.md#principled-representation A closed screenplay result is independent of the two actor placements and their shared normalized cue.
   * @evidence contracts/development/design.md#minimal-and-owned-surface compose uses each input to place the two marked shifts, check the supplied floor spacing and read the result from the placed cues.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reserved space is an authored bound on travel between the floor marks. Physical pose remains the existing motion law's responsibility.
   */
  export interface ITake {
    /** Unique prefix for the two schedule entries. */
    anchor: string;

    /** Equipment label and movement cadence for the staged take. */
    kind: Kind;

    /** First performer with any preparatory action. */
    first: IActor;

    /** Second performer with any preparatory action. */
    second: IActor;

    /** Positive common duration of the two shifts, in seconds. */
    duration: number;

    /** Normalized cue share in [0, 1] of the common duration. */
    cue: number;

    /** Scripted result to publish at the shared cue. */
    result: Result;

    /** Optional opening separation and minimum reserve between the floor marks, both in metres. */
    reserve?: readonly [opening: number, minimum: number];
  }

  /**
   * The screenplay result at its actual absolute film time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the owner of the result and unit and reference of its time.
   * @evidence contracts/development/design.md#principled-representation Film seconds and a closed scripted result form the placed cue record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by the take's reader for editing and playback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no other winner or calculated score embedded in the record.
   */
  export interface IAnnouncement {
    /** Absolute film seconds of the paired cue. */
    seconds: number;

    /** Result from the screenplay. */
    result: Result;
  }

  /**
   * The composition to place and its optional resolved result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the composition and the result reader's presence condition.
   * @evidence contracts/development/design.md#principled-representation The reader receives the actual schedule and translates two surviving cues to one result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A caller places the composition and then reads its cues through this record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing, cut or differently timed cue yields no result.
   */
  export interface IPlaced {
    /** Paired chain, including both preparatory actions. */
    composition: IAutoMovieChain;

    /** Reads the result only when both cues were placed at the same time. */
    announced: (schedule: IAutoMovieSchedule) => IAnnouncement | undefined;
  }

  /** Explicit equipment names admitted at the SDK boundary. */
  const KINDS: readonly Kind[] = ["foil", "epee", "sabre", "kendo"];

  /** The authoring result choices for single-result takes. */
  const SINGLE_RESULTS: readonly Result[] = ["first", "second", "none"];

  /** The shared clock uses the existing marked shift for each role. */
  const SHIFT: IAutoMovieMotionHumanMutual<ITake, "first" | "second"> = {
    name: "stagePiste",
    roles: ["first", "second"],
    act: (role, take): IAutoMovieMotionHumanMutual.IAct => {
      const { direction, distance, lead }: IActor = take[role];
      const params: IAutoMovieMotionHumanStageBladeFootwork.IParams = {
        style: take.kind === "kendo" ? "kendo" : "fencing",
        direction,
        distance,
        duration: take.duration,
        propCue: take.cue,
        ...(lead === undefined ? {} : { lead }),
      };
      return { name: stageBladeFootwork.name, params };
    },
  };

  /**
   * Join the actors at one stage cue and bind its declared result. The
   * optional reserve requires enough opening space for both full authored
   * translations and the remaining space stated in the screenplay.
   *
   * @param take The cast, blocking, time, reserved space and result.
   * @returns The paired composition and its result reader.
   * @throws {HumanRefusal} When the stage choices, numeric input or reserved space are invalid.
   * @throws {Error} When the anchor is blank or one performer takes both roles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the shot, required space, returned composition and refusal cases.
   * @evidence contracts/development/implementation.md#principled-implementation Each full planned translation is subtracted from opening distance for a conservative floor-mark reserve. HumanChain and the current step law place the two shifts and their shared cue.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the chosen stage, author two role intents and read their paired result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Cast, timing, marks and outcome come from the script. The reader requires both resolved uncropped cues at the shared film second.
   * @evidence contracts/development/implementation.md#efficient-algorithms Validation uses fixed input fields, placement builds two intents and result reading traverses the schedule entries for their two cues.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanChain.mutual, HumanBound and the registered stageBladeFootwork for the authored marks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result reader captures the two anchor names and selected result, with no frame cache or native resource.
   */
  export function compose(take: ITake): IPlaced {
    if (take.anchor.trim().length === 0)
      throw new Error("Give the staged piste take a nonblank anchor");
    if (!KINDS.includes(take.kind))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stageKind",
        value: take.kind,
        reason: "the production needs a supported staged piste kind",
        fix: "choose foil, epee, sabre or kendo",
      });
    const allowed: readonly Result[] =
      take.kind === "epee" ? [...SINGLE_RESULTS, "both"] : SINGLE_RESULTS;
    if (!allowed.includes(take.result))
      throw new HumanRefusal({
        kind: "rule",
        axis: "result",
        value: take.result,
        reason: "this screenplay kind allows only one awarded role at the cue",
        fix: "choose an individual role or an unawarded cue",
      });
    HumanBound.above("duration", take.duration, 0, "s");
    HumanBound.within("cue", take.cue, 0, 1);
    HumanBound.above("first.distance", take.first.distance, 0, "m");
    HumanBound.above("second.distance", take.second.distance, 0, "m");
    if (take.reserve !== undefined) {
      const [opening, minimum]: readonly [number, number] = take.reserve;
      HumanBound.above("openingSpace", opening, 0, "m");
      HumanBound.least("minimumReserve", minimum, 0, "m");
      HumanBound.least(
        "stageClearance",
        opening - take.first.distance - take.second.distance,
        minimum,
        "m",
      );
    }

    const composition: IAutoMovieChain = HumanChain.mutual(
      SHIFT,
      { first: take.first.chain, second: take.second.chain },
      take,
      take.anchor,
    );
    const result: Result = take.result;
    const first: string = `${take.anchor}.first`;
    const second: string = `${take.anchor}.second`;
    return {
      composition,
      announced: (schedule: IAutoMovieSchedule): IAnnouncement | undefined => {
        const a: number | undefined = placedCue(schedule, first);
        const b: number | undefined = placedCue(schedule, second);
        return a !== undefined && b !== undefined && Math.abs(a - b) < 1e-9
          ? { seconds: a, result }
          : undefined;
      },
    };
  }

  /** Read the resolved editing cue only while it lies within its role's span. */
  function placedCue(
    schedule: IAutoMovieSchedule,
    anchor: string,
  ): number | undefined {
    const entry: IAutoMovieScheduleEntry | undefined = schedule.entries.find(
      (row): boolean => row.intent.anchor === anchor,
    );
    const cue: IAutoMovieScheduleCue | undefined = entry?.events?.find(
      (row): boolean => row.name === "propCue",
    );
    return entry !== undefined &&
      cue !== undefined &&
      cue.seconds >= entry.start - 1e-9 &&
      cue.seconds <= entry.end + 1e-9
      ? cue.seconds
      : undefined;
  }
}
