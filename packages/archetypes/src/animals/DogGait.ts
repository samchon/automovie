import { AutoMovieArchetypeEquineGait } from "./AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { DOG_BODY_MEASURES } from "./dog/internal/constants/DOG_BODY_MEASURES";

/**
 * Provisional canine timing with measured walk data and faster point
 * prototypes.
 *
 * Light et al. 2010, AJVR 71:997, doi:10.2460/ajvr.71.9.997, measured 56
 * healthy Labradors walking at 0.6–0.9 m/s: stride 1.11 ± 0.13 s and left-fore
 * stance 0.62 s and hind stance 0.56 s. Both rows express one pooled interval;
 * they do not assert speed-stratified measurements or a fitted speed response.
 * The Labrador timing is provisional for these Husky prototypes. No reference
 * height was read for those Labradors, so absolute speeds/times are preserved.
 *
 * Griffin, Main and Farley 2004, JEB 207:3545, doi:10.1242/jeb.01177, report
 * fore contact 15% of a cycle after ipsilateral hind contact in their dogs.
 * Rebased to left fore zero, that gives phases LF=0, RH=.35, RF=.5, LH=.85.
 * This additional cohort is not a claim of paired Husky gait measurements. The
 * shared cycle retains the LF stride mean; the paper's separately averaged hind
 * stride mean and duty percentages are not asserted to be identical.
 *
 * The existing horse walk's fold, clearance, body oscillation and top-joint
 * follow remain explicitly borrowed construction kinematics, not measured
 * canine motion. The neck remains unanimated because this table supplies no
 * measured canine nod; zero declares no animation, not measured zero motion.
 * Choi et al. 2021, Sensors 21:6366, Table 1 (doi:10.3390/s21196366), observed
 * one American Akita by high-speed video: trot at 2.69 m/s has mean fore
 * support/swing 0.23/0.34 s and hind support 0.21 s; gallop at 4.34 m/s has
 * fore support/swing 0.14/0.31 s and hind support 0.16 s. Their sums 0.57/0.45
 * s are representative common fore cycles, not directly reported stride means
 * or measured stride SDs. Hind support+swing separately sums 0.55/0.48 s.
 * Faster rows therefore declare zero authored variation, not a zero measured
 * standard deviation. A singleton speed is not expanded to an unobserved band.
 * The experiment is provisional for all three Husky morphometric cohorts.
 *
 * Trot uses synchronized diagonals, also observed in six retrievers by
 * Catavitello et al. 2015, PLOS ONE 10:e0133936. The gallop's complete phase
 * construction is Choi's desired transverse robot reference, not measured
 * canine phases: swap its right-lead sides and rebase the new left fore to 0.
 * The inclusive authored switching speeds 2.69/4.34 are the faster tables'
 * first available points, not measured preferred transitions. Canter remains
 * unavailable. Borrowed horse fold/clearance/bob remain explicit construction
 * proxies for every gait.
 */
export namespace DogGait {
  /** Canine walking interval and two provisional faster experimental points. */
  export const TABLE: AutoMovieArchetypeQuadrupedGait.ITable = {
    order: ["walk", "trot", "gallop"],
    gaits: {
      walk: {
        ...AutoMovieArchetypeEquineGait.TABLE.gaits.walk!,
        nod: { range: 0, timing: "support" },
        phases: {
          leftFore: 0,
          rightFore: 0.5,
          leftHind: 0.85,
          rightHind: 0.35,
        },
        rows: [
          {
            speed: 0.6,
            stride: 1.11,
            deviation: 0.13,
            stance: 0.62,
            hindStance: 0.56,
          },
          {
            speed: 0.9,
            stride: 1.11,
            deviation: 0.13,
            stance: 0.62,
            hindStance: 0.56,
          },
        ],
      },
      trot: {
        ...AutoMovieArchetypeEquineGait.TABLE.gaits.trot!,
        change: { kind: "speed", speed: 2.69 },
        nod: { range: 0, timing: "bob" },
        phases: { leftFore: 0, rightFore: 0.5, leftHind: 0.5, rightHind: 0 },
        rows: [
          {
            speed: 2.69,
            stride: 0.57,
            deviation: 0,
            stance: 0.23,
            hindStance: 0.21,
          },
        ],
      },
      gallop: {
        ...AutoMovieArchetypeEquineGait.TABLE.gaits.gallop!,
        change: { kind: "speed", speed: 4.34 },
        nod: { range: 0, timing: "lead" },
        phases: { leftFore: 0, rightFore: 0.8, leftHind: 0.6, rightHind: 0.3 },
        rows: [
          {
            speed: 4.34,
            stride: 0.45,
            deviation: 0,
            stance: 0.14,
            hindStance: 0.16,
          },
        ],
      },
    },

    // Default query height only: absolute scaling never divides by this value.
    reference: DOG_BODY_MEASURES.pet.withers / 100,
    scaling: "absolute",
    hysteresis: 0,
    follow: AutoMovieArchetypeEquineGait.FOLLOW,
  };
}
