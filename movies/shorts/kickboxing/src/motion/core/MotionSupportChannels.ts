import { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "./MotionAction";

/**
 * Share explicit foot articulation authority between a clinical seed and its final fit.
 *
 * @evidence contracts/common.md#implementation-and-ownership The public Human leg chain supplies canonical hip, knee, ankle and hind/midfoot channels. Planted support may adapt the functional subtalar joint while authored midfoot and every toe remain fixed. An authored roll retains its subtalar value too. This selects authority only; it neither solves a route nor certifies floor, load, continuity or balance.
 * @evidence contracts/common.md#authoring-interface Callers choose one explicit policy from the technique's support plan and consume the same returned channel selection in seed and final fitting. A hard/free frame can carry a planted side's frame, so this function never infers policy from a patch mode. Original WORLD targets, native bounds, work caps and owned phase endpoints remain the callers' obligations.
 */
export namespace MotionSupportChannels {
  /**
   * Planned functional support or a fully authored distal-foot trajectory.
   *
   * @evidence contracts/common.md#implementation-and-ownership These two alternatives distinguish functional subtalar adjustment from authored roll without changing Human's channel definitions. They are explicit planning choices, not an automatic phase or support-mode switch.
   * @evidence contracts/common.md#authoring-interface Planted permits one native subtalar channel per side; authored preserves it. Both retain midfoot and all MTP/IP controls. A policy change must consume the same owned phase endpoint rather than silently selecting a new numerical seed.
   */
  export type Policy = "planted" | "authored";

  /**
   * Independent canonical paths for fitting and retained distal-foot pose.
   *
   * @evidence contracts/common.md#implementation-and-ownership Fitting and preserved paths are disjoint owned arrays. Knee rotation remains in the public chain with Human's flexion-dependent bounds; no extra freedom, numeric range or solver budget is created.
   * @evidence contracts/common.md#authoring-interface Merge preserved paths with technique-specific locks without duplicates. Final target ancestry can further restrict eligibility, but cannot turn a preserved toe into a compensating variable. The actual fit still needs original frame, every foot vertex and each loaded-side check.
   */
  export interface Selection {
    /** Own-side hip, knee, ankle and explicitly permitted subtalar fitting paths. */
    channels: AutoMovieHumanRigControls.DegreeChannel[];

    /** Original midfoot/toe paths and, for authored roll, the subtalar path. */
    preserved: AutoMovieHumanRigControls.DegreeChannel[];
  }

  /**
   * Select the same public leg authority for planning and final consumption.
   *
   * @evidence contracts/common.md#implementation-and-ownership Removes only the declared preserved distal paths from the public own-side leg chain. Toe chains are always preserved, including omitted controls whose Human default is zero. Each invocation owns its arrays; there is no pose, actor, contact or cached state to mutate.
   * @evidence contracts/common.md#authoring-interface Invalid sides or policies refuse before selection. Planted yields hip3, knee2, ankle1 and subtalar1; authored yields the same six proximal controls. This does not assert either choice can realize a requested WORLD route or that a mode handoff is continuous.
   */
  export function select(side: MotionAction.Side, policy: Policy): Selection {
    if ((side !== "left" && side !== "right") || (policy !== "planted" && policy !== "authored"))
      throw new Error("Support channels require an anatomical side and explicit planted or authored policy");

    const leg: AutoMovieHumanRigControls.DegreeChannel[] = AutoMovieHumanRigControls.chain({ region: "leg", side });
    const preserved: AutoMovieHumanRigControls.DegreeChannel[] = leg.filter((channel: AutoMovieHumanRigControls.DegreeChannel): boolean => channel.endsWith(".midfootSupination") || policy === "authored" && channel.endsWith(".subtalarInversion"));
    for (const digit of ["hallux", "second", "third", "fourth", "fifth"] as const)
      preserved.push(...AutoMovieHumanRigControls.chain({ region: "toe", side, digit }));

    return { channels: leg.filter((channel: AutoMovieHumanRigControls.DegreeChannel): boolean => !preserved.includes(channel)), preserved };
  }
}
