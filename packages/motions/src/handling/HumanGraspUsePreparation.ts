import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGraspUse,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/internal/poseBones";
import { HumanGraspUse } from "./HumanGraspUse";

/** The record of `IOfPlaced`'s site. */
type IOfPlaced = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/**
 * Read the use's contacts, lines, region and laid hand.
 *
 * @param props The request.
 * @param closure The prop frame at closure, or the entry frame when absent.
 * @returns The setup.
 * @throws {HumanRefusal} An `affordance` refusal on `use` when the prop lacks
 *   the handle or the working point; a `parameter` refusal on `use` for an
 *   `along` or `worn` line with no region of the performer's own.
 */
export function HumanGraspUsePreparation(
  props: HumanGraspUsePreparation.IInput,
  closure?: IAutoMovieRigidTransform,
): HumanGraspUsePreparation.IPrepared {
  const context: (typeof props)["context"] = props.context;
  const held: IAutoMovieMotionHumanPropReader = context.prop(props.prop);
  const world: IAutoMovieRigidTransform = closure ?? held.frame(context.start);
  const contact: (id: string) => IAutoMovieAffordance | undefined = (
    id: string,
  ): IAutoMovieAffordance | undefined =>
    (held.prop.affordances ?? []).find(
      (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
    );
  const handle: IAutoMovieAffordance | undefined = contact(props.handle);
  const tip: IAutoMovieAffordance | undefined = contact(props.use.tip);
  if (handle === undefined || tip === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "use",
      value: `${props.prop}.${props.use.tip}`,
      feasible: {
        kind: "alternatives",
        values: (held.prop.affordances ?? []).map(
          (affordance: IAutoMovieAffordance): string => affordance.id,
        ),
      },
      reason: `${props.prop} declares no ${props.use.tip}, the working point its use names`,
      fix: "name one of the prop's contacts as the tip, or pick the prop up without a use",
    });

  // The tool's line as it lies now, and the line asked: forward of the
  // body, risen by the use's angle.
  const lying: IAutoMovieVector3 = Vector3.normalize(
    Quaternion.rotateVector(
      world.rotation,
      Vector3.subtract(tip.frame.translation, handle.frame.translation),
    ),
  );
  const yaw: number = (context.entry.posture.yaw * Math.PI) / 180;
  const rise: number = (HumanGraspUse.RISE[props.use.line] * Math.PI) / 180;
  const forward: IAutoMovieVector3 = {
    x: Math.sin(yaw),
    y: 0,
    z: Math.cos(yaw),
  };

  // Ahead of the body the tool's line runs away from it. At the mouth or
  // a region it runs back into the body, from the hand before it to the
  // working point there: a line that ran forward would put the handle
  // inside the head.
  const at: AutoMovieHumanoidRegion | undefined =
    props.use.at === "mouth"
      ? "mouth"
      : typeof props.use.at === "object"
        ? props.use.at.region
        : undefined;
  const level: number = at === undefined ? 1 : -1;

  // At the mouth or a region, the tool's working point goes there and
  // the wrist follows from the hand's rotation: the point is rigid in the
  // hand, at the offset it has in the candidate grasp.
  // The entry places only what is read: the arm for the presenting place
  // (`HumanGraspUse.place`) and the region's bone.
  const region:
    | IAutoMovieMotionHumanBody["surfaces"]["regions"]["mouth"]
    | undefined =
    at === undefined ? undefined : context.body.surfaces.regions[at];
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([
      `${props.side}UpperArm`,
      `${props.side}LowerArm`,
      `${props.side}Hand`,
      ...(region === undefined ? [] : [region.bone]),
    ]),
  );
  const bearer: IAutoMovieResolvedBone | undefined =
    region === undefined ? undefined : bones.get(region.bone);
  const placed: IOfPlaced | undefined =
    region !== undefined && bearer !== undefined
      ? resolveAutoMovieHumanoidSurfaces.place(region, bearer)
      : undefined;
  const site: IAutoMovieVector3 | undefined = placed?.point;
  if (
    (props.use.line === "along" || props.use.line === "worn") &&
    placed === undefined
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "use",
      value: props.use.line,
      feasible: {
        kind: "alternatives",
        values: ["forearm", "oblique", "square", "across"],
      },
      reason:
        "a tool laid along a surface needs a surface of the performer's own body to lie on, and this use is ahead of the body",
      fix: "name the mouth or a region as the use's place, or another line",
    });

  // What is laid and onto what: the tool's line onto the asked line,
  // turned about it; laid along a surface, the working point's own face
  // onto the surface, turned about its normal. A line across the body
  // runs level toward the other hand: the body's left from the right
  // hand, its right from the left.
  const face: IAutoMovieVector3 = Vector3.normalize(
    Quaternion.rotateVector(
      world.rotation,
      Quaternion.rotateVector(tip.frame.rotation, { x: 0, y: 1, z: 0 }),
    ),
  );
  const from: IAutoMovieVector3 = props.use.line === "along" ? face : lying;
  const asked: IAutoMovieVector3 =
    props.use.line === "along"
      ? Vector3.scale(Vector3.normalize(placed!.normal), -1)
      : props.use.line === "across"
        ? {
            x: (props.side === "right" ? 1 : -1) * Math.cos(yaw),
            y: 0,
            z: (props.side === "right" ? -1 : 1) * Math.sin(yaw),
          }
        : {
            x: level * forward.x * Math.cos(rise),
            y: Math.sin(rise),
            z: level * forward.z * Math.cos(rise),
          };

  // The shortest turn from one to the other; directions that oppose each
  // other turn about the body's left, which keeps the turn in the plane
  // the body faces.
  const across: IAutoMovieVector3 = Vector3.cross(from, asked);
  const axis: IAutoMovieVector3 =
    Vector3.length(across) > 1e-9
      ? Vector3.normalize(across)
      : { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
  const laid: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle(
      axis,
      (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(from, asked)))) * 180) /
        Math.PI,
    ),
    props.wrist.rotation,
  );
  // Ahead of the body the tool's grip goes to the place a law presents it
  // at (`place`), the grip socket there and the wrist following.
  const ahead: IAutoMovieVector3 = HumanGraspUse.place(
    bones,
    props.side,
    context.entry.posture.yaw,
  );
  const socket: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    props.side,
    "grip",
  ).point;

  return {
    context,
    held,
    world,
    tip,
    at,
    site,
    laid,
    ahead,
    socket,
    roll: Quaternion.prepareAxisAngle(asked),
  };
}

/**
 * The geometry a presented use key is built from (`HumanGraspUse.presented`):
 * the tool's contacts, the line it lies on and the line asked, the region or
 * the place ahead it goes to, and the candidate hand turned onto the asked
 * line.
 */
export namespace HumanGraspUsePreparation {
  /** The request: `HumanGraspUse.presented`'s props. */
  export type IInput = IAutoMovieMotionHumanGraspUse.IPresentedProps;

  /** The setup a presented key is built from. */
  export interface IPrepared {
    /** The request's context. */
    context: IInput["context"];

    /** The held prop's reader. */
    held: IAutoMovieMotionHumanPropReader;

    /** The prop frame at grasp closure, in world metres and unit rotation. */
    world: IAutoMovieRigidTransform;

    /** The working-point affordance. */
    tip: IAutoMovieAffordance;

    /**
     * The region of the performer's own body the use is at; ahead of the body
     * when absent.
     */
    at: AutoMovieHumanoidRegion | undefined;

    /**
     * The region's point on the entry body, world metres; absent ahead of the
     * body.
     */
    site: IAutoMovieVector3 | undefined;

    /**
     * The candidate wrist's rotation turned by the shortest turn onto the asked
     * line.
     */
    laid: IAutoMovieQuaternion;

    /**
     * The grip socket's place ahead of the body (`HumanGraspUse.place`), world
     * metres.
     */
    ahead: IAutoMovieVector3;

    /** The grip socket's offset from the wrist in hand axes, metres. */
    socket: IAutoMovieVector3;

    /**
     * Rotations by degrees about the asked line, or the surface's normal for an
     * `along` use.
     */
    roll: ReturnType<typeof Quaternion.prepareAxisAngle>;
  }
}
