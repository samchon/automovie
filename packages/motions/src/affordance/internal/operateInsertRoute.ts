import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateInsert,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { operateInsert } from "./operateInsert";
import { operateLongInsert } from "./operateLongInsert";

/**
 * Route an operation: an insertion's depth resolved from its socket when not
 * given (`IAutoMovieAffordance.depth`), and planned by `operateLongInsert` when
 * the holding hand grips the tool on its working line (within its half breadth,
 * as a staff is held) and the insertion goes deeper than that grip lies behind
 * the working point, less the half breadth the hand keeps off the mouth, since
 * the hand would otherwise have to enter the bore. A grip off the line (a
 * pistol's) never meets the bore. Any other operation passes through
 * unchanged.
 *
 * @param context The operation's context.
 * @param constants The operation's reach share, stroke pace and aimed width.
 * @returns The long plan when it applies, and the context with the depth
 *   resolved.
 * @throws {HumanRefusal} When an insertion names no depth and its socket
 *   declares none.
 */
export function operateInsertRoute(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanOperate.IParams>,
  constants: operateInsertRoute.IConstants,
): operateInsertRoute.IRouted {
  const mechanism: IAutoMovieMotionHumanOperate.Mechanism = context.params.kind;
  if (mechanism.kind !== "insert") return { context };
  const into: IAutoMovieMotionTarget = mechanism.into;
  const socket: string | undefined =
    into.kind === "prop" ? into.point : undefined;
  const declared: number | undefined =
    into.kind === "prop"
      ? context
          .prop(into.subject)
          .prop.affordances?.find(
            (a: IAutoMovieAffordance): boolean => a.id === socket,
          )?.depth
      : undefined;
  const depth: number | undefined = mechanism.depth ?? declared;
  if (depth === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "mechanism.depth",
      value: "absent",
      feasible: null,
      reason: "the insertion names no depth, and its socket declares none",
      fix: "give the depth, or insert into a socket that declares its depth",
    });
  const resolved: IAutoMovieMotionHumanOperateInsert.IMechanism = {
    ...mechanism,
    depth,
  };
  const routed: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanOperate.IParams> =
    { ...context, params: { ...context.params, kind: resolved } };
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = operateInsert.tool(
    routed,
    resolved,
    side,
  );
  // The hand meets the mouth only where it holds the tool on its working
  // line, as a staff is held: a grip that lies off the line by more than
  // the hand's half breadth (a pistol's, under its barrel) stays beside the
  // bore at any depth, so only a grip on the line can be met by it.
  const half: number =
    (operateLongInsert.BREADTH * context.body.measure.hand) / 2;
  const across: number = Vector3.length(
    Vector3.subtract(
      tool.tip,
      Vector3.scale(tool.axis, Vector3.dot(tool.tip, tool.axis)),
    ),
  );
  if (across > half || depth <= tool.length - half) return { context: routed };
  return {
    context: routed,
    plan: operateLongInsert(routed, {
      mechanism: resolved,
      side,
      tool,
      socket: context.aim(into, context.start),
      ...constants,
    }),
  };
}

/** The records of {@link operateInsertRoute}. */
export namespace operateInsertRoute {
  /** The operation's own constants a long insertion reads. */
  export interface IConstants {
    /** The share of the arm's length a hand holds within. */
    reach: number;

    /** The stroke's pace, metres per second. */
    pace: number;

    /** The width a hand aims at, metres. */
    width: number;
  }

  /** A routed operation. */
  export interface IRouted {
    /** The context, an insertion's depth resolved. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanOperate.IParams>;

    /** The long insertion's plan, when it applies. */
    plan?: IAutoMovieMotionHumanActionPlan;
  }
}
