import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { AquaticPosture } from "./AquaticPosture";

/** Hull frames and shared wrist and ankle support for paddle and sail. */
export namespace AquaticCrew {
  /**
   * A hull frame reader from the action's film clock, with poised local contact
   * anchors.
   */
  export interface IHull {
    /** Supporting prop id. */
    id: string;
    /** Carrier orientation before the action, expressed as world to hull. */
    inverse: IAutoMovieQuaternion;
    /** Entered carrier transform. */
    origin: IAutoMovieRigidTransform;
    /** Local position of the entered root. */
    root: IAutoMovieVector3;
    /** Ankle targets relative to the hull at the entered phase. */
    feet: Readonly<Record<Side, IAutoMovieVector3>>;
    /** Carrier state at a local action second. */
    frame(seconds: number): IAutoMovieRigidTransform;
    /** The named articulated world grip, when authored. */
    grip(side: Side, seconds: number): IAutoMovieVector3 | undefined;
    /** Entered travel of a named hull articulation in its own unit. */
    travel(articulation: string): number;
  }

  /** Anatomical side. */
  export type Side = AutoMovieHumanSide;

  /** The limb goal key of one leg. */
  export type Leg = `${Side}Leg`;

  /**
   * Obtain entered anchors, with native handle validation for laws that pose
   * the whole rig.
   */
  export function bind(
    context: AquaticPosture.Context,
    native: boolean = false,
  ): IHull {
    const { params, entry, start } = context;
    const id: string | undefined = params.support;
    if (id === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "support",
        value: null,
        feasible: null,
        reason: "a small-craft action must use the performance's moving hull",
        fix: "supply the subject id of the supporting hull",
      });
    const carrier: IAutoMovieMotionHumanPropReader = context.prop(id);
    const origin: IAutoMovieRigidTransform = carrier.frame(start);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, origin.position),
      );
    const rest: IAutoMovieVector3 | undefined = params.footRest;
    const foot = (side: Side, sign: number): IAutoMovieVector3 =>
      rest === undefined
        ? local(entry.feet[side].ankle)
        : { ...rest, x: rest.x + sign * context.body.measure.stature * 0.085 };
    const grip = (
      side: Side,
      seconds: number,
    ): IAutoMovieVector3 | undefined => {
      const name: string | undefined =
        side === "left" ? params.leftGrip : params.rightGrip;
      return name === undefined
        ? undefined
        : carrier.prop.point?.(name, start + seconds)?.point;
    };
    for (const side of ["left", "right"] as const) {
      const name: string | undefined =
        side === "left" ? params.leftGrip : params.rightGrip;
      if (
        name !== undefined &&
        grip(side, 0) === undefined &&
        !(
          native &&
          carrier.prop.affordances?.some(
            (contact) => contact.id === name && contact.kind === "handle",
          ) === true
        )
      )
        throw new HumanRefusal({
          kind: "affordance",
          axis: `${side}Grip`,
          value: name,
          feasible: null,
          reason: "the supporting craft has no such grip point",
          fix: "name a handle or placed socket on the boat's performance prop",
        });
    }
    return {
      id,
      inverse,
      origin,
      root: local(entry.posture.root),
      feet: { left: foot("left", 1), right: foot("right", -1) },
      frame: (seconds: number): IAutoMovieRigidTransform =>
        carrier.frame(start + seconds),
      grip,
      travel: (articulation: string): number =>
        carrier.state?.(start)[articulation] ?? 0,
    };
  }

  /**
   * Convert staged hull-local motion to the displayed pose and fit the active
   * wrists and ankles; a foot keeps its entered orientation in the hull.
   */
  export function apply(
    context: AquaticPosture.Context,
    hull: IHull,
    seconds: number,
    shape: IAutoMovieMotionHumanPosture,
    local: IAutoMovieVector3,
    left?: IAutoMovieVector3,
    right?: IAutoMovieVector3,
    braced: boolean = false,
  ): IAutoMovieMotionHumanPosture {
    const frame: IAutoMovieRigidTransform = hull.frame(seconds);
    const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, point),
      );
    const root: IAutoMovieVector3 = world(local);
    const carrierTurn: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      hull.inverse,
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      carrierTurn,
      humanPostureHeading(shape),
    );
    const posture: IAutoMovieMotionHumanPosture = {
      ...shape,
      ...humanPostureHeading.angles(rotation),
      root,
    };
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieVector3 | undefined =
        side === "left" ? left : right;
      if (foot !== undefined)
        posture.limbs[`${side}Leg`] = {
          ...AutoMovieMotionHumanLeg.goal(
            context.body,
            posture,
            side,
            {
              ankle: world(foot),
              rotation: Quaternion.multiply(
                carrierTurn,
                context.entry.feet[side].rotation,
              ),
            },
            false,
          ),
          planted: braced,
        };
      const grip: IAutoMovieVector3 | undefined = hull.grip(side, seconds);
      if (grip !== undefined)
        posture.limbs[`${side}Arm`] = {
          point: grip,
          bend: Vector3.add(
            grip,
            Quaternion.rotateVector(rotation, {
              x: side === "left" ? 0.24 : -0.24,
              y: -0.18,
              z: -0.1,
            }),
          ),
        };
    }
    return posture;
  }

  /** Entered body-relative displacement expressed in the hull frame. */
  export function direction(
    context: AquaticPosture.Context,
    hull: IHull,
    displacement: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      hull.inverse,
      Quaternion.rotateVector(
        humanPostureHeading(context.entry.posture),
        displacement,
      ),
    );
  }

  /** Continuous, bounded progress along one authored stage. */
  export function span(at: number, from: number, to: number): number {
    return minimumJerk.share(
      Math.max(0, Math.min(1, (at - from) / (to - from))),
    );
  }

  /** A bearing window anchored in the moving hull. */
  export function bear(
    subject: string,
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    from: number,
    to: number,
    region?: IAutoMovieMotionHumanContactWindow["region"],
  ): IAutoMovieMotionHumanContactWindow {
    return { part, kind, from, to, region, support: { kind: "prop", subject } };
  }

  /** Hold articulated sockets without taking ownership of the entire hull. */
  export function grips(
    hull: IHull,
    params: AquaticPosture.Context["params"],
  ): IAutoMovieMotionHumanContactWindow[] {
    return (["left", "right"] as const)
      .filter(
        (side: Side): boolean =>
          (side === "left" ? params.leftGrip : params.rightGrip) !== undefined,
      )
      .map(
        (side: Side): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Hand`,
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: hull.id, carries: false },
        }),
      );
  }
}
