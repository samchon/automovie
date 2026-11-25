import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { StrikingVerdicts } from "./StrikingVerdicts";

/** The record of `IDefenceParams`'s site. */
type IDefenceParams = { outcome?: string };

/**
 * The striking capture's verdicts read off a plan's events rather than off a
 * strike's displayed limb: whether a defence's events class as its declared
 * outcome, and whether a late kick redirect is refused.
 */
export namespace StrikingEventVerdicts {
  /**
   * Whether a defence's own events class as its declared outcome: in time when
   * the guard is set by the contact, late when it is set within half its
   * movement after it, and failed otherwise.
   *
   * @param id The defender's subject id.
   * @param segment The defence's segment.
   * @returns The defence verdict; a plan missing its read, set or contact event
   *   fails.
   */
  export function defence(
    id: string,
    segment: StrikingVerdicts.ITimed &
      Pick<IAutoMovieMotionHumanSegment, "id" | "params">,
  ): IMotionCaptureCase.IVerdict {
    const name: string = `${id} ${segment.id} defence`;
    const read: number | undefined = StrikingVerdicts.at(segment, "read");
    const set: number | undefined = StrikingVerdicts.at(segment, "set");
    const met: number | undefined = StrikingVerdicts.at(segment, "contact");
    if (read === undefined || set === undefined || met === undefined)
      return {
        name,
        passed: false,
        detail: `the plan lacks its ${[
          ...(read === undefined ? ["read"] : []),
          ...(set === undefined ? ["set"] : []),
          ...(met === undefined ? ["contact"] : []),
        ].join(", ")} event`,
      };
    const margin: number = met - set;
    const movement: number = set - read;
    const shown: string =
      margin >= 0 ? "inTime" : margin > -0.5 * movement ? "late" : "fail";
    const params: IDefenceParams = segment.params;
    return {
      name,
      passed: params.outcome === undefined || params.outcome === shown,
      detail: `read at ${read.toFixed(3)} s, set at ${set.toFixed(3)} s, contact at ${met.toFixed(3)} s: ${shown} (margin ${(1000 * margin).toFixed(0)} ms over a ${(1000 * movement).toFixed(0)} ms movement); declared ${params.outcome ?? "none"}`,
    };
  }

  /**
   * Whether a redirect after the chamber key is refused as an illegal cut into
   * a kick; any other error, or none, fails.
   *
   * @param attempt Builds the late redirect.
   * @returns The refusal verdict.
   */
  export function refusal(attempt: () => unknown): IMotionCaptureCase.IVerdict {
    let message: string | undefined;

    // Process boundary: the attempt's thrown message is the verdict this case reports.
    try {
      attempt();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    return {
      name: "redirect after the chamber key refused",
      passed:
        message !== undefined && message.includes("cannot be cut into kick"),
      detail: `${message ?? "accepted"}; bound the "cannot be cut into kick" refusal`,
    };
  }
}
