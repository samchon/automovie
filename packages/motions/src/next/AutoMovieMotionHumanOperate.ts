import { AutoMovieMotionHumanOperateHelpers } from "./internal/AutoMovieMotionHumanOperateHelpers";
import { AutoMovieMotionHumanOperateLaws } from "./internal/AutoMovieMotionHumanOperateLaws";

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
   * Operating an articulated thing with one hand while standing. See
   * `AutoMovieMotionHumanOperateLaws.operate`.
   */
  export import operate = AutoMovieMotionHumanOperateLaws.operate;

  /**
   * A registered, stationary-base pour. See
   * `AutoMovieMotionHumanOperateLaws.pour`.
   */
  export import pour = AutoMovieMotionHumanOperateLaws.pour;

  /** A keyed contact sequence. See `AutoMovieMotionHumanOperateLaws.manipulate`. */
  export import manipulate = AutoMovieMotionHumanOperateLaws.manipulate;

  /**
   * Work a prop the hand already holds without letting go. See
   * `AutoMovieMotionHumanOperateLaws.workHeld`.
   */
  export import workHeld = AutoMovieMotionHumanOperateLaws.workHeld;

  /**
   * Working with a one-handed tool held in the hand, in cycles over a work
   * point while standing. See `AutoMovieMotionHumanOperateLaws.useTool`.
   */
  export import useTool = AutoMovieMotionHumanOperateLaws.useTool;

  /**
   * Work with a long tool in two hands, standing, in cycles at a work point
   * (`IAutoMovieMotionHumanLongTool`). See
   * `AutoMovieMotionHumanOperateLaws.longTool`.
   */
  export import longTool = AutoMovieMotionHumanOperateLaws.longTool;

  /**
   * Typing a text on a keyboard from the posture the performer is in (seated at
   * a desk, or standing at a counter), pressing each key with an index
   * fingertip. See `AutoMovieMotionHumanOperateLaws.typeText`.
   */
  export import typeText = AutoMovieMotionHumanOperateLaws.typeText;

  /**
   * Wiping a table, counter or other level surface with the flat palm in
   * circles, standing before it. See `AutoMovieMotionHumanOperateLaws.wipe`.
   */
  export import wipe = AutoMovieMotionHumanOperateLaws.wipe;

  /**
   * A heavy load that is not carried moved by its two handles. See
   * `AutoMovieMotionHumanOperateLaws.pushPull`.
   */
  export import pushPull = AutoMovieMotionHumanOperateLaws.pushPull;

  /**
   * A pushed load's handles held in both hands through a walk. See
   * `AutoMovieMotionHumanOperateLaws.pushSled`.
   */
  export import pushSled = AutoMovieMotionHumanOperateLaws.pushSled;

  /**
   * Draw up a clay wall on a turning wheel with both hands. See
   * `AutoMovieMotionHumanOperateHelpers.throwPottery`.
   */
  export import throwPottery = AutoMovieMotionHumanOperateHelpers.throwPottery;

  /**
   * One fingertip reaches a named touchscreen, swipes in its local X direction
   * and withdraws. See `AutoMovieMotionHumanOperateHelpers.swipeTouchscreen`.
   */
  export import swipeTouchscreen = AutoMovieMotionHumanOperateHelpers.swipeTouchscreen;

  /**
   * Move the working point of a held tool along an authored planar stroke. See
   * `AutoMovieMotionHumanOperateHelpers.write`.
   */
  export import write = AutoMovieMotionHumanOperateHelpers.write;

  /**
   * Brace a fixed garment's rim with the index finger while the opposite thumb
   * pushes its button through the opening. See
   * `AutoMovieMotionHumanOperateHelpers.button`.
   */
  export import button = AutoMovieMotionHumanOperateHelpers.button;

  /**
   * Brace a supported pouch and pinch its slider tab through a straight stroke.
   * See `AutoMovieMotionHumanOperateHelpers.zip`.
   */
  export import zip = AutoMovieMotionHumanOperateHelpers.zip;

  /** Set the hook. See `AutoMovieMotionHumanOperateHelpers.hookSet`. */
  export import hookSet = AutoMovieMotionHumanOperateHelpers.hookSet;

  /**
   * Keep both of a walker's hands on a moving implement's two handles, as a
   * ploughman holds a walking plough. See
   * `AutoMovieMotionHumanOperateHelpers.holdHandles`.
   */
  export import holdHandles = AutoMovieMotionHumanOperateHelpers.holdHandles;

  /**
   * How far the trunk leans when a load is pushed, pulled or dragged by its
   * handles, by the load's declared level and the handles' height. See
   * `AutoMovieMotionHumanOperateHelpers.pushPullLean`.
   */
  export import pushPullLean = AutoMovieMotionHumanOperateHelpers.pushPullLean;

  /**
   * The part an operation moves on a prop that articulates, and the drive the
   * operation publishes for it. See
   * `AutoMovieMotionHumanOperateHelpers.operateDrive`.
   */
  export import operateDrive = AutoMovieMotionHumanOperateHelpers.operateDrive;

  /**
   * Inserting a held prop along a socket's axis. See
   * `AutoMovieMotionHumanOperateHelpers.operateInsert`.
   */
  export import operateInsert = AutoMovieMotionHumanOperateHelpers.operateInsert;

  /**
   * The path of a long tool through one stroke, as a function of the stroke's
   * share. See `AutoMovieMotionHumanOperateHelpers.LongToolStroke`.
   */
  export import LongToolStroke = AutoMovieMotionHumanOperateHelpers.LongToolStroke;

  /**
   * The rotation one hand keeps through a keyed contact sequence
   * (`manipulate`). See `AutoMovieMotionHumanOperateHelpers.manipulateFacing`.
   */
  export import manipulateFacing = AutoMovieMotionHumanOperateHelpers.manipulateFacing;

  /**
   * The digits of a keyed contact sequence (`manipulate`). See
   * `AutoMovieMotionHumanOperateHelpers.manipulateFingering`.
   */
  export import manipulateFingering = AutoMovieMotionHumanOperateHelpers.manipulateFingering;

  /**
   * Where the wrist stands for one press of a keyed contact sequence
   * (`manipulate`). See `AutoMovieMotionHumanOperateHelpers.manipulateReach`.
   */
  export import manipulateReach = AutoMovieMotionHumanOperateHelpers.manipulateReach;

  /**
   * The hand's shape while one digit presses in a keyed contact sequence
   * (`manipulate`). See `AutoMovieMotionHumanOperateHelpers.manipulateShape`.
   */
  export import manipulateShape = AutoMovieMotionHumanOperateHelpers.manipulateShape;

  /**
   * Keyed contact sequences. See
   * `AutoMovieMotionHumanOperateHelpers.HumanManipulate`.
   */
  export import HumanManipulate = AutoMovieMotionHumanOperateHelpers.HumanManipulate;

  /**
   * The tool strokes as rows. See
   * `AutoMovieMotionHumanOperateHelpers.HumanToolRows`.
   */
  export import HumanToolRows = AutoMovieMotionHumanOperateHelpers.HumanToolRows;

  /**
   * One-handed tool work from a working base composed from shipped actions .
   * See `AutoMovieMotionHumanOperateHelpers.composeHumanToolWork`.
   */
  export import composeHumanToolWork = AutoMovieMotionHumanOperateHelpers.composeHumanToolWork;
}
