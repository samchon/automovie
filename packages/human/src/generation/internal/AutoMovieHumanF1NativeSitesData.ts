import type { AutoMovieHumanF1NativeSites } from "../AutoMovieHumanF1NativeSites";
import { AutoMovieHumanF1Placing as T } from "../AutoMovieHumanF1Placing";

/*
 * Angular samples of a section's girth: the limb law's 360, under 0.1 % short of the curve for a 100 mm limb.
 */
export const GIRTH_PHASES: number = 360;

/*
 * Grid of the extreme scans, mm: the limb law's 1 mm from the run's start, so f1's argmax sites are reproduced.
 */
export const STEP_MM: number = 1;

/*
 * Grid of the navel pit's scan, mm: the navel net's control rows stand 2 mm apart (a 32 mm window over 16 spans), so a hundredth of a
 * millimetre resolves the pit of its cubic field two hundred times finer than the field can turn.
 */
export const PIT_STEP_MM: number = 0.01;

/*
 * The names of each course's run ends: the trunk's two course centres around the three segment origins that divide it, and each limb's
 * course centres as `AutoMovieHumanF1Placing.COURSES` names them (the arm and the hand share one course).
 */
export const ENDS: Record<AutoMovieHumanF1NativeSites.ISite["family"], readonly string[]> = {
  trunk: [T.COURSES["trunk"]![0]!, "pelvis", "thorax", "head", T.COURSES["trunk"]![1]!],
  arm: T.COURSES["arm"]!,
  hand: T.COURSES["hand"]!,
  leg: T.COURSES["leg"]!,
};

/*
 * The bind segment that carries each run of each course, by run index: the segment whose length moves the run's far end, or, for a run
 * between two datums of one segment, that segment. The trunk's runs lie between the segment origins of the chain's pelvis, thorax and
 * head, whose offsets are the trunk lengths (`AutoMovieHumanF1SegmentLengths`); the limbs' between the course centres of
 * `AutoMovieHumanF1Placing.COURSES`: the arm leaves the thorax (its first two centres are thorax datums), then follows the humerus, the
 * forearm and the hand; the leg follows the femur, the tibia and the foot.
 */
export const SEGMENTS: Record<AutoMovieHumanF1NativeSites.ISite["family"], readonly string[]> = {
  trunk: ["pelvis", "pelvis", "thorax", "head"],
  arm: ["thorax", "humerus", "forearm", "hand", "hand"],
  hand: ["thorax", "humerus", "forearm", "hand", "hand"],
  leg: ["femur", "tibia", "foot", "foot"],
};

/*
 * f1's authored neck-skin site on the trunk course, mm: the native path's tape proxy for ISO 8559-1 5.3.2 neck girth ("just below the
 * bulge at the thyroid cartilage, perpendicular to the longitudinal axis of the neck"). The thyroid cartilage does not show on f1's skin,
 * so the definition is unreadable; the station is carried by its tau in the suprasternale-to-bitragion run. Provisional, f1 only.
 */
export const NECK_F1_MM: number = 690.26;

/*
 * f1's authored head-skin site, mm: the trunk knot where the head's own sections begin, 9 mm above the bitragion midpoint (the head
 * frame's origin). No published measure names this boundary; carried by its tau in the bitragion-to-crown run. Provisional, f1 only.
 */
export const HEAD_F1_MM: number = 792;
