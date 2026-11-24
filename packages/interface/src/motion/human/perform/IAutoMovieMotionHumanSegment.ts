import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieJointPose } from "../../../pose/IAutoMovieJointPose";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieSkeletonPoseResolution } from "../../../pose/IAutoMovieSkeletonPoseResolution";
import type { IAutoMovieSwivelSeed } from "../../../pose/IAutoMovieSwivelSeed";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { AutoMovieMotionHumanChannelClaim } from "../compose/AutoMovieMotionHumanChannelClaim";
import type { IAutoMovieMotionHumanGraspUse } from "../handling/IAutoMovieMotionHumanGraspUse";
import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanInterruptRow } from "../law/IAutoMovieMotionHumanInterruptRow";
import type { IAutoMovieMotionHumanLayer } from "../law/IAutoMovieMotionHumanLayer";
import type { IAutoMovieMotionPropHold } from "../law/IAutoMovieMotionPropHold";
import type { AutoMovieHumanLimb } from "../posture/AutoMovieHumanLimb";
import type { IAutoMovieHumanLimbReference } from "../posture/IAutoMovieHumanLimbReference";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";
import type { IAutoMovieMotionHumanPerformer } from "./IAutoMovieMotionHumanPerformer";

/**
 * One scheduled and planned human action with its law, context, film placement
 * and optional transition from another segment. Performance evaluation and
 * motion audits share this identity.
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
   * Each limb's seed of the action's last displayed leaf resolve, held for the
   * next one's swept fits as their bounded search's incumbent
   * (`IAutoMovieFitChainToTargetProps.incumbent`), which cannot change their
   * answer; absent until a leaf resolve, and released when the person's memos
   * are forgotten.
   */
  incumbents?: Readonly<
    Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>
  >;

  /**
   * The legs' continuation seeds at a plan second: the plan's leg chain on the
   * arm-course frame grid, prepared when the action is placed
   * (`readHumanSegmentLegs.chain`).
   *
   * @param seconds Plan seconds.
   * @returns Each leg's seed at that second.
   */
  legSeeds(
    seconds: number,
  ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;

  /**
   * The arms' fits of the action's displayed leaf at its anchor seconds, each
   * read cold once, keyed by the person's overlay count and the anchor (the
   * plan second over the anchor spacing, rounded), as `<overlays>:<anchor>`. A
   * displayed second with no fits of its own places its arms at the swivels
   * interpolated between the anchors around it, so a verdict, a sub-frame and
   * playback read one closed-form placement instead of sweeping every swivel.
   * Absent until a read needs one, and released when anything is placed or the
   * person's memos are forgotten.
   */
  anchors?: Map<string, IAutoMovieMotionHumanSegment.IAnchorFits>;

  /**
   * The legs' fit of a leaf resolve inside the plan's legs-still window
   * (`IAutoMovieMotionHumanActionPlan.legsStill`): the plan second it was read
   * at, the legs' joint records it gave and their seeds, which every later leaf
   * resolve in that window keeps in place of fitting the legs again; absent
   * until then, and released when the person's memos are forgotten.
   */
  legs?: {
    /** The plan second, clamped to the plan, the legs were fitted at. */
    at: number;

    /** The legs' joint records the fit gave, thigh to toes. */
    joints: readonly IAutoMovieJointPose[];

    /** The legs' seeds the fit chose. */
    seeds: Readonly<
      Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>
    >;
  };
}

/** Operation-local contracts supporting IAutoMovieMotionHumanSegment. */
export namespace IAutoMovieMotionHumanSegment {
  /**
   * One anchor second's arm fits (`IAutoMovieMotionHumanSegment.anchors`): each
   * fit's chosen swivel seed by its display fit name (the leaf's, an overlay
   * leaf's, a carry's or a contact's), null where that fit gave none.
   */
  export type IAnchorFits = ReadonlyMap<string, IAutoMovieSwivelSeed | null>;

  /** One action placed over a carrier. */
  export interface IOverlay extends IAutoMovieMotionHumanSegment {
    /** The channels, or single digits, it takes from the carrier. */
    channels: readonly AutoMovieMotionHumanChannelClaim[];
  }

  /** One person's state in a performance. */
  export interface IPerson {
    /** The performer. */
    performer: IAutoMovieMotionHumanPerformer;

    /** The resolved skill. */
    skill: IAutoMovieMotionHumanSkill;

    /** Placed actions, in film order. */
    segments: IAutoMovieMotionHumanSegment[];

    /**
     * Actions placed over those, in placement order: each takes its claimed
     * channels from the carrier while it runs.
     */
    overlays: IAutoMovieMotionHumanSegment.IOverlay[];

    /** The standing posture before the first action. */
    initial: IAutoMovieMotionHumanPosture;

    /**
     * Displayed poses already evaluated, by film second; bounded to 4096
     * entries.
     */
    cache: Map<number, IAutoMovieMotionHumanSegment.IShown>;

    /**
     * Whether the schedule is still being resolved: nothing is cached
     * meanwhile, because another person's actions may not be placed yet.
     */
    resolving: boolean;

    /**
     * Displayed poses read while one action is being planned, by film second
     * (`planning`): what is placed does not change during one plan, so its
     * readers share each pose; absent outside a plan.
     */
    planning?: Map<number, IAutoMovieMotionHumanSegment.IShown>;

    /**
     * Additive layers over the person's actions, in order, each inside its
     * window.
     */
    layers: IAutoMovieMotionHumanSegment.ILayered[];

    /** What a layer can read. */
    layer: IAutoMovieMotionHumanLayer.IContext;

    /** Props this person's actions left held, in placement order. */
    holds: IAutoMovieMotionHumanSegment.IHeld[];

    /**
     * Resolved stops of this person's weapons, film seconds, keyed by
     * `weapon(segment, id)`.
     */
    stops: Map<string, number>;
  }

  /** A layer and the film seconds it runs in. */
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

  /** A prop held across actions. */
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

    /**
     * The use the grip was chosen for (`IAutoMovieMotionPropHold.use`); absent
     * when it was chosen for its reach alone.
     */
    use?: IAutoMovieMotionHumanGraspUse.IUse;

    /** Film second the hold starts. */
    from: number;

    /** The launch that a staged hold captures on entry, if any. */
    capture?: IAutoMovieMotionPropHold["capture"];

    /** Film second a later action takes the hand over; infinite while none has. */
    until: number;

    /**
     * The order, within the person's actions, of the action that took the hand
     * over at `until`; absent while none has.
     */
    takenBy?: number;

    /**
     * Whether the action that took the hand over rides a carrier. The carrier
     * is still running then, so the hold ends for it at `until` too, where a
     * hold taken over by the next action still rides every action entered
     * before the takeover.
     */
    riding?: boolean;

    /** The holding arm in its frame, captured when the carry starts. */
    carry?: IAutoMovieMotionHumanSegment.ICarry;
  }

  /** The bone a carried hold's hand is held in the frame of (`ICarry.frame`). */
  export type CarryFrame = AutoMovieHumanoidBone;

  /**
   * A holding arm as its action left it, which the carry keeps: the hand's
   * frame and the elbow in its frame bone's frame, and the arm's own solution
   * (`IAutoMovieHumanLimbGoal.reference`), so the carried arm stays in the
   * configuration it took hold in.
   */
  export interface ICarry {
    /**
     * The bone whose frame the carry is held in, the moving frame of its pose
     * goal (MoveIt's `mobile_frame_` constraints): the bone the goal of the
     * action that took hold rode, or the hips, the root body, for a goal in the
     * world.
     */
    frame: CarryFrame;

    /** The hand joint in that bone's frame, metres. */
    position: IAutoMovieVector3;

    /** The hand's rotation in that bone's frame. */
    rotation: IAutoMovieQuaternion;

    /** The elbow in that bone's frame, metres: the carry's bend hint. */
    elbow: IAutoMovieVector3;

    /** The arm's solution there. */
    reference: IAutoMovieHumanLimbReference;
  }

  /**
   * One displayed pose as its evaluation produced it, kept with what its
   * readers take from it.
   */
  export interface IShown {
    /** The complete pose. */
    pose: IAutoMoviePose;

    /**
     * The pose's bones as the body's rig admitted them (`poseBones.read`): made
     * when the pose's bones are first read and taken by every later reader of
     * them, so the pose is admitted once; absent until then.
     */
    reading?: IAutoMovieSkeletonPoseResolution.IReading;
  }
}
