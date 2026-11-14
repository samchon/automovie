import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanVerdicts,
  type IHumanBody,
  type IHumanContactWindow,
  type walk,
} from "@automovie/motions";

import type { motionHumanBody } from "./motionHumanBody";

/**
 * Walks a person sets off on from standing toward a way they do not face,
 * with no `facing`, read by `motionWalkFacing`'s `about` walks: they turn
 * about where they stand, then walk (carried-off: a carrier walked 3 m
 * behind him, his hips dipping 0.26 m in 0.1 s and his toes 46 mm under the
 * floor as his first footprint turned half a turn in one swing).
 *
 * The person stands at the origin facing +Z and walks, each plain:
 * - 3 m straight behind (a turn of 180 degrees);
 * - 2 m to the right (a turn of 90 degrees);
 * - for each, the same length straight ahead, the same body's own gait to
 *   read it by.
 *
 * Scenarios, for the walks behind and aside:
 * 6. It plans and its hips arrive within 0.1 m of the walk's end.
 * 7. Read thirty times a second, the hips never lie lower than the lowest
 *    the same body's straight walk of the same length holds them, less
 *    10 mm: turning about lowers the body no more than walking does.
 * 8. While the pelvis faces more than 75 degrees from the way to the walk's
 *    end, and that end is more than 0.5 m away (nearer, the way turns with
 *    every sway of the hips), the hips stay within 0.1 m of where they
 *    stood: the person turns
 *    about before setting off, as in a standing turn (Khobkhun, Hollands and
 *    Richards 2022, Appl Sci 12:5474); the angle and the distance are
 *    provisional, a step's turn and half a foot's length.
 * 9. The shipped verdicts read no foot sliding, lifting or sinking while
 *    planted (the campaign's 5 mm bounds).
 * 10. A foot's window is declared a `pivot` only where the pelvis has
 *    turned from that foot, as it lay when the window opened, further than
 *    the hip rotates (DEFAULT_HUMANOID_ROM, 45 degrees either way; 1 degree
 *    of reading tolerance), read at the window's middle: a person spins on
 *    the ball of the stance foot only when the hip cannot take the turn
 *    (Hase and Stein 1999).
 *
 * @param name The body's name, for the complaints.
 * @param body The body.
 * @param perform The walk performed from the origin facing +Z.
 * @param complaints Where a failed reading is told.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the case it comes from, the walks and the 5 scenarios with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the walks through the public chain and reads the displayed hips, pelvis and feet against the walk's own end, the same body's straight gait of the same length, the hip's range and the plan's declared pivots, and the shipped foot verdicts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per scenario, gathered as complaints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A walk that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four short walks, read twenty or thirty times a second, and two verdicts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each walk is performed once and read by every scenario.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionWalkFacingAbout(
  name: motionHumanBody.Name,
  body: IHumanBody,
  perform: (params: walk.IParams) => HumanPerformance,
  complaints: string[],
): void {
  const at = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  /** A walk performed, and its displayed hips and pelvis's facing. */
  interface IWalked {
    performance: HumanPerformance;
    segment: HumanSegment.ISegment;
    reader: HumanSignature.IReader;
    hips: (t: number) => IAutoMovieVector3;
    pelvis: (t: number) => number;
  }
  const read = (params: walk.IParams, label: string): IWalked | null => {
    let performance: HumanPerformance;
    try {
      performance = perform(params);
    } catch (error) {
      complaints.push(
        `${name}: ${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    return {
      performance,
      segment: performance.segments("a")[0]!,
      reader,
      hips: (t: number): IAutoMovieVector3 =>
        HumanSignature.bones(reader, t).get("hips")!.worldPosition,
      // The pelvis's facing: its left hip to its right, turned a quarter.
      pelvis: (t: number): number => {
        const bones: ReturnType<typeof HumanSignature.bones> =
          HumanSignature.bones(reader, t);
        const l: IAutoMovieVector3 = bones.get("leftUpperLeg")!.worldPosition;
        const r: IAutoMovieVector3 = bones.get("rightUpperLeg")!.worldPosition;
        return (Math.atan2(-(l.z - r.z), l.x - r.x) * 180) / Math.PI;
      },
    };
  };
  // The lowest the hips go over a walk, read thirty times a second.
  const lowest = (walked: IWalked): { y: number; at: number } => {
    let low: { y: number; at: number } = { y: Infinity, at: 0 };
    for (const t of HumanSignature.times(
      walked.segment.entryTime,
      walked.segment.end,
      30,
    )) {
      const y: number = walked.hips(t).y;
      if (y < low.y) low = { y, at: t };
    }
    return low;
  };
  // A foot's heading, from its ankle to its toes.
  const foot = (walked: IWalked, side: "left" | "right", t: number): number => {
    const bones: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(
      walked.reader,
      t,
    );
    const a: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
    const b: IAutoMovieVector3 = bones.get(`${side}Toes`)!.worldPosition;
    return (Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI;
  };
  const apart = (a: number, b: number): number =>
    Math.abs(((((a - b) % 360) + 540) % 360) - 180);
  // The hips' rotation, the lesser way of either hip; a table without it
  // leaves nothing to read the pivots by.
  const range: number = Math.min(
    ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
      (bone: "leftUpperLeg" | "rightUpperLeg"): number => {
        const twist: IAutoMovieAngleRange | null | undefined =
          DEFAULT_HUMANOID_ROM[bone]?.twist;
        if (twist === null || twist === undefined)
          throw new Error(`DEFAULT_HUMANOID_ROM gives ${bone} no twist`);
        return Math.min(-twist.min, twist.max);
      },
    ),
  );

  for (const [label, to, ahead] of [
    ["the walk behind", at(0, -3), at(0, 3)],
    ["the walk aside", at(-2, 0), at(0, 2)],
  ] as const) {
    const walked: IWalked | null = read({ to }, label);
    const straight: IWalked | null = read(
      { to: ahead },
      `${label}'s straight walk`,
    );
    if (walked === null || straight === null) continue;
    const { segment, hips, pelvis } = walked;
    const stood: IAutoMovieVector3 = hips(segment.entryTime);

    // 6. It arrives.
    const end: IAutoMovieVector3 = hips(segment.end);
    const miss: number = Math.hypot(end.x - to.x, end.z - to.z);
    if (!(miss <= 0.1))
      complaints.push(
        `${name}: ${label}: the hips end ${(miss * 1000).toFixed(0)} mm from the walk's end, within 100 mm expected`,
      );

    // 7. No lower than walking.
    const low: { y: number; at: number } = lowest(walked);
    const own: { y: number; at: number } = lowest(straight);
    if (low.y < own.y - 0.01)
      complaints.push(
        `${name}: ${label}: the hips sink to ${low.y.toFixed(3)} m at ${low.at.toFixed(2)} s, the straight walk's lowest ${own.y.toFixed(3)} m less 10 mm expected at least`,
      );

    // 8. Turned about before setting off.
    let away: number = 0;
    let awayAt: number = 0;
    for (const t of HumanSignature.times(segment.entryTime, segment.end, 20)) {
      const h: IAutoMovieVector3 = hips(t);
      const way: number = (Math.atan2(to.x - h.x, to.z - h.z) * 180) / Math.PI;
      const off: number = apart(pelvis(t), way);
      const moved: number = Math.hypot(h.x - stood.x, h.z - stood.z);
      const left: number = Math.hypot(to.x - h.x, to.z - h.z);
      if (off > 75 && left > 0.5 && moved > away) {
        away = moved;
        awayAt = t;
      }
    }
    if (away > 0.1)
      complaints.push(
        `${name}: ${label}: the hips have gone ${(away * 1000).toFixed(0)} mm by ${awayAt.toFixed(2)} s while the pelvis faces more than 75 degrees from the way, within 100 mm expected`,
      );

    // 10. A foot spins only past the hip's rotation.
    for (const window of segment.plan.contacts.filter(
      (c: IHumanContactWindow): boolean =>
        c.kind === "pivot" && (c.part === "leftFoot" || c.part === "rightFoot"),
    )) {
      const side: "left" | "right" =
        window.part === "leftFoot" ? "left" : "right";
      const opened: number =
        segment.start + window.from * segment.plan.duration;
      const middle: number =
        segment.start + ((window.from + window.to) / 2) * segment.plan.duration;
      const turned: number = apart(pelvis(middle), foot(walked, side, opened));
      if (!(turned > range - 1))
        complaints.push(
          `${name}: ${label}: the ${side} foot pivots at ${middle.toFixed(2)} s with the pelvis ${turned.toFixed(0)} degrees from it, beyond the hip's ${range} expected`,
        );
    }

    // 9. The feet keep the floor.
    for (const finding of HumanVerdicts.of(walked.performance).findings.filter(
      (f: HumanVerdicts.IFinding): boolean =>
        f.check === "slip" || f.check === "lift" || f.check === "floor",
    ))
      complaints.push(
        `${name}: ${label}: ${finding.check} ${(finding.value * 1000).toFixed(1)} mm at ${finding.seconds.toFixed(2)} s (${finding.where}), within ${(finding.limit * 1000).toFixed(0)} mm expected`,
      );
  }
}
