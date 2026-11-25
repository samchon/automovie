import { minimumJerk } from "@automovie/engine";

/**
 * A sitting-volleyball shift's phases over its share (World ParaVolley Rule
 * 9.4.1, the pelvis kept on the court): the palm reaches to its plant by
 * `PLANT`, the seat scoots on it from `PLANT` to `RELEASE`, the palm lifts and
 * the forearms come to the receive platform by `RECEIVE`, and the platform eases
 * off by the end, each a minimum-jerk share (provisional staging).
 *
 * @param share The shift's progress, 0 to 1.
 * @returns How far the seat has scooted, the palm reaches, and the platform is
 *   formed, each 0 to 1.
 */
export function humanSittingVolleyPhases(
  share: number,
): humanSittingVolleyPhases.IPhases {
  const { PLANT, RELEASE, RECEIVE } = humanSittingVolleyPhases;
  return {
    moving: minimumJerk.share((share - PLANT) / (RELEASE - PLANT)),
    reaching:
      minimumJerk.share(share / PLANT) *
      (1 - minimumJerk.share((share - RELEASE) / (RECEIVE - RELEASE))),
    platform:
      minimumJerk.share((share - RELEASE) / (RECEIVE - RELEASE)) *
      (1 - minimumJerk.share((share - RECEIVE) / (1 - RECEIVE))),
  };
}

/** The sitting volley's phases. */
export namespace humanSittingVolleyPhases {
  /** The share the palm plants at. */
  export const PLANT: number = 0.25;

  /** The share the palm is released at. */
  export const RELEASE: number = 0.55;

  /** The share the forearms receive at. */
  export const RECEIVE: number = 0.8;

  /** The shift's three envelopes. */
  export interface IPhases {
    /** The seat's scoot, 0 to 1. */
    moving: number;

    /** The pressing palm's reach, 0 to 1. */
    reaching: number;

    /** The forearm platform, 0 to 1. */
    platform: number;
  }
}
