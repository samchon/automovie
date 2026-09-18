import { AutoMovieHumanoidBone, IAutoMovieActionCall, IAutoMovieMotion, IAutoMovieScene, IAutoMovieSkeleton } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

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

/** The per-node lookups a follow bake needs from the compiled shot. */
interface ICoupleContext {
  scene: IAutoMovieScene;
  motions: Record<string, IAutoMovieMotion>;
  skeleton: (node: string) => IAutoMovieSkeleton | null;
  jointAxes?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;
  restFrames?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;
  duration: number;
}

const childrenOf = (action: IAutoMovieActionCall): string[] =>
  typeof action.actor === "string" ? [action.actor] : action.actor;
