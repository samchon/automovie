import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTargetGrid } from "../../compose/internal/AutoMovieMotionHumanTargetGrid";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { gestureSignal } from "./gestureSignal";
import { gestureStroke } from "./gestureStroke";
import { gestureTouch } from "./gestureTouch";

/** A direction in the performer's own frame: out, up and forward. */
type IPRAYER = { out: number; up: number; forward: number };

/** The named axes of a place's offset. */
type PutOffsetKey = "lateral" | "height" | "range";

/**
 * A hand's goal for an upright body, in its heading frame
 * (`gestureStroke.hand`): where each gesture's hand surface goes, turned which
 * way and in which shape, at a share of its stroke.
 *
 * @param kind The gesture.
 * @param side The hand.
 * @param u The stroke's progress, 0 to 1.
 * @param cycles The stroke's repetitions over its progress.
 * @param input The stroke input: the body, its base posture, the extent and the
 *   variation of a named place.
 * @returns The hand's goal.
 * @throws {Error} For a gesture that moves no hand.
 */ export function gestureStrokeUpright(
  kind: IAutoMovieMotionHumanGestureStroke.Kind,
  side: AutoMovieHumanSide,
  u: number,
  cycles: number,
  input: gestureStroke.IInput,
): IAutoMovieMotionHumanGestureStroke.IHand {
  const body: IAutoMovieMotionHumanBody = input.body;
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const sign: number = side === "left" ? 1 : -1;
  const L: number = m.upperArm + m.forearm;
  const frame: IAutoMovieMotionHumanFrame = {
    origin: input.base.root,
    yaw: input.base.yaw,
  };
  const transform: HumanFrame.IPrepared = HumanFrame.prepare({
    origin: { x: 0, y: 0, z: 0 },
    yaw: frame.yaw,
  });
  const at: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => transform.point({ x, y, z }, frame.origin);
  const dir: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => transform.direction({ x, y, z });
  // A place of the air by its names, in the performer's own frame: the
  // shares times the stature, the half shoulder width and the arm, ahead
  // of the root, which a lowered posture carries down with it. `reach`
  // scales the distance ahead. `named` is the place without its nudge: when
  // given and the repeat varies, the named place's offset is added, so the
  // offset is one value through the stroke whatever the nudge does.
  const put: (
    place: IAutoMovieMotionHumanTargetGrid.Place,
    reach?: number,
    named?: IAutoMovieMotionHumanTargetGrid.Place,
  ) => IAutoMovieVector3 = (
    place: IAutoMovieMotionHumanTargetGrid.Place,
    reach: number = 1,
    named?: IAutoMovieMotionHumanTargetGrid.Place,
  ): IAutoMovieVector3 => {
    const shares: IAutoMovieMotionHumanTarget.IDefault =
      AutoMovieMotionHumanTargetGrid.place(body, side, place);
    const base: IAutoMovieMotionHumanTarget.IDefault | undefined =
      named === undefined || input.vary === undefined
        ? undefined
        : AutoMovieMotionHumanTargetGrid.place(body, side, named);
    const varied: IAutoMovieMotionHumanTarget.IDefault | undefined =
      base === undefined ? undefined : input.vary!(base);
    const offset: (key: PutOffsetKey) => number = (
      key: PutOffsetKey,
    ): number =>
      base === undefined || varied === undefined
        ? 0
        : (varied[key] ?? 0) - (base[key] ?? 0);
    return at(
      ((shares.lateral ?? 0) + offset("lateral")) * m.shoulderHalfWidth,
      (shares.height + offset("height")) * m.stature,
      (shares.range + offset("range")) * L * reach,
    );
  };
  const facing: (
    fingers: IAutoMovieMotionHumanHand.Direction,
    palm: IAutoMovieMotionHumanHand.Direction,
  ) => IAutoMovieQuaternion = (
    fingers: IAutoMovieMotionHumanHand.Direction,
    palm: IAutoMovieMotionHumanHand.Direction,
  ): IAutoMovieQuaternion =>
    HumanHand.facing(side, frame.yaw, { fingers, palm });
  const wave: number = gestureSignal.oscillation(u, cycles);
  const e: number = input.extent;
  switch (kind) {
    case "wave": {
      // The swing is drawn in the waving hand's own frame, inward first
      // for either hand, so a left wave is the mirror of a right one; the
      // fingers lean with the hand the way it swings.
      const swing: number = 0.06 * e * wave;
      const tilt: number = Math.atan2(swing * L, m.forearm);
      return {
        surface: "palm",
        shape: "flat",
        point: put(
          {
            at: { height: "eye", lateral: "outside", distance: "near" },
            nudge: { out: -swing },
          },
          1,
          { height: "eye", lateral: "outside", distance: "near" },
        ),
        rotation: HumanHand.rotation(side, {
          fingers: dir(-sign * Math.sin(tilt), Math.cos(tilt), 0),
          palm: HumanHand.direction(side, frame.yaw, "forward"),
        }),
        out: 0.3,
      };
    }
    case "raiseHand":
    case "cheer":
      return {
        surface: kind === "cheer" ? "fist" : "palm",
        shape: kind === "cheer" ? "fist" : "flat",
        point: put({
          between: [
            { height: "shoulder", lateral: "shoulder", distance: "close" },
            { height: "overhead", lateral: "shoulder", distance: "close" },
          ],
          share: Math.min(1, e),
          nudge: { up: kind === "cheer" ? 0.08 * e * Math.max(0, wave) : 0 },
        }),
        rotation: facing("up", "forward"),
        out: 0.2,
      };
    case "stopPalm":
      return {
        surface: "palm",
        shape: "flat",
        point: put(
          {
            at: { height: "shoulder", lateral: "inside", distance: "far" },
            nudge: { forward: 0.05 * gestureSignal.bump(u) },
          },
          Math.min(1, e),
          { height: "shoulder", lateral: "inside", distance: "far" },
        ),
        rotation: facing("up", "forward"),
        out: 0,
      };
    case "thumbsDown":
      // The fist ahead of the chest, the palm outward, so the thumb's side
      // is down. Under a hanging elbow that is half a turn of the forearm;
      // with the elbow out at the shoulder's height the arm itself gives a
      // quarter of it and the forearm turns the other quarter. A straight
      // thumb leans toward the knuckles (55 degrees from the thumb side's
      // own direction on the polygon man), so the knuckles are tipped 45
      // degrees down for the thumb to point down, the forearm sloping
      // down from the raised elbow with them.
      return {
        surface: "fist",
        shape: "fist",
        point: put(
          { height: "chest", lateral: "shoulder", distance: "mid" },
          Math.min(1, e),
        ),
        rotation: HumanHand.rotation(side, {
          fingers: dir(0, -Math.SQRT1_2, Math.SQRT1_2),
          palm: dir(sign, 0, 0),
        }),
        out: 0,
        elbow: { out: 0.9, up: 0, forward: 0.3 },
      };
    case "point":
      return gestureTouch.point(input, side);
    case "palmsUp":
    case "shrug":
      return {
        surface: "palm",
        shape: "flat",
        point: put({
          at: { height: "waist", lateral: "shoulder", distance: "near" },
          nudge: {
            out: 0.15 * e,
            up: 0.03 * e * gestureSignal.bump(u),
            forward: 0.15,
          },
        }),
        rotation: facing({ between: ["forward", "out"], share: 0.25 }, "up"),
        out: 0.2,
      };
    case "beckon":
      return {
        surface: "palm",
        shape: "flat",
        point: put({
          at: { height: "chest", lateral: "inside", distance: "mid" },
          nudge: { up: -0.05, forward: -0.05 },
        }),
        rotation: facing("forward", "up"),
        out: 0,
        curl: gestureStroke.curl(kind, u, cycles, e),
      };
    case "clap":
    case "rubHands":
    case "palmsTogether": {
      // The palms meet ahead of the chest, the fingers up and forward; a
      // clap parts them, a rub slides them opposite ways along the
      // fingers, and palms together stay as they meet.
      const apart: number =
        kind === "clap"
          ? 0.09 * e * (0.5 + 0.5 * Math.cos(2 * Math.PI * cycles * u))
          : 0;
      const slide: number = kind === "rubHands" ? sign * 0.03 * e * wave : 0;
      return {
        surface: "palm",
        shape: "flat",
        point: put({
          at: { height: "chest", lateral: "centre", distance: "near" },
          nudge: {
            out: apart,
            up: -0.1 + PRAYER.up * slide,
            forward: 0.17 + PRAYER.forward * slide,
          },
        }),
        rotation: facing(
          { explicit: PRAYER, source: "provisional: everyday-gesture-clap" },
          "in",
        ),
        out: 0.1,
      };
    }
    case "touchFace":
    case "pushGlasses":
    case "scratchHead":
      return gestureTouch.touch(kind, input, side, u, cycles);
    case "nod":
    case "shakeHead":
    case "bow":
    case "chinLift":
    case "squareShoulders":
    case "slump":
      throw new Error(`The gesture ${kind} moves no hand`);
  }
}

/**
 * Where the fingers of two palms held together point: up and forward, 30
 * degrees above the horizontal (provisional).
 */
const PRAYER: IPRAYER = {
  out: 0,
  up: 0.5,
  forward: 0.866,
};
