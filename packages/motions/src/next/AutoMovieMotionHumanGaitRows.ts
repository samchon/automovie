import { HumanProxemics as HumanProxemicsSource } from "../everyday/HumanProxemics";
import { HUMANOID_GAITS as HUMANOID_GAITSSource } from "../gait/HUMANOID_GAITS";
import { HUMANOID_PROFILE as HUMANOID_PROFILESource } from "../gait/HUMANOID_PROFILE";
import { HumanCrutchSit as HumanCrutchSitSource } from "../lexicon/HumanCrutchSit";
import { HumanCrutchStairs as HumanCrutchStairsSource } from "../lexicon/HumanCrutchStairs";
import { HumanFrailWalk as HumanFrailWalkSource } from "../lexicon/HumanFrailWalk";
import { HumanGait as HumanGaitSource } from "../lexicon/HumanGait";
import { HumanPursuit as HumanPursuitSource } from "../lexicon/HumanPursuit";
import { HumanRaceGait as HumanRaceGaitSource } from "../lexicon/HumanRaceGait";
import { HumanTravelDoor as HumanTravelDoorSource } from "../lexicon/HumanTravelDoor";
import { HUMAN_GAIT_CONFRONT } from "./presets/HUMAN_GAIT_CONFRONT";
import { HUMAN_GAIT_ESCORT } from "./presets/HUMAN_GAIT_ESCORT";
import { HUMAN_GAIT_FOLLOW } from "./presets/HUMAN_GAIT_FOLLOW";
import { HUMAN_GAIT_HURRY } from "./presets/HUMAN_GAIT_HURRY";
import { HUMAN_GAIT_STROLL } from "./presets/HUMAN_GAIT_STROLL";
import { HUMAN_GAIT_SWAGGER } from "./presets/HUMAN_GAIT_SWAGGER";
import { HUMAN_GAIT_TRUDGE } from "./presets/HUMAN_GAIT_TRUDGE";

/**
 * The gait family's lexicon rows, tables and presets, each the shipped data
 * under its family name (`AutoMovieMotionHumanGait`), with its own comment.
 */
export namespace AutoMovieMotionHumanGaitRows {
  /**
   * Named ways of going somewhere on foot; the composition gives the
   * destination. Register the ones a film uses.
   *
   * A style whose speed is one of the walk's or the run's paces is a row of
   * that action: `stroll`, `hurry`, `trudge` and `swagger` fix the walk presets
   * of the same names (`AutoMovieMotionHumanGait.STROLL` and the others,
   * provisional until each style's study is read), and `jog` and `sprint` fix
   * the run's pace alone.
   *
   * A style whose speed no pace has runs the walk's stepping plan in a gait of
   * its own, as the run does, and counts as a walk wherever actions are told
   * apart by kind:
   *
   * - `march` keeps the drill's cadence, 120 steps a minute, and its step, 30
   *   inches (0.762 m) for every marcher, as the regulation prescribes one step
   *   to all so the ranks keep their dress (US Army TC 3-21.5, quick time). The
   *   cadence governs: the way is covered in the whole number of steps nearest
   *   it in drill steps, so over a way that is not a whole number of them the
   *   step gives and the cadence stays.
   * - `doubleTime` keeps 180 steps a minute on the same step, which is a jog's
   *   speed, so it is run in the jog's gait with the count kept.
   * - `prowl` is the sneak on deeply bent knees; `sad` and `proud` carry a mood
   *   in speed, arm swing and trunk; `limp` spares one leg, standing on it
   *   briefly; `drunk` is slow, unsteady in time and wanders off its line. All
   *   provisional, each constant saying what was read and what was not.
   * - `sneak` goes slower than the slow walk on shorter steps, with the pelvis
   *   lowered and the arms held close (provisional values; no study of stealthy
   *   gait has been read).
   */
  export import HumanGait = HumanGaitSource;

  /**
   * Travel relative to another person, each a row of `approach`: the
   * composition gives the person as the target. Register the ones a film uses.
   *
   * `follow` and `escort` go where the person goes: the stop is taken where the
   * person comes to rest, read from their placed actions, and the pursuer sets
   * off late enough to arrive just after them. So the person pursued is
   * composed before the pursuer (`leader.with(follower)`), and a pursuit
   * composed the other way round is refused, saying so. First pass: the pursuer
   * does not match the person's speed on the way or keep a gap through their
   * turns. `confront` steps up to a person where they stand.
   *
   * `intercept` heads a moving person off, running to where they will be, and
   * `chase` is a row of it: a chase runs. `flee` is the opposite travel: a run
   * straight away from a person, read where they are when it begins. It is a
   * law of its own over the run, since its destination comes from the person
   * and not from the scene.
   */
  export import HumanPursuit = HumanPursuitSource;

  /**
   * Going through a doorway: travel that squares up before a named opening of
   * one of the performance's obstacles, passes through its middle and comes out
   * beyond it. Register `HumanTravelDoor.passThrough` to use it.
   *
   * The walker passes two places on the opening's own line, one of its own
   * steps at its pace before the sill and one beyond it (`walk.walking`, the
   * step `1.2 l Fr^0.25` of Alexander's walking model), so the last footfall
   * before the opening and the first after it lie on that line and the body
   * crosses the opening at right angles to its width wherever the walk began.
   * The walk itself asks the obstacles about each stretch (`walkClear`), so an
   * opening narrower than the walker's chest or lower than the walker stands is
   * refused there with the measure it would need. First pass: the leaf of a
   * door is not opened or held; an opening is a hole.
   *
   * A `duck`, `squeeze` or `crawl` mode hands the same opening to
   * `planReducedOpening`, which fits that posture through the solid's whole
   * depth and refuses with the width or headroom the posed body needs.
   */
  export import HumanTravelDoor = HumanTravelDoorSource;

  /**
   * The walk of a frail older person, graded by `severity` from the ordinary
   * walk (0) to a shuffle (1): each feature is the ordinary walk's own value
   * carried linearly toward its frail end.
   *
   * - Speed: the Froude number at the shuffle's end is that of 0.6 m/s at the
   *   reference hip, the gait speed below which an older adult is frail
   *   (Studenski et al. 2011, JAMA 305:50).
   * - Step length: `STEP` of the ordinary step at the shuffle's end, the shortest
   *   step the walk admits; older adults shorten the step before they slow the
   *   cadence (Winter et al. 1990, Phys Ther 70:340).
   * - Toe clearance: the swing's lift falls to `LIFT` of the ordinary one, the
   *   low foot of a shuffle (Winter et al. 1990).
   * - Trunk flexion: the forward lean grows to `LEAN` degrees, the stooped trunk
   *   of advanced age (provisional, of the order kyphotic walkers show).
   * - Arm swing: falls to `ARMS` of the ordinary swing (provisional).
   * - Step width: widens to `WIDTH` hip heights, a wider base (provisional).
   * - Double support: the swing shortens to `SWING` step periods, so both feet
   *   stand `1 - SWING` of each step instead of a fifth; older adults lengthen
   *   their double support (Winter et al. 1990).
   * - Toe clearance: the least clearance of the swinging foot falls to
   *   `CLEARANCE` metres, the low end of older adults' (Begg et al. 2007).
   * - Turning in place: each step turns by the same share of a hip's usable twist
   *   as the step keeps of its length, so a frail half turn takes more, shorter
   *   steps (provisional: the shortened step carried to the turn).
   *
   * The values are provisional where marked.
   */
  export import HumanFrailWalk = HumanFrailWalkSource;

  /**
   * The race walk: a walk driven to a run's speed without a flight. World
   * Athletics rule TR54.2 defines it: one foot is always on the ground, and the
   * advancing leg is straight from its first contact until it passes under the
   * body. So the swing takes almost the whole step and the double support
   * shrinks to a sliver (`SWING`), the pelvis barely rises (the flattened bob,
   * `BOB`), and the arms pump with the elbows near a right angle (`ARMS`). Its
   * speed is a Froude number of `FROUDE`, about 2.9 m/s on a 0.93 m hip, a club
   * walker's pace (elite 20 km walkers keep near 4 m/s on longer steps than the
   * walk's hip range admits here).
   *
   * Not yet: the pelvis's transverse rotation that lengthens the elite step,
   * and a stance knee locked straight by its own rule rather than by the walk's
   * contact flexion.
   */
  export import HumanRaceGait = HumanRaceGaitSource;

  /**
   * Sit down onto a chair with two crutches, or rise from it, in the prescribed
   * order (Cornell Health and HealthLinkBC, Using crutches).
   *
   * Sitting (`crutchSitDown`): the hands take the standing crutches' grips
   * (`taken`) as the injured leg lifts off the floor; both crutches are
   * gathered into the injured side's hand (`gathered`); the sound hand reaches
   * back to the chair's armrest or seat (`reached`); and the sit law lowers the
   * body while the crutches tilt on their planted tips. Rising (`crutchSitUp`):
   * the rise law stands the body on the sound leg while the sound hand pushes
   * on the chair and the crutches come back upright; the sound hand takes its
   * crutch back (`taken`), and both are planted in the tripod (`planted`). The
   * injured leg is held off the floor throughout.
   *
   * Both arms are laid as one course (`courseArmGoal`) from the second the
   * hands hold the crutches. The crutches are held, never leaned on: the hands
   * carry them by grip windows, a wear and holds.
   */
  export const HumanCrutchSit: typeof HumanCrutchSitSource =
    HumanCrutchSitSource;

  /**
   * Climbing stairs on two crutches: "up with the good, down with the bad"
   * (HealthLinkBC, Using crutches). The hands take the handgrips on both feet,
   * then the injured leg is held off the steps (`HELD`), its foot first lifted
   * clear over its place (`crutchHeldLeg`). Going up, each step first sets the
   * sound foot down on the next tread while the crutches stay planted
   * (`footUp<n>`), then lifts both crutches up and over the nosing onto that
   * tread (`crutchUp<n>`); going down, each step first moves both crutches over
   * and down onto the next tread (`crutchDown<n>`), then sets the sound foot
   * down beside them (`footDown<n>`). A foot's ball and a crutch's tip come
   * down `ON` of the tread back from its front edge. The flight starts at the
   * floor the body and the crutches enter on, so a descent is staged on its top
   * landing and never below the floor plane. The flight's riser and tread are
   * bounded as the climb bounds them (`climbStairsFlight`: a riser above 0.35
   * of the hip height, a tread shorter than 0.6 of the foot, refused), since
   * the climb is the sound leg's single step-up or step-down. The crutch props
   * share the climb's clock (`track`), so the scene's crutches and the body
   * read one course: the hands hold their grips where each crutch stands at
   * every support key and ride its move between them (`carryCrutchHands`), and
   * the injured leg is raised by the instant the first step's foot lifts.
   *
   * Each step takes `seconds`, 2 s when absent (provisional, missing a study),
   * after an opening of a quarter of a step in which the hands take the grips.
   */
  export const HumanCrutchStairs: typeof HumanCrutchStairsSource =
    HumanCrutchStairsSource;

  /**
   * Interpersonal distance: the gaps people keep, by relationship and purpose,
   * as the chest-to-target gap an approach stops at.
   *
   * Hall (1966, The Hidden Dimension) divides the space around a person into
   * zones by the interaction they afford, each with a close and a far phase:
   * intimate under 0.45 m, personal 0.45 to 1.2 m (close 0.45 to 0.75, far 0.75
   * to 1.2), social 1.2 to 3.6 m (close 1.2 to 2.1) and public beyond. The
   * named gaps here sit inside those zones:
   *
   * - `intimate` 0.3 m, the middle of the intimate far phase (0.15 to 0.45);
   * - `faceToFace` 0.6 m, the middle of the personal close phase, where two
   *   people stand squared up within arm's reach;
   * - `personal` 1.0 m, the far phase where conversation between acquaintances
   *   happens (Hall; Hayduk 1978, Psychol Bull 85:117, reviews measured
   *   comfortable distances of the same order, larger in front than behind);
   * - `fighting` 1.5 m, the middle of the 1.01 to 2.00 m two taekwondo fighters
   *   keep for 60 % of a fight (Maloney, Renshaw and Farrow 2021, Int J Perf
   *   Anal Sport 21:993, the kicking sport measured), where a kickboxing or
   *   karate bout squares off out of punching reach;
   * - `social` 1.6 m, the middle of the social close phase, impersonal business;
   * - `handing`: the gap at which both people's hands meet midway between their
   *   chests with the elbows flexed 35 degrees, the middle of the 20 to 50
   *   degrees the campaign assumes for a comfortable handover (provisional:
   *   Kopnarski et al. 2023 report where a handover happens, not at what
   *   distance), at the handover height midway between the two waists and
   *   chests (provisional).
   *
   * A gap is horizontal, measured from the front of the performer's chest (the
   * sternum region) to the target point: another person's sternum, a prop's
   * point or a free point.
   */
  export import HumanProxemics = HumanProxemicsSource;

  /**
   * The five canonical humanoid gaits, the locomotion the `locomote` verb's
   * `gait` enum names (`walk`/`run`/`sprint`/`sneak`/`march`), as ready
   * {@link IAutoMovieGait} data a host drops into an actor context. Same role as
   * the engine's other canonical humanoid tables (ROM, joint axes): the shapes
   * are fixed, a body is what varies.
   *
   * Every gait is tuned to sit inside the humanoid ROM, which is the whole
   * reason eutral`exists. Knees (flexion`[0, 150]°`, no hyperextension) swing
   * about a bent center; and the faster gaits carry the hips forward too: a
   * sprint's `±amplitude`swing would cross the hip's`−30°` floor without a
   * forward eutral`. Slower is calmer: `sneak` crouches (a high knee center)
   * and holds the ground longer (high `duty`); `march` throws the knees high;
   * `sprint` is all reach and little contact (low `duty`).
   *
   * Left/right limb pairs are a half-cycle out of phase, and each upper arm
   * shares the opposite upper leg's phase for contralateral counter-swing.
   * These rows drive hips, knees and upper arms; performShot's later stance
   * stage owns ground-contact IK.
   *
   * `locomote` carries the authored gait as `fullBody`. Layer safety is decided
   * from the root/bones/expression the synthesized clips actually carry after
   * masking, not from the broad region names: this counter-swing can layer with
   * a head-only look, but correctly conflicts with a simultaneous arm gesture.
   *
   * Periods are seconds, phases are turns and angular channels are degrees.
   * These are conventional schematic performance targets rather than measured
   * anatomical motion capacities. Module-owned rows are shared by every profile
   * context; the engine validates and samples them. Fixed table construction
   * happens once and retains no per-frame task or host resource.
   */
  export const HUMANOID_GAITS: typeof HUMANOID_GAITSSource =
    HUMANOID_GAITSSource;

  /**
   * The stroll preset: the `slow` walk (about 0.82 m/s at the reference hip) on
   * steps 0.9 times the pace's, about 94 steps a minute, the arms swung 0.8;
   * leisure, waiting about, a quiet street. Spread into `walk`'s parameters
   * with the destination; the `stroll` row of `HumanGait` fixes these values.
   * The scales are provisional until a study of strolling is read.
   */
  export const STROLL: typeof HUMAN_GAIT_STROLL = HUMAN_GAIT_STROLL;

  /**
   * The hurry preset: the `fast` walk (about 1.72 m/s at the reference hip) on
   * steps 1.1 times the pace's, about 125 steps a minute, the arms swung 1.3;
   * late for something, a purposeful errand that is not a run. Spread into
   * `walk`'s parameters with the destination; the `hurry` row of `HumanGait`
   * fixes these values. The scales are provisional until a study of hurried
   * walking is read.
   */
  export const HURRY: typeof HUMAN_GAIT_HURRY = HUMAN_GAIT_HURRY;

  /**
   * The trudge preset: the `slow` walk (about 0.82 m/s at the reference hip) on
   * steps 0.8 times the pace's, about 106 steps a minute, the arms swung 0.4;
   * exhaustion, defeat, a long march home. Spread into `walk`'s parameters with
   * the destination; the `trudge` row of `HumanGait` fixes these values. The
   * scales are provisional until a study of weary walking is read.
   */
  export const TRUDGE: typeof HUMAN_GAIT_TRUDGE = HUMAN_GAIT_TRUDGE;

  /**
   * The swagger preset: the ormal`walk (about 1.5 m/s at the reference hip),
   * the arms swung 1.5 and the elbows held 20 degrees out; confidence, a
   * challenge, showing off. Spread into`walk`'s parameters with the
   * destination; the `swagger`row of`HumanGait` fixes these values. The scales
   * are provisional until a study of the swagger is read.
   */
  export const SWAGGER: typeof HUMAN_GAIT_SWAGGER = HUMAN_GAIT_SWAGGER;

  /**
   * The follow preset: come up behind the person (`from: "behind"`) to the
   * social distance (`at: "social"`, `HumanProxemics.GAPS`), matching their
   * speed on the way (`track: "pace"`), as a follower closes the gap. Spread
   * into `approach`'s parameters with the person; the `follow` row of
   * `HumanPursuit` fixes these values.
   */
  export const FOLLOW: typeof HUMAN_GAIT_FOLLOW = HUMAN_GAIT_FOLLOW;

  /**
   * The escort preset: come to the person's left side (`from: "left"`) at the
   * personal distance (`at: "personal"`, `HumanProxemics.GAPS`), matching their
   * speed on the way (`track: "pace"`), as an escort takes station. Spread into
   * `approach`'s parameters with the person; the `escort` row of `HumanPursuit`
   * fixes these values.
   */
  export const ESCORT: typeof HUMAN_GAIT_ESCORT = HUMAN_GAIT_ESCORT;

  /**
   * The confront preset: step up in front of the person (`from: "front"`) face
   * to face (`at: "faceToFace"`, `HumanProxemics.GAPS`), as a confrontation
   * begins. Spread into `approach`'s parameters with the person; the `confront`
   * row of `HumanPursuit` fixes these values.
   */
  export const CONFRONT: typeof HUMAN_GAIT_CONFRONT = HUMAN_GAIT_CONFRONT;

  /**
   * The canonical humanoid profile fixture: the same locomotion vocabulary as
   * {@link HUMANOID_GAITS}, packaged as reusable profile data so a host can bind
   * it onto any humanoid skeleton without hand-authored TypeScript clips.
   *
   * Object.values allocates the gait array once at module load in declared key
   * order; its elements alias the owning gait table. Drivers and limits are
   * empty, so this profile adds no control or ROM enforcement. Hosts must not
   * mutate the shared rows, and the profile retains no process or renderer
   * state.
   */
  export const HUMANOID_PROFILE: typeof HUMANOID_PROFILESource =
    HUMANOID_PROFILESource;
}
