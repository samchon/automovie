import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { resolveHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A planted leg's lowering keeps the knee continuous while the hip rises
 * through the leg's full extension: soft IK (Nicholas 2009) eases the reach
 * over a band whose width the hip's step a frame derives
 * (`resolveHumanPosture.short` with `step`).
 *
 * Scenarios, on the average man and the small woman with the 5 degree
 * planted-knee floor (`resolveHumanPosture.KNEE`): an ankle fixed on the
 * floor 0.1 m ahead of the hip, the hip rising 4 mm a frame (0.12 m/s at
 * 30 frames a second, a walking hip's vertical pace) from 0.1 m
 * below the leg's vertical reach to 0.1 m above it, the root lowered by what
 * each frame asks. The knee is placed by the two-segment triangle of the
 * body's thigh and shank on the lowered hip-to-ankle distance.
 * 1. With the step given, no frame moves the knee more than the audit's
 *    5 mm jump bound.
 * 2. With the hard reach (no step), some frame moves it more, so the check
 *    distinguishes the soft reach from the hard one.
 * 3. Below the soft band the lowering asks nothing, and its slack is the
 *    hip's height under the band's start.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public lowering on real bodies through a hip course that crosses full extension and measures the resulting knee's frame-to-frame travel.
 * @evidence contracts/development/testing.md#independent-expectations The knee is placed by the law of cosines on the measured thigh and shank, independently of the lowering's own arithmetic, and held to the audit's 5 mm jump bound; the hard reach failing that bound shows the bound is not vacuous.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, the soft and the hard reach, frames below the band, inside it and beyond the reach.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on two prepared bodies; no performance, host or viewer.
 * @evidence contracts/development/common.md#meaningful-documentation States the course, the knee's construction and the three scenarios.
 */
export function test_motion_lowering_soft_reach(): void {
  const complaints: string[] = [];
  const step: number = 0.004;
  const jump: number = 0.005;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    const knee: number = resolveHumanPosture.KNEE;
    const reach: number = Math.sqrt(
      a * a + b * b + 2 * a * b * Math.cos((knee * Math.PI) / 180),
    );
    const ahead: number = 0.1;
    const vertical: number = Math.sqrt(reach * reach - ahead * ahead);
    const ankle: IAutoMovieVector3 = { x: 0, y: 0, z: ahead };
    const travel: (soft: boolean) => number = (soft: boolean): number => {
      let worst: number = 0;
      let previous: { x: number; y: number } | undefined;
      for (let v: number = vertical - 0.1; v <= vertical + 0.1; v += step) {
        const hip: IAutoMovieVector3 = { x: 0, y: v, z: 0 };
        const asked: number = resolveHumanPosture.short(
          body,
          hip,
          ankle,
          knee,
          soft ? step : undefined,
        );
        const y: number = v - Math.max(0, asked);
        const d: number = Math.hypot(ahead, y);
        const along: number = (a * a - b * b + d * d) / (2 * d);
        const off: number = Math.sqrt(Math.max(0, a * a - along * along));

        // The knee in the leg's plane: along the hip-to-ankle line from the
        // hip, then off it toward the front.
        const ux: number = ahead / d;
        const uy: number = -y / d;
        const point: { x: number; y: number } = {
          x: along * ux + off * -uy,
          y: y + along * uy + off * ux,
        };
        if (previous !== undefined)
          worst = Math.max(
            worst,
            Math.hypot(point.x - previous.x, point.y - previous.y),
          );
        previous = point;
      }
      return worst;
    };
    const soft: number = travel(true);
    const hard: number = travel(false);
    if (!(soft <= jump + 1e-9))
      complaints.push(
        `${name}: the knee moves ${(1000 * soft).toFixed(2)} mm in a frame with the soft reach, over 5 mm`,
      );
    if (!(hard > jump))
      complaints.push(
        `${name}: the hard reach moves the knee only ${(1000 * hard).toFixed(2)} mm in a frame, so the check distinguishes nothing`,
      );
    const below: number = resolveHumanPosture.short(
      body,
      { x: 0, y: vertical - 0.3, z: 0 },
      ankle,
      knee,
      step,
    );
    if (!(below < 0))
      complaints.push(
        `${name}: a hip far below the band asks ${below} m, not a slack`,
      );
  }
  TestValidator.equals(
    "a hip rising through full extension moves the knee within the jump bound",
    complaints,
    [],
  );
}
