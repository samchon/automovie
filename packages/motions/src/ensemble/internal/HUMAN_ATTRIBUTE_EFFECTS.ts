import type { IAutoMovieMotionHumanAttributeEffects } from "@automovie/interface";

import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";

/**
 * What each group attribute moves, as one table every reader takes its numbers
 * from, so changing a row reaches every law and pass that reads it.
 *
 * An effect is a value read between its value at the attribute's 0 and at its 1
 * (`HumanAttribute.effect`, linear). Attributes shape how and when, never what:
 * no row decides that a member misfires, routs or falls.
 *
 * - `discipline.axes`: the proficiency axes a member's discipline replaces its
 *   drawn proficiency on (`timing`, `reaction`, `anticipation`), so a drilled
 *   member keeps time and answers a word more tightly. Direction from the
 *   tapping literature (trained timers vary less; Repp and Su 2013, Psychon
 *   Bull Rev 20:403); the identity mapping is provisional.
 * - `discipline.lock`: the share of members whose steps lock to a beat track :
 *   0.62 at 0, the share of side-by-side civilian pairs that lock step
 *   frequency (Nessler and Gilliland 2009, Hum Mov Sci 28:772), and 1 for
 *   drilled troops at 1.
 * - `discipline.correction`: the phase-correction gain of the linear
 *   phase-correction model (Vorberg and Wing 1996): stable between 0 and 2, and
 *   held fixed by a synchronising person (Repp and Keller 2008). A search for
 *   measured gains in paced stepping (Repp 2005; Repp and Keller 2004, 2008)
 *   found no table read; 0.3 to 0.7 is provisional.
 * - `discipline.dress`: the factor on a member's dress bound about its slot
 *   (`HumanEnsemble.station`, read by the walk family's station keeping);
 *   provisional.
 * - `fatigue.pace`: the factor on a steered member's desired speed
 *   (`HumanCrowd.steer`) and on the speed of a walk-family gait that draws its
 *   own tempo (`walk.locomote`; a cadenced march keeps its count), from fresh
 *   to the `weary` manner preset's pace (`AutoMovieMotionManner.PRESETS.weary`,
 *   itself provisional), so one table owns weariness.
 * - `morale.latency`: the factor on a response latency's mean (hesitation,
 *   `HumanResponse.latency`); provisional.
 * - `morale.speed`: the factor on a fleeing member's desired speed, from the
 *   nervous to the normal desired speed of Helbing, Farkas and Vicsek 2000
 *   (Nature 407:487: about 1.5 against 1 m/s), so low morale runs faster.
 * - `morale.herding`: the herding share `p` of the same model, the weight of the
 *   neighbours' mean direction; 0 for a steady crowd, and the provisional 0.4
 *   at broken morale, inside the model's own range of 0 to 1.
 * - `morale.fluctuation`: the factor on a fleeing member's individual
 *   fluctuation, the spread of its drawn desired speed. Nervousness `n` raises
 *   the fluctuation strength as it raises the desired speed, both by the same
 *   mixing, `eta = (1 - n) eta_0 + n eta_max` beside `v_0 = (1 - n) v_0(0) + n
 *   v_max` (Helbing and Johansson, Pedestrian, Crowd and Evacuation Dynamics,
 *   Encyclopedia of Complexity and Systems Science 2009, arXiv 1309.1609;
 *   Helbing, Farkas and Vicsek 2000, Phys Rev Lett 84:1240, on panicking
 *   pedestrians' large fluctuations), with low morale as high nervousness. The
 *   review leaves `eta_max / eta_0` to calibration; 2 at broken morale is
 *   provisional.
 */
export const HUMAN_ATTRIBUTE_EFFECTS: IAutoMovieMotionHumanAttributeEffects = {
  discipline: {
    axes: ["timing", "reaction", "anticipation"],
    lock: { low: 0.62, high: 1 },
    correction: { low: 0.3, high: 0.7 },
    dress: { low: 2, high: 1 },
  },
  fatigue: {
    pace: { low: 1, high: AutoMovieMotionManner.PRESETS.weary.pace ?? 1 },
  },
  morale: {
    latency: { low: 1.3, high: 1 },
    speed: { low: 1.5, high: 1 },
    herding: { low: 0.4, high: 0 },
    fluctuation: { low: 2, high: 1 },
  },
};
