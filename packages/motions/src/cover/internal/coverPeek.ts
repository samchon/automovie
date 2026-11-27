import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCover,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { coverWall } from "./coverWall";

/*
 * Peek past a wall's end: from the standing entry the whole body leans, its
 * feet planted, until the head crosses the plane through the face's end by the
 * exposure, the head turning to look along the hidden side; it holds and leans
 * back. The lean is a tilt of the standing posture about its root whose
 * direction is found by moving the displayed head; its size is the closed form
 * `asin(shift / height)`.
 * Parameter context: The action's context, standing beside the wall.
 * Parameter p: The peek.
 * Returns: The peek, ending in the entry stance.
 * If a foot is past the end already, the head is already
 * past it, or the lean would exceed `MAX_LEAN`.
 */
export function coverPeek(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCover.IParams>,
  p: IAutoMovieMotionHumanCover.IPeek,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const face: coverWall.IFace = coverWall.read(context, p.wall, p.face);
  const sign: number = p.side === "left" ? -1 : 1;
  const out: IAutoMovieVector3 = Vector3.scale(face.axis, sign);
  const end: IAutoMovieVector3 = Vector3.add(
    face.center,
    Vector3.scale(out, face.half),
  );
  const past = (point: IAutoMovieVector3): number =>
    Vector3.dot(Vector3.subtract(point, end), out);

  const entry: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  for (const side of ["left", "right"] as const)
    if (past(HumanFoot.sockets(body, entry, side)[2]!.point) >= 0)
      throw coverWall.refusal(
        "side",
        p.side,
        "a foot is already past the wall's end",
      );
  const exposure: number = p.exposure ?? EXPOSURE;
  const shift: number = exposure - past(entry.get("head")!.worldPosition);
  if (!(shift > 0))
    throw coverWall.refusal(
      "side",
      p.side,
      "the head is already past the wall's end",
    );

  const stood: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    context.entry.posture.root,
    context.entry.posture.yaw,
  );
  const headAt = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture.seeded(body, posture).pose).get("head")!
      .worldPosition;
  const rest: IAutoMovieVector3 = headAt(stood);
  const height: number = rest.y - stood.root.y;

  // The lean splits into a roll and a pitch by the out direction's share of
  // the body's sides and front; each sign is the one that moves the head out.
  const forward: IAutoMovieVector3 = HumanFrame.forward(stood.yaw);
  const ahead: number = Vector3.dot(out, forward);
  const sideways: number = Math.sqrt(Math.max(0, 1 - ahead * ahead));
  const angle: number =
    (Math.asin(Math.min(1, shift / height)) * 180) / Math.PI;
  if (shift >= height || angle > MAX_LEAN)
    throw new HumanRefusal({
      kind: "reach",
      axis: "exposure",
      value: exposure,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum:
          height * Math.sin((MAX_LEAN * Math.PI) / 180) - (shift - exposure),
        unit: "m",
      },
      reason: "the head cannot lean that far past the wall's end from here",
      fix: "stand nearer the end or ask less exposure",
    });
  const probe = (roll: number, pitch: number): number =>
    past(
      headAt({ ...stood, roll: stood.roll + roll, pitch: stood.pitch + pitch }),
    );
  const rollSign: number = probe(1, 0) >= probe(-1, 0) ? 1 : -1;
  const pitchSign: number = probe(0, 1) >= probe(0, -1) ? 1 : -1;
  const roll: number = rollSign * angle * sideways;
  const pitch: number = pitchSign * angle * Math.abs(ahead);
  const turnSign: number = rollSign;

  const hold: number = p.hold ?? HOLD;
  const duration: number = 2 * LEAN + hold;
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    const w: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.max(0, Math.min(1, seconds / LEAN, (duration - seconds) / LEAN)),
    );
    if (w === 0) return stood;
    const neck: readonly [number, number, number] = stood.joints.neck ?? [
      0, 0, 0,
    ];
    return {
      ...stood,
      roll: stood.roll + roll * w,
      pitch: stood.pitch + pitch * w,
      joints: {
        ...stood.joints,
        neck: [neck[0], neck[1], neck[2] + turnSign * TURN * w],
      },
    };
  };
  return {
    duration,
    events: [
      { name: "peekOut", share: LEAN / duration },
      { name: "peekBack", share: (LEAN + hold) / duration },
    ],
    contacts: [
      {
        part: "leftFoot",
        kind: "bear",
        support: { kind: "ground" },
        from: 0,
        to: 1,
      },
      {
        part: "rightFoot",
        kind: "bear",
        support: { kind: "ground" },
        from: 0,
        to: 1,
      },
    ],
    base: { kind: "standing" },
    posture,
    yields: [],
  };
}

/*
 * How far the head crosses the end's plane by default, metres (provisional: one
 * eye past the corner).
 */
const EXPOSURE: number = 0.12;

/*
 * Seconds the head holds out by default (provisional).
 */
const HOLD: number = 0.8;

/*
 * Seconds to lean out and to lean back (provisional).
 */
const LEAN: number = 0.5;

/*
 * The steepest lean of the standing body, degrees (provisional: a lean that
 * keeps the planted feet loaded).
 */
const MAX_LEAN: number = 20;

/*
 * The head's turn toward the hidden side at full lean, degrees (provisional).
 */
const TURN: number = 35;
