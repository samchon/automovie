import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  AutoMovieMotionHumanTouchForm,
  HumanChain,
  HumanPerformance,
  HumanSocial,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A palm laid on a partner's chest reaches its place wherever on the region
 * the place lies.
 *
 * Two average men stand 0.6 m apart. The comforting palm crosses the median
 * plane to a chest site 54 mm down and 31 mm toward the performer's left.
 *
 * The place is read here from the partner's displayed bones, as `touchSite`
 * defines it: the sternum's point and normal on its displayed bone, moved
 * `up` along the surface toward the head (the world's up laid into the
 * surface) and `out` to the right of someone facing it. The palm is the
 * displayed hand's effector, the palm's point the touch lays
 * (`AutoMovieMotionHumanTouchEffector.point`, curled as a hold curls it).
 *
 * Scenario: at the middle of the hold the displayed palm lies within 5 mm of
 * the place (provisional: the touch's contact bound is 15 mm).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each performance through the public chain and reads both people's displayed bones at one instant; a palm held off a reachable place fails with the distance.
 * @evidence contracts/development/testing.md#independent-expectations The place is computed from the partner's displayed bones by the site's documented definition, not read from the law's goal or plan; the bound is stated and provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Crossing the median plane exercises an inward reach; the neutral and outward contacts share their exact measurements with the hand-site specification.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one two-person performance, read at one instant; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage, the site, how the place and the palm are read and the one scenario with its bound and status.
 */
export function test_human_motion_touch_partner_reach(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const effector: IAutoMovieMotionHumanTouchEffector.IEffector =
    AutoMovieMotionHumanTouchForm.curled(touch.EFFECTORS.palm, "hold");
  const site = { up: -0.054, out: -0.031 };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "site",
    laws: [HumanSocial.comfort],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: { x: 0, y: 0, z: 0.6 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .registered("comfort", {
        target: { kind: "person", subject: "b", region: "sternum" },
        site,
      })
      .with(HumanChain.subject("b").stand({ seconds: 5 })).node,
  });
  const placed: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
  const instant = (event: string): number =>
    placed.start +
    (placed.plan.events.find(
      (e: { name: string; share: number }): boolean => e.name === event,
    )?.share ?? NaN) *
      placed.plan.duration;
  const held: number = (instant("strokeEnd") + instant("relax")) / 2;

  // The place on the partner's displayed sternum, by the site's definition.
  const frame = body.surfaces.regions.sternum;
  const region: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
    resolveAutoMovieHumanoidSurfaces.place(
      frame,
      performance.bones("b", held).get(frame.bone)!,
    );
  const lay = (v: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.subtract(
      v,
      Vector3.scale(region.normal, Vector3.dot(v, region.normal)),
    );
  const up: IAutoMovieVector3 = Vector3.normalize(lay({ x: 0, y: 1, z: 0 }));
  const out: IAutoMovieVector3 = Vector3.cross(up, region.normal);
  const place: IAutoMovieVector3 = Vector3.add(
    region.point,
    Vector3.add(Vector3.scale(up, site.up), Vector3.scale(out, site.out)),
  );

  // The displayed palm.
  const palm: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
    body,
    performance.bones("a", held),
    "right",
    effector,
  );
  const shown: number = Vector3.length(Vector3.subtract(palm, place));
  if (!(shown <= 0.005))
    complaints.push(
      `the palm lies ${(shown * 1000).toFixed(1)} mm from its place on the partner at ${held.toFixed(3)} s, within 5 mm expected`,
    );
  TestValidator.equals(
    "the palm reaches its place on the partner",
    complaints,
    [],
  );
}
