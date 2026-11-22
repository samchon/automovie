import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanLook } from "../everyday/IAutoMovieMotionHumanLook";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * An overlay: where the eyes and head look. It layers on any whole-body action.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Gaze family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Gaze laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanGaze<Chain> {
  /**
   * Standing and turning the eyes, head and trunk to a target, either at once or, when cued by something seen or heard, after a seeded reaction time: the orienting response of a bystander.
   *
   * @param params The `target`, `with`, `cue` and `seconds` of `IAutoMovieMotionHumanLook.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaze.look is provided by the chain that implements IAutoMovieMotionHumanGaze.
   */
  look(params: IAutoMovieMotionHumanGaze.ILookParams, anchor?: string): Chain;
}

/**
 * The parameter types of the Gaze methods.
 */
export namespace IAutoMovieMotionHumanGaze {
  /**
   * The parameters of `look`: the law's own `IAutoMovieMotionHumanLook.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLook` owns the type; the alias serves this family's `look` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `look` takes the type its law reads.
   */
  export type ILookParams = IAutoMovieMotionHumanLook.IParams;
}

/**
 * Gaze as a goal: the eyes' lines brought onto a target, with the eyes, the
 * head and neck and the trunk recruited in that order as the target lies
 * farther from where the body faces.
 *
 * Gaze shifts recruit the eyes first and the head only beyond a threshold:
 * Freedman (2008, Exp Brain Res 190:369) reviews head-unrestrained gaze
 * shifts in which the head contributes little below about 15 to 20 degrees
 * and an increasing share beyond; Hollands, Ziavra and Bronstein (2004, Exp
 * Brain Res 154:261) find that large turns recruit the eyes, head, trunk and
 * feet in that order. The split here keeps the final eye-in-head eccentricity
 * at most `EYES` (15 degrees) on each axis, gives the head and neck the
 * remainder up to `HEAD` (provisional comfortable cervical share: 60 degrees
 * of yaw, 40 down and 30 up, inside `DEFAULT_HUMANOID_ROM`), and, when the
 * trunk may join, gives the chest and lumbar spine the yaw beyond that up to
 * `TRUNK` (40 degrees, provisional, inside their combined twist range), 60 %
 * to the chest and 40 % to the spine. What none of these can hold stays on
 * the eyes, clamped to their range, so a gaze too far behind the body is
 * visibly short; turning the feet is the `look` action's step-turn.
 *
 * The head and neck angles come from the engine's `gazeChainJoints`, which
 * splits one aim over the neck and the head inside their ranges; the eyes are
 * then solved exactly: each eye's direction to the target is read in its
 * head's frame by forward kinematics of the trunk and head, and turned into
 * the eye's twist (yaw) and flexion (pitch), which compose as twist then
 * flexion in the default joint basis (`jointToQuaternion`), so the eye's
 * forward meets the target exactly within the eye's range.
 *
 * Timing: the eyes move on the saccadic main sequence, duration `2.2 A + 21`
 * milliseconds for an amplitude of `A` degrees (Bahill, Clark and Stark 1975,
 * Math Biosci 24:191; Carpenter 1988), and the head and trunk on a
 * minimum-jerk profile of `0.15 + 0.004 A` seconds (provisional: head
 * movements are slower than saccades and lengthen with amplitude, Zangemeister
 * and Stark 1981; the coefficients are unmeasured). Because the eyes are
 * re-solved against the moving head on every frame, they hold the target
 * while the head catches up, as the vestibulo-ocular reflex does, and a moving
 * target is pursued.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Seconds since the action's start from which the head is written. to: Seconds since the action's start until which the head is written. to: Film second the gaze returns to the body's own direction; never when absent.
 * @evidence contracts/development/design.md#principled-representation from: Seconds since the action's start from which the head is written. to: Seconds since the action's start until which the head is written. to: Film second the gaze returns to the body's own direction; never when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/glance.ts (glance, recruit); compose/lookPrimitive.ts (lookPrimitive, props); compose/glance.ts (glance, target); everyday/HumanConversation.ts (HumanConversation.gaze, return); everyday/HumanConversation.ts (HumanConversation.share, requests); everyday/HumanConversation.ts (HumanConversation.share, r).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieVector3, IAutoMovieMotionHumanBody, IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGaze {
  /**
   * Which segments a gaze may recruit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Which segments a gaze may recruit.
   * @evidence contracts/development/design.md#principled-representation Closed choices "auto", "eyes", "head", "trunk" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.split, recruit); everyday/HumanGaze.ts (HumanGaze.aim, recruit); everyday/look.ts (look.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanGaze.split.
   */
  export type Recruit = "auto" | "eyes" | "head" | "trunk";

  /**
   * Which segments a gaze primitive may recruit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Says what the union decides.
   * @evidence contracts/development/design.md#principled-representation A gaze shift is made by the eyes alone or by the eyes and the head, the two cases the head channel can write.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by `look`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed literal union; the trunk is not a member because this primitive does not own it.
   */
  export type HeadRecruit = "eyes" | "head";

  /**
   * What is looked at, as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each argument, when the function is called and the result's frame and unit.
   * @evidence contracts/development/design.md#principled-representation What is looked at may move or ride on the performer, so it is a function of the posture so far and the time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One function type, taken by both gaze primitives.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed point is the constant function, so there is no second form for it.
   */
  export type Frame = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieVector3;

  /**
   * A gaze over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The span the head is written over, what is looked at, which segments join and how far they have gone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `look`; `glance` fills them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight is a function of seconds and not a named easing.
   */
  export interface ILook {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** Which segments may join. */
    recruit: IAutoMovieMotionHumanGaze.HeadRecruit;

    /** Seconds since the action's start from which the head is written. */
    from: number;

    /** Seconds since the action's start until which the head is written. */
    to: number;

    /** What is looked at. */
    target: IAutoMovieMotionHumanGaze.Frame;

    /**
     * How far the eyes and the head have moved from where the posture has
     * them toward the target.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, and that the result is a share in [0, 1].
     * @evidence contracts/development/implementation.md#principled-implementation The share is a pure function of the seconds, so any time course fits one member and the reader evaluates it at each second it needs.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by the function that writes the part; the builders from a clock fill it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reader clamps the result to [0, 1] instead of trusting the member, so an implementation that overshoots cannot push the part past its ends.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    weight(seconds: number): number;
  }

  /**
   * A participant's gaze requests through a conversation. A gaze layer's request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation to: Film second the gaze returns to the body's own direction; never when absent. with: Which segments may join; `auto` when absent.
   * @evidence contracts/development/design.md#principled-representation to: Film second the gaze returns to the body's own direction; never when absent. with: Which segments may join; `auto` when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanConversation.ts (HumanConversation.gaze, return); everyday/HumanConversation.ts (HumanConversation.share, requests); everyday/HumanConversation.ts (HumanConversation.share, r); everyday/HumanGaze.ts (HumanGaze.layer, requests); everyday/HumanGaze.ts (HumanGaze.layer, request); lexicon/HumanPursuit.ts (HumanPursuit.glances, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanGaze.Recruit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ILayer {
    /** What to look at, resolved through the layer's context. */
    target: IAutoMovieMotionTarget;

    /** Film second when the shift starts. */
    from: number;

    /** Film second when the gaze returns; omitted, it continues tracking. */
    to?: number;

    /** Which segments may join; auto when omitted. */
    with?: IAutoMovieMotionHumanGaze.Recruit;
  }

  /**
   * A split of one gaze direction, degrees: yaw positive toward the performer's left, pitch positive down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation eyes: Eye-in-head direction at the end of the shift. yaw:  pitch:
   * @evidence contracts/development/design.md#principled-representation eyes: Eye-in-head direction at the end of the shift. yaw:  pitch:
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.split, return); everyday/HumanGaze.ts (HumanGaze.aim); everyday/HumanGaze.ts (HumanGaze.layer); everyday/look.ts (look.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanGaze.split.
   */
  export interface ISplit {
    /** Eye-in-head yaw and pitch at the end of the shift, degrees. */
    eyes: {
      /** Yaw in degrees, positive toward the performer's left. */
      yaw: number;
      /** Pitch in degrees, positive downward. */
      pitch: number;
    };

    /** Combined head/neck yaw and pitch, degrees. */
    head: {
      /** Yaw in degrees, positive toward the performer's left. */
      yaw: number;
      /** Pitch in degrees, positive downward. */
      pitch: number;
    };

    /** Trunk yaw, degrees. */
    trunk: number;
  }

  /**
   * The direction of a world point from the eyes' midpoint, as yaw and pitch about the posture's hips frame. Result returned by HumanGaze.direction. Yaw (positive left) and pitch (positive down), degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation yaw: Yaw in degrees, positive toward the performer's left. pitch: Pitch in degrees, positive downward.
   * @evidence contracts/development/design.md#principled-representation yaw: Yaw in degrees, positive toward the performer's left. pitch: Pitch in degrees, positive downward.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.direction, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanGaze.direction.
   */
  export type IDirectionResult = {
    /** Yaw in degrees, positive toward the performer's left. */
    yaw: number;
    /** Pitch in degrees, positive downward. */
    pitch: number;
  };

  /**
   * The posture with its gaze on a point: trunk and head blended toward their shares by `weights`, then each eye solved exactly against the head it rides and blended by its own weight. Input weights of HumanGaze.aim. How far each part has moved toward its share, each in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation eyes: Progress in [0, 1] of the eyes toward its assigned share of the aimed pose. head: Progress in [0, 1] of the head toward its assigned share of the aimed pose. trunk: Progress in [0, 1] of the trunk toward its assigned share of the aimed pose.
   * @evidence contracts/development/design.md#principled-representation eyes: Progress in [0, 1] of the eyes toward its assigned share of the aimed pose. head: Progress in [0, 1] of the head toward its assigned share of the aimed pose. trunk: Progress in [0, 1] of the trunk toward its assigned share of the aimed pose.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.aim, weights).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanGaze.aim.
   */
  export type IAimWeights = {
    /** Progress in [0, 1] of the eyes toward its assigned share of the aimed pose. */
    eyes: number;
    /** Progress in [0, 1] of the head toward its assigned share of the aimed pose. */
    head: number;
    /** Progress in [0, 1] of the trunk toward its assigned share of the aimed pose. */
    trunk: number;
  };
}
