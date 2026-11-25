import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionMeeting } from "../compose/IAutoMovieMotionMeeting";
import type { IAutoMovieMotionHumanArmWrestle } from "../touch/IAutoMovieMotionHumanArmWrestle";

/**
 * Things two people do together or to each other in company, as rows of shipped
 * actions and as mutual records over them (`HumanChain.mutual`). Register the
 * rows a film uses.
 */
export namespace IAutoMovieMotionHumanSocial {
  /** The shared parameters of `toast`. */
  export interface IToast {
    /** Each role's held glass, by its prop id; mimed with fists when absent. */
    glasses?: Record<"host" | "guest", string>;

    /** Film seconds the clink is held over. */
    window?: IAutoMovieMotionMeeting.IWindow;
  }

  /** The shared parameters of `armWrestle`. */
  export interface IArmWrestle {
    /** The table's point the hands meet over, world metres. */
    table: IAutoMovieVector3;

    /** Finite elbow pads keyed by the role each receives. */
    pads?: Partial<
      Record<
        "one" | "other",
        NonNullable<IAutoMovieMotionHumanArmWrestle.IParams["pad"]>
      >
    >;

    /** The role that pins the other. */
    winner: "one" | "other";

    /** Seconds of struggle; 3 when absent. */
    seconds?: number;

    /**
     * The forearms' angle from upright at the pin, degrees; the law's own when
     * absent.
     */
    pin?: number;
  }

  /** The shared parameters of `toastOfFour`. */
  export interface IToastOfFour {
    /** Each role's held glass, by its prop id; mimed with fists when absent. */
    glasses?: Record<"host" | "guest" | "third" | "fourth", string>;

    /** The one world point all four glasses come to, metres. */
    at?: IAutoMovieVector3;
  }
}
