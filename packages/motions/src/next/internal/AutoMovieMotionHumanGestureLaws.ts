import { armPhrase as armPhraseLaw } from "../../everyday/internal/armPhrase";
import { gesture as gestureLaw } from "../../everyday/internal/gesture";
import { gestureSignal as gestureSignalLaw } from "../../everyday/internal/gestureSignal";
import { gestureStroke as gestureStrokeLaw } from "../../everyday/internal/gestureStroke";
import { handGoals as handGoalsLaw } from "../../everyday/internal/handGoals";
import { HumanEmblem as HumanEmblemSource } from "../../lexicon/internal/HumanEmblem";
import { HumanGestureRows as HumanGestureRowsSource } from "../../lexicon/internal/HumanGestureRows";
import { HumanUpperRows as HumanUpperRowsSource } from "../../lexicon/internal/HumanUpperRows";

/*
 * The gesture family's laws, helpers and rows, each the shipped value under its
 * family name (`AutoMovieMotionHumanGesture`), with its own comment.
 */
export namespace AutoMovieMotionHumanGestureLaws {
  /*
   * A communicative gesture while standing: the hand, head or trunk moves
   * through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
   * preparation from rest to the stroke's start, the stroke that carries the
   * meaning, an optional post-stroke hold, and retraction to rest.
   *
   * The feet stay planted and the body stands as the stand law places it;
   * performed over a carrier (a walk, a seat, a ride) the body is the
   * carrier's, instant by instant, and the gesture takes only the parts it
   * moves. Each moving hand is an effector goal (gestureStroke), solved
   * by inverse kinematics with a natural elbow hint widened by the gesture and
   * the Effort; the moving arms are planned over the whole gesture as one
   * trajectory (`gestureHands.planned`): from what the entry left to the
   * stroke's goals in the preparation, on them through the stroke, and back to
   * the relaxed hanging arm's in the retraction, while the fingers take the
   * gesture's shape and leave it on the same share. Head, shoulder and trunk
   * gestures add their joint angles under an envelope that rises in the
   * preparation and falls in the retraction; a bow pitches the whole trunk
   * about the hips by its depth (15, 30 or 45 degrees are the conventional
   * light, ordinary and deep bows) while the hips move back to keep the body
   * balanced over the feet (`HumanBalance.shift`).
   *
   * Transport time is the free-space time of the distance moved
   * (`AutoMovieMotionHumanTiming.transport`), and at least the time each moving
   * arm's arc takes within the audit's travel bound (`gestureHands.reaching`),
   * 0.3 s for head and shoulder gestures (no source found), and for a bow its
   * depth at the measured rates of standing bows, down in 1.21 s and up in 1.38
   * s for 60 degrees, held 0.95 s at the deepest (Kawabata et al. 2009, ISBS
   * 27). The Effort's tempo scales every phase, its extent the gesture's size
   * and its elbow term the arm's width (HumanEffort).
   *
   * The plan names the hands it moves (`hands`), so a gesture with a hand that
   * holds a prop is refused, naming the free hand.
   *
   * Events: `prepare`, `strokeStart`, `strokeEnd`, `retract`. A gesture may be
   * cut into another during its retraction, making a gesture unit, and into
   * standing or moving before its stroke or after it; its stroke is never cut,
   * since a cut stroke loses the gesture's meaning.
   */
  export import gesture = gestureLaw;

  /*
   * One arm phrase on a target: the hand visits a place, strokes along a path
   * or oscillates about a pose, on the standard instants of a phrase (Kendon
   * 1980's preparation, stroke, hold and retraction as BML's `ready`,
   * `strokeStart`, `stroke`, `strokeEnd` and `relax`). It is the law the
   * upper-body lexicon's rows are written over: a wave, a tap, a hand at rest
   * on the hip, a wipe across a table are each this law with its phrase, its
   * target and its hand fixed (`HumanUpperRows`), so they share one plan, one
   * set of refusals and one timing.
   *
   * The phrase moves the hand from where the entry pose holds it (its surface's
   * place in the performer's frame) to the target and back, by the vocabulary's
   * own arm phrases (`AutoMovieMotionHumanArmPhrase`: `visit`, `stroke`,
   * `oscillate`), and the composition keeps every other part as the carrier or
   * the entry state has it (`AutoMovieMotionHumanBase.under`). The target is
   * any `AutoMovieMotionTarget`, read where it is at the phrase's start: a
   * region of one's own body or another's, a prop's point, a point in the
   * performer's frame. An `offset` moves the target's point in the performer's
   * frame (out, up, forward) by shares of the arm's length (upper arm, forearm
   * and hand), so one row fits every body. The hand faces against the target's
   * normal with its fingers up, unless `facing` names it. A phrase that names a
   * `held` prop keeps the hand's grip on it over its whole span and leaves it
   * held, so a hammer, a spoon or a hat moves with the hand; a hand that does
   * not hold it at entry is refused. Such a phrase may name one of the held
   * prop's own points as its working `point` (a cup's lip, a fork's face): that
   * point, not the hand's surface, is brought to the target, the hand's surface
   * placed short of it by the point's lever from the surface in the hand's
   * frame, which the grip keeps fixed, and the hand turned so the point faces
   * into the target, unless `facing` names the turn. Both hands may perform one
   * phrase on one clock (a clap, palms rubbed together), each hand's offset
   * mirrored by its side, so two hands sent to one median target meet there;
   * such a phrase holds no prop.
   *
   * Timing: the preparation is a travel of the distance from the hand to the
   * phrase's first goal (a stroke's start, otherwise the target) and the
   * retraction one of the distance back from its last, the target
   * (`AutoMovieMotionHumanTiming.transport`); a visit's stroke is instant and
   * its hold the named `hold` pause (a beat when absent); a stroke takes one
   * travel of its path's length; an oscillation takes `cycles` beats. The
   * manner's tempo scales every phase and its extent and curvature reach the
   * phrase (`AutoMovieMotionManner`). Events: the phrase's instants.
   */
  export import armPhrase = armPhraseLaw;

  /*
   * The signals a gesture's stroke rides, each a function of the stroke's share
   * in [0, 1] that starts at rest: a windowed oscillation for the repeated
   * strokes, a single rise and fall, and a rise held to the end.
   */
  export import gestureSignal = gestureSignalLaw;

  /*
   * The stroke of each gesture: where each hand surface goes, turned which way
   * and in which shape, as a function of the stroke's progress, and which
   * joints a gesture moves directly.
   *
   * Hand gestures are effector goals. Each names a hand surface, a world point
   * and a hand rotation; the gesture law transports the hand there in the
   * preparation phase and back in the retraction, and the arm is solved by
   * inverse kinematics (HumanHand). Points are built in the performer's
   * own frame (`x` left, `y` up, `z` forward from the root) from the body's
   * measure, or on a target or on the body's own face, so every gesture fits
   * any stature and proportion. A place of the air is written in the names of
   * AutoMovieMotionHumanTargetGrid.Place (a height, a lateral and a
   * distance, with a nudge in arm lengths where the stroke moves about it), a
   * hand's turn in the axes of HumanHand.Direction, and a joint angle as
   * a level of AutoMovieMotionHumanRange:
   *
   * - `wave`: the open palm faces forward beside the head, at eye height, outside
   *   the shoulder and near; the hand swings side to side `0.06` arm lengths,
   *   tilting as the forearm turns about the elbow, about 2.5 cycles a second
   *   (provisional).
   * - `raiseHand`: the open palm forward, raised from the shoulder to overhead by
   *   the extent; `cheer` raises both fists and pumps them `0.08` arm lengths.
   * - `stopPalm`: the open palm faces forward at shoulder height, inside the
   *   shoulder and far, pushed `0.05` arm lengths further in the stroke.
   * - `point`: the index fingertip on the line from the eye on the pointing side
   *   to the target, as people point (Henriques and Crawford 2002, J
   *   Neurophysiol 87:1677, found the fingertip placed on the line from the
   *   dominant eye; the side's eye is the provisional choice), at the distance
   *   where the arm reaches with `0.95` of its length, the fingers along the
   *   line and the palm down.
   * - `palmsUp`: both open palms up, forearms forward at the waist, turned a
   *   quarter of the way out, set `0.15` arm lengths out and forward and lifted
   *   `0.03` in the stroke, the offering and not-knowing gesture; `shrug` adds
   *   it under raised shoulders.
   * - `beckon`: the palm up at chest height, `0.05` arm lengths lower and nearer,
   *   while the fingers curl and open, about 1.7 cycles a second
   *   (provisional).
   * - `clap`: both palms face each other ahead of the chest, `0.1` arm lengths
   *   below and `0.17` ahead of its place, part `0.09` and meet at the midpoint
   *   on each beat, four beats a second (free applause clusters near 4 Hz,
   *   faster than the near-2 Hz synchronised rhythm, Neda et al. 2000, Nature
   *   403:849).
   * - `thumbsDown`: the fist ahead of the chest, the palm outward and the
   *   knuckles ahead and 45 degrees down, so a straight thumb, which leans
   *   toward the knuckles, points down; the elbow is asked out at the
   *   shoulder's height, which leaves the forearm a quarter turn instead of a
   *   half (provisional place, tip and elbow).
   * - `rubHands`: the palms together, sliding `0.03` arm lengths opposite ways
   *   along the fingers.
   * - `palmsTogether`: the palms pressed together ahead of the chest, the fingers
   *   up and forward, held: the clap's hand pose without its parting (a prayer,
   *   a wai or gassho greeting).
   * - `touchFace`: the index fingertip, hand flat, on a face region with the palm
   *   toward the face and the fingers up, held; `pushGlasses` slides it 12 mm
   *   up the nose bridge; `scratchHead` rubs it 15 mm on the head's side four
   *   times a second (provisional).
   *
   * Gestures of the head, shoulders and trunk are joint angles, stated by
   * gestureJoints; pointing and self-touch read the posed trunk in
   * gestureTouch; the strokes ride the signals of gestureSignal.
   * Amplitudes and distances that express the gesture's size scale with the
   * Effort extent; contact points and the pointing line do not. Each hand goal
   * widens the elbow's hanging hint by its own share of the upper arm (`out`:
   * 0.3 for a wave, 0.2 for a raised hand, a cheer and open palms, 0.1 for
   * palms together, none for the rest; provisional, read from no measured
   * source). Every value above without a source is provisional.
   */
  export import gestureStroke = gestureStrokeLaw;

  /*
   * Arm goals that put hand surfaces on their points, the contact first and the
   * hand's turn as close as the arm allows.
   *
   * A hand goal names a surface, a point and a hand rotation. Each wrist is
   * placed for the asked rotation and the surface is declared as the goal's
   * contact (`AutoMovieMotionHumanArm.goal`), so where the arm cannot turn the
   * hand as asked the posture resolver re-aims the wrist until the surface
   * stays on its point and the rotation gives way.
   * Parameter body: The body.
   * Parameter posture: The posture the arms are added to.
   * Parameter requests: One target per moving hand; a target's `curl` is not read
   * here.
   * Returns: The posture with the arm goals set.
   */
  export const handGoals: typeof handGoalsLaw = handGoalsLaw;

  /*
   * The gestures as rows: each kind of `gesture` (emblems, self-adaptors and
   * displays, Ekman and Friesen 1969) under a name of its own, with every other
   * axis of the law open (the side, the target, the count, the hold, the
   * effort), so a production composes a gesture by its name on any base and
   * carrier the law admits.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanGestureRows = HumanGestureRowsSource;

  /*
   * Emblems: gestures with a fixed meaning, each a row of a shipped action.
   * Register the ones a film uses (`HumanPerformance.IInput.laws`,
   * `HumanChain.extend`).
   */
  export import HumanEmblem = HumanEmblemSource;

  /*
   * The upper-body acts re-expressed as rows over the arm's phrases: each row
   * is `armPhrase` with its phrase, its hand and the shape of its target fixed,
   * so a gesture, a touch, a hand at rest, a hand to the face and a wipe share
   * one plan, one timing and one set of refusals, and each accepts any base,
   * carrier, side and manner the phrase law does. The rows of the older laws
   * (`gesture`, `touch`, `rest`, `handToFace`, `wipe`) stay until these rows
   * pass their verdicts; the target a touch or a wipe needs, and the prop a
   * tool row holds (`held`), are left open.
   *
   * A row is written for the right hand: the region of a side it fixes
   * (`hipRight`) is read on the acting hand's own side (`mirror`), so the same
   * row puts the left hand on the left hip.
   *
   * Every offset is a share of the arm's length (upper arm, forearm and hand)
   * in the performer's frame, so a row fits any body; the shares are
   * provisional, set from each act's description with no measured source read.
   *
   * Duration of every row (the phrase's timing, armPhrase): the hand
   * reaches its place in the free-space time of its travel and returns in as
   * long again, `0.25 + 0.5 D` seconds for `D` metres, about 0.5 s for a 0.5 m
   * reach (AutoMovieMotionHumanTiming.transport). A visit (a hand on the
   * hip, a phone to the ear, a hat on) holds the place for a beat, 0.4 s,
   * unless `hold` names another pause
   * (AutoMovieMotionHumanTiming.PAUSES). An oscillation (a wave, a rub,
   * a scratch, a stir) lasts 2 beats, 0.8 s, unless `cycles` says more.
   * `manner.pace` and the Effort `time` factor scale every phase. All of these
   * are provisional.
   */
  export import HumanUpperRows = HumanUpperRowsSource;
}
