import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanBody } from "../body/createHumanBody";

/**
 * Completed elbow solves of one genuine body, by the exact scalar inputs
 * that decide them, so a goal asked again is answered without its sweep.
 *
 * `AutoMovieMotionHumanBend.solve` is a pure function of the body, the arm,
 * the trunk's root and heading, the wrist, the hand's rotation and the
 * fallback: the chain, the colliders and the ranges come from the body's
 * immutable rig and the trunk's root and heading alone
 * (`AutoMovieMotionHumanBendChain.of`), and the strain's neutral is the
 * body's own hanging arm. A law whose goal a planner reads again at the same
 * instant (a carried arm's course reads a plan's posture at every knot on
 * each of its passes) asks the same solve again; the memo returns a fresh
 * copy of the elbow that solve returned.
 */
export namespace AutoMovieMotionHumanBendMemo {
  /** The most solves kept per body; the least recently read is dropped first (provisional: a planner's knots of one course and its frames fit well within it). */
  export const CAPACITY: number = 2048;

  /**
   * The elbow of a solve, read from the body's table or computed and kept.
   *
   * @param props The request, exactly as `AutoMovieMotionHumanBend.solve` takes it.
   * @param run The solve itself, run when the table has no such request.
   * @returns A fresh copy of the elbow the solve returns for these inputs, world metres.
   * @throws Whatever `run` throws; a refusal is never kept, so it is thrown again on every request.
   */
  export function solve(
    props: IAutoMovieMotionHumanBend.ISolve,
    run: () => IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (!createHumanBody.owns(props.body)) return run();
    let table: Map<string, IAutoMovieVector3> | undefined = TABLES.get(
      props.body,
    );
    if (table === undefined) {
      table = new Map();
      TABLES.set(props.body, table);
    }
    const key: string = words(props);
    const kept: IAutoMovieVector3 | undefined = table.get(key);
    if (kept !== undefined) {
      table.delete(key);
      table.set(key, kept);
      return { ...kept };
    }
    const elbow: IAutoMovieVector3 = run();
    table.set(key, { x: elbow.x, y: elbow.y, z: elbow.z });
    if (table.size > CAPACITY) table.delete(table.keys().next().value!);
    return elbow;
  }
}

/** Each genuine body's table of solves. */
const TABLES: WeakMap<
  IAutoMovieMotionHumanBody,
  Map<string, IAutoMovieVector3>
> = new WeakMap();

/** The exact words of a request: the arm, the trunk, the wrist, the hand and the fallback. */
function words(props: IAutoMovieMotionHumanBend.ISolve): string {
  const posture: IAutoMovieMotionHumanBend.ISolve["posture"] = props.posture;
  const point: IAutoMovieVector3 = props.point;
  const rotation: IAutoMovieMotionHumanBend.ISolve["rotation"] = props.rotation;
  const fallback: IAutoMovieMotionHumanBend.ISolve["fallback"] = props.fallback;
  const parts: string[] = [
    props.side,
    word(posture.root.x),
    word(posture.root.y),
    word(posture.root.z),
    word(posture.yaw),
    word(posture.pitch ?? 0),
    word(posture.roll ?? 0),
    word(point.x),
    word(point.y),
    word(point.z),
  ];
  if (rotation === undefined) parts.push("-");
  else
    parts.push(
      word(rotation.x),
      word(rotation.y),
      word(rotation.z),
      word(rotation.w),
    );
  if (fallback === undefined) parts.push("-");
  else if (typeof fallback === "string") parts.push(fallback);
  else parts.push(word(fallback.out), word(fallback.up), word(fallback.forward));
  return parts.join(" ");
}

/** A number's word: its shortest round-trip text, which is unique per double, with negative zero kept apart from zero. */
function word(value: number): string {
  return Object.is(value, -0) ? "-0" : String(value);
}
