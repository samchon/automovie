import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanGaze } from "../next/IAutoMovieMotionHumanGaze";

/**
 * Standing and turning the eyes, head and trunk to a target, either at once
 * or, when cued by something seen or heard, after a seeded reaction time:
 * the orienting response of a bystander.
 *
 * The feet stay planted where they are (the stand law places the body), and
 * the gaze goal is the eyes' lines on the target, recruited eyes, head and
 * trunk in that order ({@link HumanGaze}); the target is tracked while the
 * action lasts. Use the gaze layer to look while doing something else; this
 * action is for a gaze that is the whole performance or that must turn the
 * trunk.
 *
 * An uncued look at a target outside the 120 degree field the performer
 * attends ahead (60 degrees either side of the heading) is refused: nothing
 * there could have drawn the look, so the author declares the cue. A cue
 * delays the shift by a simple reaction time drawn from an ex-Gaussian, the
 * distribution simple reaction times follow (Hohle 1965, J Exp Psychol
 * 69:382): a visual cue `seen` with mu, sigma and tau of 260, 35 and 70 ms
 * for a novice to 220, 25 and 40 ms for an elite on the `reaction` axis, and
 * an acoustic `signal` 40 ms faster in mu, since simple auditory reaction is
 * faster than visual by a few tens of milliseconds (Welford 1980, Reaction
 * Times). The values are provisional: they place the mean inside the 200 to
 * 300 ms of simple visual reaction in adults, and no study located measures
 * orienting onset by skill.
 *
 * Events: `gazeOn`, when the eyes reach the target, and `settled`, when the
 * head and trunk end their turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation recruit: Which segments may join; `auto` when absent. cue: What drew the look; an immediate, willed look when absent. duration: How long the action lasts, seconds; 0.6 s after `settled` when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation recruit: Which segments may join; `auto` when absent. cue: What drew the look; an immediate, willed look when absent. duration: How long the action lasts, seconds; 0.6 s after `settled` when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.look, params); everyday/look.ts (look.plan, context); everyday/look.ts (look.reactionLaw, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanGaze.Recruit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLook {
  /**
   * Parameters of a look: the target, which segments may join, the cue that
   * drew the look and how long the action lasts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its meaning, unit and the default an absent value takes, including that an absent cue means an immediate willed look.
   * @evidence contracts/development/design.md#principled-representation The target is the shared motion target union, tracked every instant; the recruitment is HumanGaze's closed union; the cue is a closed union of the two sensory channels whose reaction times differ; the duration is seconds, and a non-positive one is refused at plan time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by this law and read only by its plan; the target and recruitment types are imported from their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No field names a scene or body; the one invalid combination, an uncued target outside the attended field, depends on where the target is at the start and is refused at plan time.
   */
  export interface IParams {
    /** What to look at. */
    target: IAutoMovieMotionTarget;

    /** Which segments may join; `auto` when absent. */
    recruit?: IAutoMovieMotionHumanGaze.Recruit;

    /** What drew the look; an immediate, willed look when absent. */
    cue?: "seen" | "signal";

    /** How long the action lasts, seconds, positive; 0.6 s after `settled` when absent. */
    duration?: number;
  }
}
