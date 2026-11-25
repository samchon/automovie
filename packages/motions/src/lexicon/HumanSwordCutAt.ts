import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieVector3,
} from "@automovie/interface";

import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanSword } from "./HumanSword";
import { HumanSwordFollow } from "./HumanSwordFollow";
import { HumanSwordLanding } from "./HumanSwordLanding";
import { HumanSwordTiming } from "./HumanSwordTiming";

/**
 * Cut along one of the eight lines at a given speed of the striking part: the
 * landing part passes through the target at the decisive instant (`stroke`),
 * edge leading, at that speed. A target beyond the arm with the chosen advance
 * is refused on `target`.
 *
 * @param speed The striking part's peak speed at contact, metres a second, at
 *   novice and at elite skill, read on the performer's `speed` skill:
 *   `SPEED.cut` for a blade, or a row's own measured band for an implement
 *   (`HumanSportSwing.BAT_SPEED` and its siblings).
 * @returns The cut's law, named `swordCut` at every speed, so a row of it is of
 *   the cut's family.
 */
export function HumanSwordCutAt(
  speed: readonly [number, number],
): IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSword.ICut> {
  return {
    name: "swordCut",
    interrupts: StrikingHeld.follows("strokeEnd"),
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.ICut>,
    ): IAutoMovieMotionHumanActionPlan => {
      const s: IAutoMovieMotionHumanSword.ISetup = HumanSword.setup(context);
      // What lands is the held thing's own striking part: `LANDS.cut` along
      // its edge from the hand's end, or its working point when it declares
      // no edge.
      const back: number =
        s.tool.span === null
          ? 0
          : s.tool.span[1] -
            HumanSword.LANDS.cut * (s.tool.span[1] - s.tool.span[0]);
      const a: IAutoMovieMotionHumanSword.IAim = HumanSword.aim(
        context,
        s,
        s.tool.length - back,
      );
      const [out, up]: readonly [number, number] =
        HumanSword.LINES[context.params.from ?? "above"];
      const origin: IAutoMovieVector3 = s.world({ out, up, forward: 0 }, a.yaw);
      const travel: IAutoMovieVector3 = Vector3.scale(origin, -1);

      // The contact pose: the landing part on the target, the edge leading
      // along the travel, the blade's lean and turn as the arm holds them.
      const landed: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        HumanSwordLanding.frame(context, {
          tool: s.tool,
          back,
          target: a.target,
          reach: a.reach,
          travel,
          cone: HumanSword.CONE,
          posture: a.posture,
        });
      if (context.params.target !== undefined)
        StrikingRoll.reachable(
          context,
          s.tool,
          landed,
          back,
          a.posture,
          HumanSword.FIX,
        );
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        landed.rotation,
        s.tool.axis,
      );
      const about: IAutoMovieVector3 = Vector3.normalize(
        Vector3.cross(axis, travel),
      );
      // The chamber: the upper arm along the line of attack and the forearm
      // square to it, raised toward where the cut comes from.
      const chamber: IAutoMovieVector3 = Vector3.add(
        s.shoulder,
        Vector3.add(
          Vector3.scale(a.line, context.body.measure.upperArm),
          Vector3.scale(origin, context.body.measure.forearm),
        ),
      );
      const path = (
        progress: number,
      ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
        rotation: Quaternion.multiply(
          Quaternion.fromAxisAngle(about, -HumanSword.SWING * (1 - progress)),
          landed.rotation,
        ),
        // Past the target the edge goes on the way it came, the second
        // half of the unit mirroring the first.
        point:
          progress <= 1
            ? Vector3.lerp(chamber, landed.point, progress)
            : Vector3.add(
                landed.point,
                Vector3.scale(
                  Vector3.subtract(landed.point, chamber),
                  progress - 1,
                ),
              ),
      });
      const entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        HumanSword.held(context, s.tool.side);
      // The landing part passes the target at the speed: its velocity per
      // unit of progress at contact, the hand's chord plus the turn's
      // `SWING` (radians) about `about` of the arm from the grip to the
      // landing part, is the length the unit is timed on.
      const arm: IAutoMovieVector3 = Quaternion.rotateVector(
        landed.rotation,
        Vector3.subtract(s.tool.tip, Vector3.scale(s.tool.axis, back)),
      );
      const clock: IAutoMovieMotionClock = HumanSword.timed(
        context,
        Vector3.length(
          Vector3.add(
            Vector3.subtract(landed.point, chamber),
            Vector3.scale(
              Vector3.cross(about, arm),
              (HumanSword.SWING * Math.PI) / 180,
            ),
          ),
        ),
        s.skill(speed),
        1,
        0,
        HumanSwordTiming.travel(s.tool, entered, path(0)),
        HumanSword.taken(context.params)
          ? 0
          : HumanSwordTiming.travel(s.tool, path(2), entered),
      );

      // The landing follows a target that moves after the start.
      const follow: HumanSwordFollow.IFollower = HumanSwordFollow(
        context,
        a.target,
        clock.at("stroke"),
      );
      const planned: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
        context,
        {
          tool: s.tool,
          clock,
          path,
          back,
          follow: follow.at,
          support: s.support,
          advance: a.advance,
          travel: a.travel,
          line: a.line,
          stay: HumanSword.taken(context.params),
          stop: HumanSword.stopped(
            context,
            HumanSword.weak(s.tool, path(0)),
            HumanSword.weak(s.tool, landed),
            a.target,
            a.line,
          ),
        },
      );
      return planned;
    },
  };
}
