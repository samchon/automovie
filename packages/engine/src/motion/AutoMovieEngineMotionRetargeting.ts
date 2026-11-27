import { type IAutoMovieMotion, type IAutoMoviePreserveRetargetContacts, type IAutoMovieHumanoidRetargetResult, type IAutoMovieHumanoidRetargetProps, type IAutoMovieRetargetContactProps, type IAutoMovieViolationCollector } from "@automovie/interface";
import { preserveRetargetContacts as preserveRetargetContactsImplementation } from "./internal/preserveRetargetContacts";
import { retargetHumanoidMotion as retargetHumanoidMotionImplementation } from "./internal/retargetHumanoidMotion";
import { validateRetargetContacts as validateRetargetContactsImplementation } from "./internal/validateRetargetContacts";

/** Public operations for Auto Movie Engine Motion Retargeting. */
export namespace AutoMovieEngineMotionRetargeting {
  /**
   * Correct a root-scaled retarget clip at its existing authored key times using
   * each source frame's foot/declared hand contact mapped by rootScale. Source
   * slides persist; ROM-limited residuals above tolerance*rootScale are collector
   * warnings, while dynamic nonfinite ground or callback exceptions throw. Inputs
   * have passed retarget admission and parallel source/target key times agree.
   */
  export function preserveRetargetContacts(props: IAutoMoviePreserveRetargetContacts.IProps): IAutoMovieMotion {
    return preserveRetargetContactsImplementation(props);
  }

  /**
   * Retarget an admitted clinical clip from one normalized rig to another,
   * scaling root translation by positive explicit scale or target/source rest
   * height and preserving root rotation. Source, rig/mapping and enabled
   * static-contact failures return null motion/characterization with located
   * validation; target-ROM failure also returns null. Dynamic ground callback
   * failures propagate, and contact residual warnings may accompany a successful
   * motion.
   */
  export function retargetHumanoidMotion(props: IAutoMovieHumanoidRetargetProps): IAutoMovieHumanoidRetargetResult {
    return retargetHumanoidMotionImplementation(props);
  }

  /**
   * Append field-located errors for an enabled retarget contact policy before
   * source FK or IK. Disabled contact preservation ignores its unused numeric
   * policy; ground callback results are validated only when sampled.
   */
  export function validateRetargetContacts(contacts: IAutoMovieRetargetContactProps | undefined, duration: number, collector: IAutoMovieViolationCollector): void {
    validateRetargetContactsImplementation(contacts, duration, collector);
  }
}
