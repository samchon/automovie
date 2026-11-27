import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { QuadrupedChange } from "./quadruped/QuadrupedChange";

/**
 * The horse's gaits as measured: the stride and stance times by speed, the
 * footfalls, the change points, and the ranges the ride poses the trunk, the
 * head and the limbs with, gathered into the horse's gait table, `TABLE`.
 *
 * The timing is from Robilliard, Pfau and Wilson 2007, Gait characterisation
 * and classification in horses, J Exp Biol 210:187
 * (https://journals.biologists.com/jeb/article/210/2/187/17107/Gait-characterisation-and-classification-in-horses):
 * stride time and left-fore stance time by speed (Tables 2 and 3), the order of
 * footfalls (Table 1) and the fore and hind phase ratios (Table 4). Its eight
 * horses were Icelandic, about 1.4 m at the withers; warmbloods of 1.6 m stride
 * about 15 % slower at the same speed (Back, Schamhardt and Barneveld 1996, Vet
 * Q 18:79: 1.09 s at a 1.6 m/s walk, 0.67 s at a 4.0 m/s trot). For a horse of
 * another height the rows are scaled by dynamic similarity
 * (`AutoMovieArchetypeQuadrupedGait.scale`), which closes about half of the gap
 * to those warmblood figures: provisional.
 */
export namespace AutoMovieArchetypeEquineGait {
  /** The four measured equine gaits represented by this table. */
  export type Gait = "walk" | "trot" | "canter" | "gallop";

  /** Every gait of the horse, slowest first. */
  export const GAITS: readonly Gait[] = ["walk", "trot", "canter", "gallop"];

  /**
   * The measured rows by gait, in order of speed (Robilliard et al. 2007,
   * Tables 2 and 3; the canter and gallop rows are the left and right lead rows
   * the paper could be read at).
   */
  export const ROWS: Readonly<
    Record<Gait, readonly AutoMovieArchetypeQuadrupedGait.IRow[]>
  > = {
    walk: [
      { speed: 1.0, stride: 1.121, deviation: 0.12, stance: 0.733 },
      { speed: 1.5, stride: 0.904, deviation: 0.079, stance: 0.54 },
      { speed: 2.0, stride: 0.887, deviation: 0.077, stance: 0.526 },
      { speed: 2.5, stride: 0.714, deviation: 0.113, stance: 0.384 },
      { speed: 3.0, stride: 0.654, deviation: 0.106, stance: 0.307 },
    ],
    trot: [
      { speed: 2.0, stride: 0.649, deviation: 0.046, stance: 0.302 },
      { speed: 2.5, stride: 0.651, deviation: 0.043, stance: 0.328 },
      { speed: 3.0, stride: 0.637, deviation: 0.057, stance: 0.327 },
      { speed: 3.5, stride: 0.6, deviation: 0.039, stance: 0.259 },
      { speed: 4.0, stride: 0.569, deviation: 0.036, stance: 0.223 },
      { speed: 4.5, stride: 0.542, deviation: 0.036, stance: 0.206 },
      { speed: 5.0, stride: 0.511, deviation: 0.036, stance: 0.2 },
      { speed: 5.5, stride: 0.516, deviation: 0.039, stance: 0.18 },
      { speed: 6.0, stride: 0.5, deviation: 0.028, stance: 0.173 },
      { speed: 6.5, stride: 0.482, deviation: 0.013, stance: 0.158 },
    ],
    canter: [
      { speed: 4.0, stride: 0.454, deviation: 0, stance: 0.167 },
      { speed: 5.0, stride: 0.496, deviation: 0.024, stance: 0.172 },
      { speed: 8.0, stride: 0.431, deviation: 0.008, stance: 0.132 },
      { speed: 8.5, stride: 0.417, deviation: 0.021, stance: 0.127 },
    ],
    gallop: [
      { speed: 5.0, stride: 0.472, deviation: 0.021, stance: 0.176 },
      { speed: 8.0, stride: 0.393, deviation: 0.012, stance: 0.136 },
    ],
  };

  /**
   * When each hoof lands, as a fraction of the stride from the left fore's
   * landing.
   *
   * The walk is the lateral sequence left hind, left fore, right hind, right
   * fore with the pairs half a stride apart (Table 4: fore and hind ratios
   * 0.50); the quarter-stride lag from a hind hoof to the fore hoof of its side
   * is the even four-beat walk's, which the paper does not give as a number.
   * The trot lands diagonal pairs together. The left canter lands right hind,
   * then right fore with left hind, then left fore (fore ratio 0.73, hind ratio
   * 0.32). The left transverse gallop lands right hind, left hind, right fore,
   * left fore (fore ratio 0.78, hind ratio 0.29); the lag from the hind pair to
   * the fore pair is not in the paper, and is set so the right hind lands 0.05
   * of a stride after the left fore lifts off at the gallop's longest measured
   * duty factor of 0.37, the suspension that makes the gait a gallop: an
   * estimate.
   */
  export const PHASES: Readonly<
    Record<Gait, Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>>>
  > = {
    walk: { leftFore: 0, rightFore: 0.5, leftHind: 0.75, rightHind: 0.25 },
    trot: { leftFore: 0, rightFore: 0.5, leftHind: 0.5, rightHind: 0 },
    canter: { leftFore: 0, rightFore: 0.73, leftHind: 0.73, rightHind: 0.41 },
    gallop: { leftFore: 0, rightFore: 0.78, leftHind: 0.71, rightHind: 0.42 },
  };

  /**
   * The height at the withers of the horses the rows were measured on, metres:
   * Icelandic horses, 1.38 m (range 1.30 to 1.43) in Jensen et al. 2019, Acta
   * Vet Scand 61, Table 2
   * (https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML).
   * Robilliard et al. do not report their own horses' height, so this is
   * another sample of the breed: provisional.
   */
  export const REFERENCE: number = 1.38;

  /**
   * The Froude number at which horses change from walk to trot: 0.35, speed
   * squared over gravity times leg length, across nine horses of 90 to 720 kg
   * and legs of 0.7 to 1.4 m changing at 1.6 to 2.3 m/s (Griffin, Kram, Wickler
   * and Hoyt 2004, J Exp Biol 207:4215, abstract,
   * https://journals.biologists.com/jeb/article/207/24/4215/2679/Biomechanical-and-energetic-determinants-of-the).
   * The change point is the square root of this times gravity times the leg's
   * length. The paper's Methods, which name the landmark its leg length was
   * measured to, could not be read (the article page shows the abstract only,
   * the journal's PDF refused the fetch, and searches for a copy found none);
   * the hip joint's height from the ground (`AutoMovieArchetypeEquine.rig`)
   * stands for it, a provisional choice consistent with the paper's figures:
   * its 1.4 m for its 720 kg horse against 1.29 m at the hip of the 718 kg,
   * 1.80 m warmblood the bands allow.
   */
  export const FROUDE: number = 0.35;

  /**
   * The trot-gallop transition speed as it scales with body mass, the canter
   * being the gallop's slow form: `speed` at `mass` times the mass ratio to
   * `exponent`. Heglund and Taylor 1988 (J Exp Biol 138:301,
   * https://doi.org/10.1242/jeb.138.1.301), as a summary of the paper reads
   * (https://www.originalwisdom.com/wp-content/uploads/bsk-pdf-manager/2019/10/Heglund-and-Taylor_1988_Speed-and-stride-frequency-and-energy-cost-per-stride-how-do-they-change-with-body-size-and-gait.pdf):
   * "Transition speed rose with body mass to the power 0.216; stride frequency
   * there fell with body mass to the power -0.150." and "A 30 g mouse began to
   * gallop at 0.8 m/s, a 170 kg pony at 5 m/s." The coefficient of the paper's
   * Table 2 is unread (the journal's PDF refused the fetch and the summary
   * gives no table), so the pony's point anchors the power law; the same page
   * notes the paper's horse masses are given inconsistently. `AutoMovieArchetypeHorseRide.ride`'s spec
   * checks that the speed falls inside the trot's and the canter's measured
   * ranges.
   */
  export const GALLOP: Readonly<{
    speed: number;
    mass: number;
    exponent: number;
  }> = {
    speed: 5,
    mass: 170,
    exponent: 0.216,
  };

  /**
   * How far past a change point the speed must go before the gait changes,
   * metres per second at the measured horses' height, scaled with the gait's
   * speeds. A gap is needed at all because a speed at a change point wavers,
   * and without one the gait would flicker between its two gaits every stride.
   * A provisional value: no measured difference between a horse's up and down
   * changes was found (searches for gait transition hysteresis in horses found
   * Griffin et al. 2004's speed steps, upward only; a 2013 quadruped
   * simulation, arXiv 1310.7568, reporting hysteresis without a horse's
   * measure; and Nauwelaerts et al.'s acceleration study, read at its abstract
   * only). Twice the 0.1 m/s a steady speed wavers by in the hysteresis spec.
   */
  export const HYSTERESIS: number = 0.2;

  /**
   * The head's pitch range in a stride, degrees, by gait: 9 at walk, 5 at trot
   * and 10 at canter, the head's pitch displacement relative to space (Dunbar
   * et al. 2008, J Exp Biol 211:3889, Table 1,
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC2768006). The gallop reuses the
   * canter's; no measured value was found. Dunbar et al. time the nod to the
   * footfalls: at the walk the head and neck pitch on the trunk as one, nose-up
   * in the latter part of each forelimb's support (`support`); at the canter
   * retraction, nose-up, begins at the leading forelimb's touchdown (`lead`),
   * and the gallop is timed as the canter; at the trot the head bobs slightly
   * as the body rises and falls (pitch "so small as to be insignificant" in
   * their Fig. 9B), and its nose-down as the trunk sinks (`bob`) is a
   * provisional reading of that sentence.
   */
  export const NOD: Readonly<Record<Gait, number>> = {
    walk: 9,
    trot: 5,
    canter: 10,
    gallop: 10,
  };

  /**
   * The withers' height of the warmbloods whose trunk's rise and fall `BOB`
   * reads, metres: "Nineteen Warmblood riding horses (11 mares, 8 geldings, age
   * 10 ± 4.2 years, withers height 165.5 ± 7.0 cm)" (Rhodin et al. 2022,
   * Animals 12:3053, Section 2.1,
   * https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9657284/fullTextXML).
   */
  export const WARMBLOOD: number = 1.655;

  /**
   * How far the trunk rises and falls in a stride, as a fraction of the height
   * at the withers: the withers' vertical range of warmbloods, 33.4 mm at walk
   * and 92.2 mm at trot (Rhodin et al. 2022, Tables 2 and 3, the same paper),
   * over their `WARMBLOOD` height, so an animal of another height rises and
   * falls in proportion, as dynamic similarity scales every length: a
   * derivation. The same paper's Icelandic horses rise 46.8 mm at trot at 1.41
   * m, less than the warmbloods' share, so the share is the warmbloods' and not
   * every breed's. The canter and the gallop reuse the trot's; no measured
   * value was found.
   */
  export const BOB: Readonly<Record<Gait, number>> = {
    walk: 0.0334 / WARMBLOOD,
    trot: 0.0922 / WARMBLOOD,
    canter: 0.0922 / WARMBLOOD,
    gallop: 0.0922 / WARMBLOOD,
  };

  /**
   * The peak fold of the carpus and of the hock in the swing, degrees, at the
   * walk and at the trot: the joints' ranges in Back, Schamhardt and Barneveld
   * 1996, Vet Q 18:79, Tables 1 and 2
   * (https://www.tandfonline.com/doi/pdf/10.1080/01652176.1996.9694699). The
   * canter and the gallop reuse the trot's.
   */
  export const FOLD: Readonly<{
    fore: readonly [number, number];
    hind: readonly [number, number];
  }> = { fore: [68.7, 90.8], hind: [35.6, 55.4] };

  /**
   * How high a swinging hoof rises at the middle of its swing, fore and hind,
   * as a fraction of the height at the withers, at the walk and at the faster
   * gaits. At the trot, the peak hoof heights of eight horses trotting on level
   * ground, 13.8 cm fore and 10.8 cm hind (Brown, Stubbs, Kaiser, Lavagnino and
   * Clayton 2015, Equine Vet J 2015, abstract read at Europe PMC, PMID
   * 24593249), over their 142.3 cm at the withers (Clayton, Stubbs and
   * Lavagnino 2015, Equine Vet J 47:113, Materials and methods, the same
   * horses), so the model's horse of another height lifts in proportion: a
   * derivation. The canter and the gallop reuse the trot's, no measured value
   * having been found. The walk's 0.03 is a named estimate: no level-ground
   * walk hoof height was read (searched: the SLU forward-walk study, its
   * figures not reachable; the 2001 hindlimb walk kinematics, joint angles
   * only; the Kentucky walk-lameness hoof study, no heights in its abstract;
   * Animals 2025 15:2376 and Stutz et al. 2018, both refused).
   */
  export const LIFT: Readonly<{
    fore: readonly [number, number];
    hind: readonly [number, number];
  }> = { fore: [0.03, 0.138 / 1.423], hind: [0.03, 0.108 / 1.423] };

  /**
   * The share of a hoof's fore-and-aft travel that its top joint follows, fore
   * and hind: the shoulder joint's travel under a scapula of 0.311 of the
   * withers height (Matsuura et al. 2008) turning through 19.4 degrees, and the
   * hip joint's under the pelvis's 8.2 degrees (Back et al. 1996), each over
   * the 1.1 m a hoof travels in stance; derived, not measured.
   */
  export const FOLLOW: Readonly<{ fore: number; hind: number }> = {
    fore: 0.16,
    hind: 0.05,
  };

  /**
   * The horse's gait table: walk to trot at `FROUDE`, trot to canter at
   * `GALLOP` for the horse's mass, and canter to gallop at the middle of the
   * two gaits' overlapping measured ranges, provisional for want of a measured
   * change. Passage and piaffe are explicit-only and collected out of the trot.
   * Passage lands each hind 0.03 of a stride before its diagonal fore, the 30
   * ms positive diagonal advanced placement over a stride near one second
   * (Weishaupt et al. 2009 and Holmström et al. 1994, as Clayton and Hobbs 2019
   * report them); piaffe lands the diagonals together, the limb phase 0.5 of
   * the Olympic horses in Clayton 1997.
   */
  export const TABLE: AutoMovieArchetypeQuadrupedGait.ITable = createTable();

  /*
   * One of the horse's gaits gathered from the measured tables: its rows,
   * phases, bob and nod range, the walk's fold and lift or the trot's for the
   * faster gaits, as the tables state, with its nod's timing and its change
   * rule.
   * Parameter gait: The gait.
   * Parameter nod: When in the stride the head is nose-down, as `NOD` states.
   * Parameter change: How it is changed into from the gait below, absent for the
   * walk.
   * Returns: The gait.
   */
  function gathered(
    gait: Gait,
    nod: AutoMovieArchetypeQuadrupedGait.IGait["nod"]["timing"],
    change?: QuadrupedChange.Rule,
  ): AutoMovieArchetypeQuadrupedGait.IGait {
    const column: number = gait === "walk" ? 0 : 1;
    return {
      rows: ROWS[gait],
      phases: PHASES[gait],
      ...(change === undefined ? {} : { change }),
      bob: BOB[gait],
      nod: { range: NOD[gait], timing: nod },
      fold: { fore: FOLD.fore[column]!, hind: FOLD.hind[column]! },
      lift: { fore: LIFT.fore[column]!, hind: LIFT.hind[column]! },
    };
  }

  function createTable(): AutoMovieArchetypeQuadrupedGait.ITable {
    /*
     * Reduction of the dressage horses' clocks to `REFERENCE` by the table's own
     * dynamic similarity: their heights are not reported, so the warmblood
     * `WARMBLOOD` height stands for them, provisional.
     */
    const DRESSAGE: number = Math.sqrt(WARMBLOOD / REFERENCE);

    /*
     * The collected diagonal gaits' shared clock rows, reduced to `REFERENCE` by
     * `DRESSAGE`. Piaffe: stride 1.11 s (SD 0.10) and stride length 0.37 m, so
     * 0.333 m/s; passage: stride 1.09 s (SD 0.14) and 1.67 m, so 1.532 m/s; both
     * the means of four Grand Prix horses (Andersson 2020, Kinematic gait
     * analysis of horses performing piaffe, passage and extended trot, SLU, Table
     * 1, https://stud.epsilon.slu.se/15818/). Piaffe stance 0.60 s fore and 0.65
     * s hind (Clayton and Hobbs 2021, Animals 11:436, Table 1, seven horses).
     * Passage stance is derived from its 52 ms aerial phase (Clayton 1997, as
     * Clayton and Hobbs 2019 report it, Animals 9:763,
     * https://doi.org/10.3390/ani9100763): two equal diagonal stances fill the
     * stride less two suspensions, (1.09 - 2 × 0.052) / 2 = 0.493 s. The speeds
     * between the two rows interpolate the measured piaffe and passage, the
     * continuum a horse passes through in their transitions.
     */
    const COLLECTED: readonly AutoMovieArchetypeQuadrupedGait.IRow[] = [
      {
        speed: 0.37 / 1.11 / DRESSAGE,
        stride: 1.11 / DRESSAGE,
        deviation: 0.1 / DRESSAGE,
        stance: 0.6 / DRESSAGE,
        hindStance: 0.65 / DRESSAGE,
      },
      {
        speed: 1.67 / 1.09 / DRESSAGE,
        stride: 1.09 / DRESSAGE,
        deviation: 0.14 / DRESSAGE,
        stance: 0.493 / DRESSAGE,
        hindStance: 0.493 / DRESSAGE,
      },
    ];

    /*
     * One collected diagonal gait: the shared `COLLECTED` clock, the trot's
     * carriage, fold and lift ranges, and the FEI hoof heights. The FEI's
     * guideline (as Clayton and Hobbs 2019 quote it) raises the fore toe level
     * with the middle of the supporting fore cannon and the hind toe just above
     * the fetlock in both passage and piaffe, so the elevation is 0.5 fore and 0
     * hind along the cannon.
     * Parameter phases: When each hoof lands, from the left fore's landing.
     * Returns: The gait.
     */
    function collected(
      phases: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>>,
    ): AutoMovieArchetypeQuadrupedGait.IGait {
      return {
        ...gathered("trot", "bob"),
        rows: COLLECTED,
        phases,
        elevation: { fore: 0.5, hind: 0 },
      };
    }

    return {
      order: GAITS,
      explicit: ["passage", "piaffe"],
      collected: { passage: "trot", piaffe: "trot" },
      gaits: {
        walk: gathered("walk", "support"),
        trot: gathered("trot", "bob", { kind: "froude", froude: FROUDE }),
        canter: gathered("canter", "lead", { kind: "mass", ...GALLOP }),
        gallop: gathered("gallop", "lead", { kind: "overlap" }),
        passage: collected({
          leftFore: 0,
          rightFore: 0.5,
          leftHind: 0.47,
          rightHind: 0.97,
        }),
        piaffe: collected(PHASES.trot),
      },
      reference: REFERENCE,
      hysteresis: HYSTERESIS,
      follow: FOLLOW,
    };
  }
}
