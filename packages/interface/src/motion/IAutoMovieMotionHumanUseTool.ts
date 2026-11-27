import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanToolWork } from "./IAutoMovieMotionHumanToolWork";

/**
 * Working with a one-handed tool held in the hand, in cycles over a work point
 * while standing: hammering, sawing, stirring or turning a screwdriver.
 *
 * The tool is the prop the hand holds (`prop`, taken up before, as `pickUp`
 * does), rigid in the hand from the instant its grip closed, so its working
 * point is its own `face` contact at a fixed offset in the hand's frame
 * (`AutoMovieMotionHumanHeld`), and the goal is that point on the work, the
 * hand following from it. The tool's line runs from its `grip` to its `face`
 * (`createTool`'s contacts). The work fixes that line (a hammer's level at the
 * strike, a spoon's upright, a screwdriver's along the heading, a saw's sloping
 * down to the cut), and the hand turns the least that lays the held tool on it:
 * a hammer's face and a saw's teeth turned down onto the work, a screwdriver
 * and a spoon with the palm inward, as a saw and a screwdriver run on with the
 * forearm. The saw's slope is the one of `SLOPES` the arm holds with the least
 * strain ({@link AutoMovieMotionHumanBend.strain}). A hammer turns about the
 * wrist up to `RAISE` degrees and strikes back down onto the work point once a
 * cycle; a saw pushes and pulls its teeth along its line over the work point by
 * a stroke of half the forearm; a spoon circles inside the vessel it stirs
 * (`HumanToolWork`); a screwdriver turns about its own axis into the work, the
 * forearm's pronation and supination of 60 degrees each way (inside the
 * functional forearm rotation of Giachino, Benoit and Heaney 2015, J Wrist Surg
 * 4). The hand reaches the working pose in the aimed movement time (McIntosh et
 * al. 2018), works `cycles` cycles of `PERIODS` seconds (provisional), and
 * returns, its fingers kept closed on the tool as the grip left them. Experts
 * vary amplitude less (Bril et al. 2010, J Exp Psychol Hum Percept Perform
 * 36:825); the seeded variation is not drawn yet. Events: `ready`, per cycle
 * `contact<n>` (the strike, the stroke's middle, the circle's nearest point,
 * the turn's end), and `recover`.
 *
 * The plan carries the tool's working point in the hand (`IPlan.tool`), so a
 * capture reads it from the displayed hand; the tool stays held after.
 *
 * Not yet: two-handed tools (shovel, broom, mop), kneeling or seated work,
 * fatigue (Cote et al. 2002, 2005).
 */
export namespace IAutoMovieMotionHumanUseTool {
  /** Parameters. */
  export interface IParams {
    /** The work: hammering, sawing, stirring or driving a screw. */
    tool: IAutoMovieMotionHumanToolWork.Kind;

    /**
     * The held tool's prop subject, in `hand` since a pick-up: its `face`
     * contact is the working point and its line runs from its `grip` to its
     * `face`.
     */
    prop: string;

    /**
     * The work point: a nail, a cut line's middle, a screw; for a stir, the
     * vessel's `inside` (`{ kind: "prop", subject, point: "inside" }`), whose
     * `rim` bounds the circle.
     */
    on: IAutoMovieMotionTarget;

    /**
     * The working hand; the hand that holds `prop` when absent, `right` if both
     * or neither do.
     */
    hand?: AutoMovieHumanSide;

    /** How many cycles, a whole number of at least 1; 4 when absent. */
    count?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * A tool's plan: the working point's offset in the hand's frame and the work
   * point.
   */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /** The tool. */
    tool: {
      /** The working point from the grip socket, in the hand's frame, metres. */
      offset: IAutoMovieVector3;

      /** The work point, world metres. */
      on: IAutoMovieVector3;

      /** The work. */
      kind: IAutoMovieMotionHumanToolWork.Kind;
    };

    /** The same tool, offered by the tool's family. */
    offers: IAutoMovieMotionHumanActionPlan.ITooled;
  }
}
