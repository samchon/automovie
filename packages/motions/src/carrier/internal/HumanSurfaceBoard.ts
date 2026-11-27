import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanMountRider } from "../../lexicon/internal/HumanMountRider";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanSupportCarry } from "./HumanSupportCarry";
import { prepareSkateboardPhrase } from "./prepareSkateboardPhrase";
import { prepareSurfboardPhrase } from "./prepareSurfboardPhrase";

/** Vertical in the deck frame. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The axis a handle is wrapped about: its affordance frame's local +X. */
const HANDLE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * Seconds over which a riding hand reaches its grip on the support (provisional
 * staging).
 */
const REACH: number = 0.4;

/** Hand subsequent actions a settled stance after the board transfer. */
const END: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  any: [{ window: [1, 1], kind: "inertialize", entry: 0 }],
};

/**
 * Carry a two-foot stance on the actual board's film-clock trajectory. Either
 * foot can lead because the law reads the placed posture. Surf transit
 * measurements distinguish hand contact, foot acquisition and settled stance.
 * The board ride enters after acquisition, on an already placed stance.
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC7961430/ A named hand grips a point
 * of the same support, such as an escalator handrail that moves with the steps:
 * it reaches the point where it is at the start over `REACH` seconds, and the
 * support carries the grip with the feet.
 *
 * @param context The placed feet, the board id and the ride duration.
 * @returns The transferred deck-local plants and carried posture.
 * @throws {HumanRefusal} When either foot is unsupported by the selected board,
 *   a hand names a point the support lacks, or the duration is invalid.
 */
export function HumanSurfaceBoard(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.IBoardRideParams>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const duration: number = HumanBound.above(
    "duration",
    params.duration,
    0,
    "s",
  );
  const sides: readonly ["left", "right"] = ["left", "right"];
  for (const side of sides)
    if (
      !entry.supports.some(
        (support: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          support.part === `${side}Foot` &&
          (support.kind === "plant" ||
            support.kind === "bear" ||
            support.kind === "pivot") &&
          support.support.kind === "prop" &&
          support.support.subject === params.on,
      )
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: params.on,
        feasible: null,
        reason: `board ride needs the ${side} foot on ${params.on} at entry`,
        fix: "place both feet on the named board before riding it",
      });
  const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  const grips: IRideGrip[] = sides.flatMap(
    (side: AutoMovieHumanSide): IRideGrip[] => {
      const id: string | undefined = params.hands?.[side];
      if (id === undefined) return [];
      if (!Object.hasOwn(support.prop.points, id))
        throw new HumanRefusal({
          kind: "affordance",
          axis: `hands.${side}`,
          value: id,
          feasible: {
            kind: "alternatives",
            values: Object.keys(support.prop.points),
          },
          reason: `${params.on} has no point named ${id}`,
          fix: "name a point of the support the hand holds",
        });
      const placed: IAutoMovieMotionHumanProp.IPlacedPoint = context.aim(
        { kind: "prop", subject: params.on, point: id },
        context.start,
      );
      const affordance: IAutoMovieAffordance | undefined =
        support.prop.affordances?.find(
          (item: IAutoMovieAffordance): boolean => item.id === id,
        );
      const rotation: IAutoMovieQuaternion | undefined =
        affordance === undefined
          ? undefined
          : Quaternion.multiply(
              support.frame(context.start).rotation,
              affordance.frame.rotation,
            );
      return [
        {
          side,
          grip: {
            point: placed.point,
            normal: placed.normal,
            radius: (affordance?.aperture ?? 0) / 2,
            ...(rotation === undefined
              ? {}
              : { axis: Quaternion.rotateVector(rotation, HANDLE) }),
          },
        },
      ];
    },
  );

  const ankles: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: entry.feet.left.ankle,
    right: entry.feet.right.ankle,
  };
  const placed: IAutoMovieMotionHumanPosture = entry.posture;
  const knee: IAutoMovieMotionHumanPosture["limbs"] = stand.legs(
    body,
    placed.root,
    placed.yaw,
    ankles,
  );
  const posture: IAutoMovieMotionHumanPosture = {
    ...placed,
    limbs: {
      ...placed.limbs,
      leftLeg: { ...knee.leftLeg!, rotation: entry.feet.left.rotation },
      rightLeg: { ...knee.rightLeg!, rotation: entry.feet.right.rotation },
    },
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = sides.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Foot`,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    }),
  );
  const reach: number = Math.min(REACH, duration);
  for (const { side } of grips)
    contacts.push({
      part: `${side}Hand`,
      kind: "grip",
      from: reach / duration,
      to: 1,
      support: { kind: "prop", subject: params.on },
    });
  // The law's goals: each hand on its grip as the ride starts, which the
  // support's carry moves with the feet; the arm is laid on one planned
  // course from the entry's arm to it (`courseArmGoal`), so it keeps its
  // branch as it reaches and as the support moves.
  const fromJoints: Readonly<
    Record<string, IAutoMovieMotionHumanPosture["joints"]["hips"]>
  > = posture.joints;
  const holding = (at: number): IAutoMovieMotionHumanPosture => {
    if (grips.length === 0) return posture;
    const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(at / reach);
    let held: IAutoMovieMotionHumanPosture = posture;
    for (const { side, grip } of grips) {
      const arm: IAutoMovieMotionHumanMountRider.IHoldResult =
        HumanMountRider.hold(body, side, held, grip, 1, {});
      const asked: typeof fromJoints = arm.fingers;
      const fingers: Record<
        string,
        IAutoMovieMotionHumanPosture["joints"]["hips"]
      > = {};
      for (const [bone, closed] of Object.entries(asked)) {
        if (closed === undefined) continue;
        const open: readonly [number, number, number] = fromJoints[bone] ?? [
          0, 0, 0,
        ];
        fingers[bone] = [
          open[0] + (closed[0] - open[0]) * share,
          open[1] + (closed[1] - open[1]) * share,
          open[2] + (closed[2] - open[2]) * share,
        ];
      }
      held = {
        ...held,
        joints: { ...held.joints, ...fingers },
        limbs: { ...held.limbs, [`${side}Arm`]: arm.arm },
      };
    }
    return held;
  };
  const carried: IAutoMovieMotionHumanActionPlan = HumanSupportCarry.on(
    context,
    {
      duration,
      events: [{ name: "ride", share: 0 }],
      contacts,
      physicalWindow: null,
      posture: holding,
    },
    params.on,
  );
  const [first, ...others]: IRideGrip[] = grips;
  if (first === undefined) return carried;
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: reach,
    relax: duration,
    end: duration,
  };
  return courseArmGoal({
    context,
    plan: carried,
    side: first.side,
    rest: AutoMovieMotionHumanArm.angles(entry.pose, first.side),
    span,
    with: others.map(
      ({ side }: IRideGrip): courseArmGoal.IArm => ({
        side,
        rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
      }),
    ),
  });
}

/**
 * Author a continuous move on a skateboard or surfboard selected from the
 * stage. The board's animator owns its trajectory. Its actual affordances and
 * authored phase boundaries determine the rider's plants.
 */
export namespace HumanSurfaceBoard {
  /**
   * Establish one ground push, turn feet on the deck, and land from an authored
   * ollie.
   */
  export const skateboardPhrase: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ISkateboardPhraseParams> =
    {
      name: "skateboardPhrase",
      interrupts: END,
      yields: ["head"],
      plan: prepareSkateboardPhrase,
    };

  /**
   * Advance onto the board from water, paddle, and transfer from palms to a
   * surfing stance.
   */
  export const surfboardPhrase: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSurface.ISurfboardPhraseParams> =
    {
      name: "surfboardPhrase",
      interrupts: END,
      yields: ["head"],
      plan: prepareSurfboardPhrase,
    };

  /** Phase shares for synchronizing the skateboard's authored transform. */
  export const SKATEBOARD: typeof prepareSkateboardPhrase.SHARES =
    prepareSkateboardPhrase.SHARES;

  /** Phase shares for synchronizing the surfboard's authored transform. */
  export const SURFBOARD: typeof prepareSurfboardPhrase.SHARES =
    prepareSurfboardPhrase.SHARES;

  /**
   * The board frame and rectangular deck envelope admitted for one staged
   * phrase.
   */
  export interface IDeck {
    /** Sample the board's own world frame on this action's clock. */
    at(seconds: number): IAutoMovieRigidTransform;
    /** Get a named contact in board-local metres. */
    site(id: string, kind: IAutoMovieAffordance["kind"]): IAutoMovieVector3;
    /** Verify a site lies on the board's material top and inside its extent. */
    plant(point: IAutoMovieVector3, name: string): void;
    /** The deck's centre in board-local metres. */
    centre: IAutoMovieVector3;
    /** The deck's side-to-side extent in metres. */
    width: number;
    /** The deck's nose-to-tail extent in metres. */
    length: number;
  }

  /** What a deck is read from: the action's start and the board's reader. */
  export interface IDeckContext {
    /** The action's start, film seconds. */
    start: number;

    /** The board's affordances and its frame at a film second. */
    prop(subject: string): {
      prop: Pick<IAutoMovieMotionHumanPropReader["prop"], "affordances">;
      frame(seconds: number): IAutoMovieRigidTransform;
    };
  }

  /** Admit the board and use the prop's existing local affordances throughout. */
  export function deck(context: IDeckContext, on: string): IDeck {
    const prop: ReturnType<IDeckContext["prop"]> = context.prop(on);
    const contact = (
      id: string,
      kind: IAutoMovieAffordance["kind"],
    ): IAutoMovieAffordance => {
      const candidate: IAutoMovieAffordance | undefined =
        prop.prop.affordances?.find(
          (affordance: IAutoMovieAffordance): boolean =>
            affordance.id === id && affordance.kind === kind,
        );
      if (candidate === undefined)
        return refuseBoard(
          id,
          "the prop needs a finite " + kind + " affordance",
        );
      return candidate;
    };
    const surface: IAutoMovieAffordance = contact("deck", "surface");
    const centre: IAutoMovieVector3 = surface.frame.translation;
    const width: number = surface.width ?? NaN;
    const length: number = surface.depth ?? NaN;
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(
      surface.frame.rotation,
      UP,
    );
    if (!(width > 0 && length > 0) || Vector3.distance(normal, UP) > 1e-6)
      return refuseBoard(
        on,
        "the scene prop needs a bounded horizontal deck in its own frame",
      );
    return {
      at: (seconds: number): IAutoMovieRigidTransform =>
        prop.frame(context.start + seconds),
      site: (
        id: string,
        kind: IAutoMovieAffordance["kind"],
      ): IAutoMovieVector3 => contact(id, kind).frame.translation,
      plant: (point: IAutoMovieVector3, name: string): void => {
        if (
          Math.abs(point.x - centre.x) > width / 2 ||
          Math.abs(point.z - centre.z) > length / 2 ||
          Math.abs(point.y - centre.y) > GAP
        )
          refuseBoard(name, "the contact lies outside the board's deck");
      },
      centre,
      width,
      length,
    };
  }

  /** Format one named refusal from the indicated support affordance. */
  export function refuseBoard(value: string, reason: string): never {
    throw new HumanRefusal({
      kind: "affordance",
      axis: "on",
      value,
      feasible: null,
      reason,
      fix: "stage a board with matching support geometry and phase timing",
    });
  }

  /** The established 10 mm support tolerance, in metres. */
  export const GAP: number = 0.01;

  /** Orient a point or pose against the board's world frame. */
  export function world(
    frame: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, point),
    );
  }

  /** Express a world point in the current board frame. */
  export function local(
    frame: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.position),
    );
  }

  /** A planted or unplanted sole goal whose target lies in world metres. */
  export function ankle(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    sole: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    planted: boolean,
  ): Omit<IAutoMovieHumanLimbGoal, "bend"> {
    const contact: IAutoMovieVector3 = HumanFoot.offset(body, side, "sole");
    return {
      point: Vector3.subtract(sole, Quaternion.rotateVector(rotation, contact)),
      rotation,
      contact,
      planted,
    };
  }

  /** A yaw in degrees measured from positive Z. */
  export function heading(rotation: IAutoMovieQuaternion): number {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return Math.atan2(forward.x, forward.z) / Quaternion.DEG2RAD;
  }

  /** The existing minimum-jerk ease between two phase shares. */
  export function ease(at: number, from: number, to: number): number {
    return AutoMovieEngineMotionSampling.minimumJerk(Math.max(0, Math.min(1, (at - from) / (to - from)))).s;
  }

  /** A declared support interval on the board or on the world floor. */
  export function plant(
    part: IAutoMovieMotionHumanContactWindow["part"],
    from: number,
    to: number,
    support: IAutoMovieMotionHumanContactWindow.Support,
    kind: IAutoMovieMotionHumanContactWindow["kind"] = "plant",
  ): IAutoMovieMotionHumanContactWindow {
    return { part, from, to, support, kind };
  }
}

/** One riding hand and where it holds the support as the ride starts. */
interface IRideGrip {
  /** The holding hand. */
  side: AutoMovieHumanSide;

  /** The held point, its normal and wrapped axis, world, at the ride's start. */
  grip: IAutoMovieMotionHumanMountRider.IHoldGrip;
}
