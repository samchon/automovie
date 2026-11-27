import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Interpersonal distance: the gaps people keep, by relationship and purpose, as
 * the chest-to-target gap an approach stops at.
 *
 * Hall (1966, The Hidden Dimension) divides the space around a person into
 * zones by the interaction they afford, each with a close and a far phase:
 * intimate under 0.45 m, personal 0.45 to 1.2 m (close 0.45 to 0.75, far 0.75
 * to 1.2), social 1.2 to 3.6 m (close 1.2 to 2.1) and public beyond. The named
 * gaps here sit inside those zones:
 *
 * - `intimate` 0.3 m, the middle of the intimate far phase (0.15 to 0.45);
 * - `faceToFace` 0.6 m, the middle of the personal close phase, where two people
 *   stand squared up within arm's reach;
 * - `personal` 1.0 m, the far phase where conversation between acquaintances
 *   happens (Hall; Hayduk 1978, Psychol Bull 85:117, reviews measured
 *   comfortable distances of the same order, larger in front than behind);
 * - `fighting` 1.5 m, the middle of the 1.01 to 2.00 m two taekwondo fighters
 *   keep for 60 % of a fight (Maloney, Renshaw and Farrow 2021, Int J Perf Anal
 *   Sport 21:993), the kicking sport measured; a kickboxing or karate bout
 *   takes it, where `faceToFace` lies inside a punch's reach;
 * - `social` 1.6 m, the middle of the social close phase, impersonal business;
 * - `handing`: the gap at which both people's hands meet midway between their
 *   chests with the elbows flexed 35 degrees, the middle of the 20 to 50
 *   degrees the campaign assumes for a comfortable handover (provisional:
 *   Kopnarski et al. 2023 report where a handover happens, not at what
 *   distance), at the handover height midway between the two waists and chests
 *   (provisional).
 *
 * A gap is horizontal, measured from the front of the performer's chest (the
 * sternum region) to the target point: another person's sternum, a prop's point
 * or a free point.
 */
export namespace IAutoMovieMotionHumanProxemics {
  /** The gap of a request between two people. A named gap. */
  export type Band =
    /** 0.3 m (`HumanProxemics.GAPS`): an embrace, a whisper. */
    | "intimate"
    /**
     * 0.6 m: squared up within arm's reach; a confrontation, not a fight: a
     * striking bout keeps the `fighting` gap.
     */
    | "faceToFace"
    /** 1.0 m: acquaintances talking; out of arm's reach. */
    | "personal"
    /**
     * 1.5 m: two striking fighters squared off, out of punching reach and a
     * step from a kick (`HumanProxemics.GAPS`; Maloney, Renshaw and Farrow
     * 2021).
     */
    | "fighting"
    /** 1.6 m: impersonal business, a follower's distance. */
    | "social"
    /**
     * The gap where both people's hands meet midway with the elbows bent 35
     * degrees (`HumanProxemics.HANDING_ELBOW`); it follows the arm length.
     */
    | "handing";

  /**
   * Where to stop: the floor point for the feet's midpoint so the front of the
   * chest is `gap` short of the target along the line from the start. Result
   * returned by HumanProxemics.stop. The stop point on the floor and the
   * heading to face, degrees.
   */
  export type IStopResult = {
    /**
     * Stopped feet-midpoint position on the world floor, metres; it is the
     * floor location used to place the body.
     */
    at: IAutoMovieVector3;
    /** Stopped body heading in degrees about world +Y. */
    yaw: number;
  };
}
