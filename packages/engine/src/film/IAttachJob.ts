import { IAutoMovieActionCall } from "@automovie/interface";

/**
 * One validated `attachTo` job: the coupling and its source action index.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects IAttachJob preserves declared attachment handoff: One validated `attachTo` job: the coupling and its source action index.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAttachJob realizes declared attachment and object handoff: One validated `attachTo` job: the coupling and its source action index.
 */
export interface IAttachJob {
  /**
   * Validated attachment action to compile.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects IAttachJob.action preserves declared attachment handoff: Validated attachment action to compile.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAttachJob.action realizes declared attachment and object handoff: Validated attachment action to compile.
   */
  action: IAutoMovieActionCall & { verb: "attachTo" };
  /**
   * Stable source index used for paths and ordering.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects IAttachJob.index preserves declared attachment handoff: Stable source index used for paths and ordering.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAttachJob.index realizes declared attachment and object handoff: Stable source index used for paths and ordering.
   */
  index: number;
}
