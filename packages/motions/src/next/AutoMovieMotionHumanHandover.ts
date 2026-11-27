import { HumanHandover as HumanHandoverSource } from "../handling/internal/HumanHandover";
import { handOver as handOverLaw } from "../handling/internal/handOver";
import { handshake as handshakeLaw } from "../handling/internal/handshake";
import { receive as receiveLaw } from "../handling/internal/receive";
import { relayPass as relayPassLaw } from "../handling/internal/relayPass";

/**
 * Passing an object between two people: giving, receiving, relaying and the
 * handshake.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `handOver`: Handing a held prop to a receiver: the giver's half of a
 *   handover.
 * - `receive`: Taking a prop a giver holds out: the receiver's half of a
 *   handover.
 * - `relayPass`: A relay baton pass, one role of it, performed over a run
 *   (`AutoMovieMotionHumanChain.over`): the outgoing runner's hand goes back, open, palm back,
 *   and the incoming runner pushes the baton's end into it at a film second
 *   both roles state alike (`at`), from where the baton passes to the outgoing
 *   hand.
 * - `handshake`: Shaking hands with a partner: both bring the same hand's palm to
 *   one shared point, clasp, pump together and let go.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanHandover`: The shared plan of one object passing from a giver's hand to
 *   a receiver's: where it is handed over, when each hand moves, when the
 *   receiver's grip closes and when the giver lets go.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanHandover} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanHandover {
  /**
   * Handing a held prop to a receiver: the giver's half of a handover.
   *
   * The goal is the prop's place, not the arm: the giver carries the held prop
   * so its receiving grip lands on the handover point of the shared plan
   * (`HumanHandover`), holds it there while the receiver's hand arrives and
   * closes, holds on through the transfer time, and only then opens the fingers
   * and returns the hand to where it hangs; inverse kinematics solves the arm,
   * whose reference (`HumanPosture.IGoal.reference`) passes from the
   * configuration it carried the prop in to the offer's own solution with the
   * transport's progress and back on the way home; on the way out the prop is
   * turned about the vertical where the arm keeps it upright so, back to the
   * offer's own turn at the handover point (`HumanHandover.upright`); and the
   * rest of the body holds the posture it was entered in, a seated giver whose
   * arm alone falls short of the offer leaning its trunk forward over the seat
   * with the arm's course (`HumanSeatedReach`, the place read from the
   * partners' one meeting, `HumanHandoverMeeting`). The prop rides the giver's
   * hand until the receiver's grip closes, then the receiver's (the latest grip
   * carries a prop), so it never jumps.
   *
   * Outcomes: `transfer` (the default) as above; `withdraw`, the offer pulled
   * back to where the hand started as the receiver's hand arrives, keeping the
   * prop; `decline`, the offer held through the transfer time and pulled back
   * when the receiver does not reach.
   *
   * Events: `offered` when the prop reaches the handover point, `release` when
   * the giver lets go or starts to withdraw. The giver grips the prop until
   * `release` in a transfer, to the end otherwise. The finger opening (0.2 s)
   * is the put down's provisional value.
   */
  export import handOver = handOverLaw;

  /**
   * The shared plan of one object passing from a giver's hand to a receiver's:
   * where it is handed over, when each hand moves, when the receiver's grip
   * closes and when the giver lets go.
   *
   * Both the giver's and the receiver's laws compute this same plan from the
   * same inputs (both bodies, both people's displayed bones at the start and
   * the prop's frame there), so the two hands agree without either reading the
   * other's moving plan, and the giver's release follows the receiver's grip by
   * construction.
   *
   * - Where: the object's receiving grip lands on the mutual goal of the giver's
   *   and the receiver's acting shoulders (`resolveAutoMovieMutualGoal` with
   *   the handshake's comfortable reach): handovers take place midway between
   *   the partners (Hansen et al. 2017, reviewed by Kopnarski et al. 2023),
   *   with the object's middle at {@link EXCHANGE} of the partners' mean sternum
   *   height, moved only as far as both arms' reach demands
   *   (`HumanHandoverMeeting.goal`). Both laws read the place from the one
   *   meeting record (`HumanHandoverMeeting`, `meet`), where a seated pair
   *   leans its trunks when the arms alone fall short. The object keeps the
   *   orientation the giver holds it in, so the receiver grasps the grip its
   *   author named as the one offered.
   * - When: the giver's transport takes the loaded-carry time over its travel
   *   (`HumanPrehension.carry`); the receiver's reach, timed for its travel and
   *   the grasped width, starts so it ends no earlier than the giver's (the
   *   receiver begins reaching during the giver's transport, Kopnarski 2023),
   *   and its grip closes at `gripClosed`. Both hands then hold the object for
   *   the transfer time, 0.5 s for 90 g (Mason and MacKenzie 2005, Exp. Brain
   *   Res. 163:173) to 0.64 s for 1.8 kg (Doehring et al. 2020), linear in mass
   *   between and held at the ends outside, and only then does the giver open:
   *   the giver releases as the receiver takes the load (Mason and MacKenzie
   *   2005; Controzzi et al. 2018), never before `gripClosed`.
   *
   * Outcomes other than a transfer reuse the same where and when: `withdraw`
   * pulls the offer back as the receiver's hand comes within its approach
   * setback, so the receiver's hand stops short and returns; `decline` leaves
   * the receiver's hand where it is and the giver withdraws after the transfer
   * time. A drop needs the physics layer to carry the falling object and is not
   * offered.
   */
  export import HumanHandover = HumanHandoverSource;

  /**
   * Taking a prop a giver holds out: the receiver's half of a handover.
   *
   * The goal is the offered grip, not the arm: the receiver's grip socket is
   * brought onto the prop's receiving grip where the shared plan
   * (`HumanHandover`) puts the offer, on a reach-to-grasp transport that ends
   * no earlier than the giver's, the fingers opening to the peak aperture on
   * the way and closing on the prop's colliders until contact (`HumanGrip`).
   * The hand holds still through the transfer time while the giver lets go, and
   * then brings the prop in front of the body: the wrist where the elbow hangs
   * at the side flexed to a right angle (the upper arm's length below the
   * shoulder and the forearm's ahead of it), the common carrying posture, the
   * prop kept upright and turned about the vertical as the arm keeps it so
   * (`HumanHandover.upright`). The rest of the body holds the posture it was
   * entered in, a seated receiver whose arm alone falls short of the grip
   * leaning its trunk forward over the seat with the arm's course
   * (`HumanSeatedReach`, the place read from the partners' one meeting,
   * `HumanHandoverMeeting`).
   *
   * Outcomes: `transfer` as above; `withdraw`, the hand stops short by the
   * approach setback as the offer is pulled back, and returns empty; `decline`,
   * the hand stays where it is.
   *
   * Events: `gripClosed` when the fingers close on the prop, `taken` at the
   * end. The hand grips the prop from `gripClosed` and holds it afterwards.
   */
  export import receive = receiveLaw;

  /**
   * A relay baton pass, one role of it, performed over a run
   * (`AutoMovieMotionHumanChain.over`): the outgoing runner's hand goes back, open, palm back,
   * and the incoming runner pushes the baton's end into it at a film second
   * both roles state alike (`at`), from where the baton passes to the outgoing
   * hand.
   *
   * The outgoing hand is placed in the runner's own frame: behind and below the
   * shoulder by shares of the arm (the upsweep's hand, provisional), the palm
   * back and the fingers down. The incoming hand is placed each second so the
   * baton's end, read in the hand's frame where the baton is worn
   * (`IHumanProp.worn`), lies on the outgoing runner's displayed palm. Each arm
   * leaves the run's swing over `REACH` seconds before `at` and goes back to it
   * over `REACH` after `HOLD`. The outgoing role wears the baton on its hand
   * from `at` (`IHumanActionPlan.wears`), so it rides that hand from the
   * exchange on; without a baton the pass is mimed.
   *
   * With a `zone`, each role refuses a pass whose runner stands outside the
   * takeover zone's two lines at `at` (World Athletics TR24.19). First pass:
   * the free distance is the composition's (where the two runs put the runners
   * at `at`); the runners do not adjust their speed to meet, and the fingers do
   * not close on the baton.
   */
  export import relayPass = relayPassLaw;

  /**
   * Shaking hands with a partner: both bring the same hand's palm to one shared
   * point, clasp, pump together and let go.
   *
   * The goal is the meeting, not the arm: each palm socket is brought to the
   * point `handshakeOffer.point` places between the two offering elbows, where
   * both forearms reach it with the upper arms as they offer (the taller of two
   * unequal partners extends the elbow and reaches down, lowering the upper arm
   * toward hanging before the arm straightens, the shorter flexes the elbow and
   * raises the forearm, and neither raises the upper arm), with the palm facing
   * the partner's palm across the line between the two people and the fingers
   * pointing at the partner along the line that halves the angle between the
   * two forearms, so two right hands meet web to web with their thumbs up; the
   * two hands then turn in their palms' planes together, the palms' contact
   * unchanged, to the pair of turns whose open hands keep every phalanx off the
   * other's forearm and which both arms reach best at the clasp and at the
   * pump's top and bottom alike (`HumanClasp.choose`), so each hand's fingers
   * close round the other's hand rather than lie along its wrist. Inverse
   * kinematics solves each arm (`HumanHand.place`, an effector on a world
   * target), and through the clasp and the pump the arm keeps the configuration
   * it clasped in (`HumanPosture.IGoal.reference`); the feet stay planted as
   * the stand law places them. Both partners read the point from one meeting
   * record (`handshakeMeeting`), computed once from the two shoulders, so the
   * palms meet without either reading the other's moving hand. A seated pair
   * whose arms alone fall short leans its trunks forward over the seat, the
   * hand's target first (`HumanSeatedReach`, Chan and Dubey 1995), the lean
   * coming in over the reach and going over the return. The comfortable reach
   * is the shoulder-to-palm distance of an arm offering a hand: the upper arm
   * 30 degrees forward of hanging and the elbow flexed 45 degrees, which slopes
   * the forearm 15 degrees down to the hand, both provisional, as no
   * measurement of the offering arm was located. The slope is what lets two
   * hands clasp with both elbows low: each hand's fingers clear the partner's
   * forearm only when they point about 65 degrees off it (measured on the
   * sweep's bodies between two turns of 30 and two of 37.5 degrees), the wrist
   * deviates 30 degrees less the 5.5 the pump takes, and two level forearms
   * leave the rest to a raised elbow; two forearms each sloping 15 degrees down
   * supply it. `gap` is the chest gap at which both such arms meet, the
   * distance partners stand at to shake hands. The limit is the straight arm
   * less the pump's amplitude, so the pump stays within reach above and below
   * the meeting point.
   *
   * Phases, the handshake's reach, grasp, shake and release (Jindai et al.,
   * reviewed by Prasad et al. 2022, Human-Robot Handshaking: A Review, Int. J.
   * Soc. Robot.): the reach is a minimum-jerk transport whose time is the
   * reach-to-grasp movement time over the comfortable reach
   * (`HumanPrehension`), the longer of the two partners' so both palms arrive
   * together; the hand opens during the reach to the offered hand of
   * `HumanClasp.open` and its digits close from there on the partner's hand by
   * the clasp (`HumanGrip`); the shake moves the shared point up and down at
   * 2.43 Hz for two cycles, the greeting handshake of Tagne et al. 2016 (0.90 s
   * of main shaking at 2.43 Hz, as tabulated by Prasad et al.), with a vertical
   * amplitude of 25 mm about the point that is provisional (no study located
   * reports the amplitude; the robot reference of Wang et al. used 10 cm peak
   * to peak) and a `sin^2` envelope so the pump starts and stops at rest; then
   * the fingers open and the hand returns to where it hung over another reach
   * time.
   *
   * Events: `clasp` and `gripClosed` when the palms meet and the fingers close,
   * `shakeEnd` when the pump ends, `release` as the hand opens. The hand grips
   * the partner's palm region from `clasp` to `release`. A handshake cut into a
   * stand before `clasp` is a declined reach: the hand returns under the
   * transition's inertialization, continuous in velocity, with no offset left
   * once the blend ends.
   *
   * Both partners must stand, or sit leaning, within reach when the handshake
   * starts; the mutual goal refuses a gap neither arm can close. The partner's
   * shoulder is read at the start, so the partner's earlier actions must be
   * placed first, which `AutoMovieMotionHumanChain.pair` arranges.
   */
  export import handshake = handshakeLaw;
}
