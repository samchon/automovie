import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";
import { HumanSword } from "./HumanSword";
import { HumanSwordFollow } from "./HumanSwordFollow";
import { HumanSwordTiming } from "./HumanSwordTiming";

/*
 * The thrust of blade work: the point driven straight onto the target, from
 * where the fencer stands or carried by a step or a lunge, then recovered.
 *
 * A thrust states where the point goes and about which way the blade runs; the
 * blade's turn about its own line, and a lean of that line inside
 * `HumanSword.CONE`, are the ones the arm holds best with the blade as the hand
 * took it (`StrikingRoll.hand`). The attack lasts as a minimum-jerk unit
 * arrested at its peak, at the sword's cited peak speed in a lunge
 * (`HumanSword.SPEED`). Parameters, the advance and the parried outcome are
 * `HumanSword`'s.
 *
 * What the row fixes: the point lands at the decisive instant (`stroke`) on a
 * line that may leave the shoulder-to-target line by at most 40 degrees
 * (`HumanSword.CONE`); the chamber holds the upper arm 25 degrees out from the
 * trunk (`CHAMBER`); a target nearer than 0.3 of the arm from the shoulder in a
 * pose the arm cannot hold is refused (`NEAR`); a target beyond 0.9 of the arm
 * less the blade takes an advance (`HumanSword.REACH`). The duration is the
 * sword timing model's (`IAutoMovieMotionHumanSword`): 1.875 times the path
 * over a point speed of 2.6 m/s at novice to 3.2 m/s at elite, so a 0.8 m
 * thrust takes 0.47 s at elite. The row fixes no duration of its own; all its
 * values are provisional but the speeds.
 */
export namespace HumanSwordThrust {
  /*
   * The chamber's upper arm held out from the trunk, degrees of abduction from
   * hanging, so its girth clears the trunk's (provisional).
   */
  export const CHAMBER: number = 25;

  /*
   * The least share of the arm's length the hand stands before the shoulder as
   * the point lands for a pose the arm cannot hold to be blamed on the hold
   * (provisional): nearer, the refusal names its cause, a target inside the
   * tool's own length.
   */
  export const NEAR: number = 0.3;

  /*
   * Thrust: the point driven straight onto the target at the decisive instant
   * (`stroke`), with a step or a lunge when asked, then recovered. A target
   * beyond the arm with the chosen advance, or so near that the hand would land
   * within `NEAR` of the arm from the shoulder in a pose the arm cannot hold,
   * is refused on `target`.
   */
  export const thrust: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSword.IAttack> =
    {
      name: "swordThrust",
      interrupts: StrikingHeld.follows("stroke"),
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IAttack>,
      ): IAutoMovieMotionHumanActionPlan => {
        const s: IAutoMovieMotionHumanSword.ISetup = HumanSword.setup(context);
        const a: IAutoMovieMotionHumanSword.IAim = HumanSword.aim(
          context,
          s,
          s.tool.length,
        );

        // A thrust states no edge, so the blade is turned about its own line
        // the way the arm holds it with the least strain.
        const landed: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          StrikingRoll.hand(
            context,
            s.tool,
            0,
            a.target,
            Vector3.subtract(a.target, a.reach),
            HumanSword.CONE,
            a.posture,
          );
        if (context.params.target !== undefined)
          try {
            StrikingRoll.reachable(
              context,
              s.tool,
              landed,
              0,
              a.posture,
              HumanSword.FIX,
            );
          } catch (error) {
            // A pose the arm cannot hold with the hand folded in against the
            // shoulder fails for one cause: the target stands inside the
            // tool's own length, and no turn of the wrist makes room.
            // The room is what the tool leaves of the line from the shoulder
            // to the target: where the hand stands before the shoulder with
            // the tool on that line, behind it when negative.
            const room: number =
              Vector3.length(Vector3.subtract(a.target, a.reach)) -
              s.tool.length;
            if (!(error instanceof AutoMovieMotionHumanRefusal) || room >= NEAR * s.arm)
              throw error;
            throw new AutoMovieMotionHumanRefusal({
              kind: "reach",
              axis: "target",
              value: room,
              feasible: {
                kind: "range",
                minimum: NEAR * s.arm,
                maximum: HumanSword.REACH * s.arm,
                unit: "m",
              },
              reason: `the target is ${(room + s.tool.length).toFixed(3)} m from the ${s.tool.side} shoulder and the tool is ${s.tool.length.toFixed(2)} m long, so the hand would stand ${room.toFixed(3)} m before its shoulder (behind it when negative), and the arm cannot hold the tool there`,
              fix: "step back first (a retreat or a void), thrust from farther away, or answer with a cut",
            });
          }

        // The chamber: the hilt drawn back by the side, the upper arm held
        // out from the trunk by `CHAMBER` so it never lies inside it, and the
        // forearm square to it toward the target, the point already on the
        // line to the target.
        const hilt: IAutoMovieVector3 = Vector3.add(
          s.shoulder,
          s.world(
            {
              out:
                Math.sin((CHAMBER * Math.PI) / 180) *
                context.body.measure.upperArm,
              up:
                -Math.cos((CHAMBER * Math.PI) / 180) *
                context.body.measure.upperArm,
              forward: context.body.measure.forearm,
            },
            a.yaw,
          ),
        );

        // What the advance carries the shoulder by the decisive instant: the
        // displayed shoulder of the advanced body there against the entry's,
        // each read on the whole fitted posture, since the trunk-only read
        // leaves out the fit's own placement of the root.
        const shoulderOf = (
          posture: IAutoMovieMotionHumanPosture,
        ): IAutoMovieVector3 =>
          poseBones(
            context.body,
            resolveHumanPosture(context.body, posture),
            undefined,
            new Set<AutoMovieHumanoidBone>([`${s.tool.side}UpperArm`]),
          ).get(`${s.tool.side}UpperArm`)!.worldPosition;
        const travel: IAutoMovieVector3 =
          a.advance === "none"
            ? { x: 0, y: 0, z: 0 }
            : Vector3.subtract(
                shoulderOf(a.posture),
                shoulderOf(context.entry.posture),
              );
        const carried: number = Vector3.length(travel);

        // The chamber is the landing drawn back along the stroke's line
        // (`chamberDepth`), the
        // hand's attitude kept: the arm the landing chose, its elbow and its
        // forearm's turn, only less extended, so the attack is one basin of
        // the arm from the chamber to the landing. A chamber turned for
        // itself lay in the other basin of the elbow (out by the side, the
        // landing's ahead and up), and no arm joins them along the straight
        // hilt line: the fit let the hand go 0.30 m soft and jumped between
        // the basins within a frame. The hand draws back, from where it
        // lands as the entry's shoulder stands, as deep along the line as the
        // hilt's chamber by the side lies.
        const line: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(a.target, a.reach),
        );
        const reached: IAutoMovieVector3 = Vector3.subtract(
          landed.point,
          travel,
        );
        // Drawn that deep, the hand must still hold the tool on its line as
        // the entry's body stands; the landing does (`StrikingRoll.reachable`
        // above), so the chamber is the deepest draw the arm holds within the
        // held-tool bound, found to that bound's own resolution by bisection
        // between the landing and the hilt's depth.
        const drawnAt = (
          depth: number,
        ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
          point: Vector3.subtract(reached, Vector3.scale(line, depth)),
          rotation: landed.rotation,
        });
        const holds = (depth: number): boolean =>
          StrikingRoll.miss(
            context,
            s.tool,
            drawnAt(depth),
            0,
            context.entry.posture,
          ) <= StrikingRoll.MISS;
        let deepest: number = chamberDepth(s.shoulder, hilt, reached, line);
        if (!holds(deepest)) {
          let held: number = 0;
          while (deepest - held > StrikingRoll.MISS) {
            const middle: number = (held + deepest) / 2;
            if (holds(middle)) held = middle;
            else deepest = middle;
          }
          deepest = held;
        }
        const drawn: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          drawnAt(deepest);

        // The arm sets from its entry hold to the guard, the chamber, over
        // its own travel there, the hand's or the elbow's
        // (`HumanSwordTiming.setting`).
        const entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
          HumanSword.held(context, s.tool.side);
        const armTravel: number = HumanSwordTiming.setting(
          context,
          s.tool,
          entered,
          drawn,
          landed,
          a.posture,
        );

        // A one-handed thrust recovers along its line to the guard
        // (`StrikingBlade.coursed`); a supported one back to the entry hold.
        const clock: IAutoMovieMotionClock = HumanSword.timed(
          context,
          Vector3.length(
            Vector3.subtract(a.target, StrikingHeld.point(s.tool, drawn)),
          ),
          s.skill(HumanSword.SPEED.thrust),
          0,
          carried,
          armTravel,
          HumanSword.taken(context.params)
            ? 0
            : HumanSwordTiming.travel(
                s.tool,
                landed,
                s.support === null ? drawn : entered,
              ),
        );

        // The landing follows a target that moves after the start.
        const follow: HumanSwordFollow.IFollower = HumanSwordFollow(
          context,
          a.target,
          clock.at("stroke"),
        );
        const planned: IAutoMovieMotionHumanActionPlan = StrikingBlade.coursed(
          context,
          {
            tool: s.tool,
            clock,
            path: (
              progress: number,
            ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => ({
              point: Vector3.lerp(drawn.point, landed.point, progress),
              rotation: Quaternion.slerp(
                drawn.rotation,
                landed.rotation,
                Math.min(1, progress),
              ),
            }),
            back: 0,
            follow: follow.at,
            support: s.support,
            advance: a.advance,
            travel: a.travel,
            line: a.line,
            stay: HumanSword.taken(context.params),
            stop: HumanSword.stopped(
              context,
              HumanSword.weak(s.tool, drawn),
              HumanSword.weak(s.tool, landed),
              a.target,
              a.line,
            ),
          },
          armTravel,
        );
        return planned;
      },
    };
}

/*
 * How far the chamber draws the hand back from its landing along the stroke's
 * line, metres: as deep as the hilt's chamber by the side lies along the line,
 * but never nearer the shoulder than that chamber holds the hand.
 *
 * The chamber hilt stands where the forearm is square to the upper arm, so the
 * hand is the hypotenuse of the two segments from the shoulder; drawn deeper
 * along a line that passes before the trunk, the hand folds in against the
 * shoulder and the forearm lies inside the chest. The draw is therefore cut
 * where the line first meets the sphere of the chamber's reach about the
 * shoulder, the nearer root of |from − line·d| = r (a quadratic in d); a line
 * that never comes that near keeps the whole draw, and a landing already inside
 * the sphere is not drawn nearer.
 * Parameter shoulder: The thrusting shoulder, world metres.
 * Parameter hilt: The chamber's hilt by the side, world metres.
 * Parameter reached: Where the hand lands, as the entry's shoulder stands, world
 * metres.
 * Parameter line: The stroke's unit direction.
 * Returns: The draw, metres, not negative.
 */
function chamberDepth(
  shoulder: IAutoMovieVector3,
  hilt: IAutoMovieVector3,
  reached: IAutoMovieVector3,
  line: IAutoMovieVector3,
): number {
  const depth: number = Math.max(
    0,
    Vector3.dot(Vector3.subtract(reached, hilt), line),
  );
  const radius: number = Vector3.distance(hilt, shoulder);
  const from: IAutoMovieVector3 = Vector3.subtract(reached, shoulder);
  const along: number = Vector3.dot(from, line);
  const beyond: number = Vector3.dot(from, from) - radius * radius;
  if (beyond <= 0) return 0;
  const discriminant: number = along * along - beyond;
  return discriminant < 0
    ? depth
    : Math.min(depth, Math.max(0, along - Math.sqrt(discriminant)));
}
