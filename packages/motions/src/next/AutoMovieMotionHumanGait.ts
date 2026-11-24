import { AutoMovieMotionHumanGaitLaws } from "./AutoMovieMotionHumanGaitLaws";
import { AutoMovieMotionHumanGaitRows } from "./AutoMovieMotionHumanGaitRows";

/**
 * The gaits: walking and running to a floor point, travel relative to a person,
 * passing an opening and walking with a load, with the styled gaits
 * (`IAutoMovieMotionHumanGaitStyled`) and the aided walks
 * (`IAutoMovieMotionHumanGaitAided`), which run the walk's stepping plan.
 *
 * Every gait shares one speed model: a pace is a Froude number `Fr` and the
 * speed is `v = sqrt(Fr g l)` for the hip height `l` (`walk.FROUDE`,
 * `run.GAITS`): a body with a longer leg is faster by the square root of `l`,
 * its step is longer by `l` and its steps a minute fall by the square root of
 * `l`. Every speed and steps a minute stated on these types is at the reference
 * hip, 0.93 m (`walkRoot.REFERENCE_HIP`). `stride` changes the step and the
 * steps a minute inversely and leaves the speed; `manner.pace` multiplies the
 * speed (`IAutoMovieMotionManner.pace`).
 *
 * `WalkPace` and `RunPace` name the closed paces. A style that fixes more than
 * the pace is a preset, data spread into `walk`'s parameters beside the
 * destination: `AutoMovieMotionHumanGait.STROLL`, `HURRY` and `TRUDGE`
 * (`IStridePreset`) and `SWAGGER` (`ICarriagePreset`); a preset adds no method.
 * The approach has presets too: `FOLLOW` and `ESCORT`
 * (`ITrackingApproachPreset`) and `CONFRONT` (`IFacingApproachPreset`). A jog
 * and a sprint fix only the run's pace, so they are `pace: "jog"` and `pace:
 * "sprint"`, with no preset.
 *
 * Every method appends its action to the chain and returns the chain. Its
 * `anchor` is the action's id, unique in the composition, which another action
 * syncs to (`sync({ of })`) or is cut on (`until({ of, event })`).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `walk`: Walking to a floor point in whole steps, ending with the feet side by
 *   side.
 * - `run`: Running to a floor point, at a jog, a run or a sprint: the walk's
 *   footprint plan in a running gait, with a flight phase between stances.
 * - `approach`: Walking up to a person, a prop or a point and stopping at an
 *   interpersonal distance, facing it.
 * - `carryLoad`: Walking to a floor point while carrying a load or pushing a
 *   wheeled one: a bag in one hand, a box in both hands before the body, a
 *   child on the hip, or a cart or stroller pushed by its handle.
 * - `aidWalk`: A floor-aid gait with an explicit prop curve and body fitting on
 *   the same clock.
 * - `crutchWalk`: Walking on two crutches: a crutch gait on the support law, the
 *   crutches advancing on their own track and the body swinging on the hands.
 * - `caneSweep`: Sweep a long cane while walking, performed over the walk.
 * - `walkCadence`: Heel strikes entrained to a beat track: which beat each strike
 *   answers and when it lands, by the linear phase-correction model of
 *   sensorimotor synchronisation (Vorberg and Wing 1996, reviewed by Repp 2005,
 *   Psychon Bull Rev 12:969).
 * - `walkLegClearance`: How far two legs of one body pass into each other, read
 *   as the tangle audit reads them: each leg posed as the posture shows it (its
 *   hip, knee and ankle and its thigh's and shank's rotations, `HumanLegChain`,
 *   and its foot's rotation), and the deepest probe of either leg's thigh,
 *   shank, foot or toes in a segment of the other beyond the probe's own
 *   reference depth there (`AutoMovieMotionHumanAuditTangleModel.excess`).
 * - `walkStation`: A stepping plan walked to keep station on a moving point: a
 *   formation's slot, a steered course, or a person followed.
 * - `walkSteps`: The footstep plan of a walk: footprints, their heel-strike and
 *   toe-off times, each foot's scheduled stance, and the pelvis path, all as
 *   closed functions of seconds.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `STROLL`: The stroll preset: the `slow` walk (about 0.82 m/s at the reference
 *   hip) on steps 0.9 times the pace's, about 94 steps a minute, the arms swung
 *   0.8; leisure, waiting about, a quiet street.
 * - `HURRY`: The hurry preset: the `fast` walk (about 1.72 m/s at the reference
 *   hip) on steps 1.1 times the pace's, about 125 steps a minute, the arms
 *   swung 1.3; late for something, a purposeful errand that is not a run.
 * - `TRUDGE`: The trudge preset: the `slow` walk (about 0.82 m/s at the reference
 *   hip) on steps 0.8 times the pace's, about 106 steps a minute, the arms
 *   swung 0.4; exhaustion, defeat, a long march home.
 * - `SWAGGER`: The swagger preset: the `normal` walk (about 1.5 m/s at the
 *   reference hip), the arms swung 1.5 and the elbows held 20 degrees out;
 *   confidence, a challenge, showing off.
 * - `FOLLOW`: The follow preset: come up behind the person (`from: "behind"`) to
 *   the social distance (`at: "social"`, `HumanProxemics.GAPS`), matching their
 *   speed on the way (`track: "pace"`), as a follower closes the gap.
 * - `ESCORT`: The escort preset: come to the person's left side (`from: "left"`)
 *   at the personal distance (`at: "personal"`, `HumanProxemics.GAPS`),
 *   matching their speed on the way (`track: "pace"`), as an escort takes
 *   station.
 * - `CONFRONT`: The confront preset: step up in front of the person (`from:
 *   "front"`) face to face (`at: "faceToFace"`, `HumanProxemics.GAPS`), as a
 *   confrontation begins.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanGait`: Named ways of going somewhere on foot; the composition gives the
 *   destination.
 * - `HumanPursuit`: Travel relative to another person, each a row of `approach`:
 *   the composition gives the person as the target.
 * - `HumanTravelDoor`: Going through a doorway: travel that squares up before a
 *   named opening of one of the performance's obstacles, passes through its
 *   middle and comes out beyond it.
 * - `HumanFrailWalk`: The walk of a frail older person, graded by `severity` from
 *   the ordinary walk (0) to a shuffle (1): each feature is the ordinary walk's
 *   own value carried linearly toward its frail end.
 * - `HumanRaceGait`: The race walk: a walk driven to a run's speed without a
 *   flight.
 * - `HumanCrutchSit`: Sit down onto a chair with two crutches, or rise from it,
 *   in the prescribed order (Cornell Health and HealthLinkBC, Using crutches).
 * - `HumanCrutchStairs`: Climbing stairs on two crutches: "up with the good, down
 *   with the bad" (HealthLinkBC, Using crutches).
 * - `HumanProxemics`: Interpersonal distance: the gaps people keep, by
 *   relationship and purpose, as the chest-to-target gap an approach stops at.
 * - `HUMANOID_GAITS`: The five canonical humanoid gaits, the locomotion the
 *   `locomote` verb's `gait` enum names
 *   (`walk`/`run`/`sprint`/`sneak`/`march`), as ready {@link IAutoMovieGait}
 *   data a host drops into an actor context.
 * - `HUMANOID_PROFILE`: The canonical humanoid profile fixture: the same
 *   locomotion vocabulary as {@link HUMANOID_GAITS}, packaged as reusable
 *   profile data so a host can bind it onto any humanoid skeleton without
 *   hand-authored TypeScript clips.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanGait} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanGait {
  /**
   * Walking to a floor point in whole steps, ending with the feet side by side.
   * See `AutoMovieMotionHumanGaitLaws.walk`.
   */
  export import walk = AutoMovieMotionHumanGaitLaws.walk;

  /**
   * Running to a floor point, at a jog, a run or a sprint. See
   * `AutoMovieMotionHumanGaitLaws.run`.
   */
  export import run = AutoMovieMotionHumanGaitLaws.run;

  /**
   * Walking up to a person, a prop or a point and stopping at an interpersonal
   * distance, facing it. See `AutoMovieMotionHumanGaitLaws.approach`.
   */
  export import approach = AutoMovieMotionHumanGaitLaws.approach;

  /**
   * Walking to a floor point while carrying a load or pushing a wheeled one.
   * See `AutoMovieMotionHumanGaitLaws.carryLoad`.
   */
  export import carryLoad = AutoMovieMotionHumanGaitLaws.carryLoad;

  /**
   * A floor-aid gait with an explicit prop curve and body fitting on the same
   * clock. See `AutoMovieMotionHumanGaitLaws.aidWalk`.
   */
  export import aidWalk = AutoMovieMotionHumanGaitLaws.aidWalk;

  /** Walking on two crutches. See `AutoMovieMotionHumanGaitLaws.crutchWalk`. */
  export import crutchWalk = AutoMovieMotionHumanGaitLaws.crutchWalk;

  /**
   * Sweep a long cane while walking, performed over the walk. See
   * `AutoMovieMotionHumanGaitLaws.caneSweep`.
   */
  export import caneSweep = AutoMovieMotionHumanGaitLaws.caneSweep;

  /**
   * Named ways of going somewhere on foot; the composition gives the
   * destination. See `AutoMovieMotionHumanGaitRows.HumanGait`.
   */
  export import HumanGait = AutoMovieMotionHumanGaitRows.HumanGait;

  /**
   * Travel relative to another person, each a row of `approach`. See
   * `AutoMovieMotionHumanGaitRows.HumanPursuit`.
   */
  export import HumanPursuit = AutoMovieMotionHumanGaitRows.HumanPursuit;

  /**
   * Going through a doorway. See
   * `AutoMovieMotionHumanGaitRows.HumanTravelDoor`.
   */
  export import HumanTravelDoor = AutoMovieMotionHumanGaitRows.HumanTravelDoor;

  /**
   * The walk of a frail older person, graded by `severity` from the ordinary
   * walk (0) to a shuffle (1). See
   * `AutoMovieMotionHumanGaitRows.HumanFrailWalk`.
   */
  export import HumanFrailWalk = AutoMovieMotionHumanGaitRows.HumanFrailWalk;

  /** The race walk. See `AutoMovieMotionHumanGaitRows.HumanRaceGait`. */
  export import HumanRaceGait = AutoMovieMotionHumanGaitRows.HumanRaceGait;

  /**
   * Sit down onto a chair with two crutches, or rise from it, in the prescribed
   * order (Cornell Health and HealthLinkBC, Using crutches). See
   * `AutoMovieMotionHumanGaitRows.HumanCrutchSit`.
   */
  export import HumanCrutchSit = AutoMovieMotionHumanGaitRows.HumanCrutchSit;

  /**
   * Climbing stairs on two crutches. See
   * `AutoMovieMotionHumanGaitRows.HumanCrutchStairs`.
   */
  export import HumanCrutchStairs = AutoMovieMotionHumanGaitRows.HumanCrutchStairs;

  /** Interpersonal distance. See `AutoMovieMotionHumanGaitRows.HumanProxemics`. */
  export import HumanProxemics = AutoMovieMotionHumanGaitRows.HumanProxemics;

  /**
   * The five canonical humanoid gaits, the locomotion the `locomote` verb's
   * `gait` enum names (`walk`/`run`/`sprint`/`sneak`/`march`), as ready
   * {@link IAutoMovieGait} data a host drops into an actor context. See
   * `AutoMovieMotionHumanGaitRows.HUMANOID_GAITS`.
   */
  export import HUMANOID_GAITS = AutoMovieMotionHumanGaitRows.HUMANOID_GAITS;

  /**
   * Heel strikes entrained to a beat track. See
   * `AutoMovieMotionHumanGaitLaws.walkCadence`.
   */
  export import walkCadence = AutoMovieMotionHumanGaitLaws.walkCadence;

  /**
   * How far two legs of one body pass into each other, read as the tangle audit
   * reads them. See `AutoMovieMotionHumanGaitLaws.walkLegClearance`.
   */
  export import walkLegClearance = AutoMovieMotionHumanGaitLaws.walkLegClearance;

  /**
   * A stepping plan walked to keep station on a moving point. See
   * `AutoMovieMotionHumanGaitLaws.walkStation`.
   */
  export import walkStation = AutoMovieMotionHumanGaitLaws.walkStation;

  /** The footstep plan of a walk. See `AutoMovieMotionHumanGaitLaws.walkSteps`. */
  export import walkSteps = AutoMovieMotionHumanGaitLaws.walkSteps;

  /** The stroll preset. See `AutoMovieMotionHumanGaitRows.STROLL`. */
  export import STROLL = AutoMovieMotionHumanGaitRows.STROLL;

  /** The hurry preset. See `AutoMovieMotionHumanGaitRows.HURRY`. */
  export import HURRY = AutoMovieMotionHumanGaitRows.HURRY;

  /** The trudge preset. See `AutoMovieMotionHumanGaitRows.TRUDGE`. */
  export import TRUDGE = AutoMovieMotionHumanGaitRows.TRUDGE;

  /** The swagger preset. See `AutoMovieMotionHumanGaitRows.SWAGGER`. */
  export import SWAGGER = AutoMovieMotionHumanGaitRows.SWAGGER;

  /** The follow preset. See `AutoMovieMotionHumanGaitRows.FOLLOW`. */
  export import FOLLOW = AutoMovieMotionHumanGaitRows.FOLLOW;

  /** The escort preset. See `AutoMovieMotionHumanGaitRows.ESCORT`. */
  export import ESCORT = AutoMovieMotionHumanGaitRows.ESCORT;

  /** The confront preset. See `AutoMovieMotionHumanGaitRows.CONFRONT`. */
  export import CONFRONT = AutoMovieMotionHumanGaitRows.CONFRONT;

  /**
   * The canonical humanoid profile fixture. See
   * `AutoMovieMotionHumanGaitRows.HUMANOID_PROFILE`.
   */
  export import HUMANOID_PROFILE = AutoMovieMotionHumanGaitRows.HUMANOID_PROFILE;
}
