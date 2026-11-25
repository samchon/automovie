import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanClearance,
  HumanFoot,
  HumanFootRotation,
  HumanFrame,
  stand,
  stepOver,
  stepOverPathSwing,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_step_over_path_swing {
  /** Rounding of sums of a few metres. */
  const ROUNDING: number = 1e-12;

  /**
   * How far the taut string may dip below a height it clears, metres: its corners
   * are rounded within `AutoMovieMotionHumanClearance.RADIUS`, which lowers it by
   * at most half the radius, carried by the caller's clearance.
   */
  const STRING: number = AutoMovieMotionHumanClearance.RADIUS / 2;

  /**
   * `stepOverPathSwing` lays a step over's swings: the lead sole clears the
   * obstacle's top by `stepOver.MARGIN` and the trail sole by `stepOver.TRAIL`,
   * the floor is 0 before the obstacle and the landing beyond it, the lead
   * sockets' envelopes ramp from their footprints up to the lead's clearance, and
   * each swing runs from the foot's start to its landing over every height its
   * sole must clear.
   *
   * The body is built whole (`humanFixtureBody`): the sole's sockets read the
   * rig's foot. The scope is the one `stepOverPath` lays for a standing body.
   *
   * Scenarios, the average man standing at the origin facing +Z, leading with the
   * right foot over a box 0.2 m high from 0.3 to 0.4 m ahead, landing on the
   * floor at 0.75 m:
   *
   * 1. The lead clears 0.3 m and the trail 0.346 m; the surface is that over the
   *    box, 0 before it and the floor after.
   * 2. The bounded share is 0 and 1 at its ends and a half between, a step where the
   *    ends meet; a foot heeled by no pitch is the flat foot.
   * 3. The lead's envelopes are its clearance over the box; the trail's departure is
   *    its ankle heeled by `stepOver.PUSH`, and its summit the trail's top plus
   *    its farthest socket.
   * 4. Each swing starts at its foot's start and ends on its landing; along the lead
   *    swing every sole socket over the box stays within half the string's corner
   *    radius of the lead's clearance.
   */
  export async function run(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const entry = motionActionContext(body, {}).entry;
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = stand.feet(
      body,
      entry,
      0,
    );
    const origin: IAutoMovieVector3 = {
      x: (feet.left.x + feet.right.x) / 2,
      y: (feet.left.y + feet.right.y) / 2 - m.ankleHeight,
      z: (feet.left.z + feet.right.z) / 2,
    };
    const framed: HumanFrame.IPrepared = HumanFrame.prepare({ origin, yaw: 0 });
    const heading = (side: AutoMovieHumanSide): number =>
      side === "left" ? stand.TOE_OUT : -stand.TOE_OUT;
    const flat = (
      side: AutoMovieHumanSide,
      ankle: IAutoMovieVector3,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle,
      rotation: HumanFoot.rotation(heading(side), 0),
    });
    const landing = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      framed.point({
        x: body.rest.get(`${side}Foot`)!.x,
        y: m.ankleHeight,
        z: 0.75,
      });
    const end: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: landing("left"),
      right: landing("right"),
    };
    const swing: stepOverPathSwing.ISwing = stepOverPathSwing({
      body,
      obstacle: { at: { x: 0, y: origin.y, z: 0.3 }, height: 0.2, depth: 0.1 },
      origin,
      framed,
      near: 0.3,
      far: 0.4,
      ground: 0,
      lead: "right",
      trail: "left",
      feet,
      end,
      heading,
      pitched: {
        left: HumanFootRotation.prepare(heading("left"), 0),
        right: HumanFootRotation.prepare(heading("right"), 0),
      },
      flat,
    });
    TestValidator.predicate(
      "the clearances",
      nclose(swing.top("right"), 0.2 + stepOver.MARGIN, ROUNDING) &&
        nclose(swing.top("left"), 0.2 + stepOver.TRAIL, ROUNDING) &&
        swing.surface("right", 0.35) === swing.top("right") &&
        swing.surface("right", 0.2) === 0 &&
        swing.surface("right", 0.5) === 0,
    );
    TestValidator.predicate(
      "the share and the heel",
      swing.smooth(0, 0, 1) === 0 &&
        swing.smooth(1, 0, 1) === 1 &&
        nclose(swing.smooth(0.5, 0, 1), 0.5, ROUNDING) &&
        swing.smooth(0.4, 0.5, 0.5) === 0 &&
        swing.smooth(0.5, 0.5, 0.5) === 1 &&
        vclose(swing.heeled("left", feet.left, 0).ankle, feet.left, ROUNDING),
    );
    const radius: number = Math.max(
      ...HumanFoot.SOCKETS.map((socket: IAutoMovieMotionHumanFoot.Socket) =>
        Vector3.length(HumanFoot.offset(body, "left", socket)),
      ),
    );
    TestValidator.predicate(
      "the envelopes, departure and summit",
      HumanFoot.SOCKETS.every(
        (socket: IAutoMovieMotionHumanFoot.Socket): boolean =>
          swing.envelopes[socket](0.35) === swing.top("right"),
      ) &&
        nclose(
          swing.departure,
          swing.heeled("left", feet.left, -stepOver.PUSH).ankle.y,
          ROUNDING,
        ) &&
        nclose(swing.summit, origin.y + swing.top("left") + radius, ROUNDING),
    );
    const lead: (u: number) => IAutoMovieMotionHumanFoot.IPlacement =
      swing.path("right", 0);
    const trail: (u: number) => IAutoMovieMotionHumanFoot.IPlacement =
      swing.path("left", -stepOver.PUSH);
    let cleared: boolean = true;
    for (let u: number = 0; u <= 1; u += 0.02)
      for (const socket of HumanFoot.SOCKETS) {
        const at: IAutoMovieVector3 = framed.local(
          HumanFoot.point(body, "right", socket, lead(u)),
        );
        if (at.z >= 0.3 && at.z <= 0.4)
          cleared &&= at.y >= swing.top("right") - STRING;
      }
    TestValidator.equals(
      "the swings",
      [
        vclose(lead(0).ankle, feet.right, 1e-9),
        vclose(lead(1).ankle, end.right, 1e-9),
        vclose(trail(1).ankle, end.left, 1e-9),
        vclose(
          trail(0).ankle,
          swing.heeled("left", feet.left, -stepOver.PUSH).ankle,
          1e-9,
        ),
        cleared,
      ],
      [true, true, true, true, true],
    );
  }
}

/**
 * `stepOver`'s unit contract: its swings.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `step_over_path_swing`: How far the taut string may dip below a height it
 *   clears, metres:
 */
export async function test_unit_motions_everyday_step_over(): Promise<void> {
  await part_step_over_path_swing.run();
}
