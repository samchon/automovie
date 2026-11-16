import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanWorn } from "../dressing/HumanWorn";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGraspUse } from "./HumanGraspUse";

/**
 * Immutable geometry shared by the candidates of one tool-use grasp search.
 * The prop, its start frame and affordances, the body, entry pose, hand and
 * requested use are fixed for that search; candidate wrists remain separate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which inputs establish equivalence and which candidate input remains variable.
 * @evidence contracts/development/design.md#principled-representation World points, unit directions and rest-relative rotations retain the held-tool and canonical-pose owners' frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared union carries only geometry read by HumanGraspUse and separates a worn frame from an ordinary presented line.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tool kind or body size is embedded; every quantity comes from the supplied affordances, body, posture and requested use.
 */
export namespace HumanGraspUsePreparation {
  /**
   * Fixed inputs of one candidate search, before its displayed wrist is known.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the fixed search inputs and explicitly removes candidate wrist and clearance from the presented-key owner's input record.
   * @evidence contracts/development/design.md#principled-representation The same body, action-start time, world prop reader, hand and requested use as HumanGraspUse.presented; their original types retain units and closed alternatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Derived from the presented-key owner's parameter instead of defining another use or context representation; only candidate-specific members are omitted.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No casts or widening; callers must keep the referenced inputs unchanged for the synchronous search.
   */
  export type IInput = Omit<
    Parameters<typeof HumanGraspUse.presented>[0],
    "wrist" | "clear"
  >;

  /** Shared prop placement and the target region, in world metres. */
  interface IBase {
    /** The actual prop reader fixed by the search. */
    held: IHumanActionContext.IProp;

    /** The prop frame at the fixed action start, in world metres. */
    world: IHumanProp.IFrame;

    /** The admitted working-point affordance in the prop's local frame. */
    tip: IAutoMovieAffordance;

    /** That actual working point at the fixed prop start frame, world metres. */
    tipWorld: IAutoMovieVector3;

    /** The unchanged direct-joint/root assembly; every candidate still fits its full goals. */
    base: ReturnType<typeof resolveHumanPosture.prepareBase>;
  }

  /**
   * World geometry shared across candidate wrists, separated by the use it serves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Worn uses carry a region and its turn-to-frame builder; presented uses carry world target points, unit asked direction, shortest rest-relative turn and the hand's local socket.
   * @evidence contracts/development/design.md#principled-representation The worn/presented discriminant requires each branch's actual geometry; optional site in the presented branch denotes an ahead target rather than a missing region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface of produces and HumanGraspUse consumes every member; each branch retains only the geometry its candidate-key construction reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Geometry comes from the actual prop and body; no fitted candidate answer, time cache or guessed contact is represented.
   */
  export type IPrepared =
    | (IBase & {
        kind: "worn";
        at: AutoMovieHumanoidRegion;
        site: IAutoMovieVector3;
        worn: ReturnType<typeof HumanWorn.prepare>;
      })
    | (IBase & {
        kind: "presented";
        site: IAutoMovieVector3 | undefined;
        asked: IAutoMovieVector3;
        turn: IAutoMovieQuaternion;
        ahead: IAutoMovieVector3;
        socket: IAutoMovieVector3;
        hang: IAutoMovieVector3;
      });

  /**
   * Resolve the fixed contacts, target region and line once per grasp search.
   *
   * @param props The fixed body, entry posture, prop, hand and requested use.
   * @returns Geometry in the same frames consumed by the presented-key fit.
   * @throws {HumanRefusal} For the same absent working point or body surface the unprepared use refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, result frames and preserved refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the prop at the action's start and the named region on the entry pose; the shortest turn aligns the tool line or working face with the requested direction, retaining the body's left as the existing opposite-direction axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Contact admission precedes the target-region reading; worn uses return their frame inputs while other uses prepare their line and hand geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original use lines, placement shares and refusal bounds are unchanged; no fitted candidate is reused across wrists.
   * @evidence contracts/development/implementation.md#efficient-algorithms One affordance search, demanded entry FK/region reading and O(B+J) canonical base assembly serve all C candidate wrists; one O(B) base snapshot and fixed geometry are retained independently of C, while actual candidate fits remain unchanged.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the fixed context, start time, prop, handle, side and use determine this result; HumanGraspUse.prepare owns it for exactly that candidate search.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search owns one O(B) canonical base, fixed prop/target geometry and its prop reader; the consuming builder releases them with that search, without a global cache, FK reader or sampled-time history.
   */
  export function of(props: IInput): IPrepared {
    const context: IInput["context"] = props.context;
    const held: IHumanActionContext.IProp = context.prop(props.prop);
    const affordances: readonly IAutoMovieAffordance[] = held.prop.affordances ?? [];
    const contact: (id: string) => IAutoMovieAffordance | undefined = (id: string): IAutoMovieAffordance | undefined =>
      affordances.find((value: IAutoMovieAffordance): boolean => value.id === id);
    const handle: IAutoMovieAffordance | undefined = contact(props.handle);
    const tip: IAutoMovieAffordance | undefined = contact(props.use.tip);
    if (handle === undefined || tip === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "use",
        value: `${props.prop}.${props.use.tip}`,
        feasible: { kind: "alternatives", values: affordances.map(
          (value: IAutoMovieAffordance): string => value.id,
        ) },
        reason: `${props.prop} declares no ${props.use.tip}, the working point its use names`,
        fix: "name one of the prop's contacts as the tip, or pick the prop up without a use",
      });
    const world: IHumanProp.IFrame = held.frame(context.start);
    const at: AutoMovieHumanoidRegion | undefined = props.use.at === "mouth"
      ? "mouth" : typeof props.use.at === "object" ? props.use.at.region : undefined;
    const region: IHumanBody["surfaces"]["regions"]["mouth"] | undefined =
      at === undefined ? undefined : context.body.surfaces.regions[at];
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    if (props.use.line !== "worn") {
      requested.add(`${props.side}UpperArm`);
      requested.add(`${props.side}LowerArm`);
      requested.add(`${props.side}Hand`);
    }
    if (region !== undefined) requested.add(region.bone);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(context.body, context.entry.pose, undefined, requested);
    const bearer: IAutoMovieResolvedBone | undefined =
      region === undefined ? undefined : bones.get(region.bone);
    const placed: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } | undefined =
      region !== undefined && bearer !== undefined
        ? resolveAutoMovieHumanoidSurfaces.place(region, bearer) : undefined;
    if ((props.use.line === "along" || props.use.line === "worn") && placed === undefined)
      throw new HumanRefusal({
        kind: "parameter", axis: "use", value: props.use.line,
        feasible: { kind: "alternatives", values: ["forearm", "oblique", "square", "across"] },
        reason: "a tool laid along a surface needs a surface of the performer's own body to lie on, and this use is ahead of the body",
        fix: "name the mouth or a region as the use's place, or another line",
      });
    const tipWorld: IAutoMovieVector3 = Vector3.add(world.position,
      Quaternion.rotateVector(world.rotation, tip.frame.translation));
    if (props.use.line === "worn")
      return { kind: "worn", held, world, tip, tipWorld, at: at!, site: placed!.point,
        worn: HumanWorn.prepare(context.body, context.entry.posture, held.prop, at!),
        base: resolveHumanPosture.prepareBase(context.body, context.entry.posture) };

    // These directions depend on the placed prop and target, never on the
    // candidate wrist that will be turned onto them.
    const lying: IAutoMovieVector3 = Vector3.normalize(Quaternion.rotateVector(
      world.rotation, Vector3.subtract(tip.frame.translation, handle.frame.translation),
    ));
    const yaw: number = (context.entry.posture.yaw * Math.PI) / 180;
    const rise: number = (HumanGraspUse.RISE[props.use.line] * Math.PI) / 180;
    const level: number = at === undefined ? 1 : -1;
    const from: IAutoMovieVector3 = props.use.line === "along"
      ? Vector3.normalize(Quaternion.rotateVector(world.rotation,
          Quaternion.rotateVector(tip.frame.rotation, { x: 0, y: 1, z: 0 })))
      : lying;
    const asked: IAutoMovieVector3 = props.use.line === "along"
      ? Vector3.scale(Vector3.normalize(placed!.normal), -1)
      : props.use.line === "across"
        ? { x: (props.side === "right" ? 1 : -1) * Math.cos(yaw), y: 0,
            z: (props.side === "right" ? -1 : 1) * Math.sin(yaw) }
        : { x: level * Math.sin(yaw) * Math.cos(rise), y: Math.sin(rise),
            z: level * Math.cos(yaw) * Math.cos(rise) };
    const across: IAutoMovieVector3 = Vector3.cross(from, asked);
    const axis: IAutoMovieVector3 = Vector3.length(across) > 1e-9
      ? Vector3.normalize(across) : { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
    return {
      kind: "presented", held, world, tip, tipWorld, site: placed?.point, asked,
      turn: Quaternion.fromAxisAngle(axis,
        (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(from, asked)))) * 180) / Math.PI),
      ahead: HumanGraspUse.place(bones, props.side, context.entry.posture.yaw),
      socket: HumanHand.offset(context.body, props.side, "grip").point,
      hang: AutoMovieMotionHumanBend.hang(context.body, context.entry.posture, props.side),
      base: resolveHumanPosture.prepareBase(context.body, context.entry.posture),
    };
  }
}
