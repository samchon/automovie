import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanOperateInsert } from "./IAutoMovieMotionHumanOperateInsert";
import type { IAutoMovieMotionHumanPour } from "./IAutoMovieMotionHumanPour";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanSwipeTouchscreen } from "./IAutoMovieMotionHumanSwipeTouchscreen";
import type { IAutoMovieMotionHumanTypeText } from "./IAutoMovieMotionHumanTypeText";
import type { IAutoMovieMotionHumanButton } from "./IAutoMovieMotionHumanButton";
import type { IAutoMovieMotionHumanHeldWork } from "./IAutoMovieMotionHumanHeldWork";
import type { IAutoMovieMotionHumanManipulate } from "./IAutoMovieMotionHumanManipulate";
import type { IAutoMovieMotionHumanPushPull } from "./IAutoMovieMotionHumanPushPull";
import type { IAutoMovieMotionHumanPushSled } from "./IAutoMovieMotionHumanPushSled";
import type { IAutoMovieMotionHumanThrowPottery } from "./IAutoMovieMotionHumanThrowPottery";
import type { IAutoMovieMotionHumanWrite } from "./IAutoMovieMotionHumanWrite";
import type { IAutoMovieMotionHumanZip } from "./IAutoMovieMotionHumanZip";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanHoldHandles } from "./IAutoMovieMotionHumanHoldHandles";
import type { IAutoMovieMotionHumanHookSet } from "./IAutoMovieMotionHumanHookSet";
import type { IAutoMovieMotionHumanLongTool } from "./IAutoMovieMotionHumanLongTool";
import type { IAutoMovieMotionHumanUseTool } from "./IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "./IAutoMovieMotionHumanWipe";

/**
 * Working an object or a device by hand: a control, a pour, a tool, writing or
 * typing, and pushing or pulling a load.
 *
 * A method here is a method of `AutoMovieMotionHumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanOperate` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanOperate<Chain> {
  /**
   * Operating an articulated thing with one hand while standing: pressing a
   * button along its axis, turning a knob about its axis, pulling or pushing a
   * drawer along its slide, or swinging a hinged door by its handle.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the parts it moves, seated or while another action carries the
   * body; it can be cut into `stand` and `walk` from its `relax` instant.
   *
   * @param params The `balance`, `kind`, `hand` and `manner` of
   *   `IAutoMovieMotionHumanOperate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  operate(params: IAutoMovieMotionHumanOperate.IParams, anchor?: string): Chain;

  /**
   * Pour a liquid between two rigid props: the source is tilted over the target
   * until the transferred volume has left it, then righted.
   *
   * Registered law: `registered("pour", params)`; not a chain method.
   *
   * @param params The `source`, `target`, `hand`, `tilt`, `gap`, `timing`,
   *   `sourceMl`, `targetMl`, `capacityMl` and `transferMl` of
   *   `IAutoMovieMotionHumanPour.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  pour(params: IAutoMovieMotionHumanPour.IParams, anchor?: string): Chain;

  /**
   * A keyed contact sequence: digits of one hand or both pressing sites of a
   * prop one after another, timed by the caller or by skill.
   *
   * Registered law: `registered("manipulate", params)`; not a chain method.
   *
   * @param params The `prop`, `contacts`, `text`, `side` and `digit` of
   *   `IAutoMovieMotionHumanManipulate.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  manipulate(
    params: IAutoMovieMotionHumanManipulate.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Working a prop the hand already holds: its fingers drive the prop's own
   * articulations (scissor blades closed by the rings, a folding knife's blade
   * swung open, a chopstick pinched), the hand may carry it to a place before
   * the body (a tray raised on the palm, an umbrella over the head), and the
   * prop may take another prop onto one of its sockets (a morsel pinched
   * between chopstick tips).
   *
   * Registered law: `registered("workHeld", params)`; not a chain method.
   *
   * @param params The `prop`, `hand`, `drive`, `at`, `take`, `push` and
   *   `duration` of `IAutoMovieMotionHumanHeldWork.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  workHeld(
    params: IAutoMovieMotionHumanHeldWork.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Working with a one-handed tool held in the hand, in cycles over a work
   * point while standing: hammering, sawing, stirring or turning a
   * screwdriver.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the parts it moves; it can be cut into `stand` and `putDown`
   * from its `recover` instant.
   *
   * @param params The `tool`, `prop`, `on`, `hand`, `count` and `manner` of
   *   `IAutoMovieMotionHumanUseTool.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  useTool(params: IAutoMovieMotionHumanUseTool.IParams, anchor?: string): Chain;

  /**
   * Work with a long tool held in two hands, standing, in cycles at a work
   * point: chopping and splitting with an axe, a side chop at a standing trunk,
   * a sledgehammer or pickaxe swung at the ground, digging and throwing with a
   * shovel, and raking.
   *
   * Registered law: `registered("longTool", params)`; not a chain method.
   *
   * @param params The `stroke`, `prop`, `at`, `to`, `hand` and `count` of
   *   `IAutoMovieMotionHumanLongTool.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  longTool(
    params: IAutoMovieMotionHumanLongTool.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Typing a text on a keyboard from the posture the performer is in (seated at
   * a desk, or standing at a counter), pressing each key with an index
   * fingertip.
   *
   * @param params The `keyboard` and `text` of
   *   `IAutoMovieMotionHumanTypeText.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  typeText(
    params: IAutoMovieMotionHumanTypeText.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Wiping a table, counter or other level surface with the flat palm in
   * circles, standing before it: a household task that the composed laws
   * lacked, the palm's circling stroke on a work surface.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the parts it moves; it can be cut into `stand` and `walk` from
   * its `relax` instant.
   *
   * @param params The `balance`, `on`, `hand`, `count` and `manner` of
   *   `IAutoMovieMotionHumanWipe.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  wipe(params: IAutoMovieMotionHumanWipe.IParams, anchor?: string): Chain;

  /**
   * A heavy load that is not carried moved by its two handles: a crate, a
   * wardrobe or a car pushed ahead walking forward, pulled toward the body
   * walking backward, or a sack dragged behind walking forward; or pushed and
   * pulled at and not moved at all, the scene where force is shown and nothing
   * moves.
   *
   * @param params The `prop`, `way`, `to`, `left`, `right`, `load`, `moves` and
   *   `duration` of `IAutoMovieMotionHumanPushPull.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  pushPull(
    params: IAutoMovieMotionHumanPushPull.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A pushed load's handles held in both hands through a walk: a sled push.
   *
   * Registered law: `registered("pushSled", params)`; not a chain method.
   *
   * @param params The `sled`, `to`, `left`, `right`, `lean`, `incline`,
   *   `facing`, `duration` and `moves` of
   *   `IAutoMovieMotionHumanPushSled.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  pushSled(
    params: IAutoMovieMotionHumanPushSled.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Throwing pottery: seated at a wheel, both hands keep contact with the clay
   * wall, one inside and one outside, while the wheel head turns and the wall
   * is drawn up.
   *
   * Registered law: `registered("throwPottery", params)`; not a chain method.
   *
   * @param params The `wheel`, `rise`, `rpm` and `duration` of
   *   `IAutoMovieMotionHumanThrowPottery.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  throwPottery(
    params: IAutoMovieMotionHumanThrowPottery.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A one-finger swipe along the local X axis of a stationary screen, centred
   * in its depth.
   *
   * Registered law: `registered("swipeTouchscreen", params)`; not a chain
   * method.
   *
   * @param params The `prop`, `screen`, `from`, `to`, `hand` and `duration` of
   *   `IAutoMovieMotionHumanSwipeTouchscreen`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  swipeTouchscreen(
    params: IAutoMovieMotionHumanSwipeTouchscreen,
    anchor?: string,
  ): Chain;

  /**
   * One stroke by a tool the performer already holds, traced on a fixed prop's
   * surface through authored planar points.
   *
   * Registered law: `registered("write", params)`; not a chain method.
   *
   * @param params The `tool`, `tip`, `on`, `surface`, `stroke`, `duration`,
   *   `hand`, `steady`, `drive`, `take`, `leave` and `release` of
   *   `IAutoMovieMotionHumanWrite`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  write(params: IAutoMovieMotionHumanWrite, anchor?: string): Chain;

  /**
   * Pushing a button through the rectangular clear opening of a fixed garment
   * prop, on a rigid straight slider.
   *
   * Registered law: `registered("button", params)`; not a chain method.
   *
   * @param params The `garment`, `opening`, `rim`, `button`, `contact`,
   *   `travel`, `radius`, `thickness`, `duration` and `hand` of
   *   `IAutoMovieMotionHumanButton`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  button(params: IAutoMovieMotionHumanButton, anchor?: string): Chain;

  /**
   * Opening or closing a straight closed-end zipper on a supported stationary
   * pouch.
   *
   * Registered law: `registered("zip", params)`; not a chain method.
   *
   * @param params The `pouch`, `thumb`, `index`, `brace`, `travel`, `duration`
   *   and `hand` of `IAutoMovieMotionHumanZip`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  zip(params: IAutoMovieMotionHumanZip, anchor?: string): Chain;

  /**
   * Setting the hook: the hand holding a fishing rod lifts its tip sharply by
   * an angle in a set time, turning the rod about the grip.
   *
   * Registered law: `registered("hookSet", params)`; not a chain method.
   *
   * @param params The `rod`, `angle`, `duration` and `hand` of
   *   `IAutoMovieMotionHumanHookSet`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  hookSet(params: IAutoMovieMotionHumanHookSet, anchor?: string): Chain;

  /**
   * Walking behind an implement with both hands on its two handles, as a
   * ploughman holds a walking plough, as an arms overlay over an authored
   * walk.
   *
   * Registered law: `registered("holdHandles", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims both arms and hands and needs a carrier that owns the walker's
   * steps.
   *
   * @param params The implement `on`, its `left` and `right` handles,
   *   `duration` and `transition` of `IAutoMovieMotionHumanHoldHandles`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  holdHandles(params: IAutoMovieMotionHumanHoldHandles, anchor?: string): Chain;
}

/**
 * Operating an articulated thing with one hand while standing: pressing a
 * button along its axis, turning a knob about its axis, pulling or pushing a
 * drawer along its slide, or swinging a hinged door by its handle.
 *
 * The goal is the hand on the thing's moving part, and the part's motion is the
 * mechanism's own: a button's face goes in along its axis, a knob turns about
 * its axis, a slider's handle travels along its axis, a leaf's handle turns
 * about its hinge line: a door's vertical line through the point it names, or
 * the prop's own hinge axis (a cock's cross pin, `operateDrive.hinge`). The
 * hand is shaped to the part (the index fingertip on a button, a closed grip on
 * a knob, a drawer handle or a door handle) and laid on it by
 * `AutoMovieMotionHumanTarget.hand`. A part on an upright face is grasped with
 * the hand along the face's normal: a handle overhand, the palm on its top; a
 * knob with that grasp rolled about the axis, and the hand rolls with the knob
 * as it turns, the forearm's pronation and supination (Magermans et al. 2005,
 * Clin Biomech 20:591, give the ranges daily tasks use), the grip starting half
 * the turn before the forearm's neutral so the turn is centred in that range. A
 * lid's knob, its axis nearer the vertical than `UPRIGHT`, takes the palm from
 * above. Each part's place is a target, so it can be a prop's point; the part's
 * outward normal is its axis. A part beyond the standing arm is leaned into
 * (`AutoMovieMotionHumanLeanInto`): the trunk tips about the hips by the least
 * pitch that keeps the wrist within `REACH` of the arm's length and straightens
 * as the part comes nearer (a drawer pulled out); a part still out of reach at
 * the lean's limit is refused, since it is walked up to first.
 *
 * The action is one arm phrase (`AutoMovieMotionHumanArm.stroke`): the hand
 * reaches the part by `ready` in the aimed movement time to its width (McIntosh
 * et al. 2018), waits a brief moment for the grip, moves the part from
 * `strokeStart` to `strokeEnd` at the mechanism's pace (`operate.PACE`,
 * provisional): a button's press in 0.25 s, a knob at 180 degrees a second, a
 * slider at 0.4 m/s and a door's handle at 0.6 m/s along its arc, so a door
 * opened through 90 degrees by a handle 0.8 m from the hinge takes about 2.1 s;
 * holds it until `relax`, and returns to where it hung. Events: the phrase's
 * `ready` (contact or grip closed), `strokeStart`, `stroke`, `strokeEnd`
 * (bottom out, travel end, swing end) and `relax` (release).
 *
 * On a prop that articulates (`IAutoMovieMotionHumanProp.articulate`), the
 * operated contact names the articulation it is or rides, the amount is that
 * articulation's travel in its own unit and sign, the hand follows the contact
 * of the prop posed at the travel the stroke has reached, and the plan drives
 * the articulation by the same function (`operateDrive`,
 * `IAutoMovieMotionHumanActionPlan.drives`), so the door stays open after the
 * hand lets go and the hand cannot drift off the handle. The `insert` mechanism
 * moves a held prop's working point along a socket's axis instead
 * (`operateInsert`).
 *
 * Not yet: the A8 affordance kinds (`hinge`, `slider`, `knob`, `button`) in the
 * interface, which the core owns, so the mechanism is stated here; the body
 * stepping round a door and walking through it; two-handed or power grips;
 * pouring from a held container about its lip.
 */
export namespace IAutoMovieMotionHumanOperate {
  /** Parameters. */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** What is operated. */
    kind: IAutoMovieMotionHumanOperate.Mechanism;

    /** The hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** An articulated part and how it moves. */
  export type Mechanism =
    | {
        /** A push button or switch pressed along its axis. */
        kind: "button";
        /** The button's face, its normal pointing out. */
        at: IAutoMovieMotionTarget;
        /** How far it goes in, metres; 0.005 when absent. */
        travel?: number;
      }
    | {
        /** A knob, lid, tap or dial turned about its axis. */
        kind: "knob";
        /** The knob's centre, its normal along the axis toward the hand. */
        at: IAutoMovieMotionTarget;
        /** How far it turns, degrees; positive clockwise as the hand sees it. */
        turn: number;
      }
    | {
        /** A drawer or slider moved along its axis. */
        kind: "slider";
        /** The handle, its normal along the slide toward the hand. */
        at: IAutoMovieMotionTarget;
        /** How far it travels, metres; positive pulls toward the hand. */
        travel: number;
      }
    | {
        /**
         * A leaf swung about its hinge line by its handle: a door, a lid, a
         * gun's cock.
         */
        kind: "hinge";
        /** The handle, its normal out of the leaf toward the hand. */
        at: IAutoMovieMotionTarget;
        /**
         * A point on a vertical hinge line, a door's. Absent, the line is the
         * operated prop's own hinge articulation
         * (`IAutoMovieMotionHumanOperateDrive.IPart.line`): its point and its
         * `+Y` axis, however it lies, a cock's cross pin.
         */
        hinge?: IAutoMovieMotionTarget;
        /** How far the leaf swings, degrees; positive pulls it toward the hand. */
        swing: number;
      }
    | IAutoMovieMotionHumanOperateInsert.IMechanism;
}
