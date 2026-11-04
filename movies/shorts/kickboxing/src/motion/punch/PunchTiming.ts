import type { MotionAction } from "../core/MotionAction";
import type { PunchShape } from "./PunchShape";

/**
 * Explicit bag-study timings, available for comparison rather than sparring defaults.
 *
 * @evidence contracts/common.md#implementation-and-ownership Menzel and Potthast 2021, Sensors21:7882, doi:10.3390/s21237882, Table6 and section2.3 report experienced n11 isolated bag punches sampled at1000Hz. Throw starts at fist motion, contact ends at release, and retraction ends at guard/reduced acceleration. Preparation and later settling were not measured separately.
 * @evidence contracts/common.md#authoring-interface All returned durations are seconds. Hook data describe the rear hand only. The source rear-hook total441ms differs from its phase sum400ms; this API exposes the observed phases without reconciling that discrepancy or treating bag-contact dwell as a universal fight timing.
 */
export namespace PunchTiming {
  /**
   * Reported mean and standard deviation in seconds, with task-specific scope.
   *
   * @evidence contracts/common.md#implementation-and-ownership Keeps phase means, phase standard deviations and reported total separate, preserving the published rear-hook inconsistency and absence of measured preparation/settling.
   * @evidence contracts/common.md#authoring-interface Standard deviations describe the experienced bag-study sample, not independent random distributions. Hook is rear-hand only; the source does not identify the uppercut arm.
   */
  export interface Measurement {
    /** Mean throw duration from fist-motion onset to first contact. */
    delivery: number;
    /** Mean first-contact-to-release duration against the study bag. */
    contact: number;
    /** Mean release-to-guard/reduced-acceleration duration. */
    retraction: number;
    /** Standard deviations of the three respective durations. */
    standardDeviation: { delivery: number; contact: number; retraction: number };
    /** Published total, retained independently of the phase sum. */
    reportedTotal: number;
    /** Separate preparation and post-guard settling were not measured. */
    unmeasuredPhases: readonly ["preparation", "post-guard-recovery"];
  }

  /**
   * Return one owned study record without sampling a probability distribution.
   *
   * @evidence contracts/common.md#implementation-and-ownership Copies Table6 experienced means and standard deviations, converting milliseconds once at transcription. Each lookup returns independent data and does not retain caller mutations.
   * @evidence contracts/common.md#authoring-interface Jab/cross/rear-hook/uppercut are the study tasks. These group means establish no compulsory duration for an individual fighter or moving-target encounter.
   */
  export function measurement(kind: PunchShape.Kind): Measurement {
    switch (kind) {
      case "jab": return { delivery: .117, contact: .144, retraction: .262, standardDeviation: { delivery: .025, contact: .027, retraction: .042 }, reportedTotal: .523, unmeasuredPhases: ["preparation", "post-guard-recovery"] };
      case "cross": return { delivery: .111, contact: .122, retraction: .169, standardDeviation: { delivery: .041, contact: .018, retraction: .041 }, reportedTotal: .402, unmeasuredPhases: ["preparation", "post-guard-recovery"] };
      case "hook": return { delivery: .091, contact: .141, retraction: .168, standardDeviation: { delivery: .050, contact: .029, retraction: .097 }, reportedTotal: .441, unmeasuredPhases: ["preparation", "post-guard-recovery"] };
      case "uppercut": return { delivery: .071, contact: .143, retraction: .171, standardDeviation: { delivery: .036, contact: .034, retraction: .033 }, reportedTotal: .385, unmeasuredPhases: ["preparation", "post-guard-recovery"] };
    }
  }

  /**
   * Construct a named bag comparison profile with no inferred setup or settling.
   *
   * @evidence contracts/common.md#implementation-and-ownership Uses the three independently reported phase means, not the inconsistent rear-hook total. Zero unmeasured preparation/recovery means the comparison begins prepared and ends at return, rather than asserting those processes take no time in real fighting.
   * @evidence contracts/common.md#authoring-interface Callers explicitly choose this profile. Actual paired-action delivery, contact dwell and recovery remain caller-owned parameters and interaction outcomes.
   */
  export function bagStudy2021(kind: PunchShape.Kind): MotionAction.Timing {
    const value: Measurement = measurement(kind);
    return { preparation: 0, delivery: value.delivery, contact: value.contact, retraction: value.retraction, recovery: 0 };
  }
}
