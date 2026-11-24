import { operate as operateLaw } from "../affordance/operate";
import { operateDrive as operateDriveLaw } from "../affordance/operateDrive";
import { operateInsert as operateInsertLaw } from "../affordance/operateInsert";
import { pour as pourLaw } from "../affordance/pour";
import { swipeTouchscreen as swipeTouchscreenLaw } from "../everyday/swipeTouchscreen";
import { typeText as typeTextLaw } from "../everyday/typeText";
import { button as buttonLaw } from "../handling/button";
import { manipulate as manipulateLaw } from "../handling/manipulate";
import { manipulateFacing as manipulateFacingLaw } from "../handling/manipulateFacing";
import { manipulateFingering as manipulateFingeringLaw } from "../handling/manipulateFingering";
import { manipulateReach as manipulateReachLaw } from "../handling/manipulateReach";
import { manipulateShape as manipulateShapeLaw } from "../handling/manipulateShape";
import { pushPull as pushPullLaw } from "../handling/pushPull";
import { pushPullLean as pushPullLeanLaw } from "../handling/pushPullLean";
import { pushSled as pushSledLaw } from "../handling/pushSled";
import { throwPottery as throwPotteryLaw } from "../handling/throwPottery";
import { workHeld as workHeldLaw } from "../handling/workHeld";
import { write as writeLaw } from "../handling/write";
import { zip as zipLaw } from "../handling/zip";
import { HumanHoldHandles as HumanHoldHandlesLaw } from "../lexicon/HumanHoldHandles";
import { HumanManipulate as HumanManipulateSource } from "../lexicon/HumanManipulate";
import { HumanToolRows as HumanToolRowsSource } from "../lexicon/HumanToolRows";
import { LongToolStroke as LongToolStrokeSource } from "../tasks/LongToolStroke";
import { composeHumanToolWork as composeHumanToolWorkLaw } from "../tasks/composeHumanToolWork";
import { hookSet as hookSetLaw } from "../tasks/hookSet";
import { longTool as longToolLaw } from "../tasks/longTool";
import { useTool as useToolLaw } from "../tasks/useTool";
import { wipe as wipeLaw } from "../tasks/wipe";

/**
 * Working an object or a device by hand: a control, a pour, a tool, writing or
 * typing, and pushing or pulling a load.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `operate`: Operating an articulated thing with one hand while standing:
 *   pressing a button along its axis, turning a knob about its axis, pulling or
 *   pushing a drawer along its slide, or swinging a hinged door by its handle.
 * - `pour`: A registered, stationary-base pour.
 * - `manipulate`: A keyed contact sequence: digits of one hand or both pressing
 *   sites of a prop one after another, timed by the caller or by skill.
 * - `workHeld`: Work a prop the hand already holds without letting go: the
 *   fingers drive its articulations (scissor blades closed by their rings, a
 *   folding knife's blade swung open on its pivot, a chopstick pinched), the
 *   hand may first carry it to a place in the performer's floor frame (a tray
 *   on the palm at shoulder height, an umbrella over the head, kept level when
 *   asked), and the prop may take another prop onto one of its sockets at the
 *   end (a morsel pinched between chopstick tips).
 * - `useTool`: Working with a one-handed tool held in the hand, in cycles over a
 *   work point while standing: hammering, sawing, stirring or turning a
 *   screwdriver.
 * - `longTool`: Work with a long tool in two hands, standing, in cycles at a work
 *   point (`IAutoMovieMotionHumanLongTool`): the trailing hand holds the tool
 *   rigid near the shaft's end, so the face is a fixed offset in that hand's
 *   frame (`AutoMovieMotionHumanHeld`), and each instant of the stroke
 *   (`LongToolStroke`) gives the tool's line, its face's facing and the
 *   trailing grip in the world, the hand turned the least that lays the held
 *   tool on them; the lead hand closes on the tool's line at the stroke's slide
 *   from the trailing grip, palm toward it from the body's side.
 * - `typeText`: Typing a text on a keyboard from the posture the performer is in
 *   (seated at a desk, or standing at a counter), pressing each key with an
 *   index fingertip.
 * - `wipe`: Wiping a table, counter or other level surface with the flat palm in
 *   circles, standing before it: a household task that the composed laws
 *   lacked, the palm's circling stroke on a work surface.
 * - `pushPull`: A heavy load that is not carried moved by its two handles: a
 *   crate, a wardrobe or a car pushed ahead walking forward, pulled toward the
 *   body walking backward, or a sack dragged behind walking forward; or pushed
 *   and pulled at and not moved at all, the scene where force is shown and
 *   nothing moves.
 * - `pushSled`: A pushed load's handles held in both hands through a walk: a sled
 *   push.
 * - `throwPottery`: Draw up a clay wall on a turning wheel with both hands.
 * - `swipeTouchscreen`: One fingertip reaches a named touchscreen, swipes in its
 *   local X direction and withdraws.
 * - `write`: Move the working point of a held tool along an authored planar
 *   stroke.
 * - `button`: Brace a fixed garment's rim with the index finger while the
 *   opposite thumb pushes its button through the opening.
 * - `zip`: Brace a supported pouch and pinch its slider tab through a straight
 *   stroke.
 * - `hookSet`: Set the hook.
 * - `holdHandles`: Keep both of a walker's hands on a moving implement's two
 *   handles, as a ploughman holds a walking plough.
 * - `pushPullLean`: How far the trunk leans when a load is pushed, pulled or
 *   dragged by its handles, by the load's declared level and the handles'
 *   height.
 * - `operateDrive`: The part an operation moves on a prop that articulates, and
 *   the drive the operation publishes for it: the hand and the part follow one
 *   function of the stroke's progress, the prop posed at the articulation's
 *   travel there.
 * - `operateInsert`: Inserting a held prop along a socket's axis: a rammer down a
 *   bore, a sword into its scabbard, a magazine into its well, an arrow back
 *   into a quiver, a key into a lock.
 * - `manipulateFacing`: The rotation one hand keeps through a keyed contact
 *   sequence (`manipulate`): the fingers toward the hand's first site from the
 *   body's root, laid across the site's normal, and the palm against the
 *   normal.
 * - `manipulateFingering`: The digits of a keyed contact sequence (`manipulate`):
 *   each contact's own digit, or the Viterbi path over the five digits of its
 *   hand that minimizes the travel of the limiting part over each stroke,
 *   accounting for the lift and descent of a reused digit.
 * - `manipulateReach`: Where the wrist stands for one press of a keyed contact
 *   sequence (`manipulate`): the hand turned as the act keeps it, the pressing
 *   digit straight, its tip over the site at typing's hover height
 *   (`typeText.HOVER`) and advanced along the digit by as much as its swing
 *   down to the key's bottom shortens its reach.
 * - `manipulateShape`: The hand's shape while one digit presses in a keyed
 *   contact sequence (`manipulate`): that digit straight, as the flat hand
 *   holds it, for its inverse kinematics to take down to its key.
 * - `composeHumanToolWork`: One-handed tool work from a working base composed
 *   from shipped actions: kneeling or crouching at floor level, seated at a
 *   bench, or standing.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `LongToolStroke`: The path of a long tool through one stroke, as a function
 *   of the stroke's share: the trailing grip, the tool's line from that grip
 *   toward its face, the face's facing, the lead hand's slide along the line
 *   from the trailing grip, and how far the stroke reaches toward the work (for
 *   the trunk's bow).
 * - `HumanManipulate`: Keyed contact sequences: the digits pressing the sites of
 *   a prop one after another, each a row of `manipulate`.
 * - `HumanToolRows`: The tool strokes as rows: each tool of `useTool` under a
 *   name of its own, the held prop, the work site, the hand, the cycles and the
 *   manner open.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanOperate} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanOperate {
  /**
   * Operating an articulated thing with one hand while standing: pressing a
   * button along its axis, turning a knob about its axis, pulling or pushing a
   * drawer along its slide, or swinging a hinged door by its handle.
   *
   * The goal is the hand on the thing's moving part, and the part's motion is
   * the mechanism's own: a button's face goes in along its axis, a knob turns
   * about its axis, a slider's handle travels along its axis, a leaf's handle
   * turns about its hinge line: a door's vertical line through the point it
   * names, or the prop's own hinge axis (a cock's cross pin,
   * `operateDrive.hinge`). The hand is shaped to the part (the index fingertip
   * on a button, a closed grip on a knob, a drawer handle or a door handle) and
   * laid on it by `AutoMovieMotionHumanTarget.hand`. A part on an upright face
   * is grasped with the hand along the face's normal: a handle overhand, the
   * palm on its top; a knob with that grasp rolled about the axis, and the hand
   * rolls with the knob as it turns, the forearm's pronation and supination
   * (Magermans et al. 2005, Clin Biomech 20:591, give the ranges daily tasks
   * use), the grip starting half the turn before the forearm's neutral so the
   * turn is centred in that range; a crank's knob spins free on its pin, so the
   * hand keeps its attitude and only orbits. A lid's knob, its axis nearer the
   * vertical than `UPRIGHT`, takes the palm from above. Each part's place is a
   * target, so it can be a prop's point; the part's outward normal is its axis.
   * A part beyond the standing arm is leaned into
   * (`AutoMovieMotionHumanLeanInto`): the trunk tips about the hips by the
   * least pitch that keeps the wrist within `REACH` of the arm's length and
   * straightens as the part comes nearer (a drawer pulled out); a part still
   * out of reach at the lean's limit is refused, since it is walked up to
   * first.
   *
   * The action is one arm phrase (`AutoMovieMotionHumanArm.stroke`): the hand
   * reaches the part by `ready` in the aimed movement time to its width
   * (McIntosh et al. 2018), waits a brief moment for the grip, moves the part
   * from `strokeStart` to `strokeEnd` at the mechanism's pace (`PACE`,
   * provisional), holds it until `relax`, and returns to where it hung. Events:
   * the phrase's `ready` (contact or grip closed), `strokeStart`, `stroke`,
   * `strokeEnd` (bottom out, travel end, swing end) and `relax` (release).
   *
   * On a prop that articulates (`IHumanProp.articulate`), the operated contact
   * names the articulation it is or rides, the amount is that articulation's
   * travel in its own unit and sign, the hand follows the contact of the prop
   * posed at the travel the stroke has reached, and the plan drives the
   * articulation by the same function (`operateDrive`,
   * `IHumanActionPlan.drives`), so the door stays open after the hand lets go
   * and the hand cannot drift off the handle. The `insert` mechanism moves a
   * held prop's working point along a socket's axis instead (`operateInsert`),
   * hand over hand when deeper than its grip reaches (`operateLongInsert`).
   *
   * Not yet: the A8 affordance kinds (`hinge`, `slider`, `knob`, `button`) in
   * the interface, which the core owns, so the mechanism is stated here; the
   * body stepping round a door and through it; power grips; pouring about a
   * lip.
   */
  export import operate = operateLaw;

  /**
   * A registered, stationary-base pour. Bring the held source above a fixed
   * recipient, tip about its rim lip, transfer, right it and retreat. Register
   * `pour` in `HumanPerformance` and call `registered(pour.name, params)`.
   * `flowStart` and `flowEnd` delimit the authored transfer cue.
   * EPIC-KITCHENS-100 provides observational action context (Damen et al.,
   * 2021, https://arxiv.org/abs/2006.13256). Angles and phase lengths here are
   * staged inputs. The liquid query gives the volume cue for one action
   * instance.
   */
  export import pour = pourLaw;

  /**
   * A keyed contact sequence: digits of one hand or both pressing sites of a
   * prop one after another, timed by the caller or by skill. Typing, a piano's
   * keys, a guitar's frets, a phone's keypad and a dial are the same structure
   * and are rows of this law (`HumanManipulate`).
   *
   * The prop's sites are its affordances: each contact names one, whose frame's
   * translation is the site and whose `+Y` is the site's outward normal, read
   * in the prop's frame at the act's start. A contact names its digit, or
   * leaves it to the fingering: the digit chosen is the one whose press keeps
   * the hand still, by dynamic programming over the sequence of each hand (the
   * Viterbi path over digits, cost the distance the hand's wrist must travel
   * between consecutive presses), so a run of nearby keys stays under one
   * placement of the hand. This is the outcome Handrix reports for its fretting
   * hand, which begins on the middle finger to keep the wrist still (ElKoura
   * and Singh 2003, "Handrix: animating the human hand", SCA 2003, pp.
   * 110-119); its own cost terms (finger strength, stretch) were not read at
   * the source, so the wrist's travel alone is the cost here, a first pass. A
   * text with the touch-typing layout assigns every letter's digit by the
   * standard home-row chart instead.
   *
   * Each press is two goals. The arm carries the hand so the pressing digit's
   * tip, the digit straight and the others curled clear of the keys
   * (`manipulateShape`), stands over its site at the hover height, drawn back
   * by as much as its swing down to the key shortens its reach
   * (`manipulateReach`), moving between placements on minimum-jerk paths; the
   * digit's own inverse kinematics (`HumanPosture.digits`) then takes the tip
   * down by the key's travel and up again. Times come from `at` when every
   * contact gives it, or from typing skill otherwise (the interval of
   * `typeText`, Salthouse 1986), each press taking the first 40 % of its
   * interval to reach the key and the rest to lift, as `typeText` does. The
   * body holds the posture it is entered in. Events `press1` to `pressN`.
   */
  export import manipulate = manipulateLaw;

  /**
   * Work a prop the hand already holds without letting go: the fingers drive
   * its articulations (scissor blades closed by their rings, a folding knife's
   * blade swung open on its pivot, a chopstick pinched), the hand may first
   * carry it to a place in the performer's floor frame (a tray on the palm at
   * shoulder height, an umbrella over the head, kept level when asked), and the
   * prop may take another prop onto one of its sockets at the end (a morsel
   * pinched between chopstick tips). The free hand may push a part the drive
   * moves while the holding hand keeps still (an umbrella's runner pushed up
   * its shaft), the holder first bringing the prop before the body when the
   * free arm cannot reach the part (an extinguisher's pin pulled,
   * workHeldPush). Register as `workHeld`.
   *
   * The grip never opens, so the prop rides the palm's frame throughout and its
   * place is reached by the wrist that holds it there: the hand-to-prop offset
   * the grip keeps, read from the displayed frames at entry, inverted at the
   * place (as `putDown` places a prop). The hand reaches the place in the
   * transport movement time over its travel (`AutoMovieMotionHumanTiming`) and
   * stays there, so the hold that persists afterwards carries the prop with the
   * trunk through a walk. The drives run over the work's `seconds` after the
   * transport, each from the performance's travel at the start. Events: the
   * clock's `strokeStart` and `strokeEnd`.
   *
   * Refusals: a work that neither drives, moves nor takes; a hand that does not
   * hold the prop; a place beyond the arm; an articulation the prop does not
   * declare or a travel outside its range; a socket the prop lacks.
   */
  export const workHeld: typeof workHeldLaw = workHeldLaw;

  /**
   * Working with a one-handed tool held in the hand, in cycles over a work
   * point while standing: hammering, sawing, stirring or turning a
   * screwdriver.
   *
   * The tool is the prop the hand holds (`prop`, taken up before, as `pickUp`
   * does), rigid in the hand from the instant its grip closed, so its working
   * point is its own `face` contact at a fixed offset in the hand's frame
   * (`AutoMovieMotionHumanHeld`), and the goal is that point on the work, the
   * hand following from it. The tool's line runs from its `grip` to its `face`
   * (`createTool`'s contacts). The work fixes that line (a hammer's level at
   * the strike, a spoon's upright, a screwdriver's along the heading, a saw's
   * sloping down to the cut), and the hand turns the least that lays the held
   * tool on it: a hammer's face and a saw's teeth turned down onto the work, a
   * screwdriver and a spoon with the palm inward, as a saw and a screwdriver
   * run on with the forearm. The saw's slope is the one of `SLOPES` the arm
   * holds with the least strain ({@link AutoMovieMotionHumanBend.strain}). A
   * hammer turns about the wrist up to `RAISE` degrees and strikes back down
   * onto the work point once a cycle; a saw pushes and pulls its teeth along
   * its line over the work point by a stroke of half the forearm; a spoon
   * circles inside the vessel it stirs (`HumanToolWork`); a screwdriver turns
   * about its own axis into the work, the forearm's pronation and supination of
   * `TURN` degrees each way. The hand reaches the working pose in the timing
   * owner's movement time (`AutoMovieMotionHumanTiming`), works `cycles` cycles
   * (a hammer's and a saw's of `PERIODS` seconds, a stir's the time its circle
   * takes at a tool stroke's speed, `STROKE_SPEED`), and returns, its fingers
   * kept closed on the tool as the grip left them. Experts vary amplitude less
   * (Bril et al. 2010, J Exp Psychol Hum Percept Perform 36:825); the seeded
   * variation is not drawn yet. Events: `ready`, per cycle `contact<n>` (the
   * strike, the stroke's middle, the circle's nearest point, the turn's end),
   * and `recover`.
   *
   * The plan carries the tool's working point in the hand (`IPlan.tool`), so a
   * capture reads it from the displayed hand; the tool stays held after.
   *
   * Not yet: two-handed tools (shovel, broom, mop), kneeling or seated work,
   * fatigue (Cote et al. 2002, 2005).
   */
  export import useTool = useToolLaw;

  /**
   * Work with a long tool in two hands, standing, in cycles at a work point
   * (`IAutoMovieMotionHumanLongTool`): the trailing hand holds the tool rigid
   * near the shaft's end, so the face is a fixed offset in that hand's frame
   * (`AutoMovieMotionHumanHeld`), and each instant of the stroke
   * (`LongToolStroke`) gives the tool's line, its face's facing and the
   * trailing grip in the world, the hand turned the least that lays the held
   * tool on them; the lead hand closes on the tool's line at the stroke's slide
   * from the trailing grip, palm toward it from the body's side. The trunk bows
   * and the pelvis sinks with the work point's height below the hips; the feet
   * stay planted where they entered. Both arms are laid as one course on the
   * one tool (`courseArmGoal`, `grasp`). A contact the trailing arm cannot
   * reach from where the performer stands is refused with the distance.
   *
   * Events: `ready`, per stroke `contact<k>` (and for a dig `drive<k>`,
   * `lever<k>`, `throw<k>`; for a rake `pull<k>`), and `recover`.
   *
   * Not yet: the foot that drives a shovel's blade, the thrown load as a prop,
   * stepping between rake strokes, kneeling work and the one-hand pull that
   * frees a stuck head.
   */
  export import longTool = longToolLaw;

  /**
   * Typing a text on a keyboard from the posture the performer is in (seated at
   * a desk, or standing at a counter), pressing each key with an index
   * fingertip. The keyboard is the scene's prop: its `homeRow` contact places
   * the keys, its `keys` field must span the letter rows, and the typist faces
   * it from its `+Z` side (`createKeyboard`).
   *
   * Each key press is a goal: the index fingertip of the hand on that key's
   * side comes down onto the key's centre by the key's travel and lifts again,
   * while the other hand's fingertip hovers over its home key. Only the index
   * fingertips are contact surfaces of the body, so this is two-finger typing;
   * touch typing with every finger waits on fingertip surfaces for the other
   * fingers. The keys lie on the standard 19.05 mm pitch with the usual row
   * stagger (ISO/IEC 9995; rows offset by a quarter and three quarters of a
   * key), a QWERTY layout, the space bar two rows below the home row pressed by
   * the right hand where it lies under that hand's home key, the bar being wide
   * enough to strike anywhere; a key the layout lacks is refused.
   *
   * Time between presses comes from typing skill: skilled typists strike about
   * every 0.15 to 0.2 s and novices far slower (Salthouse 1986, Psychol Bull
   * 99:303). Everyday typists, two-finger and touch alike, type 34 to 79 words
   * a minute (Feit, Weir and Oulasvirta 2016, CHI '16, How We Type), five
   * characters a word, so the interval runs from 60 / (34 x 5) s, about 0.35 s,
   * for a novice to 60 / (79 x 5) s, about 0.15 s, for an elite on the `speed`
   * axis, with the cross-task timing variability of `HumanSkill.jitter`. Each
   * press takes the first 40 % of its interval to reach the key, moving from 15
   * mm above it, and the rest to lift; the key travels 4 mm (inside the 1.5 to
   * 6 mm of ergonomic keyboard standards). The keyboard should sit near elbow
   * height with the elbows near 90 degrees (ANSI/HFES 100-2007): one whose home
   * row lies more than 0.15 m from the elbows' height, the shoulder joints'
   * mean height less the upper arm, or whose home keys lie beyond 0.95 of each
   * arm's reach from its shoulder is refused (both provisional). When the press
   * after a key on the same hand comes sooner than a whole interval, the reach
   * and the lift share that gap instead, so the fingertip moves on from the key
   * it lifts off. The body holds the posture it is entered in: each planted
   * foot stays on its floor and a seated body on its seat. No action cuts a
   * typing. Events `press1` to `pressN`, one per key.
   */
  export import typeText = typeTextLaw;

  /**
   * Wiping a table, counter or other level surface with the flat palm in
   * circles, standing before it: a household task that the composed laws
   * lacked, the palm's circling stroke on a work surface.
   *
   * The goal is the palm flat on the surface, circling its centre with a radius
   * of a quarter of the forearm (provisional) `cycles` times. The hand comes to
   * the surface in the aimed movement time (McIntosh et al. 2018), circles at a
   * tool stroke's hand speed (`useTool.STROKE_SPEED`) with the palm on the
   * surface throughout, and returns. A patch whose far side lies beyond the
   * standing arm is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk
   * tips about the hips by the least pitch that keeps the wrist within the
   * reach of an elbow kept at `ELBOW` degrees (`reach`); one still out of reach
   * at the lean's limit is refused, since it is walked up to first. The
   * preferred working height lies 200 to 250 mm below the elbow (Li, Chang and
   * Zhang 2024, Sensors 24:7056); the law accepts any reachable height and the
   * author places the surface. Events: the phrase's `ready` (palm down),
   * `strokeStart`, `strokeEnd`, `relax` (palm lifted).
   *
   * Not yet: leaning on the counter with the free hand (Iwakiri et al. 2007), a
   * held cloth as a prop, and the task sequences (dishwashing, laundry, bed
   * making) that chain this with the grasp, affordance and bend laws.
   */
  export import wipe = wipeLaw;

  /**
   * A heavy load that is not carried moved by its two handles: a crate, a
   * wardrobe or a car pushed ahead walking forward, pulled toward the body
   * walking backward, or a sack dragged behind walking forward; or pushed and
   * pulled at and not moved at all, the scene where force is shown and nothing
   * moves.
   *
   * The hold is the sled push's (`pushSled`): the hands reach the handles where
   * the load stands, close on them and are carried with the chest, so the
   * gripped load goes where the hands go; the push's grasp search, its sink
   * onto bent knees and its refusal of a handle out of reach are its own. What
   * the haul sets is the way and the trunk's lean:
   *
   * - `push`: the walk goes forward to `to`, the trunk leaning into the load.
   * - `pull`: the walk goes backward to `to`, the body keeping the heading it
   *   enters with, so it faces the load it draws, the trunk leaning back.
   * - `drag`: the walk goes forward to `to` with the handles behind the body, the
   *   trunk leaning forward.
   *
   * The lean is the measured one for the declared load at the handles' height
   * (`pushPullLean`, Lett and McGill 2006), so a heavier load leans the trunk
   * further. The walk is the push's slow one, its steps shorter than a free
   * walk's. A load that does not move (`moves: false`) is pressed for `seconds`
   * standing in place, the hands bearing on its handles without gripping, so it
   * stays where it stands.
   *
   * First pass, not yet: walking a tall load corner by corner (the load's own
   * pivot on the floor is not modelled), the breakaway and per-step events, the
   * step-to-step pauses a seed draws under heavy loads, and the load's friction
   * slowing the walk.
   */
  export import pushPull = pushPullLaw;

  /**
   * A pushed load's handles held in both hands through a walk: a sled push. The
   * trunk leans into the load while the body stands, the hands go to the
   * handles where the load stands, close on them, and from then on are carried
   * with the chest along the floor at the handles' own height. The body then
   * walks to `to`, slowly with no arm swing, while the arms take the walk's
   * rise and fall and the gripped load stays on the floor.
   *
   * The lean is the trunk's incline from the vertical, a hinge at the hips
   * shared by the pelvis and the spine (at least `lean`, if asked), coming in
   * over `SETTLE` seconds with the arms; lower handles are pushed with the
   * trunk nearer the horizontal, as far as measured pushers incline at the
   * handles' height (`pushSledStance`), and from bent knees, the body sinking
   * as far as keeps each wrist within the arm's reach as the walk rises; the
   * hands reach the handles in that time and grip them from its end, each
   * fist's grip socket on its handle as a grasp lays it (`HumanHand.reach`: the
   * palm into the bar along the handle's `-Y`, the thumb's side along its
   * `+X`), turned about the handle as far as its symmetry makes the same grasp
   * and slid along its grip band to whichever grasp the arm, its wrist within
   * range, keeps nearest the handle through the push (the shared chooser,
   * `HumanFreedomChoice`), so the handle is in the fist. Each hand's place is
   * then kept in the chest's frame for the rest of the push, its turn kept with
   * it; a turn the arm cannot meet gives way about the grip socket.
   *
   * The same hold serves the other ways a load is moved by its handles
   * (`pushPull`): an incline asked outright, leaning back for a pull; a walk
   * facing the load, so the body walks backward and draws it along; a stand in
   * place (`seconds`) instead of the walk; and a load that does not move, whose
   * handles the hands press (a `bear` contact bearing none of the body's
   * weight) instead of gripping, so it stays where it stands.
   *
   * First pass: the load slides with the grip and is not dragged by a friction;
   * the push's force and the slowing it brings to the walk are not modelled.
   */
  export import pushSled = pushSledLaw;

  /**
   * Draw up a clay wall on a turning wheel with both hands. Register as
   * `throwPottery`.
   *
   * The right palm lies on the wall's `outside` face and the left on its
   * `inside` face, each placed by the wrist that puts the palm's surface on the
   * face (`placeHumanHandSurface`'s rule) with the hand's entry attitude. The
   * faces ride the wheel's `raise` slider, which the pull drives from its
   * travel at the start up by `rise` over `seconds`, so both palms rise with
   * the wall and its height grows monotonically; the trunk leans forward over
   * the wheel, by the least hip hinge (`HumanTrunkLean`) that brings every palm
   * place within the arms, coming in and going out with the hands; the head's
   * crank turns at `rpm` throughout. The clay is round about the head's axis,
   * so each palm stays on the same surface in the turning head's frame. The
   * hands reach the wall over the transport movement time and leave over
   * another. Events: `strokeStart` and `strokeEnd` bound the pull.
   *
   * Refusals: a wheel without its head, rise or wall faces; a rise outside the
   * wheel's; a non-positive duration; a face beyond either arm.
   */
  export const throwPottery: typeof throwPotteryLaw = throwPotteryLaw;

  /**
   * One fingertip reaches a named touchscreen, swipes in its local X direction
   * and withdraws. `strokeStart` is touch-in, `strokeEnd` (also `relax`) is
   * touch-out. The hand returns to its entry pose at full duration. The stroke
   * takes 285.1 ms by default, the mean touch-in to touch-out duration from
   * Jeong and Liu (2017, doi:10.1080/00140139.2017.1313457). Jeong reports the
   * measured mean in Table 2.6 of his dissertation. The shared transport rule
   * times the reach and withdrawal. The contact carries no weight. The screen
   * belongs to a stationary fixture and the body keeps its entry stance. Stage
   * a free hand in front of the glass and within reach of the entire stroke.
   * The next action can cut in once the hand has withdrawn.
   */
  export const swipeTouchscreen: typeof swipeTouchscreenLaw =
    swipeTouchscreenLaw;

  /**
   * Move the working point of a held tool along an authored planar stroke.
   *
   * Register the law and perform `registered("write", params)` after taking the
   * tool in the orientation used to write. The surface belongs to a fixed rigid
   * prop. A prop that supplies a frame reader declares its rigidity with
   * `hasArticulations: false`. The arm approaches and leaves the stroke with
   * the entry wrist attitude as its goal. The target gives each edge time
   * proportional to its length and zero speed at each vertex, using Flash and
   * Hogan's planar minimum-jerk law (1985,
   * doi:10.1523/JNEUROSCI.05-07-01688.1985). The arm plans against that target.
   * This stages the motion of the working point. Mark making and pressure
   * depend on the scene's medium.
   */
  export const write: typeof writeLaw = writeLaw;

  /**
   * Brace a fixed garment's rim with the index finger while the opposite thumb
   * pushes its button through the opening. Register as `button`. The same
   * stroke clock moves the button mesh and places the thumb; the drive leaves
   * the button through the panel when the hands leave. A rigid straight slider
   * and authored bounding sphere approximate the closure without cloth
   * dynamics.
   */
  export const button: typeof buttonLaw = buttonLaw;

  /**
   * Brace a supported pouch and pinch its slider tab through a straight stroke.
   *
   * YKK's usage guidance calls for a straight pull along the zipper chain and
   * bringing opposing elements together for a bag closure
   * (https://lyncs.ykkfastening.com/shop/pages/about_products_09.aspx). The
   * flat modeled brace anchors the casing. The model's coupled lips, the
   * working fingertips and the retained travel follow one authored stroke.
   */
  export const zip: typeof zipLaw = zipLaw;

  /**
   * Set the hook. The hand holding the rod turns it about the grip, the tip
   * rising by the authored angle on a minimum-jerk course in the authored time
   * (a sharp lift), about the horizontal axis square to the rod; the grip stays
   * where it is, so the rod turns in the hand's own rotation and the arm
   * follows the hand's goal. The set is held a beat. A rod not held, a lift
   * outside 0 to `LIFT` or a time of no length is refused; a grip the arm
   * cannot keep is refused by the reach check.
   */
  export const hookSet: typeof hookSetLaw = hookSetLaw;

  /**
   * Keep both of a walker's hands on a moving implement's two handles, as a
   * ploughman holds a walking plough.
   *
   * The base walk owns the steps and the handles stay on the posed implement.
   * The overlay acquires both handles and releases them over equal authored
   * intervals, each hand's goal on its handle's actual moving frame by the
   * shared rider hold (`HumanMountRider.hold`, `HumanRideHands`), the same fit
   * the lead and the driving lines use, and both arms laid on one planned
   * course (`courseArmGoal`) so neither changes branch as the handles move.
   *
   * The author gives the total `seconds`; the hands take the handles and let go
   * in `transition` seconds each, together less than `seconds`; no natural
   * value is defined (provisional).
   */
  export const holdHandles: typeof HumanHoldHandlesLaw = HumanHoldHandlesLaw;

  /**
   * How far the trunk leans when a load is pushed, pulled or dragged by its
   * handles, by the load's declared level and the handles' height.
   *
   * The angles are Lett and McGill's (2006, Ergonomics 49:895, figure 9): the
   * peak torso angle, the trunk's lean relative to the hips, of nine men
   * pushing walking forward and pulling walking backward against a cable weight
   * stack, the handle at each one's waist and at each one's shoulder, at three
   * loads. The load levels are theirs: 45.5 N (`light`), 222.5 N (`moderate`,
   * Snook and Ciriello's 1991 acceptable push and pull, which they chose to
   * test) and 400.5 N (`heavy`). Each angle is the mean of the four
   * firefighters' and the five students' bars weighted by the groups' sizes,
   * the bars read off the figure to about half a degree.
   *
   * A push leans forward into the load and a pull leans back away from it, the
   * upper body's centre of mass ahead of the feet for a push and behind them
   * for a pull (the paper's hinge torque). A drag behind the body while walking
   * forward leans forward as a push does, the hands' force on the load pointing
   * the way the body walks, and takes the push's angles. A handle between the
   * waist and the shoulder takes the angle between theirs in proportion; below
   * the waist or above the shoulder keeps the nearer one's, as the study
   * measured no other height.
   */
  export import pushPullLean = pushPullLeanLaw;

  /**
   * The part an operation moves on a prop that articulates, and the drive the
   * operation publishes for it: the hand and the part follow one function of
   * the stroke's progress, the prop posed at the articulation's travel there.
   *
   * The operated contact is the prop's articulation itself (a trigger, a
   * button, a knob) or a contact that rides one of the mechanism's kinds,
   * however far up its chain (a door's lever on its latch on its hinge, a
   * drawer's pull on its slider, `IAutoMovieAffordance.rides`). The stroke
   * moves that articulation from where the performance has it at the
   * operation's start by the mechanism's amount, converting a prior writer's
   * coordinate of that degree through the engine's articulation map, in the
   * articulation's own unit and sign: degrees for a hinge's swing or a knob's
   * turn, metres for a slider's or a button's travel. The hand's goal at a
   * progress is the contact of the prop posed at that travel, so the hand
   * cannot drift from the part; the drive writes the same travel at the same
   * progress.
   */
  export import operateDrive = operateDriveLaw;

  /**
   * Inserting a held prop along a socket's axis: a rammer down a bore, a sword
   * into its scabbard, a magazine into its well, an arrow back into a quiver, a
   * key into a lock.
   *
   * The hand holds the prop as it entered the operation (`StrikingHeld`) and
   * the goal is the prop's working point (`tip`) on the socket's axis: at the
   * socket's mouth when the stroke begins, then pushed in along the axis, the
   * inverse of the socket's outward normal, by `depth`. The prop's line is kept
   * on the axis, so the hand's place and turn follow from the prop's own line
   * as the hand holds it (`StrikingRoll.hand`), and the elbow is placed by the
   * bend search. With `withdraw` the prop is drawn back out over the second
   * half of the stroke along the same axis: the depth at a progress `p` of the
   * stroke is `depth (1 - cos 2 pi p) / 2`, at rest at the mouth, at the bottom
   * and at the mouth again, so the reversal at the bottom has no jump in speed.
   * Without it the depth is `depth p`, and the prop is left home.
   */
  export import operateInsert = operateInsertLaw;

  /**
   * The path of a long tool through one stroke, as a function of the stroke's
   * share: the trailing grip, the tool's line from that grip toward its face,
   * the face's facing, the lead hand's slide along the line from the trailing
   * grip, and how far the stroke reaches toward the work (for the trunk's bow).
   * A swung stroke (`chop`, `side`, `swing`) turns the line in the one plane
   * holding its top and its contact, about that plane's normal, the face facing
   * the way the head travels, so it arrives at the work from the stroke's
   * direction; the lead hand slides down to the trailing hand on the downswing
   * (Freivalds 1986 for a shovel's and an axe's two-hand holds). A dig drives
   * the blade below the ground, levers it, lifts it and swings it toward where
   * the load goes; a rake pulls the tines along the ground toward the performer
   * and lifts them back. Keys between are eased with minimum jerk.
   */
  export import LongToolStroke = LongToolStrokeSource;

  /**
   * The rotation one hand keeps through a keyed contact sequence
   * (`manipulate`): the fingers toward the hand's first site from the body's
   * root, laid across the site's normal, and the palm against the normal. The
   * plan places the hand with it and the fingering reads every digit's tip
   * where it puts it, so both see one hand.
   *
   * @param hold The posture the act is entered with.
   * @param presses The sequence's sites with their hands, in order.
   * @param side The hand.
   * @returns The hand's world rotation from its rest.
   */
  export const manipulateFacing: typeof manipulateFacingLaw =
    manipulateFacingLaw;

  /**
   * The digits of a keyed contact sequence (`manipulate`): each contact's own
   * digit, or the Viterbi path over the five digits of its hand that minimizes
   * the travel of the limiting part over each stroke, accounting for the lift
   * and descent of a reused digit. The wrist stands where the plan places it
   * for that digit's press (`manipulateReach`, in the rotation the hand keeps
   * for the act), so a difference of two such places is the wrist's travel.
   *
   * @param body The body.
   * @param contacts The contacts with their sites.
   * @param sides Each contact's hand.
   * @param rotation Each hand's rotation for the act, from its rest.
   * @returns Each contact's digit.
   */
  export const manipulateFingering: typeof manipulateFingeringLaw =
    manipulateFingeringLaw;

  /**
   * Where the wrist stands for one press of a keyed contact sequence
   * (`manipulate`): the hand turned as the act keeps it, the pressing digit
   * straight, its tip over the site at typing's hover height (`typeText.HOVER`)
   * and advanced along the digit by as much as its swing down to the key's
   * bottom shortens its reach.
   *
   * A straight digit of length r from its first joint, swung down by the hover
   * height and the key's travel d, reaches sqrt(r^2 - d^2) ahead of that joint,
   * not r: a tip placed straight over the key would stop short of it by the
   * difference. The knuckle advances along the digit by r - sqrt(r^2 - d^2),
   * and the press is a swing about the first joint that ends on the key, which
   * the digit's own inverse kinematics then fits.
   *
   * @param body The body.
   * @param side The hand.
   * @param digit The pressing digit, as `manipulate.Finger` names it.
   * @param site The site, world metres.
   * @param normal The site's outward unit normal, world.
   * @param depth The key's travel, metres.
   * @param rotation The hand's world rotation from its rest for the act.
   * @returns The wrist's world point.
   */
  export const manipulateReach: typeof manipulateReachLaw = manipulateReachLaw;

  /**
   * The hand's shape while one digit presses in a keyed contact sequence
   * (`manipulate`): that digit straight, as the flat hand holds it, for its
   * inverse kinematics to take down to its key. Other digits retain their
   * relaxed shape when it clears the key plane by the hover height. Each
   * remaining digit takes a clearing shape or lifts its own tip from the
   * achieved wrist frame.
   *
   * @param body The rig supplying each shaped tip.
   * @param wrist The achieved wrist point, in world metres.
   * @param rotation The achieved wrist rotation.
   * @param site The key top in world metres.
   * @param normal The surface's unit outward normal.
   * @param side The hand.
   * @param digit The pressing digit, as `manipulate.Finger` names it.
   * @returns The digit angles and only the additional goals required for
   *   clearance.
   */
  export const manipulateShape: typeof manipulateShapeLaw = manipulateShapeLaw;

  /**
   * Keyed contact sequences: the digits pressing the sites of a prop one after
   * another, each a row of `manipulate`. Register the ones a film uses
   * (`HumanPerformance.IInput.laws`, `HumanChain.extend`); `manipulate` itself
   * is registered with them.
   *
   * Register the separate write law to trace an authored planar stroke with a
   * held tool.
   */
  export import HumanManipulate = HumanManipulateSource;

  /**
   * The tool strokes as rows: each tool of `useTool` under a name of its own,
   * the held prop, the work site, the hand, the cycles and the manner open.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanToolRows = HumanToolRowsSource;

  /**
   * One-handed tool work from a working base composed from shipped actions :
   * kneeling or crouching at floor level, seated at a bench, or standing. The
   * base is taken first, then `useTool` cycles from it, so the base, the pickup
   * and the tool are fitted, refused and checked as those actions are. The tool
   * is taken up once the base has settled, since a kneeling or seated body
   * rests its free hands as it goes down.
   *
   * The work point's height chooses the base when the author names none: below
   * `FLOOR_REACH` of the stature the performer kneels on one knee, up to
   * `CROUCH_REACH` it crouches, and above it stands (provisional bands between
   * the standing work heights `useTool` already reaches and the floor).
   */
  export import composeHumanToolWork = composeHumanToolWorkLaw;
}
