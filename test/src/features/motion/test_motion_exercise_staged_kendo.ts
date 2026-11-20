import { createStageBladeProp } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanStagePiste,
  stageBladeFootwork,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/** Travel of each actor to its lateral floor mark, metres. */
const SHIFT: number = 0.125;

/** Shared phase duration in seconds. */
const SECONDS: number = 1.5;

/** The independently placed editing cue within the paired shift. */
const CUE: number = 0.57;

/**
 * A paired kendo take reads a low slide and fixed support, then settles
 * before a new stand. The editing cue and reserve are independent controls.
 *
 * Scenarios:
 * 1. Two performers on separate stage marks perform lateral glides while the
 *    complementary sole remains planted. A digital prop is carried into the take.
 * 2. A shared editing cue carries the screenplay's neutral result. Ending
 *    one cue span before the cue suppresses the result.
 * 3. The reserve boundary accepts equal available space and rejects the
 *    adjacent smaller input. The admitted feet settle before recovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the paired slide, support, result and stage-space refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the public pair and a following stand, measures the actual posed sole sockets and pelvis, and reads the shared cue from the placed schedule at both full and cut spans.
 * @evidence contracts/development/testing.md#independent-expectations The input floor marks differ by 0.125 m. The existing kendo stage witness supplies the 6 mm glide-height and 5 mm fixed-sole bounds. The script sets an independent cue at 57 percent and requests 0.25 m of reserve beyond the two translations. Pelvis separation is a sampled check of the visible floor blocking.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite directions distinguish the first travelling foot on each actor. A complete cue and one cut span differ while geometry remains the same. Two nearby explicit opening distances exercise the inclusive reserve boundary.
 * @evidence contracts/development/testing.md#execution-ownership The public in-memory performance uses a canonical floor rig and an inert display prop. There is no renderer or physical sport host.
 */
export function test_motion_exercise_staged_kendo(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const actor: IAutoMovieMotionHumanChain = HumanChain.subject("a");
  const prop = createStageBladeProp({
    kind: "shinai",
    id: "inert-display-prop",
  });
  const grip: IAutoMovieVector3 = prop.affordance("grip").frame.translation;
  const held: IAutoMovieMotionHumanProp = HumanObject.prop(
    "inert-display-prop",
    prop,
    {
      at: {
        x: -0.6 - body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight - grip.y,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    },
  );
  const take: HumanStagePiste.ITake = {
    anchor: "glide",
    kind: "kendo",
    first: {
      chain: actor.pickUp({
        prop: held.subject,
        handle: "grip",
        hand: "right",
      }),
      direction: "left",
      lead: "right",
      distance: SHIFT,
    },
    second: {
      chain: HumanChain.subject("b").stand({ seconds: 0.2, sway: 0 }),
      direction: "right",
      lead: "left",
      distance: SHIFT,
    },
    duration: SECONDS,
    cue: CUE,
    result: "none",
    reserve: [1.2, 0.25],
  };
  const placed: HumanStagePiste.IPlaced = HumanStagePiste.compose(take);
  const film: HumanPerformance = new HumanPerformance({
    seed: "two-posed-stage-glides",
    laws: [stageBladeFootwork],
    performers: [
      {
        subject: "a",
        body,
        at: { x: -0.6, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: { x: 0.6, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [held],
    composition: {
      kind: "sequence",
      parts: [
        placed.composition.node,
        actor.stand({ seconds: 0.4, sway: 0 }, "recover").node,
      ],
    },
  });
  const entry = (anchor: string): IAutoMovieScheduleEntry =>
    film.schedule.entries.find((row): boolean => row.intent.anchor === anchor)!;
  const a: IAutoMovieScheduleEntry = entry("glide.first");
  const b: IAutoMovieScheduleEntry = entry("glide.second");
  const recovery: IAutoMovieScheduleEntry = entry("recover");
  const announced: HumanStagePiste.IAnnouncement | undefined = placed.announced(
    film.schedule,
  );
  const cue: number = a.start + CUE * SECONDS;
  complaints.check(
    "both glides supply one independently timed neutral screen cue",
    announced?.result === "none" &&
      nclose(announced.seconds, cue) &&
      nclose(a.start, b.start) &&
      nclose(a.end, recovery.start) &&
      nclose(b.end, recovery.start) &&
      film.hits().length === 0,
  );
  complaints.check(
    "one cue cut before its time leaves the screen result absent",
    placed.announced({
      ...film.schedule,
      entries: film.schedule.entries.map(
        (row): IAutoMovieScheduleEntry =>
          row === b ? { ...row, end: cue - 0.001 } : row,
      ),
    }) === undefined,
  );
  complaints.check(
    "a film cue ahead of its actor's placed span leaves the result absent",
    placed.announced({
      ...film.schedule,
      entries: film.schedule.entries.map(
        (row): IAutoMovieScheduleEntry =>
          row === b ? { ...row, start: cue + 0.001 } : row,
      ),
    }) === undefined,
  );

  const gap: number = Math.min(
    ...[a.start, a.start + 0.27 * SECONDS, cue, a.end].map(
      (at: number): number =>
        Math.abs(
          film.bones("a", at).get("hips")!.worldPosition.x -
            film.bones("b", at).get("hips")!.worldPosition.x,
        ),
    ),
  );
  complaints.check(
    "the staged floor blocking retains its reserve",
    gap >= 0.25,
  );
  complaints.check(
    "the inert prop advances with its staged carrier",
    film.prop(held.subject, a.end).position.x -
      film.prop(held.subject, a.start).position.x >
      0.04,
  );

  for (const [track, moving, planted, travel] of [
    [a, "left", "right", SHIFT],
    [b, "right", "left", -SHIFT],
  ] as const) {
    const first = track.events?.find((event) => event.name === "firstSettle");
    const follow = track.events?.find((event) => event.name === "followSettle");
    const sole = (
      side: "left" | "right",
      seconds: number,
    ): IAutoMovieVector3 => {
      const foot: IAutoMovieResolvedBone = film
        .bones(track.subject, seconds)
        .get(`${side}Foot`)!;
      return HumanFoot.point(body, side, "ball", {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      });
    };
    const hips = (seconds: number): IAutoMovieVector3 =>
      film.bones(track.subject, seconds).get("hips")!.worldPosition;
    const early: number = track.start + 0.27 * SECONDS;
    const start: IAutoMovieVector3 = sole(moving, track.start);
    const mid: IAutoMovieVector3 = sole(moving, early);
    complaints.check(
      `${track.subject}: travelling sole slides while its partner stays planted`,
      Math.sign(travel) * (mid.x - start.x) > 0.02 &&
        Math.abs(mid.y - start.y) <= 0.006 &&
        Vector3.distance(sole(planted, early), sole(planted, track.start)) <=
          0.005,
    );
    complaints.check(
      `${track.subject}: visible settles and held posture precede recovery`,
      first !== undefined &&
        follow !== undefined &&
        first.seconds < follow.seconds &&
        follow.seconds <= recovery.start &&
        !nclose(cue, first.seconds) &&
        !nclose(cue, follow.seconds) &&
        nclose(sole(moving, track.end).x - start.x, travel, 0.008) &&
        Math.sign(travel) * (hips(track.end).x - hips(track.start).x) > 0.04 &&
        Vector3.distance(
          hips(recovery.start - 0.0001),
          hips(recovery.start + 0.0001),
        ) <= 0.005,
    );
  }

  HumanStagePiste.compose({ ...take, reserve: [0.5, 0.25] });
  try {
    HumanStagePiste.compose({ ...take, reserve: [0.499999, 0.25] });
    complaints.list.push(
      "a stage reserve below the exact boundary was accepted",
    );
  } catch (error) {
    if (!(error instanceof HumanRefusal) || error.axis !== "stageClearance")
      complaints.list.push(
        `stage reserve: unexpected refusal ${String(error)}`,
      );
  }
  complaints.assert("Staged kendo glide");
}
