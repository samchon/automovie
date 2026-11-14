import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanVerdicts,
  type IHumanBody,
  type walk,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A walk that does not face its way, on one body, which the
 * `test_human_motion_walk_facing_*` specs read by body and by walks (#3360): the
 * body walks backward, sideways or round while it faces a heading or a
 * point (`walk`'s `facing`).
 *
 * The person stands at the origin facing +Z and walks:
 * - backward 2 m, facing +Z throughout (a backpedal);
 * - 1.2 m to its left, facing +Z throughout (a side-walk);
 * - backward round a quarter of a circle of 1.5 m about a point 1.5 m ahead,
 *   facing the point throughout.
 *
 * Scenarios, for each walk:
 * 1. It plans and its root arrives within 0.1 m of the walk's end
 *    (provisional: the feet's closing step lies at the end).
 * 2. Read ten times a second, the pelvis faces the asked heading (for the
 *    arc, toward the point) within 15 degrees (provisional, a step's turn
 *    between footfalls).
 * 3. The shipped verdicts read no foot sliding, lifting or sinking while
 *    planted (the campaign's 5 mm bounds).
 * 4. For the side-walk, the feet never cross: read ten times a second, the
 *    left ankle stays to the body's left of the right one.
 * 5. The backpedal takes longer than the same walk forward by between 1.1
 *    and 1.4 times: a backward walk keeps the cadence and shortens the
 *    stride to 0.79 of a forward one (Laufer 2005; Hreljac et al. 2005),
 *    give or take the ramps into and out of the gait.
 *
 * @param name The body.
 * @param which The backpedal with its forward walk (`back`), the side-walk (`side`) or the backward arc (`arc`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the walks and the 5 scenarios with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the walks through the public chain and reads displayed joints and soles against the asked headings and the plan's declared plants.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per scenario, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A walk that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four short walks read at ten or twenty instants a second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionWalkFacing(
  name: motionHumanBody.Name,
  which: "back" | "side" | "arc",
): void {
  const body: IHumanBody = motionHumanBody(name);
  const complaints: string[] = [];
  const at = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const perform = (params: walk.IParams): HumanPerformance =>
    new HumanPerformance({
      seed: "facing",
      performers: [
        {
          subject: "a",
          body,
          at: at(0, 0),
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").walk(params).node,
    });
  const heading = (v: IAutoMovieVector3): number =>
    (Math.atan2(v.x, v.z) * 180) / Math.PI;
  const off = (a: number, b: number): number =>
    Math.abs(((((a - b) % 360) + 540) % 360) - 180);
  const centre: IAutoMovieVector3 = at(0, 1.5);
  const walks: {
    label: string;
    params: walk.IParams;
    faces: (root: IAutoMovieVector3) => number;
  }[] = [
    {
      label: "the backpedal",
      params: { to: at(0, -2), facing: { yaw: 0 } },
      faces: (): number => 0,
    },
    {
      label: "the side-walk",
      params: { to: at(1.2, 0), facing: { yaw: 0 } },
      faces: (): number => 0,
    },
    {
      label: "the backward arc",
      params: {
        to: at(1.5, 1.5),
        via: [0.25, 0.5, 0.75].map(
          (share: number): IAutoMovieVector3 =>
            at(
              1.5 * Math.sin((share * Math.PI) / 2),
              1.5 - 1.5 * Math.cos((share * Math.PI) / 2),
            ),
        ),
        facing: { toward: centre },
      },
      faces: (root: IAutoMovieVector3): number =>
        heading({ x: centre.x - root.x, y: 0, z: centre.z - root.z }),
    },
  ];
  const durations: Record<string, number> = {};
  for (const one of walks.filter(
    (w: { label: string }): boolean =>
      w.label ===
      { back: "the backpedal", side: "the side-walk", arc: "the backward arc" }[
        which
      ],
  )) {
    let performance: HumanPerformance;
    try {
      performance = perform(one.params);
    } catch (error) {
      complaints.push(
        `${name}: ${one.label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const segment: HumanSegment.ISegment = performance.segments("a")[0]!;
    durations[one.label] = segment.end - segment.entryTime;

    // 1. It arrives.
    const hips = (t: number): IAutoMovieVector3 =>
      HumanSignature.bones(reader, t).get("hips")!.worldPosition;
    const end: IAutoMovieVector3 = hips(segment.end);
    const miss: number = Math.hypot(
      end.x - one.params.to.x,
      end.z - one.params.to.z,
    );
    if (!(miss <= 0.1))
      complaints.push(
        `${name}: ${one.label}: the hips end ${(miss * 1000).toFixed(0)} mm from the walk's end, within 100 mm expected`,
      );

    // 2. It faces the asked way; 4. the side-walk's feet do not cross.
    for (const t of HumanSignature.times(segment.entryTime, segment.end, 10)) {
      const bones: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(reader, t);
      const left: IAutoMovieVector3 = bones.get("leftUpperLeg")!.worldPosition;
      const right: IAutoMovieVector3 =
        bones.get("rightUpperLeg")!.worldPosition;
      // The pelvis's facing: its left hip to its right, turned a quarter.
      const across: IAutoMovieVector3 = {
        x: left.x - right.x,
        y: 0,
        z: left.z - right.z,
      };
      const facing: number = heading({ x: -across.z, y: 0, z: across.x });
      const asked: number = one.faces(hips(t));
      if (off(facing, asked) > 15)
        complaints.push(
          `${name}: ${one.label}: at ${t.toFixed(2)} s the pelvis faces ${facing.toFixed(0)} degrees, the asked ${asked.toFixed(0)} within 15 expected`,
        );
      if (one.label === "the side-walk") {
        const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
        const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
        const apart: number = (l.x - r.x) * across.x + (l.z - r.z) * across.z;
        if (!(apart > 0))
          complaints.push(
            `${name}: the side-walk: at ${t.toFixed(2)} s the left ankle is not left of the right one`,
          );
      }
    }

    // 3. The feet keep the floor: the shipped verdicts read no foot slide,
    // lift or sink.
    for (const finding of HumanVerdicts.of(performance).findings.filter(
      (f: HumanVerdicts.IFinding): boolean =>
        f.check === "slip" || f.check === "lift" || f.check === "floor",
    ))
      complaints.push(
        `${name}: ${one.label}: ${finding.check} ${(finding.value * 1000).toFixed(1)} mm at ${finding.seconds.toFixed(2)} s (${finding.where}), within ${(finding.limit * 1000).toFixed(0)} mm expected`,
      );
  }

  // 5. Backward against forward.
  if (which === "back")
    try {
      const forward: HumanSegment.ISegment = perform({ to: at(0, 2) }).segments(
        "a",
      )[0]!;
      const ratio: number =
        (durations["the backpedal"] ?? NaN) / (forward.end - forward.entryTime);
      if (!(ratio >= 1.1 && ratio <= 1.4))
        complaints.push(
          `${name}: the backpedal takes ${ratio.toFixed(2)} times the forward walk's time, between 1.1 and 1.4 expected`,
        );
    } catch (error) {
      complaints.push(
        `${name}: the forward walk: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

  TestValidator.equals(
    `a walk faces apart from its way (${name}, ${which})`,
    complaints,
    [],
  );
}
