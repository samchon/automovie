import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanLeanInto,
  AutoMovieMotionHumanReach,
  HumanBalance,
  HumanRefusal,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The lean of a standing body into work beyond its standing arm, on real
 * bodies.
 *
 * The contract: the trunk tips by the least pitch that keeps the wrist's
 * goal within a share of the arm's length (upper arm and forearm) from the
 * shoulder, the hips move back so the body stays balanced, work within the
 * share needs no lean, and work still beyond the share at the limit
 * (`AutoMovieMotionHumanReach.LEAN_LIMIT`) is refused.
 *
 * Each wrist goal is built so its answer is known without solving anything:
 * it stands exactly the share of the arm's length straight ahead of where
 * the shoulder is when the body is tipped by a chosen pitch. A shallower tip
 * leaves the shoulder farther back, so the chosen pitch is the least one.
 * The shoulder is the displayed upper-arm bone's place and the arm's length
 * is read between the displayed bones.
 *
 * Scenarios, on one body of the sweep (the `test_human_motion_compose_lean_into_*`
 * specs run one body each), for both hands and
 * shares of 0.8 and 0.95:
 * 1. `tip` adds its pitch, moves the hips straight back, and keeps the centre
 *    of mass inside the base of support at 10, 25, 40 and 45 degrees.
 * 2. `pitch` is 0 for a goal within the share, the chosen pitch (within 0.05
 *    degrees) for goals placed at 10, 25 and 40 degrees, larger for each
 *    farther goal, and at the pitch it gives the wrist is within the share
 *    while 0.05 degrees less leaves it beyond.
 * 3. A goal 0.1 m beyond the share at the limit is refused with the caller's
 *    message, told the limit and how far beyond the goal stays.
 * 4. The primitive claims the root and the trunk over the whole clock,
 *    leaves the standing body at both ends, does not lean at the stroke's
 *    start where the goal is near, leans to the far goal's pitch from the
 *    stroke's end to `relax`, leans no less as the stroke goes farther, and
 *    at every sampled second keeps both feet on their plants and the centre
 *    of mass inside the base of support.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reads the owner's results on a real body through the public functions and the resolver, as the scenarios state.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body's cells, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing cell is named with its body, its parameters and its numbers; no cell is sampled away for time.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The postures live as long as the call; the body is the shared fixture's.
 */
export function motionComposeLeanInto(name: motionHumanBody.Name): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const all: motionComplaints.IGatherer = motionComplaints();
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(2);
  const ahead = (p: IAutoMovieVector3, z: number): IAutoMovieVector3 => ({
    x: p.x,
    y: p.y,
    z: p.z + z,
  });

  {
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    const standing: IHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const upright: Bones = bones(standing);
    for (const side of ["left", "right"] as const)
      for (const share of [0.8, 0.95] as const) {
        const cell: string = `${name}: the ${side} hand kept within ${share} of its arm`;
        const length: number =
          gap(
            upright.get(`${side}UpperArm`)!.worldPosition,
            upright.get(`${side}LowerArm`)!.worldPosition,
          ) +
          gap(
            upright.get(`${side}LowerArm`)!.worldPosition,
            upright.get(`${side}Hand`)!.worldPosition,
          );
        let goal: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        const refusals: [number, number][] = [];
        const lean: AutoMovieMotionHumanLeanInto.ILean =
          AutoMovieMotionHumanLeanInto.solve({
            body,
            standing,
            side,
            share,
            wrist: (): IAutoMovieVector3 => goal,
            refuse: (beyond: number, limit: number): string => {
              refusals.push([beyond, limit]);
              return "the work is out of reach";
            },
          });
        const shoulder = (pitch: number): IAutoMovieVector3 =>
          bones(lean.tip(standing, pitch)).get(`${side}UpperArm`)!
            .worldPosition;

        // 1. The tipped posture.
        for (const pitch of [10, 25, 40, 45] as const) {
          const tipped: IHumanPosture = lean.tip(standing, pitch);
          const hips: IAutoMovieVector3 =
            bones(tipped).get("hips")!.worldPosition;
          const was: IAutoMovieVector3 = upright.get("hips")!.worldPosition;
          const margin: number = HumanBalance.margin(body, tipped);
          all.check(
            `${cell}: a tip of ${pitch} adds its pitch, moves the hips ${mm(was.z - hips.z)} mm straight back and keeps a margin of ${mm(margin)} mm`,
            tipped.pitch === pitch &&
              was.z - hips.z >= 0 &&
              Math.abs(hips.x - was.x) <= 1e-9 &&
              Math.abs(hips.y - was.y) <= 1e-9 &&
              margin > 0,
          );
        }

        // 2. The least pitch.
        goal = ahead(shoulder(0), 0.5 * share * length);
        all.check(
          `${cell}: a goal within the share needs no lean, got ${lean.pitch(standing, 0)}`,
          lean.pitch(standing, 0) === 0,
        );
        let last: number = 0;
        for (const chosen of [10, 25, 40] as const) {
          goal = ahead(shoulder(chosen), share * length);
          const pitch: number = lean.pitch(standing, 0);
          const within: number = gap(shoulder(pitch), goal) - share * length;
          const beyond: number =
            gap(shoulder(pitch - 0.05), goal) - share * length;
          all.check(
            `${cell}: a goal placed at ${chosen} degrees is leaned to by ${pitch.toFixed(3)}, the wrist ${mm(within)} mm beyond the share there and ${mm(beyond)} mm at 0.05 degrees less`,
            Math.abs(pitch - chosen) <= 0.05 &&
              within <= 1e-6 &&
              beyond > 0 &&
              pitch > last,
          );
          last = pitch;
        }

        // 3. The refusal.
        goal = ahead(
          shoulder(AutoMovieMotionHumanReach.LEAN_LIMIT),
          share * length + 0.1,
        );
        let message: string = "";
        try {
          lean.pitch(standing, 0);
        } catch (error) {
          // A refusal states its reason as a field; its message adds the
          // axis, the feasible range and the fix around it.
          message =
            error instanceof HumanRefusal && error.kind === "reach"
              ? error.reason
              : (error as Error).message;
        }
        all.check(
          `${cell}: a goal 100 mm beyond the share at the limit is refused, message "${message}" with ${JSON.stringify(refusals)}`,
          message === "the work is out of reach" &&
            refusals.length === 1 &&
            Math.abs(refusals[0]![0] - 0.1) <= 0.001 &&
            refusals[0]![1] === AutoMovieMotionHumanReach.LEAN_LIMIT,
        );

        // 4. The primitive, once per hand.
        if (share !== 0.8) continue;
        const near: IAutoMovieVector3 = ahead(
          shoulder(0),
          0.5 * share * length,
        );
        const far: IAutoMovieVector3 = ahead(shoulder(25), share * length);
        const stroke: AutoMovieMotionHumanLeanInto.ILean =
          AutoMovieMotionHumanLeanInto.solve({
            body,
            standing,
            side,
            share,
            wrist: (
              _posture: IHumanPosture,
              progress: number,
            ): IAutoMovieVector3 => ({
              x: near.x + (far.x - near.x) * progress,
              y: near.y + (far.y - near.y) * progress,
              z: near.z + (far.z - near.z) * progress,
            }),
            refuse: (): string => "the work is out of reach",
          });
        const phrase: IAutoMovieMotionHumanPrimitive = stroke.primitive(clock);
        all.equals(
          `${cell}: the lean claims the root and the trunk over the whole clock`,
          [phrase.channels, phrase.from, phrase.to],
          [["root", "trunk"], 0, clock.duration],
        );
        let before: number = 0;
        for (let k: number = 0; k <= 10; k++) {
          const seconds: number = k * 0.125;
          const written: IHumanPosture = phrase.write(standing, seconds);
          const pose: Bones = bones(written);
          const at: string = `${cell}: the lean at ${seconds} s`;
          const slip: number = Math.max(
            gap(
              pose.get("leftFoot")!.worldPosition,
              upright.get("leftFoot")!.worldPosition,
            ),
            gap(
              pose.get("rightFoot")!.worldPosition,
              upright.get("rightFoot")!.worldPosition,
            ),
          );
          const margin: number = HumanBalance.margin(body, written);
          all.check(
            `${at} keeps both feet, off by ${mm(slip)} mm, and a margin of ${mm(margin)} mm`,
            slip <= 0.001 && margin > 0,
          );
          if (seconds === 0 || seconds === 1.25)
            all.check(
              `${at} stands as before, pitched ${written.pitch}`,
              written.pitch === 0 && gap(written.root, standing.root) <= 1e-6,
            );
          else if (seconds <= 0.375)
            all.check(
              `${at} does not lean for the near goal, pitched ${written.pitch}`,
              written.pitch === 0,
            );
          else if (seconds <= 0.875)
            all.check(
              `${at} leans no less than before, pitched ${written.pitch.toFixed(3)} after ${before.toFixed(3)}`,
              written.pitch >= before - 1e-9 && written.pitch <= 25.05,
            );
          if (seconds === 0.875 || seconds === 1)
            all.check(
              `${at} leans to the far goal's 25 degrees, pitched ${written.pitch.toFixed(3)}`,
              Math.abs(written.pitch - 25) <= 0.05,
            );
          before = written.pitch;
        }
      }
  }
  all.assert(`the lean into the work holds on every body (${name})`);
}
