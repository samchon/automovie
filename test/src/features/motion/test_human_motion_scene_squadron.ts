import { ArchetypeCourse, createHorse } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanEnsemble,
  HumanFormation,
  type IHumanBody,
  type IHumanFormation,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A cavalry squadron's horses ride the formation's slot paths, crossing the
 * package boundary as plain data: each horse is drawn from its member's own
 * seed, its course is its slot's timed way, and the two ranks keep their
 * files and distances knee to knee.
 *
 * Scenarios, a 2 by 6 squadron on two rider bodies, files 1.1 m apart (a
 * horse's breadth knee to knee, provisional) and ranks 3.2 m (a horse's
 * length and a gap, provisional), advancing 30 m on a path frame whose speed
 * marks walk at 1.8 m/s and trot at 3.5 m/s (inside the French
 * eighteenth-century walk and trot ranges, Revue historique des armees):
 * 1. Every horse's timed course passes its slot's way within 1e-6 m at every sample
 *    of the way (`ArchetypeCourse.timed` over `HumanFormation.path`).
 * 2. At every 1/24 s, no two horses' placements come closer than the file
 *    spacing, and each rank keeps its files in order across the front.
 * 3. Each member's horse seed is its own and stays when a member is added.
 * 4. The rides replay bit for bit.
 *
 * A horse's ride along a timed course (the archetypes' ride takes leg courses
 * only, #3493), gait changes within one ride (#3494), riders posting at the trot on
 * their own horse's footfalls, the arrival spread at the charge and the
 * wheel's speed bound are recorded as blocked on #3466 until the props
 * planner's ride gives gait changes along one course.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds horses and rides from the ensemble's seeds and slot paths and reads their placements: a course off its slot, horses that close up or swap files, a seed shared or moved, or a non-replaying ride is caught.
 * @evidence contracts/development/testing.md#independent-expectations A timed course passes through its samples by construction; the spacings are the formation's own; seeds keyed by member are the ensemble's contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two ranks, two speeds, an added member and a replay; the rider's seat and posting belong to the riding tests.
 * @evidence contracts/development/testing.md#execution-ownership A scene test across the motions and archetypes packages (the test package may import both), discovered by its exported name; placements only, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and the cases recorded as blocked.
 */
export function test_human_motion_scene_squadron(): void {
  const findings: string[] = [];
  const pool: IHumanBody[] = [motionHumanBody("m-average"), motionHumanBody("m-tall")];
  const formation: IHumanFormation = HumanFormation.of({
    blocks: [{ layout: { kind: "line", ranks: 2, files: 6, spacing: { lateral: 1.1, depth: 3.2 } }, count: 12 }],
    frame: {
      kind: "path",
      via: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 40 }],
      speed: { marks: [{ at: 0.5, speed: 1.8 }, { at: 6, speed: 3.5 }] },
    },
  });
  const squadron: HumanEnsemble.IEnsemble = HumanEnsemble.of({ id: "sq", seed: "squadron", count: 12, bodies: pool, preset: "line", formation });
  const end: number = HumanFormation.end(formation)!;
  const rides: ArchetypeCourse.IPlan[] = [];
  const ways: ReturnType<typeof HumanFormation.path>[] = [];
  for (const m of squadron.members) {
    const way: ReturnType<typeof HumanFormation.path> = HumanFormation.path(formation, m.index, 0, end);
    ways.push(way);
    rides.push(ArchetypeCourse.timed(`horse ${m.index}`, way));
  }

  // 1. Courses on their slots.
  ways.forEach((way: ReturnType<typeof HumanFormation.path>, i: number): void => {
    const course: ArchetypeCourse.IPlan = ArchetypeCourse.timed("horse", way);
    for (const s of way) {
      const at: IAutoMovieVector3 = course.at(s.seconds).placement.translation;
      if (Math.hypot(at.x - s.x, at.z - s.z) > 1e-6) {
        findings.push(`horse ${i}'s course leaves its slot at ${s.seconds.toFixed(2)} s`);
        break;
      }
    }
  });

  // 2. Spacing and file order.
  for (let t: number = 0; t <= end; t += 1 / 24) {
    const at: IAutoMovieVector3[] = rides.map((r: ArchetypeCourse.IPlan): IAutoMovieVector3 => r.at(t).placement.translation);
    let bad: boolean = false;
    for (let i: number = 0; i < at.length && !bad; ++i)
      for (let j: number = i + 1; j < at.length; ++j)
        if (Math.hypot(at[i]!.x - at[j]!.x, at[i]!.z - at[j]!.z) < 1.1 - 1e-6) {
          findings.push(`horses ${i} and ${j} close to ${Math.hypot(at[i]!.x - at[j]!.x, at[i]!.z - at[j]!.z).toFixed(3)} m at ${t.toFixed(2)} s`);
          bad = true;
          break;
        }
    for (const rank of [0, 1])
      for (let f: number = 1; f < 6; ++f)
        if (!(at[rank * 6 + f]!.x < at[rank * 6 + f - 1]!.x)) {
          findings.push(`rank ${rank} files ${f - 1} and ${f} swap at ${t.toFixed(2)} s`);
          bad = true;
        }
    if (bad) break;
  }

  // 3. Seeds: each member's horse is drawn from its own, and two horses of two seeds differ.
  const first: ReturnType<typeof createHorse> = createHorse({}, HumanEnsemble.seed(squadron, 0, "horse"));
  const second: ReturnType<typeof createHorse> = createHorse({}, HumanEnsemble.seed(squadron, 1, "horse"));
  if (JSON.stringify(first) === JSON.stringify(second)) findings.push("two members' horses are the same horse");
  const grown: HumanEnsemble.IEnsemble = HumanEnsemble.of({ id: "sq", seed: "squadron", count: 13, bodies: pool, preset: "line", places: (i: number) => ({ at: { x: i, y: 0, z: 0 }, yaw: 0 }) });
  const seeds: Set<number> = new Set();
  for (const m of squadron.members) {
    const seed: number = HumanEnsemble.seed(squadron, m.index, "horse");
    if (seeds.has(seed)) findings.push(`${m.subject} shares a horse seed`);
    seeds.add(seed);
    if (HumanEnsemble.seed(grown, m.index, "horse") !== seed) findings.push(`adding a member moves ${m.subject}'s horse seed`);
  }

  // 4. Replay.
  const again: ArchetypeCourse.IPlan = ArchetypeCourse.timed("horse 3", HumanFormation.path(formation, 3, 0, end));
  for (let t: number = 0; t <= end; t += 0.5)
    if (JSON.stringify(again.at(t).placement) !== JSON.stringify(rides[3]!.at(t).placement)) {
      findings.push(`horse 3 does not replay at ${t} s`);
      break;
    }
  TestValidator.equals("a cavalry squadron's horses on their slots", findings, []);
}
