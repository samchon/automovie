import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieSwivelSeed } from "../../../pose/IAutoMovieSwivelSeed";
import type { IAutoMovieSkeletonPoseResolution } from "../../../pose/IAutoMovieSkeletonPoseResolution";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { AutoMovieMotionHumanChannelClaim } from "../compose/AutoMovieMotionHumanChannelClaim";
import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanInterruptRow } from "../law/IAutoMovieMotionHumanInterruptRow";
import type { IAutoMovieMotionHumanLayer } from "../law/IAutoMovieMotionHumanLayer";
import type { AutoMovieHumanLimb } from "../posture/AutoMovieHumanLimb";
import type { IAutoMovieHumanLimbReference } from "../posture/IAutoMovieHumanLimbReference";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";

/**
 * One scheduled and planned human action with its law, context, film placement and optional transition from another segment. Performance evaluation and motion audits share this identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation One scheduled and planned human action with its law, context, film placement and optional transition from another segment. Performance evaluation and motion audits share this identity.
 * @evidence contracts/development/design.md#principled-representation entry: The schedule entry's walk-order index. start: Film second of the law's time zero. blend: Offset decay time, seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Performance placement creates planned segments consumed by pose evaluation, overlays, prop contacts and audits; caches and carried-grip work state remain nested evaluator helpers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Film placement and the plan's action-local clock stay separate, and a transition explicitly references its source segment. The performance scheduler owns admission and recursive evaluation guards.
 */
export interface IAutoMovieMotionHumanSegment {
  /** Order within the person's actions. */
  index: number;

  /** The schedule entry's walk-order index. */
  entry: number;

  /** The action's stable id: its anchor or its name. */
  id: string;

  /** The action. */
  name: AutoMovieMotionHumanActionKey;

  /** Its parameters. */
  params: object;

  /** Its law. */
  law: IAutoMovieMotionHumanActionLaw<never>;

  /** The context it was planned in. */
  context: IAutoMovieMotionHumanActionContext<never>;

  /** Its plan. */
  plan: IAutoMovieMotionHumanActionPlan;

  /** Film second of the law's time zero. */
  start: number;

  /** Film second it becomes active. */
  entryTime: number;

  /** Film second it stops: its cut or its end. */
  end: number;

  /** The transition that entered it, when it follows another action. */
  transition?: {
    /** Transition kind. */
    kind: IAutoMovieMotionHumanInterruptRow["kind"];
    /** Offset decay time, seconds. */
    blend: number;
    /** The action it follows. */
    source: IAutoMovieMotionHumanSegment;
    /** Film second of the cut. */
    cut: number;
    /** The offset, captured on first use. */
    offset?: (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose;
  };

  /**
   * Each limb's seed of the action's last displayed leaf resolve, held for
   * the next one's swept fits as their bounded search's incumbent
   * (`IAutoMovieFitChainToTargetProps.incumbent`), which cannot change their
   * answer; absent until a leaf resolve, and released when the person's memos
   * are forgotten.
   */
  incumbents?: Readonly<Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>>;
}

/** Operation-local contracts supporting IAutoMovieMotionHumanSegment. */
export namespace IAutoMovieMotionHumanSegment {
  /**
   * One action placed over a carrier.
   *
   * @evidence contracts/development/common.md#meaningful-documentation channels: The channels, or single digits, it takes from the carrier.
   * @evidence contracts/development/design.md#principled-representation channels: The channels, or single digits, it takes from the carrier.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformance.ts (HumanPerformance.overlays, return); perform/HumanPerformanceRead.ts (HumanPerformanceRead.overlays, return); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build, used); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build.tag, o); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build, o); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.contactGoals, overlay).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanChannelClaim identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IOverlay extends IAutoMovieMotionHumanSegment {
    /** The channels, or single digits, it takes from the carrier. */
    channels: readonly AutoMovieMotionHumanChannelClaim[];
  }

  /**
   * One person's state in a performance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation stops: Resolved stops of this person's weapons, film seconds, keyed by `weapon(segment, id)`.
   * @evidence contracts/development/design.md#principled-representation stops: Resolved stops of this person's weapons, film seconds, keyed by `weapon(segment, id)`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.hold, person); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts.nearest, owner); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts.events, person); perform/HumanPerformanceFlight.ts (HumanPerformanceFlight.flights, people); perform/HumanPerformanceFlight.ts (HumanPerformanceFlight.flight, person); perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window, person).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanSkill, IAutoMovieMotionHumanSegment, IAutoMovieMotionHumanSegment.IOverlay, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPerson {
    /** The performer. */
    performer: IAutoMovieMotionHumanPerformer;

    /** The resolved skill. */
    skill: IAutoMovieMotionHumanSkill;

    /** Placed actions, in film order. */
    segments: IAutoMovieMotionHumanSegment[];

    /** Actions placed over those, in placement order: each takes its claimed channels from the carrier while it runs. */
    overlays: IAutoMovieMotionHumanSegment.IOverlay[];

    /** The standing posture before the first action. */
    initial: IAutoMovieMotionHumanPosture;

    /** Displayed poses already evaluated, by film second; bounded to 4096 entries. */
    cache: Map<number, IAutoMovieMotionHumanSegment.IShown>;

    /** Whether the schedule is still being resolved: nothing is cached meanwhile, because another person's actions may not be placed yet. */
    resolving: boolean;

    /**
     * Displayed poses read while one action is being planned, by film second
     * (`planning`): what is placed does not change during one plan, so its
     * readers share each pose; absent outside a plan.
     */
    planning?: Map<number, IAutoMovieMotionHumanSegment.IShown>;

    /** Additive layers over the person's actions, in order, each inside its window. */
    layers: IAutoMovieMotionHumanSegment.ILayered[];

    /** What a layer can read. */
    layer: IAutoMovieMotionHumanLayer.IContext;

    /** Props this person's actions left held, in placement order. */
    holds: IAutoMovieMotionHumanSegment.IHeld[];

    /** Resolved stops of this person's weapons, film seconds, keyed by `weapon(segment, id)`. */
    stops: Map<string, number>;
  }

  /**
   * A layer and the film seconds it runs in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation fade: Seconds over which it comes in and goes out.
   * @evidence contracts/development/design.md#principled-representation fade: Seconds over which it comes in and goes out.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window, return); perform/HumanPerformanceState.ts (HumanPerformanceState, return); perform/HumanSegmentPose.ts (HumanSegmentPose.layered, { layer, from, to, fade }).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLayer identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ILayered {
    /** The layer. */
    layer: IAutoMovieMotionHumanLayer;

    /** The second it starts; minus infinity for the whole film. */
    from: number;

    /** The second it ends; infinity for the whole film. */
    to: number;

    /** Seconds over which it comes in and goes out. */
    fade: number;
  }

  /**
   * A prop held across actions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation until: Film second a later action takes the hand over; infinite while none has. carry: The holding arm relative to the chest, captured when the carry starts.
   * @evidence contracts/development/design.md#principled-representation until: Film second a later action takes the hand over; infinite while none has. carry: The holding arm relative to the chest, captured when the carry starts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.hold, h); perform/HumanSegmentCarry.ts (HumanSegmentCarry.carries, holds); perform/HumanSegmentCarry.ts (HumanSegmentCarry.carries, h); perform/HumanSegmentCarry.ts (HumanSegmentCarry.capture, held); perform/HumanSegmentEntry.ts (HumanSegmentEntry.entry, h); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid, carried).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanSegment, IAutoMovieMotionHumanSegment.ICarry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IHeld {
    /** The holding hand. */
    side: "left" | "right";

    /** The prop's subject. */
    prop: string;

    /** The holding fingers' clinical angles. */
    fingers: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >;

    /** The action that took hold. */
    source: IAutoMovieMotionHumanSegment;

    /** Film second the hold starts. */
    from: number;

    /** Film second a later action takes the hand over; infinite while none has. */
    until: number;

    /**
     * Whether the action that took the hand over rides a carrier. The
     * carrier is still running then, so the hold ends for it at `until`
     * too, where a hold taken over by the next action still rides every
     * action entered before the takeover.
     */
    riding?: boolean;

    /** The holding arm relative to the chest, captured when the carry starts. */
    carry?: IAutoMovieMotionHumanSegment.ICarry;
  }

  /**
   * A holding arm as its action left it, which the carry keeps: the hand's
   * frame and the elbow in the chest's frame, and the arm's own solution
   * (`IAutoMovieHumanLimbGoal.reference`), so the carried arm stays in the
   * configuration it took hold in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation position: The hand joint in the chest's frame, metres. elbow: The elbow in the chest's frame, metres: the carry's bend hint.
   * @evidence contracts/development/design.md#principled-representation position: The hand joint in the chest's frame, metres. elbow: The elbow in the chest's frame, metres: the carry's bend hint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanSegmentCarry.ts (HumanSegmentCarry.capture, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieHumanLimbReference identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ICarry {
    /** The hand joint in the chest's frame, metres. */
    position: IAutoMovieVector3;

    /** The hand's rotation in the chest's frame. */
    rotation: IAutoMovieQuaternion;

    /** The elbow in the chest's frame, metres: the carry's bend hint. */
    elbow: IAutoMovieVector3;

    /** The arm's solution there. */
    reference: IAutoMovieHumanLimbReference;
  }

  /**
   * One displayed pose as its evaluation produced it, kept with what its readers take from it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSegment.IShown: One displayed pose as its evaluation produced it, kept with what its readers take from it.
   * @evidence contracts/development/design.md#principled-representation One record of pose, reading over the canonical IAutoMoviePose, IAutoMovieSkeletonPoseResolution contracts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Its producer fills it and the enclosing IAutoMovieMotionHumanSegment contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
   */
  export interface IShown {
    /** The complete pose. */
    pose: IAutoMoviePose;

    /** The pose's bones as the body's rig admitted them (`poseBones.read`): made when the pose's bones are first read and taken by every later reader of them, so the pose is admitted once; absent until then. */
    reading?: IAutoMovieSkeletonPoseResolution.IReading;
  }
}
