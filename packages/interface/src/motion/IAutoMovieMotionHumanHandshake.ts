import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

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
 * pointing at the partner along the line that halves the angle between the two
 * forearms, so two right hands meet web to web with their thumbs up; the two
 * hands then turn in their palms' planes together, the palms' contact
 * unchanged, to the pair of turns whose open hands keep every phalanx off the
 * other's forearm and which both arms reach best at the clasp and at the pump's
 * top and bottom alike (`HumanClasp.choose`), so each hand's fingers close
 * round the other's hand rather than lie along its wrist. Inverse kinematics
 * solves each arm (`HumanHand.place`, an effector socket on a world target),
 * and through the clasp and
 * the pump the arm keeps the configuration it clasped in
 * (`IAutoMovieHumanLimbGoal.reference`); the feet stay planted as the stand law
 * places them. Both partners read the point from one meeting record
 * (`handshakeMeeting`), computed once from the two shoulders, so the palms meet
 * without either reading the other's moving hand. A seated pair whose arms
 * alone fall short leans its trunks forward over the seat, the hand's target
 * first (`HumanSeatedReach`, Chan and Dubey 1995), the lean coming in over the
 * reach and going over the return. The comfortable reach is the
 * shoulder-to-palm distance of an arm offering a hand: the upper arm 30 degrees
 * forward of hanging and the elbow flexed 45 degrees, which slopes the forearm
 * 15 degrees down to the hand, both provisional, as no measurement of the
 * offering arm was located. The slope is what lets two hands clasp with both
 * elbows low: each hand's fingers clear the partner's forearm only when they
 * point about 65 degrees off it (measured on the sweep's bodies between two
 * turns of 30 and two of 37.5 degrees), the wrist deviates 30 degrees less the
 * 5.5 the pump takes, and two level forearms leave the rest to a raised elbow;
 * two forearms each sloping 15 degrees down supply it. `gap` is the chest gap
 * at which both such arms meet, the distance partners stand at to shake hands.
 * The limit is the straight arm less the pump's amplitude, so the pump stays
 * within reach above and below the meeting point.
 *
 * Phases, the handshake's reach, grasp, shake and release (Jindai et al.,
 * reviewed by Prasad et al. 2022, Human-Robot Handshaking: A Review, Int. J.
 * Soc. Robot.): the reach is a minimum-jerk transport whose time is the
 * reach-to-grasp movement time over the comfortable reach (`HumanPrehension`),
 * the longer of the two partners' so both palms arrive together; the hand opens
 * during the reach to the offered hand of `HumanClasp.open` and its digits
 * close from there on the partner's hand by the clasp (`HumanGrip`); the shake
 * moves the shared point up and down at 2.43 Hz for two cycles, the greeting
 * handshake of Tagne et al. 2016 (0.90 s of main shaking at 2.43 Hz, as
 * tabulated by Prasad et al.), with a vertical amplitude of 25 mm about the
 * point that is provisional (no study located reports the amplitude; the robot
 * reference of Wang et al. used 10 cm peak to peak) and a `sin^2` envelope so
 * the pump starts and stops at rest; then the fingers open and the hand returns
 * to where it hung over another reach time.
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
 * placed first, which `HumanChain.pair` arranges.
 */
export namespace IAutoMovieMotionHumanHandshake {
  /** Parameters. */
  export interface IParams {
    /** The partner's subject id. */
    partner: string;

    /** The shaking hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** Pump cycles, a whole number of at least 1; 2 when absent. */
    count?: number;
  }

  /** Where a standing body's chest and acting shoulder lie from its floor point. */
  export interface IStance {
    /** How high the shoulder joint stands above the floor, metres. */
    height: number;

    /** How far the sternum region lies ahead of the floor point, metres. */
    sternum: number;

    /** How far the shoulder joint lies ahead of the floor point, metres. */
    shoulder: number;

    /** How far the shoulder joint lies to the side of the floor point, metres. */
    across: number;
  }
}
