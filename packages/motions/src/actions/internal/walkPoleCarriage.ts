import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../../everyday/HumanTrunk";
import { HumanGrip } from "../../handling/HumanGrip";
import { HumanFrame } from "../../posture/HumanFrame";
import { walkFoot } from "./walkFoot";
import { walkPoleFrame } from "./walkPoleFrame";

/** The alternatives of `PrepareContext`'s site. */
type PrepareContext = "body" | "entry" | "prop" | "cut";

/**
 * A long held prop carried along a walk or a run: a prop held in one hand or
 * two whose end lies farther from the carrying grip than the hand hangs above
 * the floor at rest would drag that end if it hung with the swinging hand, so
 * the arms hold it still against the body, its end raised ahead.
 *
 * As a vaulter carries a pole (Coaches Insider, "Pole carry and drop"): the
 * carrying (top) hand at the hip, the forearm forward, and the pole "at 70
 * degrees from a long approach, almost at vertical" (`CARRY`), across the body
 * to the lower hand ahead of the trunk's middle. The prop's roll about its line
 * is the one that keeps the arms at their ease (`walkPoleFrame`).
 *
 * A walk cut into an action that plants the prop (a run into a vault,
 * `IHumanActionContext.cut`) lowers it continuously from the start to the cut,
 * the tip falling "the moment the vaulter moves", gradually: the lower hand is
 * the fulcrum, and the top hand rises past the ribs, the shoulder and the face
 * as the pole turns about it, down to the elevation the plant takes from the
 * overhead grip (the vault's `high`) and ahead along the run, never lower than
 * keeps the end a swinging toe's clearance off the floor
 * (`walkFoot.CLEARANCE`). One hand turns the prop about its own grip.
 */
export namespace walkPoleCarriage {
  /**
   * The carried prop's elevation above the horizontal at the run's start,
   * degrees: a long approach's carry (Coaches Insider, "Pole carry and drop").
   */
  export const CARRY: number = 70;

  /**
   * A carried prop, its hands and its line in the heading's frame from the
   * root.
   */
  export interface IHold {
    /** The prop and its holding hands. */
    pole: walkPoleFrame.IPole;

    /** Each holding arm's shoulder joint, metres. */
    shoulders: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>;

    /** The fulcrum: the lower hand's grip, or the only hand's, metres. */
    fulcrum: IAutoMovieVector3;

    /**
     * The way across the body the carried line leans, degrees from ahead toward
     * the trunk's middle.
     */
    across: number;

    /**
     * The lowering to the next action's plant; none when the walk is not cut
     * into one.
     */
    drop?: IDrop;
  }

  /** The lowering of a carried prop to a plant. */
  export interface IDrop {
    /** The walk's second the cut falls at. */
    to: number;

    /** The elevation by the cut, degrees: the plant's, below the horizontal. */
    elevation: number;
  }

  /**
   * The props carried long as the action enters.
   *
   * @param context The action's context.
   * @param events The walk's events, as shares of its duration.
   * @param duration The walk's seconds.
   * @returns The carried props; none when no hand holds a prop whose end would
   *   reach the floor hanging.
   */
  export function prepare(
    context: Pick<IAutoMovieMotionHumanActionContext, PrepareContext>,
    events: readonly IAutoMovieMotionEvent[],
    duration: number,
  ): IHold[] {
    const out: IHold[] = [];
    const seen: Set<string> = new Set();
    for (const side of ["right", "left"] as const) {
      const prop: string | undefined = context.entry.holds[side];
      if (prop === undefined || seen.has(prop)) continue;
      seen.add(prop);
      const plant: IAutoMovieMotionHumanActionContext.ICut["plant"] =
        context.cut?.plant?.prop === prop ? context.cut.plant : undefined;
      const pole: walkPoleFrame.IPole | undefined = walkPoleFrame(
        context,
        prop,
        plant?.end ?? "tip",
      );
      if (pole === undefined) continue;
      const carrying: AutoMovieHumanSide = pole.hands[0]!.side;
      // The carrying hand's height above the floor hanging at rest, where
      // the walk's swing carries it.
      const hanging: number =
        context.body.rest.get(`${carrying}Hand`)!.y -
        context.body.rest.get(`${carrying}Foot`)!.y +
        context.body.measure.ankleHeight;
      if (!(pole.length > hanging)) continue;

      // The carrying arm at the hip: the upper arm hanging, the elbow a
      // right angle so the forearm points ahead; the shoulders on the
      // entry's trunk.
      const heading: IAutoMovieQuaternion = HumanFrame.turn(
        context.entry.posture.yaw,
      );
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(heading);
      const root: IAutoMovieVector3 = context.entry.posture.root;
      const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(inverse, Vector3.subtract(point, root));
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanTrunk.resolve(
          context.body,
          context.entry.posture,
          {
            ...context.entry.posture.joints,
            [`${carrying}UpperArm`]: [0, 0, 0],
            [`${carrying}LowerArm`]: [RIGHT, 0, 0],
            [`${carrying}Hand`]: [0, 0, 0],
          },
          undefined,
          new Set<AutoMovieHumanoidBone>([
            "leftUpperArm",
            "rightUpperArm",
            `${carrying}Hand`,
          ]),
        );
      const hand: IAutoMovieResolvedBone = bones.get(`${carrying}Hand`)!;
      const grip: IAutoMovieVector3 = local(
        Vector3.add(
          hand.worldPosition,
          Quaternion.rotateVector(hand.worldRotation, pole.hands[0]!.socket),
        ),
      );
      const shoulders: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> =
        {};
      for (const held of pole.hands)
        shoulders[held.side] = local(
          bones.get(`${held.side}UpperArm`)!.worldPosition,
        );

      // The lower hand ahead of the trunk's middle, as far across as its
      // grip's distance along the line reaches at the carry.
      const level: number = pole.fulcrum * Math.cos(radians(CARRY));
      const across: number =
        level > 0
          ? degrees(Math.asin(Math.min(1, Math.abs(grip.x) / level)))
          : 0;
      const fulcrum: IAutoMovieVector3 = Vector3.add(
        grip,
        Vector3.scale(line(carrying, CARRY, across), pole.fulcrum),
      );

      // The plant's elevation: the vault's straight top arm at the grip's
      // neutral angle to the pole, its end on the floor
      // (`walkPoleFrame.plant`).
      const to: number | undefined =
        plant === undefined ? undefined : cutAt(context.cut!, events, duration);
      const planted: walkPoleFrame.IPlant | undefined =
        plant === undefined
          ? undefined
          : walkPoleFrame.plant(
              root.y + shoulders[carrying]!.y,
              context.body.measure.upperArm + context.body.measure.forearm,
              pole.length,
              walkPoleFrame.neutral(pole),
              plant.lean,
            );
      out.push({
        pole,
        shoulders,
        fulcrum,
        across,
        ...(to === undefined || planted === undefined
          ? {}
          : { drop: { to, elevation: planted.pole } }),
      });
    }
    return out;
  }

  /**
   * The walk's second of a cut at its own event or share, or undefined when the
   * event is not the walk's.
   */
  function cutAt(
    cut: IAutoMovieMotionHumanActionContext.ICut,
    events: readonly IAutoMovieMotionEvent[],
    duration: number,
  ): number | undefined {
    if (cut.share !== undefined) return cut.share * duration;
    const found: IAutoMovieMotionEvent | undefined = events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === cut.event,
    );
    return found === undefined ? undefined : found.share * duration;
  }

  /**
   * The grip windows by which the walk takes each carried prop over for the
   * whole action, the carrying hand's first so it carries and the other
   * steadies (`HumanPerformanceHold`): a hand the action drives is not carried
   * with the trunk by the performance (`HumanSegment.drives`), and a driven
   * held hand must take its prop over
   * (`IAutoMovieMotionHumanActionPlan.hands`).
   *
   * @param holds The carried props.
   * @returns One grip window per holding hand, over the whole action.
   */
  export function grips(
    holds: readonly IHold[],
  ): IAutoMovieMotionHumanContactWindow[] {
    return holds.flatMap((hold: IHold): IAutoMovieMotionHumanContactWindow[] =>
      hold.pole.hands.map(
        (hand: walkPoleFrame.IHand): IAutoMovieMotionHumanContactWindow => ({
          part: `${hand.side}Hand`,
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: hold.pole.prop },
        }),
      ),
    );
  }

  /**
   * The holds the walk keeps: each carried prop stays in its hands with the
   * fingers they entered with, from the walk's start, so an action cut into the
   * walk at any second (a vault out of its run) enters with the prop held, as a
   * draw from a carrier leaves its prop held (`drawFromCarrier`).
   *
   * @param context The action's context.
   * @param holds The carried props.
   * @returns One hold per holding hand, from the action's start.
   */
  export function kept(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    holds: readonly IHold[],
  ): IAutoMovieMotionPropHold[] {
    return holds.flatMap((hold: IHold): IAutoMovieMotionPropHold[] =>
      hold.pole.hands.map(
        (hand: walkPoleFrame.IHand): IAutoMovieMotionPropHold => ({
          side: hand.side,
          prop: hold.pole.prop,
          from: 0,
          fingers: HumanGrip.fingers(context.entry.pose, hand.side),
        }),
      ),
    );
  }

  /**
   * The posture with each holding hand's goal at a second of the walk: the
   * line's elevation then (`CARRY`, lowered to a plant by the cut, never so low
   * the end nears the floor), turned about the fulcrum and from across the body
   * to straight ahead, placed by the holds and carried by the root and the
   * heading.
   *
   * @param body The body.
   * @param posture The walk's posture.
   * @param holds The carried props.
   * @param seconds The walk's second.
   * @returns The posture with those hands' goals.
   */
  export function write(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    holds: readonly IHold[],
    seconds: number,
  ): IAutoMovieMotionHumanPosture {
    if (holds.length === 0) return posture;
    const heading: IAutoMovieQuaternion = HumanFrame.turn(posture.yaw);
    const world = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(posture.root, Quaternion.rotateVector(heading, local));
    let written: IAutoMovieMotionHumanPosture = posture;
    for (const hold of holds) {
      const share: number =
        hold.drop === undefined
          ? 0
          : minimumJerk.share(
              hold.drop.to > 0
                ? Math.min(1, Math.max(0, seconds / hold.drop.to))
                : 1,
            );
      const floor: number = degrees(
        Math.asin(
          Math.max(
            -1,
            Math.min(
              1,
              (walkFoot.CLEARANCE - posture.root.y - hold.fulcrum.y) /
                (hold.pole.length - hold.pole.fulcrum),
            ),
          ),
        ),
      );
      const elevation: number = Math.max(
        floor,
        CARRY + ((hold.drop?.elevation ?? CARRY) - CARRY) * share,
      );
      const carrying: AutoMovieHumanSide = hold.pole.hands[0]!.side;
      const along: IAutoMovieVector3 = line(
        carrying,
        elevation,
        hold.across * (1 - share),
      );
      const goals: walkPoleFrame.IGoal[] = walkPoleFrame.place(
        hold.pole,
        world(
          Vector3.subtract(
            hold.fulcrum,
            Vector3.scale(along, hold.pole.fulcrum),
          ),
        ),
        Quaternion.rotateVector(heading, along),
        (side: AutoMovieHumanSide): IAutoMovieVector3 =>
          world(hold.shoulders[side]!),
      );
      written = walkPoleFrame.write(
        written,
        goals,
        (side: AutoMovieHumanSide): IAutoMovieVector3 =>
          AutoMovieMotionHumanBend.hang(body, posture, side),
      );
    }
    return written;
  }

  /**
   * The unit line at an elevation, leaning `across` degrees from ahead toward
   * the trunk's middle from the carrying side, in the heading's frame.
   */
  function line(
    carrying: AutoMovieHumanSide,
    elevation: number,
    across: number,
  ): IAutoMovieVector3 {
    const level: number = Math.cos(radians(elevation));
    // The trunk's middle from the right side is toward +X (the left).
    const inward: number = carrying === "right" ? 1 : -1;
    return {
      x: inward * level * Math.sin(radians(across)),
      y: Math.sin(radians(elevation)),
      z: level * Math.cos(radians(across)),
    };
  }

  /** Degrees to radians. */
  function radians(angle: number): number {
    return (angle * Math.PI) / 180;
  }

  /** Radians to degrees. */
  function degrees(angle: number): number {
    return (angle * 180) / Math.PI;
  }
}

/** A right angle, degrees: the carrying elbow's flexion, the forearm forward. */
const RIGHT: number = 90;
