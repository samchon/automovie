import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanArmPhrase } from "../compose/IAutoMovieMotionHumanArmPhrase";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanEffort } from "../everyday/IAutoMovieMotionHumanEffort";
import type { IAutoMovieMotionHumanGestureStroke } from "../everyday/IAutoMovieMotionHumanGestureStroke";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanHandShape } from "../posture/IAutoMovieMotionHumanHandShape";

/**
 * Gestures of the hands and arms: emblems, beats and pointing, as arm phrases.
 *
 * The family carries its fixed-parameter gestures as presets, data on
 * `AutoMovieMotionHumanGesture`: the beats and body gestures `WAVE`,
 * `RAISE_HAND`, `CHEER`, `STOP_PALM`, `POINT`, `PALMS_UP`, `BECKON`, `CLAP`,
 * `RUB_HANDS`, `PALMS_TOGETHER`, `THUMBS_DOWN`, `TOUCH_FACE`, `PUSH_GLASSES`,
 * `SCRATCH_HEAD`, `SHRUG`, `NOD`, `SHAKE_HEAD`, `BOW`, `CHIN_LIFT`,
 * `SQUARE_SHOULDERS` and `SLUMP`, read by the rows of `HumanGestureRows`; the
 * emblems `EMBLEM_PALMS_TOGETHER`, `EMBLEM_HANDS_UP`, `EMBLEM_HALT`,
 * `EMBLEM_COME_HERE`, `EMBLEM_DONT_KNOW`, `EMBLEM_THUMBS_UP`,
 * `EMBLEM_THUMBS_DOWN`, `EMBLEM_OK_SIGN`, `EMBLEM_VICTORY_SIGN`,
 * `EMBLEM_CROSSED_FINGERS`, `EMBLEM_COUNT_ONE` to `EMBLEM_COUNT_FIVE`,
 * `EMBLEM_SHAKE_FIST`, `EMBLEM_FINGER_SNAP` and `EMBLEM_AIR_QUOTES`, read by
 * the rows of `HumanEmblem`; and the arm phrases `PHRASE_*`
 * (`PHRASE_WAVE_HAND`, `PHRASE_POINT_AT`, `PHRASE_TAP_ON`, `PHRASE_FOLD_ARMS`,
 * `PHRASE_HAND_ON_HIP`, `PHRASE_PHONE_TO_EAR` and the rest of that group), read
 * by the rows of `HumanUpperRows`. A preset adds no method and is spread into
 * the parameters of `gesture` or `armPhrase`; each row and its preset share one
 * value.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanGesture` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanGesture<Chain> {
  /**
   * A communicative gesture while standing: the hand, head or trunk moves
   * through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
   * preparation from rest to the stroke's start, the stroke that carries the
   * meaning, an optional post-stroke hold, and retraction to rest.
   *
   * Overlay law: it rides a stand, a walk or a run, which yield the arms. It
   * claims the moving arms with their hands, and the head or the trunk when its
   * kind moves them, and yields nothing itself, so a second gesture on the same
   * hand cannot overlap it. It can be cut into `stand`, `walk`, `look` and
   * `gesture`, a gesture only from its `retract` instant, which is how a count
   * of one number a second is made: cut each gesture `until({ event: "retract"
   * })`.
   *
   * @param params The `balance`, `kind`, `hand`, `target`, `region`, `count`,
   *   `hold`, `depth`, `effort`, `turn`, `shape`, `aim` and `manner` of
   *   `IAutoMovieMotionHumanGesture.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  gesture(params: IAutoMovieMotionHumanGesture.IParams, anchor?: string): Chain;

  /**
   * Arm primitives: a hand surface carried to a target, kept on it and taken
   * back.
   *
   * Registered law: `registered("armPhrase", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * rides a carrier that yields its arm and hand; it can be cut into any action
   * from its `relax` instant.
   *
   * @param params The `phrase`, `target`, `offset`, `from`, `swing`, `cycles`,
   *   `mirror`, `side`, `surface`, `shape`, `facing`, `hold`, `manner`, `held`
   *   and `point` of `IAutoMovieMotionHumanArmPhrase.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  armPhrase(
    params: IAutoMovieMotionHumanArmPhrase.IParams,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the Gesture methods. */
export namespace IAutoMovieMotionHumanGesture {
  /** The `gesture` parameters a preset fixes: `kind`. */
  export type IGestureKindPreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind"
  >;

  /** The `gesture` parameters a preset fixes: `kind`, `shape`, `turn`, `aim`. */
  export type IGestureKindShapeTurnAimPreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "shape" | "turn" | "aim"
  >;

  /** The `gesture` parameters a preset fixes: `kind`, `shape`, `aim`. */
  export type IGestureKindShapeAimPreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "shape" | "aim"
  >;

  /** The `gesture` parameters a preset fixes: `kind`, `shape`. */
  export type IGestureKindShapePreset = Pick<
    IAutoMovieMotionHumanGesture.IParams,
    "kind" | "shape"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `mirror`,
   * `offset`, `swing`, `count`, `facing`.
   */
  export type IArmPhrasePhraseTargetMirrorOffsetSwingCountFacingPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "swing" | "count" | "facing"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `mirror`,
   * `offset`, `facing`, `hold`.
   */
  export type IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "facing" | "hold"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `surface`, `shape`,
   * `hold`.
   */
  export type IArmPhrasePhraseSurfaceShapeHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "hold"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `surface`, `shape`,
   * `swing`, `count`.
   */
  export type IArmPhrasePhraseSurfaceShapeSwingCountPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "swing" | "count"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `surface`, `shape`,
   * `from`.
   */
  export type IArmPhrasePhraseSurfaceShapeFromPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "surface" | "shape" | "from"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `mirror`,
   * `surface`, `shape`, `hold`.
   */
  export type IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "surface" | "shape" | "hold"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `surface`,
   * `shape`, `hold`.
   */
  export type IArmPhrasePhraseTargetSurfaceShapeHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "hold"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `surface`,
   * `shape`, `from`.
   */
  export type IArmPhrasePhraseTargetSurfaceShapeFromPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "from"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `surface`,
   * `shape`, `swing`, `count`.
   */
  export type IArmPhrasePhraseTargetSurfaceShapeSwingCountPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "swing" | "count"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `hand`, `target`,
   * `offset`, `swing`, `count`, `facing`.
   */
  export type IArmPhrasePhraseHandTargetOffsetSwingCountFacingPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "swing" | "count" | "facing"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `hand`, `target`,
   * `offset`, `facing`, `hold`.
   */
  export type IArmPhrasePhraseHandTargetOffsetFacingHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "facing" | "hold"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `hand`, `target`,
   * `offset`, `shape`, `facing`, `hold`.
   */
  export type IArmPhrasePhraseHandTargetOffsetShapeFacingHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "hand" | "target" | "offset" | "shape" | "facing" | "hold"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `mirror`,
   * `offset`, `shape`, `facing`, `hold`.
   */
  export type IArmPhrasePhraseTargetMirrorOffsetShapeFacingHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "mirror" | "offset" | "shape" | "facing" | "hold"
  >;

  /**
   * The `armPhrase` parameters a preset fixes: `phrase`, `target`, `surface`,
   * `shape`, `point`, `hold`.
   */
  export type IArmPhrasePhraseTargetSurfaceShapePointHoldPreset = Pick<
    IAutoMovieMotionHumanArmPhrase.IParams,
    "phrase" | "target" | "surface" | "shape" | "point" | "hold"
  >;
}

/**
 * A communicative gesture while standing: the hand, head or trunk moves through
 * Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind): preparation from
 * rest to the stroke's start, the stroke that carries the meaning, an optional
 * post-stroke hold, and retraction to rest.
 *
 * The feet stay planted and the body stands as the stand law places it;
 * performed over a carrier (a walk, a seat, a ride) the body is the carrier's,
 * instant by instant, and the gesture takes only the parts it moves. Each
 * moving hand is an effector goal ({@link gestureStroke}), solved by inverse
 * kinematics with a natural elbow hint widened by the gesture and the Effort;
 * the moving arms are planned over the whole gesture as one trajectory
 * (`gestureHands.planned`): from what the entry left to the stroke's goals in
 * the preparation, on them through the stroke, and back to the relaxed hanging
 * arm's in the retraction, while the fingers take the gesture's shape and leave
 * it on the same share. Head, shoulder and trunk gestures add their joint
 * angles under an envelope that rises in the preparation and falls in the
 * retraction; a bow pitches the whole trunk about the hips by its depth (15, 30
 * or 45 degrees are the conventional light, ordinary and deep bows) while the
 * hips move back to keep the body balanced over the feet
 * ({@link HumanBalance}).
 *
 * Transport time is the free-space time of the distance moved
 * (`AutoMovieMotionHumanTiming.transport`), 0.3 s for head and shoulder
 * gestures and one second per 30 degrees of a bow (provisional). The Effort's
 * tempo scales every phase, its extent the gesture's size and its elbow term
 * the arm's width ({@link HumanEffort}).
 *
 * The plan names the hands it moves (`hands`), so a gesture with a hand that
 * holds a prop is refused, naming the free hand.
 *
 * Events: `prepare`, `strokeStart`, `strokeEnd`, `retract`. A gesture may be
 * cut into another during its retraction, making a gesture unit, and into
 * standing or moving before its stroke or after it; its stroke is never cut,
 * since a cut stroke loses the gesture's meaning.
 */
export namespace IAutoMovieMotionHumanGesture {
  /**
   * Parameters of a gesture: which gesture, which hand, what it points at or
   * touches, how many strokes, the hold, a bow's depth and the movement
   * quality.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The gesture. */
    kind: IAutoMovieMotionHumanGestureStroke.Kind;

    /** The hand of a one-hand gesture; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** What to point at; required by `point`. */
    target?: IAutoMovieMotionTarget;

    /** The face region a `touchFace` reaches; `forehead` when absent. */
    region?: IAutoMovieMotionHumanGestureStroke.FaceRegion;

    /**
     * Stroke repetitions (waves, nods, claps), a whole number of at least 1;
     * the gesture's own count when absent.
     */
    count?: number;

    /**
     * Post-stroke hold, seconds, at least 0, between the stroke and the
     * retraction; 0 when absent: the hand retracts at once. A beat is
     * `AutoMovieMotionHumanTiming.PAUSES`. The timing of the other phases is on
     * the `gesture` namespace.
     */
    hold?: number;

    /**
     * A bow's depth, degrees in (0, gesture.DEEPEST_BOW], about 82 (two
     * deviations past the measured mean, Kawabata et al. 2009), refused outside
     * that range only for a bow, so it carries no schema bound; 30 when
     * absent.
     */
    depth?: number;

    /**
     * Laban Effort ({@link IAutoMovieMotionHumanEffort.IEffort}): `time`
     * multiplies every phase by `1 - 0.3 time` (0.7 sudden, 1.3 sustained),
     * `weight` and `flow` the gesture's size, `flow` the elbow width; neutral
     * when absent. The coefficients are provisional.
     */
    effort?: IAutoMovieMotionHumanEffort.IEffort;

    /**
     * Degrees the moving hands are turned in the plane of their own palms from
     * the gesture's attitude, the thumb's side rising for a positive turn
     * (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter
     * turn stands a held-out fist's thumb up, the opposite one points it down.
     * No turn when absent.
     */
    turn?: number;

    /**
     * A hand shape with a meaning of its own, taken by the moving hands in
     * place of the gesture's working shape: a thumbs up, an OK ring, a V, a
     * count; the gesture's own shape when absent.
     */
    shape?: IAutoMovieMotionHumanHandShape.Emblem;

    /**
     * A digit of `shape` aimed straight at the world's up or down: the moving
     * hands turn by the least rotation from the gesture's attitude, after
     * `turn`, that points the digit's own direction (`HumanHandShape.digit`)
     * there, since a straight digit does not lie along the hand's axes (a
     * thumbs up's thumb stands about 35 degrees off the knuckle line). Requires
     * `shape`; no aim when absent.
     */
    aim?: {
      /** Digit extended for the directed hand gesture. */
      digit: "thumb" | "forefinger";
      /** Whether that digit points upward or downward. */
      toward: "up" | "down";
    };

    /**
     * How much repeats of the gesture differ: `variation` in [0, 1] scales the
     * spread of the preparation's length and of where a `wave` or a `stopPalm`
     * holds the hand within its named place, and `proficiency` replaces the
     * performer's skill for those spreads. Absent or 0, every repeat is the
     * same.
     */
    manner?: Pick<IAutoMovieMotionManner, "variation" | "consistency">;
  }
}
