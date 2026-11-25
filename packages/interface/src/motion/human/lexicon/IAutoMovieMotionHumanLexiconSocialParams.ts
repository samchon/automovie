import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanHandToFace } from "../daily/IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanApproach } from "../everyday/IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanCurtsy } from "../everyday/IAutoMovieMotionHumanCurtsy";
import type { IAutoMovieMotionHumanKuzushi } from "../grappling/IAutoMovieMotionHumanKuzushi";
import type { IAutoMovieMotionHumanRelayPass } from "../handling/IAutoMovieMotionHumanRelayPass";
import type { IAutoMovieMotionHumanGrapple } from "../next/IAutoMovieMotionHumanGrapple";
import type { IAutoMovieMotionHumanTouch } from "../next/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanHighFive } from "../touch/IAutoMovieMotionHumanHighFive";
import type { IAutoMovieMotionHumanKiss } from "../touch/IAutoMovieMotionHumanKiss";

/**
 * Open parameters of the social lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconSocialParams {
  /**
   * A whisper: the lips brought to the partner's ear and held (two seconds,
   * provisional).
   */
  whisper: Omit<IAutoMovieMotionHumanKiss.IParams, "region" | "hold">;

  /** A kiss on the cheek. */
  cheekKiss: Omit<IAutoMovieMotionHumanKiss.IParams, "region">;

  /** A kiss on the forehead. */
  foreheadKiss: Omit<IAutoMovieMotionHumanKiss.IParams, "region">;

  /**
   * A pat on the partner's shoulder; the composition gives the shoulder as the
   * target.
   */
  shoulderPat: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count"
  >;

  /** A comforting hand held on the partner. */
  comfort: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "hold"
  >;

  /** A fist bump, one role of it. */
  fistBump: Omit<IAutoMovieMotionHumanHighFive.IParams, "kind">;

  /** A low five, one role of it. */
  lowFive: Omit<IAutoMovieMotionHumanHighFive.IParams, "kind">;

  /** A sip taken after a toast. */
  toastSip: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /**
   * A pinky promise, one role of it: the hands meet at chest height as fists do
   * (first pass; the hooked little fingers are not shaped).
   */
  pinkyPromise: Omit<IAutoMovieMotionHumanHighFive.IParams, "kind">;

  /**
   * A firm, slow pat or press of the palm on the partner (Laban's press:
   * strong, sustained, direct); the composition gives the region.
   */
  firmPress: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "manner"
  >;

  /**
   * A light, quick flick of the fingertips on the partner, as brushing lint off
   * a shoulder (Laban's flick: light, sudden, indirect); the composition gives
   * the region.
   */
  flickOff: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "manner"
  >;

  /**
   * The incoming runner of a relay pass, performed over its run: the baton worn
   * in the hand pushed into the outgoing hand at the stated `at`. The
   * composition gives the partner, `at` and the baton.
   */
  relayIncoming: Omit<IAutoMovieMotionHumanRelayPass.IParams, "role">;

  /**
   * The outgoing runner of a relay pass, performed over its run: the hand back
   * and open at the stated `at`, the baton worn on it from then. The
   * composition gives the partner, `at` and the baton.
   */
  relayOutgoing: Omit<IAutoMovieMotionHumanRelayPass.IParams, "role">;

  /**
   * The leader of a walking partner dance: a slow walk the follower keeps pace
   * with. The composition gives where to.
   */
  danceLead: Omit<IAutoMovieMotionHumanWalkParams, "pace">;

  /**
   * The follower of a walking partner dance: at the leader's right, 0.4 m off
   * (provisional, a promenade's side-by-side hold), walking at the leader's
   * speed by the speed-matching law of a follower (`approach`'s `track:
   * "pace"`). The composition gives the leader as the target.
   */
  danceFollow: Omit<
    IAutoMovieMotionHumanApproach.IParams,
    "from" | "at" | "pace" | "track"
  >;

  /**
   * The follower's hold of a walking partner dance once both stand: her left
   * palm laid on the leader and held. The composition gives the leader's region
   * (his near shoulder at her left in a promenade). A hold kept while walking
   * is coupled travel, not staged here: a speed-matching follower lags while
   * the leader walks.
   */
  danceHold: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "hold" | "hand"
  >;

  /**
   * Judo's grip (kumikata) for a throw: the right hand on the partner's left
   * collar and the left on the right sleeve, held two seconds (provisional).
   * The composition gives the partner.
   */
  judoGrip: IAutoMovieMotionHumanGrapple.IClinchRow;

  /**
   * The receiver of a judo throw drawn off balance forward (`kuzushi`), the
   * body tipped about the ankles over the toes and held a second.
   */
  judoBroken: Omit<IAutoMovieMotionHumanKuzushi.IParams, "depth">;

  /** Perform a formal dip and recovery. */
  curtsy: IAutoMovieMotionHumanCurtsy;
}
