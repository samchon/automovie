import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Martial-art forms other than kickboxing: the karate horse stance
 * (kiba-dachi), alternating straight punches from it (choku-zuki) and the tai
 * chi push in a bow stance.
 *
 * - Horse stance: the left foot steps out until the feet stand two shoulder
 *   widths apart (provisional) and the hips sink a fifth of the thigh
 *   (provisional), held, and the foot steps back.
 * - Choku-zuki: from the horse stance, each fist drives from its chamber at the
 *   hip (waist height, at the shoulder's side) to the midline at chest height
 *   an arm's reach ahead, the other fist pulled back to its chamber at the same
 *   time (hikite). Each punch extends in 0.2 s and stays 0.2 s, inside the 400
 *   ms a choku-zuki takes (VencesBrito et al. 2011); the hands alternate.
 * - Tai chi push: the lead foot steps ahead 0.35 statures (provisional) over 3 s
 *   as the hips come half the step forward and sink until both legs reach their
 *   feet; over 3 s more the weight shifts to six tenths of the step as the
 *   palms push from before the chest to an arm's reach ahead, then shifts back
 *   over 3 s, and the foot returns over 3 s: the slow, continuous form of tai
 *   chi (Wu and Hitt 2005).
 *
 * Karate and tai chi also have separate linked stance phrases. The karate
 * phrase moves between front and back stances with paired chamber and arm
 * placement. The tai chi phrase carries both open hands through gradual forward
 * and backward weight transfers. The taekwondo reset turns a bladed, upright
 * stance under a low sparring guard, and the Muay Thai reset keeps a square,
 * lower stance under a high guard. The capoeira ginga steps one foot back
 * behind the other, low, under a high guard, so alternating leads trace its
 * triangle; the sumo shiko raises the foot high to the side and stamps it down
 * into a wide, deep stance; the wing chun stance takes a short step under the
 * centreline guard, both hands forward on the midline. All return to the entry
 * and have no partner or contact target.
 */
export namespace IAutoMovieMotionHumanMartialArt {
  /** Parameters. */
  export interface IParams {
    /** The named form or unpartnered screen reset. */
    kind: IAutoMovieMotionHumanMartialArt.Kind;

    /**
     * Punches of a choku-zuki series, a whole number of at least 1; 4 when
     * absent. Each punch extends in 0.2 s and stays 0.2 s (`martialArt`).
     */
    count?: number;

    /** Seconds the stance is held, at least 0; 1 when absent. */
    hold?: number;

    /** Leading foot of a linked stance phrase or reset. Left when absent. */
    lead?: "left" | "right";

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** Named techniques and linked solo forms from a quiet standing pose. */
  export type Kind =
    | "horseStance"
    | "chokuZuki"
    | "taiChiPush"
    | "karateStanceTransfer"
    | "taiChiTransfer"
    | "taekwondoStanceReset"
    | "muayThaiStanceReset"
    | "capoeiraGinga"
    | "sumoShiko"
    | "wingChunStance";
}
