import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieJointPose } from "../../../pose/IAutoMovieJointPose";
import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
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
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
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
  };

  /**
   * What the performance solved for the action once every action was placed,
   * every stop committed and every flight resolved (`prepareHumanPerformance`):
   * the knots and curves its display evaluates. Absent while the schedule is
   * resolved, where a display reads the action cold.
   */
  prepared?: IAutoMovieMotionHumanSegment.IPrepared;
}

/** Operation-local contracts supporting IAutoMovieMotionHumanSegment. */
export namespace IAutoMovieMotionHumanSegment {
  /**
   * One anchor second's arm fits (`IPrepared.anchors`): each fit's chosen
   * swivel seed by its display fit name (the leaf's, an overlay leaf's, a
   * carry's or a contact's), null where that fit gave none.
   */
  export type IAnchorFits = ReadonlyMap<string, IAutoMovieSwivelSeed | null>;

  /** A curve of limb seeds over an action's own seconds. */
  export type ISwivels = (
    seconds: number,
  ) => ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;

  /**
   * The knots and curves one placed action's display evaluates, solved once
   * when the performance is prepared. Every member is a closed-form evaluation
   * of knots fitted in order from the action's start, so a second's pose never
   * depends on which seconds were read before it.
   */
  export interface IPrepared {
    /**
     * The legs' continuation seeds at a plan second: the plan's leg chain on
     * the arm-course frame grid (`readHumanSegmentLegs.chain`).
     */
    legs: ISwivels;

    /**
     * The arms' swivel course at a plan second: knots on the frame grid and at
     * the plan's events, each continuing the one before
     * (`courseLimbSwivels.swivels`).
     */
    swivels: ISwivels;

    /**
     * The arms' fits of the displayed leaf at each anchor second, by anchor
     * index from the action's start (`readHumanSegmentAnchors.prepare`); empty
     * for an action whose arms its swivel course places at every second.
     */
    anchors: readonly IAnchorFits[];

    /**
     * The legs' fit of the leaf at the start of the plan's legs-still window
     * (`IAutoMovieMotionHumanActionPlan.legsStill`), which every leaf resolve
     * in that window keeps in place of fitting the legs again; absent without
     * such a window.
     */
    still?: IStill;

    /**
     * Each stopped weapon's planted limb goal, by the weapon's id: the limb's
     * end and middle joints as the action displays them at the committed stop
     * (`HumanSegmentStop`); empty for an action whose law takes its stops
     * itself.
     */
    stops: ReadonlyMap<string, IAutoMovieHumanLimbGoal>;

    /**
     * The inertialization offset of the transition that entered the action
     * (Bollo 2018), from both actions' displayed state at the cut; absent
     * without an offsetting transition.
     *
     * @param elapsed Seconds since the cut.
     * @param pose The pose the offset is added to.
     * @returns The pose with the decayed offset.
     */
    offset?: (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose;
  }

  /** The legs' fit kept over a legs-still window (`IPrepared.still`). */
  export interface IStill {
    /** The legs' joint records the fit gave, thigh to toes. */
    joints: readonly IAutoMovieJointPose[];

    /** The legs' seeds the fit chose. */
    seeds: Readonly<
      Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>
    >;
  }

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
     * While the performance is prepared (`prepareHumanPerformance`), solve
     * the person's action shown at a film second before it is read, so a
     * reader is solved after what it reads: the depth-first topological order
     * of the performance's dependencies. Absent outside the preparation.
     *
     * @param seconds Film seconds about to be read.
     */
    ready?: (seconds: number) => void;

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

    /**
     * The holding arm in its frame where the holding action ended, solved when
     * the performance is prepared; absent before, where a carry reads it from
     * that action's pose.
     */
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
}
