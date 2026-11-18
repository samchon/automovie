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
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanGraspUse } from "./HumanGraspUse";

/**
 * The geometry a presented use key is built from (`HumanGraspUse.presented`):
 * the tool's contacts, the line it lies on and the line asked, the region or
 * the place ahead it goes to, and the candidate hand turned onto the asked
 * line.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the setup, its world-metre points and rotations, and its refusals.
 * @evidence contracts/development/design.md#principled-representation Canonical context, affordance, point and quaternion types; no solved pose is carried.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of` supplies exactly what `HumanGraspUse.presented` reads, kept apart so that file stays under the size bound.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tool kind is named; every point comes from the prop's affordances and the body's regions.
 */
export namespace HumanGraspUsePreparation {
  /**
   * The request: `HumanGraspUse.presented`'s props.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The context, prop, handle, hand, use, candidate wrist and optional clearance, in the units `IAutoMovieMotionHumanGraspUse` states.
   * @evidence contracts/development/design.md#principled-representation The interface's own props type, named here for the setup's signature.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An alias of the owned type, no copy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing widened or cast.
   */
  export type IInput = IAutoMovieMotionHumanGraspUse.IPresentedProps;

  /**
   * The setup a presented key is built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation World points and rotations and the wrist-local socket in canonical types; optional `at` and `site` separate a region use from one ahead of the body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member feeds the worn branch or the key builder of `presented`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixed pose or sampled frame.
   */
  export interface IPrepared {
    /** The request's context. */
    context: IInput["context"];

    /** The held prop's reader. */
    held: IAutoMovieMotionHumanPropReader;

    /** The working-point affordance. */
    tip: IAutoMovieAffordance;

    /** The region of the performer's own body the use is at; ahead of the body when absent. */
    at: AutoMovieHumanoidRegion | undefined;

    /** The region's point on the entry body, world metres; absent ahead of the body. */
    site: IAutoMovieVector3 | undefined;

    /** The candidate wrist's rotation turned by the shortest turn onto the asked line. */
    laid: IAutoMovieQuaternion;

    /** The grip socket's place ahead of the body (`HumanGraspUse.place`), world metres. */
    ahead: IAutoMovieVector3;

    /** The grip socket's offset from the wrist in hand axes, metres. */
    socket: IAutoMovieVector3;

    /** Rotations by degrees about the asked line, or the surface's normal for an `along` use. */
    roll: ReturnType<typeof Quaternion.prepareAxisAngle>;
  }

  /**
   * Read the use's contacts, lines, region and laid hand.
   *
   * @param props The request.
   * @returns The setup.
   * @throws {HumanRefusal} An `affordance` refusal on `use` when the prop lacks the handle or the working point; a `parameter` refusal on `use` for an `along` or `worn` line with no region of the performer's own.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the request, the setup and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The tool's line runs from the handle to the working point in the prop's frame at the start; the asked line is forward of the body risen by the use's angle, across toward the other hand, or into the region's surface; the shortest turn between them about their cross product, or about the body's left when they oppose, lays the candidate hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Contacts, lines, region, turn and the two socket places, in that order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing contact or region is refused, never substituted; the 1e-9 cross-product length is the floating-point floor below which the lines are parallel.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two affordance scans and one entry FK of the arm and the region's bone.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The asked axis is prepared once for every roll of the search.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The setup lives for one `presented` call.
   */
  export function of(props: IInput): IPrepared {
    const context: (typeof props)["context"] = props.context;
    const held: IAutoMovieMotionHumanPropReader = context.prop(props.prop);
    const contact: (id: string) => IAutoMovieAffordance | undefined = (id: string): IAutoMovieAffordance | undefined =>
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
        held.frame(context.start).rotation,
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
    const region: IAutoMovieMotionHumanBody["surfaces"]["regions"]["mouth"] | undefined =
      at === undefined ? undefined : context.body.surfaces.regions[at];
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        `${props.side}UpperArm`, `${props.side}LowerArm`, `${props.side}Hand`,
        ...(region === undefined ? [] : [region.bone]),
      ]),
    );
    const bearer: IAutoMovieResolvedBone | undefined =
      region === undefined ? undefined : bones.get(region.bone);
    const placed:
      | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
      | undefined =
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
        held.frame(context.start).rotation,
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

    return { context, held, tip, at, site, laid, ahead, socket,
      roll: Quaternion.prepareAxisAngle(asked) };
  }
}
