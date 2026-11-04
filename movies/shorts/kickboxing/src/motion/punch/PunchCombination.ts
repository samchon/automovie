import type {
  AutoMovieHumanRigControls,
  IAutoMovieHumanPose,
} from "@automovie/human";

import type { MotionAction } from "../core/MotionAction";
import { PunchAction } from "./PunchAction";
import { PunchArm } from "./PunchArm";
import { PunchContinuation } from "./PunchContinuation";

/**
 * Coordinate existing jab return and an independently clocked continuing cross.
 * @evidence contracts/common.md#implementation-and-ownership This module schedules two existing reusable actions and returns explicit own-side writers. It never creates body/support trajectories, restarts jab recovery, blends whole poses or merges contact lifetimes. The actual host supplies one admitted shared-body continuation into the original cross body technique.
 * @evidence contracts/common.md#authoring-interface Sequence seconds map affinely to the original action clocks. An immutable actual-entry cross is required. Both writers consume the same realized body and independent contexts; the host rejects duplicate writers and checks actual geometry, support and rates.
 */
export namespace PunchCombination {
  /**
   * One independently owned arm result for the host's simultaneous consumption.
   * @evidence contracts/common.md#implementation-and-ownership Side and the exact source-selected channels prevent a whole arms object from replacing the other action. The returned sample retains its own original action/contact clock.
   * @evidence contracts/common.md#authoring-interface Writer ownership covers only the named anatomical arm. Root/support are the supplied single placement, not another competing body proposal; channels may never target the opposite side.
   */
  export interface Writer {
    /** Sole anatomical arm this action may write. */ side: MotionAction.Side;
    /** Owned source request and honest planning receipt. */ sample: PunchAction.Sample;
    /** Exact same eligible channels used by source IK. */ channels: readonly AutoMovieHumanRigControls.DegreeChannel[];
  }
  /**
   * Two existing action placements and their sequence offsets.
   * @evidence contracts/common.md#implementation-and-ownership Borrowed immutable instances retain their original identity, variation and contact clock. Cross must explicitly continue an actual entry instead of silently starting a fresh neutral guard.
   * @evidence contracts/common.md#authoring-interface Finite sequence offsets order jab before cross. Same actor and stance, distinct action IDs and opposite anatomical arms are required; the body owner separately proves its actual shared continuation and support lifetimes.
   */
  export interface Input {
    /** Existing lead-hand action, including its original return clock. */ jab: PunchAction.Instance;
    /** Existing rear-hand action with an actual immutable entry bridge. */ cross: PunchAction.Instance;
    /** Sequence start of the original jab clock. */ jabStart: number;
    /** Sequence start of the independent cross clock. */ crossStart: number;
    /** Actual continuing jab arm/rates; its deadline is the existing jab endpoint. */ jabReturn: PunchContinuation.Entry;
  }
  /**
   * Deterministic arm scheduling, independent of display history.
   * @evidence contracts/common.md#implementation-and-ownership Each evaluation samples the same existing instances at the same local seconds. No elapsed integration, last-frame pose or RAF velocity is retained; contexts keep the two interactions separate.
   * @evidence contracts/common.md#authoring-interface A realized single shared placement is mandatory. Its producer must bridge actual body pose/rate to the original cross body/foot technique, not keep the jab body throughout the cross.
   */
  export interface Instance {
    /** Sequence endpoint of both original action clocks. */ readonly duration: number;
    /**
     * Evaluate both owned arms without writing a body or restarting recovery.
     * @evidence contracts/common.md#implementation-and-ownership Uses original time offsets and explicit shared-body authority. Before cross begins only the original jab writes; afterwards both act on opposite arms while their independent contact branches remain intact.
     * @evidence contracts/common.md#authoring-interface Contexts are separate action-local interaction inputs. Optional actor-local bodyResponse belongs only to the cross and is identical to the shared body's request. originalTaskFrame retains that cross's source WORLD-terminal authority when released arms consume a different body frame. Returned writers are owned snapshots for applyArms; an unsupported shared pose remains a failure and is never fixed by resetting either arm.
     */
    sample(
      seconds: number,
      contexts: { jab: MotionAction.Context; cross: MotionAction.Context },
      placement: MotionAction.BodyPlacement,
      bodyResponse?: Readonly<MotionAction.Vec3>,
      originalTaskFrame?: MotionAction.Context["frame"],
    ): Writer[];
  }

  /**
   * Admit one jab-to-cross overlap without introducing a new film controller.
   * @evidence contracts/common.md#implementation-and-ownership Validates only scheduling and ownership. The supplied cross already owns actual entry/rate and original terminal WORLD tasks. Existing jab ID, elapsed clock, contact and recovery are reused directly.
   * @evidence contracts/common.md#authoring-interface No body provider or mutable actor is retained. Shared-body continuation, canonical actual sampling and final multi-arm admission belong to the actual host; no whole-pose averages or neutral resets are manufactured here.
   */
  export function create(input: Input): Instance {
    const { jab, cross, jabStart, crossStart }: Input = input;
    if (jab.kind !== "jab" || cross.kind !== "cross" || !cross.continuation)
      throw new Error("A jab-cross combination requires an actual-entry cross");
    if (
      ![jabStart, crossStart].every(Number.isFinite) ||
      crossStart <= jabStart
    )
      throw new Error(
        "Combination clocks require ordered finite sequence starts",
      );
    if (
      jab.request.actorId !== cross.request.actorId ||
      jab.request.id === cross.request.id ||
      jab.request.side === cross.request.side ||
      jab.request.leadSide !== cross.request.leadSide
    )
      throw new Error(
        "Combination requires distinct own-side action writers for one stance and actor",
      );
    const jabReturn: MotionAction.Immutable<PunchContinuation.Entry> =
      PunchContinuation.createEntry(input.jabReturn, jab.request.side);
    if (jabReturn.endSeconds > jabStart + jab.duration - crossStart + 1e-10)
      throw new Error(
        "Jab continuation must keep the existing return deadline",
      );
    const duration: number = Math.max(
      jabStart + jab.duration,
      crossStart + cross.duration,
    );
    const sample: Instance["sample"] = (
      seconds: number,
      contexts: { jab: MotionAction.Context; cross: MotionAction.Context },
      placement: MotionAction.BodyPlacement,
      bodyResponse?: Readonly<MotionAction.Vec3>,
      originalTaskFrame?: MotionAction.Context["frame"],
    ): Writer[] => {
      if (!Number.isFinite(seconds))
        throw new Error("Combination requires finite sequence seconds");
      const contact: MotionAction.ContactState | undefined =
        contexts.jab.contact;
      const originalEnd: number =
        jabStart +
        (contact
          ? contact.event.time +
            jab.timing.contact +
            jab.timing.retraction +
            jab.timing.recovery
          : jab.duration);
      if (Math.abs(crossStart + jabReturn.endSeconds - originalEnd) > 1e-10)
        throw new Error(
          "Jab continuation deadline must equal its original effective contact clock",
        );
      const writers: Writer[] = [];
      if (seconds >= jabStart) {
        const result: PunchAction.Sample = jab.sample(
          seconds - jabStart,
          contexts.jab,
          placement,
          seconds >= crossStart ? "shared" : undefined,
        );
        if (seconds >= crossStart && seconds <= originalEnd) {
          if (
            result.phase !== "retraction" &&
            result.phase !== "recovery" &&
            result.phase !== "complete"
          )
            throw new Error(
              "Cross overlap requires the existing jab's released return",
            );
          result.pose = PunchContinuation.returnArm(
            jabReturn,
            seconds - crossStart,
            jab.request.side,
            contexts.jab.basePose,
            structuredClone(placement.pose) as IAutoMovieHumanPose,
          );
          result.effectors = PunchArm.frame(
            contexts.jab,
            result.pose,
            jab.request.side,
            false,
          );
          if (seconds === crossStart) {
            const expected: MotionAction.Vec3 = PunchContinuation.entryPoint(
              jabReturn,
              contexts.jab.frame,
            );
            const actual: MotionAction.Vec3 = result.effectors[0]!.target.map(
              (value: number, index: number): number =>
                value + result.rootOffset[index]!,
            ) as MotionAction.Vec3;
            if (
              Math.hypot(
                ...actual.map(
                  (value: number, index: number): number =>
                    value - expected[index]!,
                ),
              ) > 1e-8
            )
              throw new Error(
                "Jab return continuation must retain its actual WORLD entry",
              );
          }
        }
        writers.push({
          side: jab.request.side,
          sample: result,
          channels: jab.armChannels,
        });
      }
      if (seconds >= crossStart)
        writers.push({
          side: cross.request.side,
          sample: cross.sample(
            seconds - crossStart,
            contexts.cross,
            placement,
            "shared",
            bodyResponse,
            originalTaskFrame,
          ),
          channels: cross.armChannels,
        });
      return writers;
    };
    return Object.freeze({ duration, sample });
  }
}
