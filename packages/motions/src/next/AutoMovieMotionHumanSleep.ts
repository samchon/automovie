import { lieTogether as lieTogetherLaw } from "../floor/lieTogether";
import { pullCover as pullCoverLaw } from "../floor/pullCover";
import { sleep as sleepLaw } from "../floor/sleep";

/**
 * Sleeping: over a long lie the performer turns over seeded times into
 * positions drawn by how much of the night people spend in each (Skarpsno et
 * al. 2017: side 54.1 %, back 37.5 %, front 7.3 %, the side split evenly),
 * never the one it lies in, holding still between; it pulls a cover over and
 * lies together with a partner. De Koninck et al. 1992 count such shifts
 * through the night; a film sleep compresses them into its seconds.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `sleep`: Sleep with seeded position changes: over a long lie, the lying
 *   performer turns over `changes` times into positions drawn by how much of
 *   the night people spend in each (Skarpsno et al.
 * - `pullCover`: Pull a cover up while lying, or push it off.
 * - `lieTogether`: Lie together with a partner.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanSleep} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanSleep {
  /**
   * Sleep with seeded position changes: over a long lie, the lying performer
   * turns over `changes` times into positions drawn by how much of the night
   * people spend in each (Skarpsno et al. 2017), never the one it lies in, at
   * seeded instants spread over the sleep; between, it holds still. De Koninck
   * et al. 1992 count such shifts through the night; a film sleep compresses
   * them into its seconds.
   *
   * @param chain The lying performer's chain.
   * @param params The sleep's length, changes, seed and support.
   * @returns The chain with the turns appended.
   * @throws {HumanRefusal} When the changes are not a whole count of one or
   *   more, or the sleep is too short to hold between them.
   */
  export const sleep: typeof sleepLaw = sleepLaw;

  /**
   * Pull a cover up while lying, or push it off. Each hand's way runs over its
   * own side of the lying body, from the thigh's front over the upper abdomen
   * to the chest (`WAY`), each region `OVER` out along its normal, read on the
   * posture the body lies in at the start. Pulling, both hands go to the thigh
   * end by `ready`, grip the soft cover there (the soft prop binds its particle
   * nearest each hand's grip socket when the grip closes) and draw it up the
   * way to the chest by `strokeEnd`, where they let go and return; pushing runs
   * the way from the chest down. The hands face the body, the palms down onto
   * the cover, the fingers across the body toward its midline. Both arms are
   * laid in one course (`courseArmGoal`). A performer not lying on the back
   * (the sternum less than half the chest's depth above the upper back) is
   * refused.
   */
  export const pullCover: typeof pullCoverLaw = pullCoverLaw;

  /**
   * Lie together with a partner. Both already lie on the support (`lieDown`,
   * `lieOnSurface`, `turnOver`), the performer within its arm's reach (upper
   * arm, forearm and hand) of where it settles; as it settles, the arm on the
   * side it lies on folds up before the face (`FOLD`), or, spooning, under its
   * own head (`PILLOW`), the free arm draped over the partner
   * (`lieTogetherDrape`). Spooning, the performer lies on the same side as the
   * partner, heading within `ALIGNED`, and slides across the support until its
   * chest's sternum region lies `REST` off the partner's upper back; where its
   * hips meet the partner's first, the lumbar spine curls the chest the rest of
   * the way (`lieTogetherCurl`), each midline keeping the height its own lying
   * width gives it. With the head on the chest, it lies on its side beside the
   * partner on the back, its head toward the partner's nearer chest region; it
   * slides toward that region across the support until any part but its head
   * and neck comes `REST` off the partner (`lieTogetherReach`), then the neck's
   * side bend and flexion lay the lower cheek on the partner's surface beneath
   * it, the nearest of the chest it reaches or the shoulder by it, on a coarse
   * grid refined by degrees, a miss over a skin contact refused
   * (`lieTogetherNeck`). The slide is horizontal, so the body stays on the
   * support; it takes the transport time of its distance on a minimum-jerk
   * share, once the arm has folded in the free-space time of its hand's arc.
   * From the start the settled posture is carried rigidly by the bone under the
   * partner's sternum (`carryHumanPosture`), so the contact holds as the
   * partner breathes or shifts. Windows: the body lies on the support
   * throughout, and from the settle the chest bears on the partner's back or
   * the cheek on the partner's chest.
   */
  export const lieTogether: typeof lieTogetherLaw = lieTogetherLaw;
}
