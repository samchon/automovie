import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryPolicy,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";
import type { AutoMovieEnginePhysicalStanceSeat } from "./AutoMovieEnginePhysicalStanceSeat";

/** Type contracts for the engine-owned physical balance operations. */
export namespace AutoMovieEnginePhysicalBalanceTypes {
  /** Inputs and readings for the balance sensing phase. */
  /** One supporting limb of the policy's pattern. */
  export type ILimb =
    IAutoMoviePhysicalRecoveryPolicy["pattern"]["limbs"][number];

  /** What the readings are taken from. */
  export interface ISenseInput {
    /** The body's provider profile. */
    profile: IAutoMoviePhysicalProfile;
    /** The world segment wrappers, by bone, read before this step's integration. */
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;
    /** The numerical support and motor policy. */
    policy: IAutoMoviePhysicalRecoveryPolicy;
    /** The authored world placements, by bone. */
    targets: Readonly<Record<string, IAutoMovieRigidTransform>>;
    /** The endpoints' authored world velocities, metres per second. */
    velocities?: Readonly<Record<string, IAutoMovieVector3>>;
    /** The endpoints authored motion owns this substep. */
    unavailable?: readonly string[];
    /** The present local seconds. */
    seconds: number;
    /** The substep, seconds. */
    dt: number;
    /** Gravity's magnitude, metres per second squared, positive. */
    gravity: number;
    /** The floor's height, metres. */
    floor: number;
    /** The supports' measured contacts this substep. */
    supports: readonly IAutoMovieCollectPhysicalSupports.ISupport[];

    /**
     * The authored pose's centre of mass, world metres, its velocity and its
     * acceleration, the command a biped's recovery plan stands in for; absent,
     * a centre at rest on the authored segments' poses.
     */
    command?: ISenseInputCommand;
  }

  /** The command object of {@link ISenseInput}. */
  export type ISenseInputCommand = {
    /** The authored mass center, world metres. */
    center: IAutoMovieVector3;
    /** Its authored velocity, metres per second. */
    velocity: IAutoMovieVector3;
    /** Its authored acceleration, metres per second squared. */
    acceleration: IAutoMovieVector3;
  };

  /** The readings, world metres, seconds and newtons. */
  export interface ISense extends ISenseInput {
    /** The policy's supporting limbs, in pattern order. */
    limbs: readonly ILimb[];
    /** The body's centre of mass. */
    center: IAutoMovieVector3;
    /** The centre of mass's velocity, metres per second. */
    velocity: IAutoMovieVector3;
    /** The body's weight. */
    weight: number;
    /** The root segment, which no joint has as its child, and its body. */
    root: ISenseRoot;
    /** The limb of an endpoint bone. */
    limb(bone: string): ILimb;
    /**
     * A limb's measured floor load this substep: its normal impulse over the
     * substep.
     */
    load(bone: string): number;
    /** Whether a floor constraint touches a limb this substep. */
    touching(bone: string): boolean;
    /** Whether a limb's sole stands within the floor's contact skin. */
    grounded(limb: ILimb): boolean;
    /**
     * The spread of a foot carrier's sole vertices' actual heights: the
     * vertices lowest at its planted pose, the toes (a jointed segment of their
     * own) left out.
     */
    spread(bone: string): number;
    /** A limb's authored support endpoint. */
    authored(bone: string): IAutoMovieVector3;
    /**
     * A limb's actual support endpoint, read without moving a body's
     * bone-origin frame.
     */
    actual(bone: string): IAutoMovieVector3;
    /**
     * A stance foot's references as it actually stands when its stance begins:
     * its support point and its world rotation, which its planted-foot hold
     * keeps through the stance (`AutoMovieEnginePhysicalStanceJointTarget`).
     */
    latch(limb: ILimb): NonNullable<AutoMovieEnginePhysicalStanceSeat.ISeat["anchor"]>;
    /** A limb's swinging mass: its chain and contact carriers, kilograms. */
    legMass(limb: ILimb): number;
    /**
     * How much further a limb's lowest contact point hangs below its endpoint
     * at its planned swing attitude than at its planted pose: its carriers at
     * their authored attitude, the level foot the swing holds, carried with the
     * endpoint to where it stands (`AutoMovieEnginePhysicalSwingReference.hang`).
     */
    hang(limb: ILimb): number;
    /**
     * A limb's support patch: its contact shapes' outline on the floor
     * (`physicalSupportFootprint`), where it bears or would bear again, seated
     * by the recovery's seating and moved by its landed offset; with a place,
     * its planted outline moved so its endpoint stands there, as where a
     * swinging limb lifted from.
     */
    footprint(
      /** The limb whose planted or lifted support patch is read. */
      limb: ILimb,
      /** The recovery state carrying seating and landed offsets. */
      state: Readonly<
        Pick<IAutoMoviePhysicalRecoveryState, "seating" | "offsets">
      >,
      /** An optional horizontal place to move the planted outline to. */
      at?: IAutoMovieVector3,
    ): IAutoMoviePhysicalSupportPatch;
    /**
     * From a limb's endpoint to the middle of its planted footprint,
     * horizontal, both at its planted pose moved by its landed offset: a target
     * for the footprint's middle less this is the endpoint's (Pratt et al.,
     * M2V2, Section VII-C2). The planted pose, not the present one, so a foot
     * rolling as it unloads does not move where it is aimed.
     */
    inset(
      /** The endpoint bone whose planted-foot inset is read. */
      bone: string,
      /** The recovered offsets applied to the planted pose. */
      offsets: IAutoMoviePhysicalRecoveryState["offsets"],
    ): IAutoMovieVector3;
  }

  /** The root object of {@link ISense}. */
  export type ISenseRoot = {
    /** The profile segment that has no joint as its child. */
    segment: IAutoMoviePhysicalSegment;
    /** The root segment's rigid-body wrapper. */
    body: AutoMovieXpbdBody;
  };

  /** Input for the whole-body centroidal momentum task. */
  /** The body, its goals and the root's gains and demands. */
  export interface ICentroidalTaskInput {
    /** The body's profile: its segments' masses and mass centers. */
    profile: IAutoMoviePhysicalProfile;

    /** The body's rigid segments by bone. */
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;

    /** Every segment's sampled goal. */
    goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>;

    /** The root's bone. */
    root: string;

    /** Where the root should stand, with its shifts, world metres. */
    rootGoal: IAutoMovieVector3;

    /** The root's goal velocity, with its shifts, metres per second. */
    rootVelocity: IAutoMovieVector3;

    /** The mass center's stiffness, newtons per metre. */
    stiffness: number;

    /** The mass center's damping, newton seconds per metre. */
    damping: number;

    /** The force's bound, newtons. */
    maximumForce: number;

    /** The gravity force compensated, newtons; zero without compensation. */
    weight: IAutoMovieVector3;

    /** The trunk's orientation demand, newton metres. */
    torque: IAutoMovieVector3;

    /** The native step, seconds. */
    dt: number;
  }

  /** Terms and solution for the capture-point feedback program. */
  /** A 2 x 2 matrix, row by row. */
  export type IIcpControllerQpMatrix = readonly [
    readonly [number, number],
    readonly [number, number],
  ];

  /** The terms `ICPController` hands the solver each update. */
  export interface IIcpControllerQpInput {
    /** The capture point's error from its plan, dead-banded, metres. */
    error: Polygon.IPoint;

    /**
     * The feed-forward centre of pressure the feedback is added to, metres; it
     * offsets the support constraint (`ConstraintToConvexRegion` l.167-172).
     */
    feedForwardCop: Polygon.IPoint;

    /** The feedback gains K = 1 + K_p in the caller's frame. */
    gains: IIcpControllerQpMatrix;

    /** The CoP feedback weight in the caller's frame. */
    copWeight: IIcpControllerQpMatrix;

    /** The CMP feedback weight, the angular-momentum minimization weight. */
    cmpWeight: number;

    /** The dynamics task's weight. */
    dynamicsWeight: number;

    /** The desired feedback, K times the error, of any length. */
    direction: Polygon.IPoint;

    /** The feedback direction task's weight; zero drops the task. */
    directionWeight: number;

    /** The total feedback's rate weight, over the control period squared. */
    rateWeight: number;

    /** The CoP and CMP feedbacks' own rate weight, over the period squared. */
    copCmpRateWeight: number;

    /** The last solution, the rate tasks' objective, metres. */
    previous: IIcpControllerQpSolution;

    /**
     * The support polygon's vertices in any order, metres; its convex hull
     * constrains the centre of pressure, and none constrains it when empty.
     */
    support: readonly Polygon.IPoint[];

    /** How far inside the support the centre of pressure stays, metres. */
    safeDistance: number;

    /**
     * The total feedback's bound, |T (dCoP + dCMP)| per axis, with T the
     * transform into the plan's motion frame; infinite bounds add no row.
     */
    maximum: IIcpControllerQpInputMaximum;

    /**
     * The total feedback's rate bound, metres per second, and the control
     * period, seconds; an infinite rate adds no row.
     */
    rate: IIcpControllerQpInputRate;
  }

  /** The rate object of {@link IIcpControllerQpInput}. */
  export type IIcpControllerQpInputRate = {
    /** The total feedback rate bound, metres per second. */
    limit: number;
    /** The control period, seconds. */
    dt: number;
  };

  /** The maximum object of {@link IIcpControllerQpInput}. */
  export type IIcpControllerQpInputMaximum = {
    /** The transform into the plan's motion frame. */
    transform: IIcpControllerQpMatrix;
    /** The x-axis feedback bound, metres. */
    x: number;
    /** The y-axis feedback bound, metres. */
    y: number;
  };

  /** The program's solution. */
  export interface IIcpControllerQpSolution {
    /** The centre of pressure's feedback, metres. */
    cop: Polygon.IPoint;

    /** The pivot's offset from the centre of pressure, metres. */
    cmp: Polygon.IPoint;
  }

  /** Inputs and sampled results for prepared push-recovery spans. */
  /** The state just after the first push and the pushes after it. */
  export interface IPrepareDisturbanceSpanInput {
    /** The first push's time, local seconds. */
    seconds: number;

    /** The centre of mass just after it, world metres. */
    center: IAutoMovieVector3;

    /** Its velocity, metres per second, the push's impulse over the mass added. */
    velocity: IAutoMovieVector3;

    /** The pendulum's rate, per second (IHMC's omega0). */
    omega: number;

    /** The body's mass, kilograms. */
    mass: number;

    /** Gravity's magnitude, metres per second squared. */
    gravity: number;

    /**
     * The two planted feet: each its endpoint bone, its side, its sole frame
     * and its contact outline in that frame, x forward and y to the left
     * (`AutoMovieEnginePhysicalSupportSole.foot`).
     */
    feet: readonly IPrepareDisturbanceSpanFoot[];

    /** The authored capture point and its rate at the push, held for the span. */
    authored: IPrepareDisturbanceSpanInputAuthored;

    /** The pushes after the first, each its time and velocity jump. */
    pushes?: readonly IPrepareDisturbanceSpanPush[];

    /** The policy's longest step, metres. */
    maximumStep: number;

    /** The policy's reaction time before a step, seconds; zero when absent. */
    reactionSeconds?: number;

    /** The floor's height, metres. */
    floor: number;
  }

  /** The authored object of {@link IPrepareDisturbanceSpanInput}. */
  export type IPrepareDisturbanceSpanInputAuthored = {
    /** The authored capture point, world x and z, metres. */
    position: {
      /** The world x coordinate, metres. */
      x: number;
      /** The world z coordinate, metres. */
      z: number;
    };
    /** Its horizontal velocity, metres per second. */
    velocity: {
      /** The world x velocity, metres per second. */
      x: number;
      /** The world z velocity, metres per second. */
      z: number;
    };
  };

  /** A later push of the stated disturbance. */
  export interface IPrepareDisturbanceSpanPush {
    /** When, local seconds. */
    seconds: number;

    /** The centre of mass's velocity jump, metres per second. */
    velocity: IAutoMovieVector3;
  }

  /** A planted foot. */
  export interface IPrepareDisturbanceSpanFoot {
    /** Its endpoint bone. */
    bone: string;

    /** Its side. */
    side: "left" | "right";

    /** Its sole frame, world x and z. */
    frame: IPrepareDisturbanceSpanFootFrame;

    /** Its contact outline in the sole frame. */
    polygon: {
      /** The forward coordinate in the sole frame, metres. */
      x: number;
      /** The lateral coordinate in the sole frame, metres. */
      y: number;
    }[];

    /**
     * Its leg's reach, when known: the hip anchor's horizontal offset from the
     * centre of mass, world x and z, its height over the floor, and the leg's
     * chain length, metres. A footstep stays within sqrt(L^2 - h^2) of the hip
     * where it stands at touchdown, carried by the centre of mass.
     */
    leg?: IPrepareDisturbanceSpanFootLeg;
  }

  /** The leg object of {@link IPrepareDisturbanceSpanFoot}. */
  export type IPrepareDisturbanceSpanFootLeg = {
    /** The hip anchor, horizontal world x and z. */
    hip: {
      /** The hip anchor's world x coordinate, metres. */
      x: number;
      /** The hip anchor's world z coordinate, metres. */
      z: number;
    };
    /** The hip height over the floor, metres. */
    height: number;
    /** The leg chain length, metres. */
    length: number;
  };

  /** The frame object of {@link IPrepareDisturbanceSpanFoot}. */
  export type IPrepareDisturbanceSpanFootFrame = {
    /** The sole origin, world x and z. */
    origin: {
      /** The world x coordinate, metres. */
      x: number;
      /** The world z coordinate, metres. */
      z: number;
    };
    /** The sole forward direction, x and z. */
    forward: {
      /** The x component. */
      x: number;
      /** The z component. */
      z: number;
    };
  };

  /** A branch point of the span. */
  export interface IPrepareDisturbanceSpanBranch {
    /** What happens there. */
    kind: "push" | "trigger" | "touchdown" | "standing" | "end" | "fall";

    /** When, local seconds. */
    seconds: number;

    /** The stepping foot, at a trigger or touchdown. */
    bone?: string;
  }

  /** The response at a time. */
  export interface IPrepareDisturbanceSpanSample {
    /** The walking state the time falls in. */
    phase: "double" | "single" | "toStanding" | "standing" | "after";

    /** Whether the controller's pivot is held on the support. */
    saturated: boolean;

    /** The capture point, world x and z, metres. */
    capture: IPrepareDisturbanceSpanSampleCapture;

    /** Its rate, metres per second. */
    captureVelocity: IPrepareDisturbanceSpanSampleCaptureVelocity;

    /** The centroidal moment pivot, world x and z, metres. */
    pivot: IPrepareDisturbanceSpanSamplePivot;

    /** The centre of mass, world metres, its height held from the push. */
    center: IAutoMovieVector3;

    /** Its velocity, metres per second, horizontal. */
    centerVelocity: IAutoMovieVector3;

    /** Each foot's endpoint on the floor, world metres, by bone. */
    feet: Record<string, IAutoMovieVector3>;

    /**
     * The ground's reaction, newtons, at the pivot on the floor: m omega^2 (c -
     * cmp) across and the weight up.
     */
    reaction: IPrepareDisturbanceSpanSampleReaction;

    /** Each planted foot's share of the reaction, by bone, summing to one. */
    loads: Record<string, number>;
  }

  /** The reaction object of {@link IPrepareDisturbanceSpanSample}. */
  export type IPrepareDisturbanceSpanSampleReaction = {
    /** The point on the floor where the reaction acts, world metres. */
    point: IAutoMovieVector3;
    /** The ground's force, world newtons. */
    force: IAutoMovieVector3;
  };

  /** The pivot object of {@link IPrepareDisturbanceSpanSample}. */
  export type IPrepareDisturbanceSpanSamplePivot = {
    /** The world x coordinate, metres. */
    x: number;
    /** The world z coordinate, metres. */
    z: number;
  };

  /** The captureVelocity object of {@link IPrepareDisturbanceSpanSample}. */
  export type IPrepareDisturbanceSpanSampleCaptureVelocity = {
    /** The world x velocity, metres per second. */
    x: number;
    /** The world z velocity, metres per second. */
    z: number;
  };

  /** The capture object of {@link IPrepareDisturbanceSpanSample}. */
  export type IPrepareDisturbanceSpanSampleCapture = {
    /** The world x coordinate, metres. */
    x: number;
    /** The world z coordinate, metres. */
    z: number;
  };

  /** The prepared span. */
  export interface IPrepareDisturbanceSpanResult {
    /** Its branch points in time order. */
    branches: IPrepareDisturbanceSpanBranch[];

    /** The last recovery step's foot and footstep, if it steps. */
    footstep?: IPrepareDisturbanceSpanResultFootstep;

    /**
     * When the response has settled within `maxErrorToStanding` of its plan
     * after its last branch point, or falls, local seconds: where the body is
     * handed back to the physics.
     */
    until: number;

    /**
     * The response at a time: pure, in any order; before the push, the state
     * just after it.
     *
     * @param seconds Local seconds.
     * @returns The response.
     */
    sample(seconds: number): IPrepareDisturbanceSpanSample;
  }

  /** The footstep object of {@link IPrepareDisturbanceSpanResult}. */
  export type IPrepareDisturbanceSpanResultFootstep = {
    /** The endpoint bone of the stepping foot. */
    bone: string;
    /** The footstep, world x and z, metres. */
    position: {
      /** The world x coordinate, metres. */
      x: number;
      /** The world z coordinate, metres. */
      z: number;
    };
    /** Whether the footstep is within the policy's reach. */
    viable: boolean;
  };
}
