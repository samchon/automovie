import { ArchetypeCourse } from "@automovie/archetypes";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanEnsemble,
  HumanFormation,
  HumanGait,
  HumanPerformance,
  walkStation,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A formation lays its slots from the engine's layouts in a moving frame,
 * moves them rigidly with it, composes a square from four outward blocks,
 * and its members keep their slots by their own travel.
 *
 * Scenarios:
 * 1. A three-rank line of 40 files, 0.56 m files and 0.33 m ranks (22 and 13
 *    inches, the official frontage and the French rank distance, Balagan's
 *    summary of Haythornthwaite and Nafziger): with 4 cm dressing every slot
 *    lies within the dressing of its lattice point; without dressing on the
 *    lattice to 1e-9 m, file 0 on the frame's left and rank 0 in front.
 * 2. Moving the frame by 7 m and turning it by 53 degrees leaves every
 *    pairwise slot distance unchanged to 1e-9 m.
 * 3. A square of four `line` blocks faced 0, 90, 180 and 270 degrees: every
 *    member faces away from the square's centre and no two slots stand closer
 *    than the file spacing.
 * 4. Six members on two bodies march their slots behind a path frame that
 *    stands half a second, gathers speed and turns 90 degrees: every member
 *    takes the same number of steps within one, ends within its step's
 *    length of its slot, and at every heel strike before the frame turns its
 *    corner stands within half a drill step of its slot, its place kept by
 *    the length of its step at the called cadence (`walkStation.cadenced`),
 *    not by drifting ahead while the frame stands or gathers speed.
 * 5. Two members walk freely behind a path frame that starts, slows and
 *    halts: each ends within 0.15 m of its slot, and never falls behind its
 *    slot by more than the lag the speed-matching gain gives for the
 *    largest speed change, `dv / GAIN`, plus half a step.
 * 6. A path frame with two speed marks: the frame's speed reaches each mark
 *    within its acceleration's time, and a slot's way read back by a timed
 *    course (`ArchetypeCourse.timed`) passes the same points at the same
 *    seconds within 1e-6 m.
 * 7. A member's station from `HumanEnsemble.station`: its dress bound is
 *    smaller for a disciplined member than for an undisciplined one, and a
 *    member walking its dressed station ends within 0.15 m of its slot (the
 *    deviation vanishes where the station ends).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Lays slots, moves frames and performs marches and walks that keep station; a wrong lattice, a frame that shears, an inward face, a member that loses its count or its slot, or a path the course cannot replay is caught.
 * @evidence contracts/development/testing.md#independent-expectations The lattice and its 22 and 13 inch spacings are the drill's; rigidity and outward faces are geometry; the lag bound is the cited gain's first-order law; the course passes through its samples by construction of a timed course.
 * @evidence contracts/development/testing.md#distinguishing-cases Dressed and undressed lattices, a moved frame, four faced blocks, cadenced and free station keeping, and marks on a path; members, manoeuvres and steering belong to their own tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies, discovered by its exported name; postures only, no host. The test package may import archetypes.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_human_motion_ensemble_formation(): void {
  const findings: string[] = [];
  const line = (dress: number): IAutoMovieMotionHumanFormation => ({
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 3,
          files: 40,
          spacing: { lateral: 0.56, depth: 0.33 },
          dressing: { lateral: dress, depth: dress },
        },
        count: 120,
        seed: 7,
      },
    ],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  });

  // 1. The lattice.
  for (const dress of [0.04, 0]) {
    const f: IAutoMovieMotionHumanFormation = HumanFormation.of(line(dress));
    for (let i: number = 0; i < 120; ++i) {
      const rank: number = Math.floor(i / 40);
      const file: number = i % 40;
      const at: IAutoMovieVector3 = HumanFormation.slot(f, i, 0).at;

      // Facing +Z, the frame's right is -X and its rear -Z.
      const lattice: IAutoMovieVector3 = {
        x: -(file - 19.5) * 0.56,
        y: 0,
        z: -rank * 0.33,
      };
      const dx: number = Math.abs(at.x - lattice.x);
      const dz: number = Math.abs(at.z - lattice.z);
      if (
        dress === 0
          ? Math.hypot(dx, dz) > 1e-9
          : dx > dress + 1e-9 || dz > dress + 1e-9
      ) {
        findings.push(
          `slot ${i} stands ${dx.toFixed(4)}, ${dz.toFixed(4)} m off its lattice point with ${dress} m dressing`,
        );
        break;
      }
    }
  }
  if (!(HumanFormation.slot(HumanFormation.of(line(0)), 0, 0).at.x > 0))
    findings.push("file 0 does not stand on the frame's left");

  // 2. Rigidity.
  const still: IAutoMovieMotionHumanFormation = line(0.04);
  const moved: IAutoMovieMotionHumanFormation = {
    ...still,
    frame: { kind: "fixed", at: { x: 7, y: 0, z: -2 }, heading: 53 },
  };
  const pairwise = (
    f: IAutoMovieMotionHumanFormation,
    i: number,
    j: number,
  ): number => {
    const a: IAutoMovieVector3 = HumanFormation.slot(f, i, 0).at;
    const b: IAutoMovieVector3 = HumanFormation.slot(f, j, 0).at;
    return Math.hypot(a.x - b.x, a.z - b.z);
  };
  for (let i: number = 0; i < 120; i += 7)
    for (let j: number = i + 1; j < 120; j += 11)
      if (Math.abs(pairwise(still, i, j) - pairwise(moved, i, j)) > 1e-9)
        findings.push(
          `slots ${i} and ${j} change distance when the frame moves`,
        );

  // 3. A square.
  const face = (
    facing: number,
    lateral: number,
    depth: number,
  ): IAutoMovieMotionHumanFormation.IBlock => ({
    layout: {
      kind: "line",
      ranks: 2,
      files: 8,
      spacing: { lateral: 0.56, depth: 0.6 },
    },
    count: 16,
    facing,
    offset: { lateral, depth },
  });
  const square: IAutoMovieMotionHumanFormation = HumanFormation.of({
    blocks: [face(0, 0, -3), face(90, -3, 0), face(180, 0, 3), face(270, 3, 0)],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  });
  const slots: IAutoMovieMotionHumanFormation.ISlot[] = Array.from(
    { length: 64 },
    (_: unknown, i: number): IAutoMovieMotionHumanFormation.ISlot =>
      HumanFormation.slot(square, i, 0),
  );
  for (const [i, s] of slots.entries()) {
    const out: number =
      s.at.x * Math.sin((s.heading * Math.PI) / 180) +
      s.at.z * Math.cos((s.heading * Math.PI) / 180);
    if (!(out > 0)) findings.push(`square slot ${i} faces inward`);
    for (let j: number = i + 1; j < slots.length; ++j)
      if (
        Math.hypot(s.at.x - slots[j]!.at.x, s.at.z - slots[j]!.at.z) <
        0.56 - 1e-9
      )
        findings.push(`square slots ${i} and ${j} stand too close`);
  }

  // 4. Cadenced station keeping round a corner.
  const bodies: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
  ];
  const path: IAutoMovieMotionHumanFormation = HumanFormation.of({
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 2,
          files: 3,
          spacing: { lateral: 0.8, depth: 1.0 },
        },
        count: 6,
      },
    ],
    frame: {
      kind: "path",
      via: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 6 },
        { x: 6, y: 0, z: 6 },
      ],
      start: 0.5,
      speed: 1.2,
    },
  });
  const troop: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "t",
    seed: "formation",
    count: 6,
    bodies,
    preset: "elite",
    formation: path,
  });
  const end: number = HumanFormation.end(path)!;
  const march: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "formation",
    laws: [...HUMAN_LEXICON.gait!],
    performers: HumanEnsemble.performers(troop),
    composition: HumanEnsemble.chains(
      troop,
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
        chain: IAutoMovieMotionHumanChain,
      ) =>
        chain.registered("march", {
          to: HumanFormation.slot(path, m.index, end).at,
          station: { formation: path, slot: m.index },
        }),
    ),
  });
  const counts: number[] = troop.members.map(
    (m: IAutoMovieMotionHumanEnsemble.IMember): number =>
      march
        .segments(m.subject)
        .reduce(
          (n: number, s: IAutoMovieMotionHumanSegment): number =>
            n +
            s.plan.events.filter((e) => /HeelStrike\d+$/.test(e.name)).length,
          0,
        ),
  );
  if (Math.max(...counts) - Math.min(...counts) > 1)
    findings.push(`the marchers took ${counts.join(", ")} steps`);
  for (const m of troop.members) {
    const last: IAutoMovieMotionHumanSegment = march
      .segments(m.subject)
      .at(-1)!;
    if (m === troop.members[0]) projection(last.plan, "entrained march", findings);
    const root: IAutoMovieVector3 = march.posture(m.subject, last.end).root;
    const slot: IAutoMovieVector3 = HumanFormation.slot(path, m.index, end).at;
    const off: number = Math.hypot(root.x - slot.x, root.z - slot.z);
    if (off > 0.4)
      findings.push(`${m.subject} ends ${off.toFixed(3)} m from its slot`);

    // Through the frame's standing start and its gathering of speed, before it turns its corner (where a rigid line's inner file must swing back, which the stepping plan's way does not), the count kept and the place kept by the step's length.
    const segment: IAutoMovieMotionHumanSegment = march.segments(m.subject)[0]!;
    const half: number = 0.5 * HumanGait.MARCH.step;
    for (const e of segment.plan.events.filter(
      (e: IAutoMovieMotionEvent): boolean => /HeelStrike\d+$/.test(e.name),
    )) {
      const t: number = segment.start + e.share * segment.plan.duration;
      if (
        t > end ||
        HumanFormation.frame(path, t).heading !==
          HumanFormation.frame(path, 0).heading
      )
        continue;
      const at: IAutoMovieVector3 = march.posture(m.subject, t).root;
      const slot: IAutoMovieVector3 = HumanFormation.slot(path, m.index, t).at;
      const gap: number = Math.hypot(at.x - slot.x, at.z - slot.z);
      if (gap > half) {
        findings.push(
          `${m.subject} stands ${gap.toFixed(3)} m from its slot at ${e.name}, ${t.toFixed(2)} s, more than half a drill step`,
        );
        break;
      }
    }
  }

  // 5. Free station keeping through a start, a slowing and a halt.
  const marks: IAutoMovieMotionHumanFormation = HumanFormation.of({
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 1,
          files: 2,
          spacing: { lateral: 1.2, depth: 1 },
        },
        count: 2,
      },
    ],
    frame: {
      kind: "path",
      via: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 12 },
      ],
      start: 0.5,
      speed: {
        marks: [
          { at: 0.5, speed: 1.3 },
          { at: 4, speed: 0.7 },
        ],
      },
    },
  });
  const pair: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "w",
    seed: "formation",
    count: 2,
    bodies,
    formation: marks,
  });
  const stop: number = HumanFormation.end(marks)!;
  const walking: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "formation",
    performers: HumanEnsemble.performers(pair),
    composition: HumanEnsemble.chains(
      pair,
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
        chain: IAutoMovieMotionHumanChain,
      ) =>
        chain.walk({
          to: HumanFormation.slot(marks, m.index, stop).at,
          station: { formation: marks, slot: m.index },
        }),
    ),
  });
  for (const m of pair.members) {
    const last: IAutoMovieMotionHumanSegment = walking
      .segments(m.subject)
      .at(-1)!;
    if (m === pair.members[0]) projection(last.plan, "station-paced walk", findings);
    const root: IAutoMovieVector3 = walking.posture(m.subject, last.end).root;
    const slot: IAutoMovieVector3 = HumanFormation.slot(
      marks,
      m.index,
      stop,
    ).at;
    if (Math.hypot(root.x - slot.x, root.z - slot.z) > 0.15)
      findings.push(
        `${m.subject} walks to ${Math.hypot(root.x - slot.x, root.z - slot.z).toFixed(3)} m from its slot`,
      );
    const bound: number =
      1.3 / walkStation.GAIN + 0.5 * 0.8 * m.body.measure.hipHeight;
    for (let t: number = 0.5; t <= stop; t += 0.25) {
      const behind: number =
        HumanFormation.slot(marks, m.index, t).at.z -
        walking.posture(m.subject, t).root.z;
      if (behind > bound) {
        findings.push(
          `${m.subject} falls ${behind.toFixed(3)} m behind its slot at ${t} s, within ${bound.toFixed(3)} m expected`,
        );
        break;
      }
    }
  }

  // 6. Marks and a timed course.
  const frame = (t: number): IAutoMovieVector3 =>
    HumanFormation.frame(marks, t).at;
  const speed = (t: number): number =>
    (frame(t + 1e-3).z - frame(t - 1e-3).z) / 2e-3;
  const rate: number = HumanFormation.ACCELERATION;
  if (Math.abs(speed(0.5 + 1.3 / rate + 0.05) - 1.3) > 1e-6)
    findings.push(
      `the frame runs at ${speed(0.5 + 1.3 / rate + 0.05).toFixed(4)} m/s after its first change, 1.3 expected`,
    );
  if (Math.abs(speed(4 + 0.6 / rate + 0.05) - 0.7) > 1e-6)
    findings.push(
      `the frame runs at ${speed(4 + 0.6 / rate + 0.05).toFixed(4)} m/s after its second change, 0.7 expected`,
    );
  const samples: IAutoMovieMotionHumanFormation.ISample[] = HumanFormation.path(
    marks,
    1,
    0,
    stop,
  );
  const course: ArchetypeCourse.IPlan = ArchetypeCourse.timed("frame", samples);
  for (const s of samples) {
    const at: IAutoMovieVector3 = course.at(s.seconds).placement.translation;
    if (Math.hypot(at.x - s.x, at.z - s.z) > 1e-6) {
      findings.push(`the timed course misses the slot's way at ${s.seconds} s`);
      break;
    }
  }

  // 7. A member's dressed station.
  const drilled: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "d",
    seed: "formation",
    count: 2,
    bodies,
    formation: marks,
    attributes: { discipline: { mean: 1, spread: 0 } },
  });
  const raw: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "d",
    seed: "formation",
    count: 2,
    bodies,
    formation: marks,
    attributes: { discipline: { mean: 0, spread: 0 } },
  });
  const steady: IAutoMovieMotionHumanFormation.IStation = HumanEnsemble.station(
    drilled,
    drilled.members[0]!,
  );
  const loose: IAutoMovieMotionHumanFormation.IStation = HumanEnsemble.station(
    raw,
    raw.members[0]!,
  );
  if (!(steady.dress!.bound < loose.dress!.bound))
    findings.push(
      `the drilled member's dress bound ${steady.dress!.bound} is not below the undisciplined one's ${loose.dress!.bound}`,
    );
  const dressed: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "formation",
    performers: HumanEnsemble.performers(raw),
    composition: HumanEnsemble.chains(
      raw,
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
        chain: IAutoMovieMotionHumanChain,
      ) =>
        chain.walk({
          to: HumanFormation.slot(marks, m.index, stop).at,
          station: HumanEnsemble.station(raw, m),
        }),
    ),
  });
  const walked: IAutoMovieMotionHumanSegment = dressed.segments("d.0")[0]!;
  const reach: number = Math.hypot(
    dressed.posture("d.0", walked.end).root.x -
      HumanFormation.slot(marks, 0, stop).at.x,
    dressed.posture("d.0", walked.end).root.z -
      HumanFormation.slot(marks, 0, stop).at.z,
  );
  if (reach > 0.15)
    findings.push(
      `the dressed member ends ${reach.toFixed(3)} m from its slot`,
    );
  TestValidator.equals("a formation and its station keeping", findings, []);
}

/** Compare the shortcut against complete root coordinates on the retimed action clock. */
function projection(plan: walkStation.IPlan, label: string, findings: string[]): void {
  if (plan.horizontalRoot === undefined) {
    findings.push(`${label}: no horizontal root projection`);
    return;
  }
  const seconds: Set<number> = new Set<number>([0, plan.duration]);
  for (const event of plan.events) seconds.add(event.share * plan.duration);
  for (let k: number = 1; k * walkStation.TICK < plan.duration; k++)
    seconds.add(k * walkStation.TICK);
  for (const at of seconds) {
    const full: IAutoMovieVector3 = plan.posture(at).root;
    const point: walkStation.HorizontalPoint = plan.horizontalRoot(at);
    if (point.x !== full.x || point.z !== full.z) {
      findings.push(`${label}: horizontal projection at ${at} s is (${point.x}, ${point.z}), expected (${full.x}, ${full.z})`);
      return;
    }
  }
}