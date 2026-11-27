import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanHand } from "./IAutoMovieMotionHumanHand";

/**
 * A grasp chosen for what the tool is taken up for, and not only for the reach:
 * the use names the tool's working point and how the tool's line, from its
 * handle to that point, lies to the forearm when it is presented.
 *
 * A handle can be wrapped from any side, and the side a hanging arm reaches
 * most easily leaves a blade or a barrel where the wrist cannot later aim it.
 * So a grasp taken for a use must also hold in one more key pose of the grasp's
 * choice (`HumanGrasp.reachable`): the tool presented ahead of the shoulder on
 * the line of its use.
 */
export namespace IAutoMovieMotionHumanGraspUse {
  /** The use a tool is taken up for. */
  export interface IUse {
    /**
     * The affordance id of the tool's working point: a blade's point, a muzzle,
     * a hammer's face. The tool's line runs from the handle to it.
     */
    tip: string;

    /**
     * How the tool's line lies to the forearm when it is presented: `forearm`
     * continues it, as a pistol's bore and a thrusting point do; `oblique`
     * rises 45 degrees from it, a sabre grip across the palm; `square` stands
     * upright on it, a hammer grip; `across` runs level across the body toward
     * the other hand, as a camera or a bar held in both hands lies, whatever
     * the place; `along` lays the tool along the surface of its place with the
     * working point's own face on it, as a razor lies on the jaw or a comb on
     * the scalp, its way along the surface the hand's own (a place on the body
     * only); `worn` puts the thing on that place as it is worn
     * (`HumanWorn.frame`), the whole frame of its `wear` socket on the region,
     * as a hat goes on the crown or spectacles on the nose (a region only).
     */
    line: "forearm" | "oblique" | "square" | "across" | "along" | "worn";

    /**
     * For a thing `worn` round about the region's normal, as a hat about the
     * crown, that its turn about it is free: the grasp holds at whichever turn
     * suits it; spectacles are not, and stay facing the body's way. False when
     * absent.
     */
    round?: boolean;

    /**
     * Where the tool is used, which is where the grasp must also hold: `ahead`
     * presents it ahead of the shoulder, as a blade or a barrel is aimed;
     * `mouth` brings its working point to the performer's own mouth, as a
     * vessel's lip is drunk from; a `region` brings it to that named region of
     * the performer's own body, as a razor's edge is laid on the jaw or a comb
     * on the scalp. `ahead` when absent. At the mouth or a region the level
     * part of the line runs from the hand back into the body (a cigarette's or
     * a spoon's `forearm` line points at the lips), and `square` stays
     * upright.
     */
    at?:
      | "ahead"
      | "mouth"
      | {
          /** Body region toward which the held tool's active end is presented. */
          region: AutoMovieHumanoidRegion;
        };
  }

  /**
   * The pose a tool is presented in for its use, as a key the grasp must also
   * hold: the grip at the place a law presents it (`place`), and the hand
   * turned so that the tool's line lies on the line the use names, in the plane
   * the body faces. Input props of HumanGraspUse.presented. The action's
   * context, the prop and its handle, the hand, the hand the arm shows for the
   * candidate grasp, the use, and how far the closed hand at a wrist keeps out
   * of the body's other parts, metres, negative inside (every roll alike when
   * absent).
   */
  export type IPresentedProps = {
    /**
     * Borrowed action body, entry, prop resolver and performance start used to
     * solve presentation.
     */
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "body" | "entry" | "prop" | "start"
    >;
    /** Scene subject id of the held prop. */
    prop: string;
    /** Affordance id identifying its grasp handle. */
    handle: string;
    /** Hand holding and presenting the tool. */
    side: AutoMovieHumanSide;
    /** Initial wrist's world position and unit rotation. */
    wrist: IAutoMovieMotionHumanHand.IWrist;
    /** Tool-use orientation and target region to satisfy. */
    use: IAutoMovieMotionHumanGraspUse.IUse;
    /**
     * Optional synchronous clearance in METRES, negative inside another body
     * part. Presentation reads the fitted/displayed wrist; its worn-tool branch
     * reads the candidate wrist. Both subtract min(0, clear), penalising
     * penetration without rewarding positive clearance, and cache each distinct
     * roll/turn. Omitted adds no clearance penalty. Called during the search,
     * not by the returned key's judge; returned closures may retain the
     * containing props record. Exceptions propagate.
     */
    clear?: (wrist: IAutoMovieMotionHumanHand.IWrist) => number;
  };
}
