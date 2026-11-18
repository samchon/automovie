import type { IAutoMovieRandom } from "../../../core/IAutoMovieRandom";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IAutoMovieMotionHumanAttribute } from "../ensemble/IAutoMovieMotionHumanAttribute";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";
import type { AutoMovieMotionHumanScheduledInstant } from "./AutoMovieMotionHumanScheduledInstant";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";

/**
 * An additive layer over whatever action a person performs: gaze, breathing,
 * an affect display. A layer never starts, cuts or ends an action; it takes
 * the active action's posture at a film second and returns it with its own
 * contribution added, the way layered animation adds an additive pose on top
 * of a base locomotion (Unreal's layered blend per bone, Unity's additive
 * animator layers).
 *
 * A layer must keep every planted or gripping limb goal unchanged, because
 * contacts are re-solved from those goals and must not slide; it should
 * change joints a body action leaves free (the eyes, the head, the chest's
 * breathing) or add small offsets to the root and the trunk. Its draws come
 * from `random`, keyed by the performer and the layer's name.
 *
 * A layer runs for the whole film, or inside a window the performance is
 * given with it ({@link IAutoMovieMotionHumanLayer.IScheduled}): from and to a film second
 * or an instant of an action or of a cue track, entered and left over a
 * fade so neither end steps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation channels: The channels whose joints the layer writes: the head and the trunk for gaze, breath and an affect display, an arm for a mood that lets it hang. A layer scheduled in a window during which one of the person's actions holds a limb channel it names by a contact (a grip on that hand, a planted foot of that leg) is refused when the performance is built; the head and the trunk bear no contact window, so naming them refuses nothing. Absent for a layer that does not say what it writes. attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral. events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.
 * @evidence contracts/development/design.md#principled-representation channels: The channels whose joints the layer writes: the head and the trunk for gaze, breath and an affect display, an arm for a mood that lets it hang. A layer scheduled in a window during which one of the person's actions holds a limb channel it names by a contact (a grip on that hand, a planted foot of that leg) is refused when the performance is built; the head and the trunk bear no contact window, so naming them refuses nothing. Absent for a layer that does not say what it writes. attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral. events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanAffect.ts (HumanAffect.layer, return); everyday/HumanBreath.ts (HumanBreath.layer, return); everyday/HumanGaze.ts (HumanGaze.layer, return); lexicon/HumanAirborneShape.ts (HumanAirborneShape.layer, return); lexicon/HumanCarriedLean.ts (HumanCarriedLean.layer, return); lexicon/HumanCarriedLean.ts (HumanCarriedLean.coupled, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanChannel, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSkill, IAutoMovieMotionHumanAttribute.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanLayer {
  /** Stable layer name, unique per performer; keys the layer's draws. */
  name: string;

  /**
   * The channels whose joints the layer writes: the head and the trunk for
   * gaze, breath and an affect display, an arm for a mood that lets it hang.
   * A layer scheduled in a window during which one of the person's actions
   * holds a limb channel it names by a contact (a grip on that hand, a
   * planted foot of that leg) is refused when the performance is built; the
   * head and the trunk bear no contact window, so naming them refuses
   * nothing. Absent for a layer that does not say what it writes.
   */
  channels?: readonly AutoMovieMotionHumanChannel[];

  /**
   * The posture with this layer's contribution added.
   *
   * @param posture The active action's posture, after earlier layers.
   * @param seconds Film seconds.
   * @param context The person and the performance's queries.
   * @returns The layered posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanLayer.apply: The posture with this layer's contribution added.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanLayer.apply is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanLayer.apply is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanLayer.apply is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanLayer.apply is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanLayer.apply is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanLayer.apply is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
   */
  apply(
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    context: IAutoMovieMotionHumanLayer.IContext,
  ): IAutoMovieMotionHumanPosture;
}

/**
 * Contracts used by HumanAffect.layer, HumanBreath.layer, HumanGaze.layer, HumanAirborneShape.layer.
 *
 */
export namespace IAutoMovieMotionHumanLayer {
  /**
   * What a layer can read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral.
   * @evidence contracts/development/design.md#principled-representation attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanBreath.ts (HumanBreath.layer, context); everyday/HumanGaze.ts (HumanGaze.layer, context); lexicon/HumanAirborneShape.ts (HumanAirborneShape.layer, context).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSkill, IAutoMovieMotionHumanAttribute.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IContext {
    /** The person's subject id. */
    subject: string;

    /** The person's body. */
    body: IAutoMovieMotionHumanBody;

    /** The person's skill. */
    skill: IAutoMovieMotionHumanSkill;

    /** The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral. */
    attributes?: Readonly<
      Partial<Record<IAutoMovieMotionHumanAttribute.Name, number>>
    >;

    /**
     * Exact FK metadata borrowed only during this synchronous layer apply.
     * Call lazily for the same unchanged body; neither the reader nor this
     * getter may be stored in a plan, output posture or callback. The host
     * revokes its borrowed source on return or throw; a retained getter then
     * creates an independent fresh reader rather than retaining the source.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanLayer.IContext.resolution: Exact FK metadata borrowed only during this synchronous layer apply.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; its producer supplies resolution and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to its producer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; its producer keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; its producer owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; its producer owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; its producer owns what it retains and releases.
     */
    resolution?: () => IAutoMoviePoseResolution;

    /**
     * Genuine same-body direct ROM projection, borrowed only during apply; the host revokes this getter's source on return/throw and later reads create independent cold metadata. Never retain the returned projector.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanLayer.IContext.projection: Genuine same-body direct ROM projection, borrowed only during apply.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; its producer supplies projection and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to its producer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; its producer keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; its producer owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; its producer owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; its producer owns what it retains and releases.
     */
    projection?: () => (pose: IAutoMoviePose) => IAutoMoviePose;

    /**
     * A target's world point and outward normal at a film second.
     *
     * @param target The target.
     * @param seconds Film seconds.
     * @returns The aim.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanLayer.IContext.aim: A target's world point and outward normal at a film second.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanLayer.IContext.aim is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanLayer.IContext.aim is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanLayer.IContext.aim is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanLayer.IContext.aim is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanLayer.IContext.aim is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanLayer.IContext.aim is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     */
    aim(
      target: IAutoMovieMotionTarget,
      seconds: number,
    ): {
      /** Resolved target point in world metres. */
      point: IAutoMovieVector3;
      /** Resolved target's outward surface normal in world coordinates. */
      normal: IAutoMovieVector3;
    };

    /**
     * The action the person performs at the second applied, so a layer can
     * follow it: gaze ahead of a turn, breath after an effort.
     *
     * @returns The action, or undefined before the person's first.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanLayer.IContext.action: The action the person performs at the second applied, so a layer can follow it: gaze ahead of a turn, breath after an effort.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanLayer.IContext.action is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanLayer.IContext.action is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanLayer.IContext.action is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanLayer.IContext.action is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanLayer.IContext.action is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanLayer.IContext.action is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     */
    action(): IAutoMovieMotionHumanLayer.IAction | undefined;

    /**
     * The layer's draw stream for one channel.
     *
     * @param channel The quantity drawn.
     * @returns The stream.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanLayer.IContext.random: The layer's draw stream for one channel.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanLayer.IContext.random is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanLayer.IContext.random is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanLayer.IContext.random is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanLayer.IContext.random is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanLayer.IContext.random is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanLayer.IContext.random is used through packages/motions/src/perform/HumanPerformanceLayers.ts.
     */
    random(channel: string): IAutoMovieRandom;
  }

  /**
   * The action a person performs at the second a layer is applied.
   *
   * @evidence contracts/development/common.md#meaningful-documentation events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.
   * @evidence contracts/development/design.md#principled-representation events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanSegmentPose.ts (HumanSegmentPose.layered.action, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IAction {
    /** Its name. */
    name: AutoMovieMotionHumanActionKey;

    /** The action it is a row of; its own name when it is none. */
    family: AutoMovieMotionHumanActionKey;

    /** Film second it became active. */
    from: number;

    /** Film second it stops. */
    to: number;

    /** Its events, in film seconds. */
    events: readonly {
      /** Event name exposed to synchronisation queries. */
      name: string;
      /** Event instant in film seconds. */
      seconds: number;
    }[];

    /** Its contact windows, as shares of its own duration. */
    contacts: readonly IAutoMovieMotionHumanContactWindow[];
  }

  /**
   * A layer's window in film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation from: The second it starts. to: The second it ends.
   * @evidence contracts/development/design.md#principled-representation from: The second it starts. to: The second it ends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanPursuit.ts (HumanPursuit.sweeps, window).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanPursuit.sweeps.
   */
  export interface IWindow {
    /** The second it starts. */
    from: number;

    /** The second it ends. */
    to: number;
  }

  /**
   * A layer with the window it runs in.
   *
   * The layer is given as it is, or as a function of the window's seconds
   * for one that times itself inside it: a sigh when a partner's exit ends
   * is `{ from: { of: "exit", event: "end" }, layer: (w) => HumanAffect.layer([{ kind: "sigh", at: w.from }]) }`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation layer: The layer, or what builds it from the window's seconds. from: When it starts; the film's start when absent. to: When it ends; the film's end when absent.
   * @evidence contracts/development/design.md#principled-representation layer: The layer, or what builds it from the window's seconds. from: When it starts; the film's start when absent. to: When it ends; the film's end when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanPursuit.ts (HumanPursuit.sweeps, return); perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window, scheduled); perform/HumanPerformanceState.ts (HumanPerformanceState, layer).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLayer, IAutoMovieMotionHumanLayer.IWindow, AutoMovieMotionHumanScheduledInstant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IScheduled {
    /** The layer, or what builds it from the window's seconds. */
    layer:
      | IAutoMovieMotionHumanLayer
      | ((
          window: IAutoMovieMotionHumanLayer.IWindow,
        ) => IAutoMovieMotionHumanLayer);

    /** When it starts; the film's start when absent. */
    from?: AutoMovieMotionHumanScheduledInstant;

    /** When it ends; the film's end when absent. */
    to?: AutoMovieMotionHumanScheduledInstant;

    /** Seconds over which it comes in after `from` and goes out before `to`; an overlay's fade (`HumanSegment.FADE`) when absent. */
    fade?: number;

    /**
     * A name under which the layer's own instants are addressed like an
     * action's events: `onset` (it starts coming in), `full` (it is fully
     * in), `offset` (it starts going out) and `end` (it is gone). A later
     * layer's window names them (`{ of: anchor, event: "full" }`), and
     * `HumanPerformance.instant` reads them. An action is synced to them or
     * cut on them only when the window does not itself wait for an action:
     * its `from` and `to` are then film seconds or instants of cue tracks,
     * known before any action is placed. The name is unique among anchors,
     * cue tracks and other layers.
     */
    anchor?: string;
  }
}
