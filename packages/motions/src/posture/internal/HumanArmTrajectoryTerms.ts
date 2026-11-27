import { AutoMovieEngineRomTolerance } from "@automovie/engine";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { HumanArmGeometry as G } from "./HumanArmGeometry";

/*
 * The weights and bounds of an arms' trajectory (`HumanArmTrajectoryModel`),
 * which its evaluation and its convex model read alike.
 */
export namespace HumanArmTrajectoryTerms {
  /*
   * The largest violation of a constraint other than clearance accepted as
   * feasible: a millimetre, or a millimetre per step; the solve refuses past
   * it.
   */
  export const TOLERANCE: number = 1;

  /*
   * The weight a range's excess, degrees or chart units, takes against the
   * other terms' millimetres: `TOLERANCE` per the ranges' own resolution
   * (`AutoMovieEngineRomTolerance`, the resolution a posture's resolve clamps a joint at), so
   * a frame passing its range by more than the resolve admits is refused, and
   * no frame the solve admits is clamped on display.
   */
  export const RANGE: number = TOLERANCE / AutoMovieEngineRomTolerance;

  /*
   * Weight of a squared coordinate acceleration per waypoint.
   */
  export const ACCELERATION: number = 10;

  /*
   * Weight of a squared coordinate unit a still configuration lies from its
   * anchor: an acceleration's own, so a coordinate moved off the anchor costs
   * what the same second difference does.
   */
  export const ANCHOR: number = ACCELERATION;

  /*
   * Weight of a squared degree of the hand's rotation off its site, on a hold
   * waypoint.
   */
  export const ROTATION: number = 10;

  /*
   * Weight of a squared millimetre of an elbow's or a wrist's step.
   */
  export const LENGTH: number = 0.01;

  /*
   * The probes whose Cartesian steps the objective sums: the elbow and the
   * wrist.
   */
  export const PATH: readonly number[] = [G.ELBOW, G.WRIST];

  /*
   * The probes whose speed is bounded: the elbow, the wrist and the fingertips.
   */
  export const SPEED: readonly number[] = [G.ELBOW, G.WRIST, G.TIP];

  /*
   * How much deeper than its reference a probe may lie in a shape, metres: the
   * skin the tangle and partner audits allow (`BUILT`) less the solver's own
   * `TOLERANCE`, which a course's reading admits past every bound, so the
   * deepest probe a course is admitted with is the audit's bound itself. A
   * narrower allowance refused courses the audit admits (a ring finger 6.6 mm
   * into the trunk).
   */
  export const DEPTH: number =
    AutoMovieMotionHumanAuditSkin.BUILT - TOLERANCE / 1000;

  /*
   * The slack a clearance miss has before the path is refused, millimetres,
   * over the solver's own `TOLERANCE`: none, so a probe is admitted and refused
   * against its allowance, `DEPTH`, read on every probe the audit reads at
   * every frame of the course.
   */
  export const SKIN: number = 0;

  /*
   * TrajOpt's active set: a pair enters the convex subproblem only within this
   * of its bound, millimetres. trajopt's collision checker reads every pair
   * within its contact distance, the largest safety distance plus 0.04 m
   * (`cc->SetContactDistance(*std::max_element(dist_pen.begin(),
   * dist_pen.end()) + .04)`, github.com/joschu/trajopt
   * src/trajopt/problem_description.cpp line 549 at commit
   * 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013,
   * John Schulman), Schulman et al. 2014's `d_check > d_safe` (section IV-A);
   * here each pair's own bound is its safety distance, so a pair enters within
   * 40 mm beyond it.
   */
  export const CHECK: number = 0.04 * 1000;

  /*
   * The reach within which a shape is read against a probe, metres.
   */
  export const REACH: number = 0.05;

  /*
   * Weight of a squared millimetre the hand stands off its site along the
   * normal: the lift is the least that clears.
   */
  export const LIFT: number = 10;

  /*
   * Weight of a squared millimetre the contact lands from its site along the
   * surface.
   */
  export const SITE: number = 10;
}
