import { type IAutoMovieResolvedBone, Quaternion, Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieAffordance, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { HumanGraspUse } from "./HumanGraspUse";

/**
 * Original per-call tool-use geometry, in its public callback admission order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the original one-call contact/line/entry setup, its world-metre points and rotations, and the foreign frame/entry reads that remain live in their original sequence.
 * @evidence contracts/development/design.md#principled-representation Canonical context, affordance, point and quaternion types carry actual admitted geometry; the result contains no fixed direct posture, fitted answer or source-immutability claim.
 * @evidence contracts/development/design.md#minimal-and-owned-surface of supplies exactly the original setup consumed once by HumanGraspUse.presented; the helper keeps that source below the file bound without another geometry or numerical owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No frame callback, eager face transform, full entry FK, refusal, source read or unused-but-original admission is merged or omitted; borrowed inputs are not certified plain or immutable.
 */
export namespace HumanGraspUsePreparation {
  /**
   * The actual public per-call request, including its displayed candidate wrist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reuses presented's current body/entry/prop/start, handle/hand/use, wrist and optional clearance request with their original units and callback contract.
   * @evidence contracts/development/design.md#principled-representation Parameters derives the existing request directly, including all current nested source values rather than a frozen or copied posture graph.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The original caller passes the complete request to one setup operation; no alternate context or grasp representation is introduced.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No raw input is widened, cloned, probed for descriptors or treated as an immutable capability.
   */
  export type IInput = Parameters<typeof HumanGraspUse.presented>[0];

  /**
   * The original setup locals consumed by the remainder of this one call.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members carry the original context/held prop/tip/region, optional world site, already laid candidate rotation, ahead grip point and wrist-local socket; the roll reader owns only the private computed asked axis.
   * @evidence contracts/development/design.md#principled-representation World points/rotations and the wrist-local socket retain canonical types; optional at/site keep the original ahead-versus-region meaning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member feeds the original worn branch or non-worn key builder, with no fixed body pose, sampled frame or unused whole-body output exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The private asked axis is arithmetic output of this call; sharing its numerical length never certifies borrowed context, callback or posture state as immutable.
   */
  export interface IPrepared {
    /** Original request context, still live across subsequent callbacks. */
    context: IInput["context"];
    /** Original prop reader, whose later frame calls remain actual. */
    held: IHumanActionContext.IProp;
    /** Admitted working-point affordance. */
    tip: IAutoMovieAffordance;
    /** Original own-body region, or ahead when absent. */
    at: AutoMovieHumanoidRegion | undefined;
    /** Original world-metre placed region point, when present. */
    site: IAutoMovieVector3 | undefined;
    /** Original shortest-line turn times the actual candidate wrist attitude. */
    laid: IAutoMovieQuaternion;
    /** Original ahead grip-socket point, world metres. */
    ahead: IAutoMovieVector3;
    /** Original body-local grip socket offset, metres. */
    socket: IAutoMovieVector3;
    /** Actual degree rotations on the private computed asked axis. */
    roll: ReturnType<typeof Quaternion.prepareAxisAngle>;
  }

  /**
   * Admit the original contacts, line, body region and laid wrist in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserves handle then tip lookup, lying frame read, yaw/line/region selection, full entry FK, placed-region refusal, eager second face frame read, shortest turn and ahead/socket setup.
   * @evidence contracts/development/implementation.md#principled-implementation The same original vector/quaternion expressions form the actual line and requested direction; the shortest turn is applied to the candidate wrist before ahead and socket reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chronological setup owner returns its original locals to the remaining key/roll search; it does not accept or return a solved pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original foreign frame invocation, full entry admission, eager face computation, nested source lookup, opposite-direction threshold, arithmetic grouping and refusal remains, including work before the worn branch.
   * @evidence contracts/development/implementation.md#efficient-algorithms Original one-call contact scans and full entry FK remain. A lazy axis-angle reader shares only the private arithmetic asked axis's length across actual rolls; each angle/trigonometric output remains fresh. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The asked axis is a newly constructed private vector that no external callback receives; its length alone is invariant. Context, prop frames and entry source are never frozen or reused as prepared direct assembly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One call owns its setup locals and private axis reader until its original key search completes. No direct base, pose/FK workspace, evaluated roll answer, time history or external handle is retained.
   */
  export function of(props: IInput): IPrepared {
    const context: (typeof props)["context"] = props.context;
    const held: IHumanActionContext.IProp = context.prop(props.prop);
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
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      context.entry.pose,
    );
    const region: IHumanBody["surfaces"]["regions"]["mouth"] | undefined =
      at === undefined ? undefined : context.body.surfaces.regions[at];
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
