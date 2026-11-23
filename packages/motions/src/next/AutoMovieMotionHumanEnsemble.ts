import { HUMAN_ATTRIBUTE_EFFECTS as HUMAN_ATTRIBUTE_EFFECTSSource } from "../ensemble/HUMAN_ATTRIBUTE_EFFECTS";
import { HUMAN_ENSEMBLE_PRESETS as HUMAN_ENSEMBLE_PRESETSSource } from "../ensemble/HUMAN_ENSEMBLE_PRESETS";
import { HUMAN_MANOEUVRES as HUMAN_MANOEUVRESSource } from "../ensemble/HUMAN_MANOEUVRES";
import { HumanAttribute as HumanAttributeSource } from "../ensemble/HumanAttribute";
import { HumanCrowd as HumanCrowdSource } from "../ensemble/HumanCrowd";
import { HumanEnsemble as HumanEnsembleSource } from "../ensemble/HumanEnsemble";
import { HumanFormation as HumanFormationSource } from "../ensemble/HumanFormation";
import { HumanManoeuvre as HumanManoeuvreSource } from "../ensemble/HumanManoeuvre";
import { HumanPopulation as HumanPopulationSource } from "../ensemble/HumanPopulation";
import { humanCrowdGroupFormation as humanCrowdGroupFormationLaw } from "../ensemble/humanCrowdGroupFormation";
import { humanQueueAdvance as humanQueueAdvanceLaw } from "../ensemble/humanQueueAdvance";
import { instance as instanceLaw } from "../ensemble/instance";
import { manoeuvreWheel as manoeuvreWheelLaw } from "../ensemble/manoeuvreWheel";

/**
 * Groups of people: a formation, a crowd and a manoeuvre.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `instance`: An instanced member: a performer that displays a template
 *   member's placed posture, read whole film frames earlier and moved rigidly
 *   by the offset it stands at from the template, so a rear rank marching with
 *   its front rank costs no plans and no fits of its own.
 * - `humanCrowdGroupFormation`: Compose density-sensitive walking slots around
 *   the centre of a pedestrian group's course.
 * - `humanQueueAdvance`: Advance a stationary single-file service queue by one
 *   position.
 * - `manoeuvreWheel`: A wheel on a fixed pivot: the formation turned rigidly
 *   about its pivot flank, so the line stays straight as it wheels.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HUMAN_ATTRIBUTE_EFFECTS`: What each group attribute moves, as one table
 *   every reader takes its numbers from, so changing a row reaches every law
 *   and pass that reads it.
 * - `HUMAN_ENSEMBLE_PRESETS`: Named groups as distributions of their members'
 *   attributes and proficiency, so an elite battalion and a militia are one
 *   composition under two names.
 * - `HUMAN_MANOEUVRES`: The drills as rows over the four choices of a manoeuvre,
 *   so a new drill (deploying on the head, by the rear) is a row, not code.
 * - `HumanAttribute`: A group member's attributes: the named qualities a group's
 *   distribution gives each member a number of, and the keyed draws that give
 *   them.
 * - `HumanEnsemble`: A group of people as one subject: its members resolved from
 *   the group's input, handed to a performance as performers and chains, and
 *   the seeded choices an author makes over them.
 * - `HumanFormation`: Formations: validating one, and reading where each member's
 *   slot stands at a film second, the way it travels between two seconds, and
 *   which member takes which slot.
 * - `HumanManoeuvre`: Manoeuvres planned as each member's own travel, and
 *   appended to the members' chains.
 * - `HumanPopulation`: Background members handed to the instanced population
 *   layer: their places as one formation design, and their motion as a cycle of
 *   a performed template member's own displayed poses, so a background soldier
 *   marches the march the foreground marches.
 * - `HumanCrowd`: A crowd that keeps no formation, steered: each member (or each
 *   walking group, as one agent) heads for its goals at its own drawn speed and
 *   avoids the others and the obstacles, by one plan-time pass of the engine's
 *   `steerAutoMovieCrowd`.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanEnsemble} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanEnsemble {
  /**
   * An instanced member: a performer that displays a template member's placed
   * posture, read whole film frames earlier and moved rigidly by the offset it
   * stands at from the template, so a rear rank marching with its front rank
   * costs no plans and no fits of its own.
   *
   * At its start the law reads where it stands relative to the template, in the
   * template's heading frame: an offset and a turn. Each posture is the
   * template's at `t - shift / 24` with the root, every limb goal's world point
   * and bend, and every goal's rotation moved by that offset and turn about the
   * template's root; a goal's contact lies in its end joint's own rest frame
   * and turns with the joint, so it is kept; joint angles are the template's.
   * So the instance's feet are planted where the template's are, moved, and a
   * gaze layer on it still looks at its own target. The move stays rigid only
   * while the template keeps its heading, so a span in which the template turns
   * by more than `TURN` refuses (a wheel needs full members), and so does a
   * template on another body, whose limbs the instance would carry. A goal
   * attached to a bone is in that bone's frame and is kept; a goal that keeps
   * clear of or rests on world colliders is refused, since those belong to the
   * template's place. The instance gives up its own per-step draws for one
   * whole-frame shift: the declared price of `IHumanEnsemble.detail`.
   *
   * Its contact windows are none: a planted goal it carries is the template's,
   * moved, and the slip of an instance is the template's own.
   */
  export import instance = instanceLaw;

  /**
   * What each group attribute moves, as one table every reader takes its
   * numbers from, so changing a row reaches every law and pass that reads it.
   *
   * An effect is a value read between its value at the attribute's 0 and at its
   * 1 (`HumanAttribute.effect`, linear). Attributes shape how and when, never
   * what: no row decides that a member misfires, routs or falls.
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
   *   phase-correction model (Vorberg and Wing 1996): stable between 0 and 2,
   *   and held fixed by a synchronising person (Repp and Keller 2008). A search
   *   for measured gains in paced stepping (Repp 2005; Repp and Keller 2004,
   *   2008) found no table read; 0.3 to 0.7 is provisional.
   * - `discipline.dress`: the factor on a member's dress bound about its slot
   *   (`HumanEnsemble.station`, read by the walk family's station keeping);
   *   provisional.
   * - `fatigue.pace`: the factor on a steered member's desired speed
   *   (`HumanCrowd.steer`) and on the speed of a walk-family gait that draws
   *   its own tempo (`walk.locomote`; a cadenced march keeps its count), from
   *   fresh to the `weary` manner preset's pace
   *   (`AutoMovieMotionManner.PRESETS.weary`, itself provisional), so one table
   *   owns weariness.
   * - `morale.latency`: the factor on a response latency's mean (hesitation,
   *   `HumanResponse.latency`); provisional.
   * - `morale.speed`: the factor on a fleeing member's desired speed, from the
   *   nervous to the normal desired speed of Helbing, Farkas and Vicsek 2000
   *   (Nature 407:487: about 1.5 against 1 m/s), so low morale runs faster.
   * - `morale.herding`: the herding share `p` of the same model, the weight of
   *   the neighbours' mean direction; 0 for a steady crowd, and the provisional
   *   0.4 at broken morale, inside the model's own range of 0 to 1.
   * - `morale.fluctuation`: the factor on a fleeing member's individual
   *   fluctuation, the spread of its drawn desired speed. Nervousness `n`
   *   raises the fluctuation strength as it raises the desired speed, both by
   *   the same mixing, `eta = (1 - n) eta_0 + n eta_max` beside `v_0 = (1 - n)
   *   v_0(0) + n v_max` (Helbing and Johansson, Pedestrian, Crowd and
   *   Evacuation Dynamics, Encyclopedia of Complexity and Systems Science 2009,
   *   arXiv 1309.1609; Helbing, Farkas and Vicsek 2000, Phys Rev Lett 84:1240,
   *   on panicking pedestrians' large fluctuations), with low morale as high
   *   nervousness. The review leaves `eta_max / eta_0` to calibration; 2 at
   *   broken morale is provisional.
   */
  export const HUMAN_ATTRIBUTE_EFFECTS: typeof HUMAN_ATTRIBUTE_EFFECTSSource =
    HUMAN_ATTRIBUTE_EFFECTSSource;

  /**
   * Named groups as distributions of their members' attributes and proficiency,
   * so an elite battalion and a militia are one composition under two names.
   *
   * Every value here is provisional: no study measuring the spread of
   * discipline, fatigue or morale across a unit was located. The rows order the
   * groups as the period sources and the crowd literature describe them:
   * drilled regulars steadier and more uniform than militia, a rabble the least
   * disciplined and the most varied, and civilians undrilled but calm. The
   * scene tests assert relations between the rows (elite narrower than militia,
   * rabble wider than civilians), never the rows' own numbers.
   */
  export const HUMAN_ENSEMBLE_PRESETS: typeof HUMAN_ENSEMBLE_PRESETSSource =
    HUMAN_ENSEMBLE_PRESETSSource;

  /**
   * The drills as rows over the four choices of a manoeuvre, so a new drill
   * (deploying on the head, by the rear) is a row, not code.
   *
   * - `wheel`: file order kept, the formation turned rigidly about the pivot
   *   flank, each member's step growing with its radius, all together
   *   (`manoeuvreWheel`, after Dundas 1792).
   * - `deploy`: column block k takes line block k, its files marching by the
   *   flank along the line's front to their own file, then fronting and
   *   marching up into place (`HumanManoeuvre`'s flank way, after Dundas 1792),
   *   the farthest first; the base block halts in place. A straight oblique
   *   from a closed column would brush the blocks ahead.
   * - `ploy`: the deployment reversed, the nearest first.
   * - `square`: file order kept, straight in whole steps, together; the front
   *   rank kneels, the rest stand (French regulation, through the Balagan
   *   summary of Nafziger 1996; provisional).
   * - `extend`, `close`: open or close order along the front, together.
   * - `face`: a turn in place.
   * - `free`: the least total distance (Kuhn 1955), straight, and steered where
   *   ways cross; each by its own latency.
   */
  export const HUMAN_MANOEUVRES: typeof HUMAN_MANOEUVRESSource =
    HUMAN_MANOEUVRESSource;

  /**
   * A group member's attributes: the named qualities a group's distribution
   * gives each member a number of, and the keyed draws that give them.
   *
   * An attribute is a value in [0, 1]: `discipline` (drill and steadiness, 1
   * the best drilled), `fatigue` (0 fresh, 1 spent) and `morale` (0 broken, 1
   * steady). A group states each as a distribution (`IDistribution`); each
   * member draws its own value from a stream keyed by the chain seed, the
   * ensemble's id, the member's index and the name drawn, so adding a member or
   * an attribute leaves every other draw bit-identical (the keyed streams of
   * `HumanSkill.stream`, Salmon et al. 2011). What an attribute moves is
   * `HUMAN_ATTRIBUTE_EFFECTS`'s; an attribute never decides an outcome.
   */
  export import HumanAttribute = HumanAttributeSource;

  /**
   * Compose density-sensitive walking slots around the centre of a pedestrian
   * group's course. For the two- to four-person groups measured by Moussaïd et
   * al. (2010, https://doi.org/10.1371/journal.pone.0010047, Table 1 and Fig.
   * 4), sparse groups walk abreast and higher-density groups bend their outer
   * members forward. The low-density bearings are set to 90 degrees because the
   * study found no significant departure from abreast there. Interpolation
   * between the two populations is an authored approximation. Densities outside
   * the observations use the nearer endpoint.
   *
   * Give each member's walking action its slot in the returned formation. Plan
   * the supplied frame from the group's centroid and check that the placed
   * slots clear obstacles along the course, including while turning. A
   * summed-shoulder-breadth disc can miss an outer slot. The result describes
   * relative slots only.
   *
   * @param frame The group centre and facing over film time.
   * @param halfBreadths Positive shoulder half breadths in metres, in
   *   left-to-right member order.
   * @param density Authored pedestrian density in people per square metre,
   *   finite and nonnegative.
   * @returns Formation blocks in member order for station keeping.
   * @throws {HumanRefusal} When the member count, half breadths or density are
   *   invalid.
   */
  export const humanCrowdGroupFormation: typeof humanCrowdGroupFormationLaw =
    humanCrowdGroupFormationLaw;

  /**
   * A group of people as one subject: its members resolved from the group's
   * input, handed to a performance as performers and chains, and the seeded
   * choices an author makes over them.
   *
   * Nothing here writes motion: each member performs the vocabulary's actions
   * the author's `build` appends. Attributes shape how and when, never what: an
   * outcome such as five misfires is the author's count, and `pick` only
   * chooses which members it falls on. Every draw is keyed by the chain seed,
   * the ensemble, the member's index and the quantity, so adding a member
   * leaves the others' bodies, attributes and roles bit-identical; discipline
   * replaces the drawn proficiency on the axes `HUMAN_ATTRIBUTE_EFFECTS`
   * names.
   */
  export import HumanEnsemble = HumanEnsembleSource;

  /**
   * Formations: validating one, and reading where each member's slot stands at
   * a film second, the way it travels between two seconds, and which member
   * takes which slot.
   *
   * A slot is laid by the engine's `formationSlotPosition` in its block's own
   * frame (the layout's geometry and dressing have that one owner), its depth
   * turned to run from the front rank to the rear, then turned by the block's
   * facing, moved by its offset and placed in the formation's frame at that
   * second. A member keeps its slot by its own travel: a cadenced march walks
   * the slot's way (`path`) and lets its step give, a free walk follows the
   * slot by speed matching (`walkStation`).
   */
  export import HumanFormation = HumanFormationSource;

  /**
   * Manoeuvres planned as each member's own travel, and appended to the
   * members' chains.
   *
   * A plan decides, per member, which new slot it takes, when after the word it
   * steps off, the way it goes and how it stands on arrival; it writes no
   * motion. File order is kept by every drill rule; only `nearest` reassigns,
   * because a formed unit's men keep their files and a crowd does not. Before
   * any member is planned, the ways are checked in time: two members whose ways
   * bring them closer than their summed shoulder half breadths, and closer than
   * they stand in either formation, at any 1/24 s instant refuse the manoeuvre,
   * unless its rule leaves crossings to the crowd's steering or wheels the
   * formation rigidly, each member keeping its slot of the turning formation
   * (`manoeuvreWheel`). A unit keeps together: a straight or slanting way is
   * marched at the slowest member's pace, each member keeping its place on it
   * as a station, so the ways are checked, and walked, as those places move. A
   * member's step-off is the drill order's delay here plus its own response
   * latency, drawn when the sync places it.
   */
  export import HumanManoeuvre = HumanManoeuvreSource;

  /**
   * Background members handed to the instanced population layer: their places
   * as one formation design, and their motion as a cycle of a performed
   * template member's own displayed poses, so a background soldier marches the
   * march the foreground marches.
   *
   * A population is a detail the author declares (`IHumanEnsemble.detail`),
   * never a camera's choice. A population uses steady motion because a
   * population member cannot be synced, cut or reached, so `cycle` refuses a
   * template whose window is not inside one stepping action. `standing` holds
   * the pose of one settled stand at every phase. The design lays the
   * formation's blocks for the engine's own `formationSlotPosition`, whose
   * placement with the facing turned about is the formation's
   * (`HumanFormation`), so a population member stands on the slot it would have
   * had as a performer; the performed members are its hero overrides.
   */
  export import HumanPopulation = HumanPopulationSource;

  /**
   * Advance a stationary single-file service queue by one position. Order the
   * ensemble head first and place it on one level, straight line. The head
   * walks toward the exit on the named release. Every follower walks to the
   * mark vacated immediately ahead, starting after that walk ends and the
   * declared wait passes. Each rank is a fully performed person.
   *
   * The release cue is an absolute film time even when these chains are
   * included in a larger composition. Walk anchors are fixed per subject, so
   * use this advance once per performer in the performance.
   *
   * Ziemer, Seyfried and Schadschneider measured successive stopped and moving
   * pedestrians in single-file ring trials (https://arxiv.org/abs/1602.03053).
   * Bilintoh et al. found that the fitted zero-speed headway varied across
   * cohorts (0.210 m in Ghana and 0.365 m in Germany,
   * https://doi.org/10.1016/j.heliyon.2023.e19378, Table 2). The service cue,
   * standing marks and delay are authored for the scene. Requiring the
   * predecessor's walk to end is a conservative staging rule for this release,
   * rather than an estimate of pedestrian reaction or flow.
   *
   * @param ensemble Fully performed queue members in head-to-tail order.
   * @param request The release cue, head's exit and optional follower wait.
   * @returns A parallel composition whose walk dependencies run head first.
   * @throws {HumanRefusal} If the exit or wait is invalid, a rank lacks a fully
   *   performed body, or the marks fail line, order or shoulder-disc clearance
   *   checks.
   */
  export const humanQueueAdvance: typeof humanQueueAdvanceLaw =
    humanQueueAdvanceLaw;

  /**
   * A wheel on a fixed pivot: the formation turned rigidly about its pivot
   * flank, so the line stays straight as it wheels. In the drill books one
   * flank stands fast while the rest moves round it; "the outward wheeling man
   * always lengthens his step to 33 inches" from the ordinary 30, and every
   * other man shortens his step "in proportion as he is nearer to the standing
   * flank on which the wheel is made" (Rules and Regulations for the Formations
   * and Movements of the Militia of Lower-Canada, c. 1814, after Dundas 1792).
   *
   * The wheeling frame is a course standing on the pivot, the `from`
   * formation's blocks moved so each slot stands where it stood at the word,
   * its heading turning and sampled every `HumanFormation.SAMPLE` seconds: a
   * frame that only turns carries every slot round the pivot exactly between
   * samples. Its angular speed is the slowest member's travel speed lengthened
   * by `LENGTHENED`, over the outward radius, so the outward man takes the
   * lengthened step and nobody a longer one; it gathers and sheds that speed at
   * `HumanFormation.ACCELERATION` over the same radius. Each member keeps its
   * own slot of the wheeling formation as a station, so at a called cadence its
   * steps shorten with its radius (`walkStation.cadenced`) and the pivot turns
   * on its own ground. Its way on paper is the arc its slot draws, a point
   * every `ARC` degrees.
   *
   * @param ensemble The ensemble, its member `i` standing in slot
   *   `members[i].index` of `from`.
   * @param manoeuvre The wheel.
   * @param starts Where each stands at the word.
   * @param ends Each one's slot in `to`.
   * @param speeds Each one's travel speed, m/s.
   * @returns Each member's way and station; no stations when nothing turns.
   * @throws {HumanRefusal} When `to` is not `from` turned about the pivot,
   *   naming the member whose slot lies elsewhere and how far.
   */
  export const manoeuvreWheel: typeof manoeuvreWheelLaw = manoeuvreWheelLaw;

  /**
   * A crowd that keeps no formation, steered: each member (or each walking
   * group, as one agent) heads for its goals at its own drawn speed and avoids
   * the others and the obstacles, by one plan-time pass of the engine's
   * `steerAutoMovieCrowd`. The pass gives each member a course; the member's
   * own walk or run then keeps station on it (`walkStation`), so its feet are
   * still whole steps.
   *
   * A member's agent is a disc of its shoulders' half breadth (the shoulder
   * joint's half width plus the upper arm's radius) at its desired speed: its
   * gait's speed at its leg length by dynamic similarity (the walk's normal
   * Froude number, or the run's), scaled by a normal draw with the coefficient
   * of variation of pedestrians' desired speeds, 0.26 over 1.34 m/s (Helbing
   * and Molnar 1995), by fatigue, and in flight by morale
   * (`HUMAN_ATTRIBUTE_EFFECTS`). Its start is the cue plus its latency
   * (`HumanResponse`), and in flight its herding share is morale's. Every draw
   * is keyed by the member; adding a member changes the others' courses (they
   * avoid it) but never their draws.
   */
  export import HumanCrowd = HumanCrowdSource;
}
