import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import type { rest } from "./rest";
import { restClasped } from "./restClasped";
import { restCrossedArms } from "./restCrossedArms";
import { restElbowSupport } from "./restElbowSupport";

/**
 * Both hands' rest goals on a posture.
 *
 * Each place states where the elbow points, as a bend preset of
 * `AutoMovieMotionHumanBend` (`BENDS`): akimbo and behind-the-head elbows go
 * out wide, chin-rest elbows forward and down, the others down beside the
 * body; crossed arms set their elbows exactly (`restCrossedArms`). A place
 * that holds one hand lays a hand surface on a named region with the palm
 * facing into it; the places that hold the hands together are
 * `restClasped`'s and `restCrossedArms`'s, and the hand under the other
 * elbow is `restElbowSupport`'s.
 *
 * @param body The body.
 * @param posture The standing posture.
 * @param places Each hand's place.
 * @returns The goals of the hands that move.
 * @throws {Error} When the trunk has no surface where a clasp is laid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each kind of place lays where and which function owns the paired ones.
 * @evidence contracts/development/implementation.md#principled-implementation Every place is an effector goal on the body's own surface, with the elbow's side stated by a named preset.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One case per place and one pass for the places that depend on another hand's goal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body is special-cased; a place is a region and directions in the performer's frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per place beyond the paired places' own solves.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanTrunk.region`, `HumanHand.rotation` and the bend presets.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function restGoals(
  body: IHumanBody,
  posture: IHumanPosture,
  places: Record<HumanHand.Side, rest.Place>,
): Partial<Record<HumanHand.Side, rest.IGoal>> {
  const out: Partial<Record<HumanHand.Side, rest.IGoal>> = {};
  const m = body.measure;
  const region = (
    name: AutoMovieHumanoidRegion,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =>
    HumanTrunk.region(body, posture, name);
  const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
  const dir = (x: number, y: number, z: number): IAutoMovieVector3 =>
    HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
      { x, y, z },
    );
  // The hint rides the root and the heading only, as the rest places were
  // captured: a standing rest does not pitch or roll the trunk.
  const elbow = (
    side: HumanHand.Side,
    place: keyof typeof restGoals.BENDS,
  ): IAutoMovieVector3 =>
    AutoMovieMotionHumanBend.arm(
      body,
      { root: posture.root, yaw: posture.yaw },
      side,
      restGoals.BENDS[place],
    );
  const lay = (
    side: HumanHand.Side,
    place: keyof typeof restGoals.BENDS,
    surface: HumanHand.Surface,
    shape: HumanHand.Shape,
    point: IAutoMovieVector3,
    fingers: IAutoMovieVector3,
    palm: IAutoMovieVector3,
  ): rest.IGoal => ({
    surface,
    shape,
    point,
    rotation: HumanHand.rotation(side, { fingers, palm }),
    elbow: elbow(side, place),
  });
  for (const side of ["left", "right"] as const) {
    const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
    const sign: number = side === "left" ? 1 : -1;
    const place: rest.Place = places[side];
    switch (place) {
      case "side":
      case "crossed":
      case "elbowSupport":
        break;
      case "pocket": {
        const pocket = region(`pocketFront${Side}`);
        out[side] = lay(
          side,
          place,
          "palm",
          "relaxed",
          pocket.point,
          dir(0, -1, 0.35),
          dir(-sign, 0, -0.4),
        );
        break;
      }
      case "hip": {
        const hip = region(`hip${Side}`);
        const up: number = 0.5 * (m.waistHeight - m.hipHeight);
        out[side] = lay(
          side,
          place,
          "palm",
          "flat",
          Vector3.add(hip.point, { x: 0, y: up, z: 0 }),
          dir(0, -0.6, 0.8),
          Vector3.scale(hip.normal, -1),
        );
        break;
      }
      case "claspedFront":
      case "claspedBehind": {
        if (side === "right") break;
        const elbows: Record<HumanHand.Side, IAutoMovieVector3> = {
          left: elbow("left", place),
          right: elbow("right", place),
        };
        Object.assign(
          out,
          place === "claspedFront"
            ? restClasped.front(body, posture, elbows)
            : restClasped.behind(body, posture, elbows),
        );
        break;
      }
      case "behindHead": {
        const head = region("headBack");
        const beside: IAutoMovieVector3 = Vector3.add(
          head.point,
          Vector3.scale(dir(1, 0, 0), sign * 0.25 * m.headRadius),
        );
        out[side] = lay(
          side,
          place,
          "palm",
          "flat",
          beside,
          dir(-sign, 0.6, 0),
          Vector3.scale(head.normal, -1),
        );
        break;
      }
      case "chinRest": {
        const chin = region("chin");
        out[side] = lay(
          side,
          place,
          "fist",
          "fist",
          chin.point,
          dir(0, 1, 0),
          dir(-sign, 0, 0),
        );
        break;
      }
    }
  }
  if (places.left === "crossed")
    Object.assign(out, restCrossedArms(body, posture));
  for (const side of ["left", "right"] as const) {
    if (places[side] !== "elbowSupport") continue;
    const other: HumanHand.Side = side === "left" ? "right" : "left";
    out[side] = restElbowSupport(
      body,
      posture,
      side,
      out[other]!,
      elbow(side, "elbowSupport"),
    );
  }
  return out;
}

/**
 * Companion values of {@link restGoals}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table maps.
 * @evidence contracts/development/design.md#principled-representation One bend preset per place that has an elbow hint, keyed exhaustively.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one table the goals read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Names presets of the shared bend table; it holds no values of its own.
 */
export namespace restGoals {
  /** The elbow's bend preset by place. */
  export const BENDS: Readonly<
    Record<
      Exclude<rest.Place, "side" | "crossed">,
      AutoMovieMotionHumanBend.Arm
    >
  > = {
    pocket: "tucked",
    hip: "akimbo",
    claspedFront: "front",
    claspedBehind: "behind",
    behindHead: "raised",
    chinRest: "forward",
    elbowSupport: "folded",
  };
}
