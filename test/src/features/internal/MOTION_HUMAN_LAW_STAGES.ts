import { MOTION_HUMAN_LAW_STAGES_HANDLING } from "./MOTION_HUMAN_LAW_STAGES_HANDLING";
import { MOTION_HUMAN_LAW_STAGES_LOCOMOTION } from "./MOTION_HUMAN_LAW_STAGES_LOCOMOTION";
import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "./MOTION_HUMAN_LAW_STAGES_POSTURE";
import { MOTION_HUMAN_LAW_STAGES_SPORT } from "./MOTION_HUMAN_LAW_STAGES_SPORT";
import { MOTION_HUMAN_LAW_STAGES_STRIKING } from "./MOTION_HUMAN_LAW_STAGES_STRIKING";
import { MOTION_HUMAN_LAW_STAGES_TOUCH } from "./MOTION_HUMAN_LAW_STAGES_TOUCH";
import type { motionHumanLawSweep } from "./motionHumanLawSweep";

/**
 * Every family of the law sweep with its stages, so that the sweep's
 * completeness can be read in one place: a law of the registry belongs to
 * exactly one family here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table is for and its one invariant.
 * @evidence contracts/development/design.md#principled-representation Families keyed by name, each the table its own sweep test runs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Six families, one per sweep test.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The family tables are referenced, never copied.
 */
export const MOTION_HUMAN_LAW_STAGES: Readonly<
  Record<string, Readonly<Record<string, motionHumanLawSweep.Stage>>>
> = {
  locomotion: MOTION_HUMAN_LAW_STAGES_LOCOMOTION,
  posture: MOTION_HUMAN_LAW_STAGES_POSTURE,
  striking: MOTION_HUMAN_LAW_STAGES_STRIKING,
  handling: MOTION_HUMAN_LAW_STAGES_HANDLING,
  touch: MOTION_HUMAN_LAW_STAGES_TOUCH,
  sport: MOTION_HUMAN_LAW_STAGES_SPORT,
};
