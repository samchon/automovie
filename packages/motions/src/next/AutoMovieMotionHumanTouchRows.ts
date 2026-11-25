import { AutoMovieMotionHumanTouchDrink as AutoMovieMotionHumanTouchDrinkSource } from "../compose/AutoMovieMotionHumanTouchDrink";
import { AutoMovieMotionHumanTouchEffector as AutoMovieMotionHumanTouchEffectorSource } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm as AutoMovieMotionHumanTouchFormSource } from "../compose/AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchLaid as AutoMovieMotionHumanTouchLaidSource } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchPath as AutoMovieMotionHumanTouchPathSource } from "../compose/AutoMovieMotionHumanTouchPath";
import { AutoMovieMotionHumanTouchStance as AutoMovieMotionHumanTouchStanceSource } from "../compose/AutoMovieMotionHumanTouchStance";
import { AutoMovieMotionHumanTouchUpright as AutoMovieMotionHumanTouchUprightSource } from "../compose/AutoMovieMotionHumanTouchUpright";
import { HumanClasp as HumanClaspSource } from "../lexicon/HumanClasp";
import { HumanDrape as HumanDrapeSource } from "../lexicon/HumanDrape";
import { HumanPartner as HumanPartnerSource } from "../lexicon/HumanPartner";
import { HumanSocial as HumanSocialSource } from "../lexicon/HumanSocial";
import { HumanTouchRows as HumanTouchRowsSource } from "../lexicon/HumanTouchRows";
import { HumanSeatedReach as HumanSeatedReachSource } from "../touch/HumanSeatedReach";
import { HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND } from "./presets/HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND";
import { HUMAN_TOUCH_EMBLEM_COVER_EARS } from "./presets/HUMAN_TOUCH_EMBLEM_COVER_EARS";
import { HUMAN_TOUCH_EMBLEM_COVER_MOUTH } from "./presets/HUMAN_TOUCH_EMBLEM_COVER_MOUTH";
import { HUMAN_TOUCH_EMBLEM_HAND_ON_HEART } from "./presets/HUMAN_TOUCH_EMBLEM_HAND_ON_HEART";
import { HUMAN_TOUCH_EMBLEM_SALUTE } from "./presets/HUMAN_TOUCH_EMBLEM_SALUTE";
import { HUMAN_TOUCH_HOLD } from "./presets/HUMAN_TOUCH_HOLD";
import { HUMAN_TOUCH_PARTNER_DANCE_HOLD } from "./presets/HUMAN_TOUCH_PARTNER_DANCE_HOLD";
import { HUMAN_TOUCH_PAT } from "./presets/HUMAN_TOUCH_PAT";
import { HUMAN_TOUCH_PRESS } from "./presets/HUMAN_TOUCH_PRESS";
import { HUMAN_TOUCH_RUB } from "./presets/HUMAN_TOUCH_RUB";
import { HUMAN_TOUCH_SCRATCH } from "./presets/HUMAN_TOUCH_SCRATCH";
import { HUMAN_TOUCH_SOCIAL_COMFORT } from "./presets/HUMAN_TOUCH_SOCIAL_COMFORT";
import { HUMAN_TOUCH_SOCIAL_FIRM_PRESS } from "./presets/HUMAN_TOUCH_SOCIAL_FIRM_PRESS";
import { HUMAN_TOUCH_SOCIAL_SHOULDER_PAT } from "./presets/HUMAN_TOUCH_SOCIAL_SHOULDER_PAT";
import { HUMAN_TOUCH_SQUEEZE } from "./presets/HUMAN_TOUCH_SQUEEZE";
import { HUMAN_TOUCH_STROKE } from "./presets/HUMAN_TOUCH_STROKE";
import { HUMAN_TOUCH_TAP } from "./presets/HUMAN_TOUCH_TAP";

/**
 * The touch family's owners, rows and presets, each the shipped value under its
 * family name (`AutoMovieMotionHumanTouch`), with its own comment.
 */
export namespace AutoMovieMotionHumanTouchRows {
  /**
   * What touches in a touch: a hand surface, or the tip of a tool the hand
   * holds, stated in the hand's anatomical axes (where the fingers point, where
   * the palm faces and where the thumb points at rest) as shares of the hand's
   * length, so a held cup's rim or a spoon's bowl is placed on the mouth
   * without a prop. Also the effector's displayed point the verdicts read, the
   * skin's stand-off from the hand's own colliders and the arm goal that lays
   * the effector on a contact point.
   */
  export import AutoMovieMotionHumanTouchEffector = AutoMovieMotionHumanTouchEffectorSource;

  /**
   * The kinds of a touch and how each moves in the region's surface frame: the
   * social touch gestures of Jung et al. 2017 (the corpus of social touch)
   * reduced to a lift off the surface along its normal (a tap, a pat), a travel
   * along it (a stroke, a rub, a scratch) or neither (a press, a squeeze, a
   * hold), with the repetition's length and the fingers' curl.
   *
   * A stroke moves at the pleasant-touch speed of Loken et al. 2009 (1 to 10
   * cm/s; the peak is set to 5 cm/s). The other periods and every amplitude are
   * provisional shares of the hand's length.
   */
  export import AutoMovieMotionHumanTouchForm = AutoMovieMotionHumanTouchFormSource;

  /**
   * An effector laid on a region at rest, before any stroke moves it: the arm
   * goal that lays it, what its two directions lie on by the touch's lay, the
   * elbow's hint for that goal, the arm solved there as the reference every
   * second of a stroke is held to, and the elbow settled with a hand that meets
   * its place end on. The touch stroke (`AutoMovieMotionHumanTouch`) and every
   * law that plans one read these once, on the entry posture.
   */
  export import AutoMovieMotionHumanTouchLaid = AutoMovieMotionHumanTouchLaidSource;

  /**
   * The direction a hand lies on a surface region when the arm chooses it
   * (`lay`), and the direction a hand that continues its forearm points at a
   * place (`reach`). Read by the touch stroke (`AutoMovieMotionHumanTouch`),
   * whose transport is a joint-space carry and so needs no path of its own.
   */
  export import AutoMovieMotionHumanTouchPath = AutoMovieMotionHumanTouchPathSource;

  /**
   * What the body behind the arm does so a hand reaches a region its arm alone
   * does not: the shoulder girdle lifted and a rise onto the toes for a region
   * above the shoulder, then a lean from the hips for what is still beyond the
   * arm.
   *
   * A person reaching up to a taller person's face, or to a shelf, lifts the
   * shoulder with the arm (the scapula turns up as the arm is raised, Inman,
   * Saunders and Abbott 1944) and then raises the heels, because leaning
   * forward lowers the shoulder and takes it away from a place above it. Each
   * moves by the least angle that brings the wrist within the kept share of the
   * arm, and no further than the shoulder needs to come level with the wrist or
   * than its limit (`GIRDLE`, `RAISE`). What remains is leaned into
   * (`AutoMovieMotionHumanLeanInto`). A region off to the side that the forward
   * lean leaves out of reach is turned toward first: the trunk twists about its
   * long axis by the heading's angle to the line from the shoulder to the
   * wrist, shared by the lumbar and thoracic spine within their twist ranges,
   * as a person turns the chest toward a hand reaching across the body. The
   * lean, solved again on the turned trunk, refuses a region still out of reach
   * at its limit. Two hands' regions off to one side (`faces`) are turned
   * toward from the start, the leaned trunk facing their middle from the
   * shoulders, the turn and the lean solved together to their fixed point, so
   * both arms reach from that side and neither crosses the body.
   */
  export import AutoMovieMotionHumanTouchStance = AutoMovieMotionHumanTouchStanceSource;

  /**
   * How a held vessel is turned about its own upright axis at a region, so the
   * arm that brings it there keeps it upright, and how far it is leaned.
   *
   * Standing a vessel upright fixes one axis of the hand; its turn about that
   * axis is free, and most of those turns ask the forearm and the wrist for
   * more than their range, so the resolver gives way on the rotation and the
   * vessel tilts. Each candidate turns the region's level normal by a multiple
   * of `STEP` degrees within `SPAN` either way (`facings`); each is solved on
   * the posture, and the facing whose reached hand keeps the vessel's axis
   * nearest the asked one is taken, the nearest to head on on a tie, so the
   * first that keeps it exactly ends the search. The turn about that axis is
   * not counted, since it is free. A lean toward the face is a turn of the axis
   * about the level line across the region (`tip`); the least lean that lets
   * the arm drink is `AutoMovieMotionHumanTouchDrink`'s.
   */
  export import AutoMovieMotionHumanTouchUpright = AutoMovieMotionHumanTouchUprightSource;

  /**
   * How far a vessel is leaned toward the face at the lips, and turned there,
   * so the arm that brings it holds it as a person drinks: the least lean, in
   * `LEAN_STEP` degrees up to `LEAN`, whose fitted arm drinks with the vessel
   * where it was asked (`AutoMovieMotionHumanDrinkingArm.drinks`, its reached
   * axis within a `LEAN_STEP` of the asked one), with the facing
   * (`AutoMovieMotionHumanTouchUpright`) whose hand meets the vessel's axis
   * best, or for a vessel held by the grasp it was taken up by, the lean alone
   * (`held`). Held exactly upright at the lips the vessel asks the elbow up to
   * the shoulder's height; a drinker tips the glass at the lips with the elbow
   * low (Murphy, Willén and Sunnerhagen 2011).
   */
  export import AutoMovieMotionHumanTouchDrink = AutoMovieMotionHumanTouchDrinkSource;

  /**
   * A seated reach with the trunk below the arm in task priority: the hand's
   * target first, and when the arm alone falls short, a lean of the trunk
   * forward, which the seat bears: the hips flex the trunk over the seat and
   * the spine's three joints flex above them, each within the flexion room its
   * range leaves. The joints share the lean in one share of each one's room,
   * and two seated partners in one share of each one's chain, the
   * joint-limit-weighted least-norm resolution of the redundancy (Chan and
   * Dubey 1995, "A weighted least-norm solution based scheme for avoiding joint
   * limits for redundant joint manipulators", IEEE Trans. Robot. Autom. 11(2)):
   * each joint's motion weighted by its range, so none reaches its limit before
   * another.
   *
   * A standing body leans none here: its reach stays its arm's, as the standing
   * laws already plan it.
   */
  export import HumanSeatedReach = HumanSeatedReachSource;

  /**
   * Hold on with the hands (`IAutoMovieMotionHumanClasp`): the entry posture
   * carried by its own carrier's contact, or standing where it is, while each
   * named hand reaches its hold over `REACH` and follows it: a partner's
   * displayed bone or another prop's moving contact. Register `HumanClasp` to
   * use it.
   *
   * The author gives `seconds`; the hand's reach to its hold is provisional
   * (`HumanClasp`); a handshake, a held hand.
   */
  export const HumanClasp: typeof HumanClaspSource = HumanClaspSource;

  /**
   * A limp body laid across a saddle (`IAutoMovieMotionHumanDrape`): in the
   * carrier contact's frame the body lies face down across the seat, its trunk
   * level and pointing to the head's side, the hips resting on the seat a
   * trunk's half depth above it and folded so the legs hang down the other
   * side, the arms and head hanging; it comes to lie so from the entry over
   * `lay` by a minimum-jerk share and is carried by the contact. Register
   * `HumanDrape` to use it.
   *
   * The author gives `seconds` of the drape after the laying movement; no
   * natural value is defined (provisional).
   */
  export const HumanDrape: typeof HumanDrapeSource = HumanDrapeSource;

  /**
   * Things two people do together or to each other in company, as rows of
   * shipped actions and as mutual records over them (`HumanChain.mutual`).
   * Register the rows a film uses.
   */
  export import HumanSocial = HumanSocialSource;

  /**
   * Things two people do as partners in sport and dance, each a row of a law
   * whose roles share a stated instant or a meeting. Register the rows a film
   * uses.
   */
  export import HumanPartner = HumanPartnerSource;

  /**
   * The contact strokes as rows: each kind of `touch` under a name of its own,
   * the site, the effector, the side and the target open, so one row serves
   * every site.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanTouchRows = HumanTouchRowsSource;

  /**
   * The values the `touchTap` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. `touch` of kind `tap`: 3 taps of 0.3 s, then 0.4 s on
   * the place, in all 1.3 s after the reach; a light attention-getting touch on
   * a shoulder or an arm ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count`
   * and `hold` override; provisional except the stroke).
   */
  export const TAP: typeof HUMAN_TOUCH_TAP = HUMAN_TOUCH_TAP;

  /**
   * The values the `touchPat` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. `touch` of kind `pat`: 3 pats of 0.4 s, then 0.4 s,
   * 1.6 s after the reach; comfort, praise, a friendly pat
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const PAT: typeof HUMAN_TOUCH_PAT = HUMAN_TOUCH_PAT;

  /**
   * The values the `touchStroke` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. `touch` of kind `stroke`: one stroke at a 5
   * cm/s peak (the pleasant-touch rate, Loken et al. 2009), about 5 s for a 0.2
   * m hand, then 0.4 s; a caress, soothing
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const STROKE: typeof HUMAN_TOUCH_STROKE = HUMAN_TOUCH_STROKE;

  /**
   * The values the `touchRub` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. `touch` of kind `rub`: 3 rubs of 0.5 s, then 0.4 s,
   * 1.9 s after the reach; warming, soothing, rubbing a shoulder or a back
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const RUB: typeof HUMAN_TOUCH_RUB = HUMAN_TOUCH_RUB;

  /**
   * The values the `touchPress` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. `touch` of kind `press`: one press of 0.4 s,
   * then held 1.2 s, 1.6 s after the reach; a firm touch, pushing a button on a
   * person, steadying ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and
   * `hold` override; provisional except the stroke).
   */
  export const PRESS: typeof HUMAN_TOUCH_PRESS = HUMAN_TOUCH_PRESS;

  /**
   * The values the `touchSqueeze` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. `touch` of kind `squeeze`: one squeeze of 0.4 s
   * with the fingers curled 20 degrees, held 1.2 s, 1.6 s after the reach;
   * reassurance, a grip on an arm or a hand
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const SQUEEZE: typeof HUMAN_TOUCH_SQUEEZE = HUMAN_TOUCH_SQUEEZE;

  /**
   * The values the `touchHold` row of `HumanTouchRows` fixes on `touch`, spread
   * into its parameters. `touch` of kind `hold`: one placement of 0.4 s, then
   * held 1.2 s, 1.6 s after the reach; a hand laid on a shoulder or an arm
   * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
   * provisional except the stroke).
   */
  export const HOLD: typeof HUMAN_TOUCH_HOLD = HUMAN_TOUCH_HOLD;

  /**
   * The values the `touchScratch` row of `HumanTouchRows` fixes on `touch`,
   * spread into its parameters. `touch` of kind `scratch`: 3 scratches of 0.2 s
   * with curled fingers, then 0.4 s, 1.0 s after the reach; an itch, scratching
   * the head or an arm ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and
   * `hold` override; provisional except the stroke).
   */
  export const SCRATCH: typeof HUMAN_TOUCH_SCRATCH = HUMAN_TOUCH_SCRATCH;

  /**
   * The values the `salute` row of `HumanEmblem` fixes on `touch`, spread into
   * its parameters. The military hand salute (US Army TC 3-21.5): the
   * forefinger's end at the right brow, the hand in line with the forearm, the
   * upper arm level.
   */
  export const EMBLEM_SALUTE: typeof HUMAN_TOUCH_EMBLEM_SALUTE =
    HUMAN_TOUCH_EMBLEM_SALUTE;

  /**
   * The values the `handOnHeart` row of `HumanEmblem` fixes on `touch`, spread
   * into its parameters. A hand on the heart: the right palm on the left
   * chest.
   */
  export const EMBLEM_HAND_ON_HEART: typeof HUMAN_TOUCH_EMBLEM_HAND_ON_HEART =
    HUMAN_TOUCH_EMBLEM_HAND_ON_HEART;

  /**
   * The values the `blownKissSend` row of `HumanEmblem` fixes on `touch`,
   * spread into its parameters. The blown kiss's send, performed after
   * `blownKiss`: the open hand, palm up, swept forward from the lips and held a
   * moment at the shoulder's height, 0.818 of the stature, the forearm and the
   * hand's length, 0.146 and 0.108 of it, ahead of the performer (Drillis and
   * Contini's segment proportions, as Winter's Biomechanics and Motor Control
   * of Human Movement tabulates them), in the performer's own statures so it
   * fits every body.
   */
  export const EMBLEM_BLOWN_KISS_SEND: typeof HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND =
    HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND;

  /**
   * The values the `coverMouth` row of `HumanEmblem` fixes on `touch`, spread
   * into its parameters. A hand over the mouth, as at a gasp or a yawn.
   */
  export const EMBLEM_COVER_MOUTH: typeof HUMAN_TOUCH_EMBLEM_COVER_MOUTH =
    HUMAN_TOUCH_EMBLEM_COVER_MOUTH;

  /**
   * The values the `coverEars` row of `HumanEmblem` fixes on `touch`, spread
   * into its parameters. Both hands over the ears.
   */
  export const EMBLEM_COVER_EARS: typeof HUMAN_TOUCH_EMBLEM_COVER_EARS =
    HUMAN_TOUCH_EMBLEM_COVER_EARS;

  /**
   * The values the `shoulderPat` row of `HumanSocial` fixes on `touch`, spread
   * into its parameters. A pat on the partner's shoulder; the composition gives
   * the shoulder as the target. Two pats of 0.4 s, then 0.4 s, 1.2 s after the
   * reach (`AutoMovieMotionHumanTouchForm.FORMS`, provisional); encouragement,
   * praise.
   */
  export const SOCIAL_SHOULDER_PAT: typeof HUMAN_TOUCH_SOCIAL_SHOULDER_PAT =
    HUMAN_TOUCH_SOCIAL_SHOULDER_PAT;

  /**
   * The values the `comfort` row of `HumanSocial` fixes on `touch`, spread into
   * its parameters. A comforting hand held on the partner. Held 2 s after the
   * reach (provisional); condolence, reassurance.
   */
  export const SOCIAL_COMFORT: typeof HUMAN_TOUCH_SOCIAL_COMFORT =
    HUMAN_TOUCH_SOCIAL_COMFORT;

  /**
   * The values the `firmPress` row of `HumanSocial` fixes on `touch`, spread
   * into its parameters. A firm, slow pat or press of the palm on the partner
   * (Laban's press: strong, sustained, direct); the composition gives the
   * region. The press takes 0.4 s and holds 1.2 s (`touch`'s defaults,
   * provisional); steadying, emphasis.
   */
  export const SOCIAL_FIRM_PRESS: typeof HUMAN_TOUCH_SOCIAL_FIRM_PRESS =
    HUMAN_TOUCH_SOCIAL_FIRM_PRESS;

  /**
   * The values the `danceHold` row of `HumanPartner` fixes on `touch`, spread
   * into its parameters. The follower's hold of a walking partner dance once
   * both stand: her left palm laid on the leader and held 1.5 s. The
   * composition gives the leader's region (his near shoulder at her left in a
   * promenade). A hold kept while walking is coupled travel, not staged here: a
   * speed-matching follower lags while the leader walks.
   */
  export const PARTNER_DANCE_HOLD: typeof HUMAN_TOUCH_PARTNER_DANCE_HOLD =
    HUMAN_TOUCH_PARTNER_DANCE_HOLD;
}
