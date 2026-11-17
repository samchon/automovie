import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanChain, IAutoMovieMotionHumanEnsemble, IAutoMovieMotionHumanFormation, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanProp, IAutoMovieMotionHumanSeated, IAutoMovieMotionHumanSegment, IAutoMovieVector3 } from "@automovie/interface";
import { ArchetypeCourse, createHorse, rideHorse } from "@automovie/archetypes";

import { HumanCue, HumanEnsemble, HumanFormation, HumanObject, HumanPerformance, HumanRide } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A cavalry squadron as the crowd primitives over riders: each member's
 * horse is drawn from its member's own seed and rides its slot's way, the
 * horses changing gait by speed along one course, and each rider sits its
 * own horse and posts at the trot to its own horse's footfalls.
 *
 * Scenarios, a 2 by 3 squadron on two rider bodies, files 1.1 m apart (a
 * horse's breadth knee to knee, provisional) and ranks 3.2 m (a horse's
 * length and a gap, provisional), advancing 40 m: a walk to 1.8 m/s over the
 * first 10 m, a trot to 3.5 m/s over the next 20 m, and a halt (inside the
 * French eighteenth-century walk and trot ranges, Revue historique des
 * armees), after the riders have sat for `WAIT` seconds:
 * 1. Every horse starts on its slot and keeps its lateral and depth offset
 *    from the leading file's horse within 1e-6 m at every 1/24 s: the horses
 *    ride the formation rigidly, since their courses are the same legs from
 *    their own slots.
 * 2. No two horses come closer than the file spacing at any 1/24 s sample.
 * 3. Each horse changes gait along its one course (a `gait:` instant), and
 *    the gait changes of the six horses fall within one stride time of each
 *    other's (their tempos are their own).
 * 4. Each rider, posting to its own horse's right-fore footfalls, keeps its
 *    pelvis over its horse's saddle seat on the floor plan (between the seat's
 *    front edge and its depth behind it, and within 0.15 m of its middle line,
 *    provisional) at every footfall from the first gait change to the end of
 *    its ride; the seat's 10 mm verdict is the riding law's own spec's. Every
 *    rider is riding before its horse sets off at `WAIT`: a horse that leaves
 *    while its rider is still sitting down leaves the rider behind.
 * 5. Each member's horse seed is its own and stays when a member is added,
 *    and two members' horses differ.
 * 6. The rides and the riders replay bit for bit.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds horses and rides from the ensemble's seeds and slots, seats riders on them and reads placements, gait instants and the riders' seat regions: a horse off its slot, horses that close up, a ride without a gait change, a rider off the saddle at a footfall, a shared seed or a non-replaying scene is caught.
 * @evidence contracts/development/testing.md#independent-expectations Rigid rides follow from equal legs from each slot; the pelvis bound over the saddle is provisional and named; the speed ranges are the period sources'; seeds keyed by member are the ensemble's contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two ranks, two rider bodies, a walk, a trot and a halt, an added member and a replay; the charge's arrival spread and the wheel's speed bound need dress loosening with pace and are phase 2's.
 * @evidence contracts/development/testing.md#execution-ownership A scene test across the motions and archetypes packages (the test package may import both), discovered by its exported name; placements and postures only, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios, their bounds and what is left to phase 2.
 */
export function test_human_motion_scene_squadron(): void {
  const findings: string[] = [];
  // The horses set off once every rider has sat down (the sit takes 5 s for these bodies, checked in scenario 4).
  const WAIT: number = 6;
  const pool: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("m-tall"),
  ];
  const formation: IAutoMovieMotionHumanFormation = HumanFormation.of({
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 2,
          files: 3,
          spacing: { lateral: 1.1, depth: 3.2 },
        },
        count: 6,
      },
    ],
    frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
  });
  const squadron: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "sq",
    seed: "squadron",
    count: 6,
    bodies: pool,
    preset: "line",
    formation,
  });
  const course = (at: IAutoMovieVector3): ArchetypeCourse.ICourse => ({
    start: { x: at.x, z: at.z, heading: 0 },
    legs: [
      { kind: "straight", length: 10 },
      { kind: "straight", length: 20 },
      { kind: "straight", length: 10 },
    ],
    speeds: [1.8, 3.5, 0],
    cruise: 3.5,
    acceleration: 1,
    deceleration: 1.5,
    at: WAIT,
  });
  const build = (): {
    rides: ReturnType<typeof rideHorse>[];
    performance: IAutoMovieMotionHumanPerformance;
  } => {
    const rides: ReturnType<typeof rideHorse>[] = squadron.members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember) =>
        rideHorse(
          createHorse({}, HumanEnsemble.seed(squadron, m.index, "horse")),
          course(HumanFormation.slot(formation, m.index, 0).at),
        ),
    );
    const props: IAutoMovieMotionHumanProp[] = squadron.members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember, i: number): IAutoMovieMotionHumanProp => {
        const placed = (seconds: number): IAutoMovieMotionHumanProp.IFrame => {
          const sample: ReturnType<ReturnType<typeof rideHorse>["at"]> =
            rides[i]!.at(seconds);
          return {
            position: sample.placement.translation,
            rotation: sample.placement.rotation,
          };
        };
        return HumanObject.prop(
          m.prop("horse"),
          rides[i]!.at(0).archetype,
          placed(0),
          placed,
        );
      },
    );
    const cues: Record<
      string,
      ReturnType<typeof HumanCue.instants>
    > = Object.fromEntries(
      squadron.members.map(
        (
          m: IAutoMovieMotionHumanEnsemble.IMember,
          i: number,
        ): [string, ReturnType<typeof HumanCue.instants>] => [
          `${m.prop("horse")}.diagonal`,
          HumanCue.instants(rides[i]!, ["rightForeOn"]),
        ],
      ),
    );
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "squadron",
      laws: [HumanRide.ride],
      props,
      cues,
      performers: HumanEnsemble.performers(squadron).map(
        (p: IAutoMovieMotionHumanPerformer, i: number): IAutoMovieMotionHumanPerformer => {
          const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
            rides[i]!.at(0).archetype,
            props[i]!.frame,
            "seat",
          );
          const radians: number = (seat.yaw * Math.PI) / 180;
          return {
            ...p,
            at: {
              x: seat.at.x + 0.6 * Math.cos(radians),
              y: 0,
              z: seat.at.z - 0.6 * Math.sin(radians),
            },
            yaw: seat.yaw,
          };
        },
      ),
      composition: HumanEnsemble.chains(
        squadron,
        (m: IAutoMovieMotionHumanEnsemble.IMember, chain: IAutoMovieMotionHumanChain) => {
          const horse: string = m.prop("horse");
          const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
            rides[m.index]!.at(0).archetype,
            props[m.index]!.frame,
            "seat",
          );
          return chain.sit({ seat }).registered("ride", {
            on: horse,
            seconds: rides[m.index]!.duration,
            rising: { cue: `${horse}.diagonal` },
            feet: { left: "leftStirrup", right: "rightStirrup" },
            hands: { left: "leftRein", right: "rightRein" },
          });
        },
      ),
    });
    return { rides, performance };
  };
  const { rides, performance } = build();
  // A ride's seconds are film seconds; its course starts at `WAIT`.
  const end: number =
    WAIT +
    Math.max(
      ...rides.map((r: ReturnType<typeof rideHorse>): number => r.duration),
    );

  // 1 and 2. Rigid rides on the slots, apart.
  for (let t: number = 0; t <= end; t += 1 / 24) {
    const at: IAutoMovieVector3[] = rides.map(
      (r: ReturnType<typeof rideHorse>): IAutoMovieVector3 =>
        r.at(t).placement.translation,
    );
    let bad: boolean = false;
    for (const m of squadron.members) {
      const slot: IAutoMovieVector3 = HumanFormation.slot(
        formation,
        m.index,
        0,
      ).at;
      const lead: IAutoMovieVector3 = HumanFormation.slot(formation, 0, 0).at;
      const dx: number = at[m.index]!.x - at[0]!.x - (slot.x - lead.x);
      const dz: number = at[m.index]!.z - at[0]!.z - (slot.z - lead.z);
      if (Math.hypot(dx, dz) > 1e-6) {
        findings.push(
          `horse ${m.index} leaves its offset by ${Math.hypot(dx, dz).toExponential(2)} m at ${t.toFixed(2)} s`,
        );
        bad = true;
        break;
      }
    }
    for (let i: number = 0; i < at.length && !bad; ++i)
      for (let j: number = i + 1; j < at.length; ++j)
        if (Math.hypot(at[i]!.x - at[j]!.x, at[i]!.z - at[j]!.z) < 1.1 - 1e-6) {
          findings.push(
            `horses ${i} and ${j} close to ${Math.hypot(at[i]!.x - at[j]!.x, at[i]!.z - at[j]!.z).toFixed(3)} m at ${t.toFixed(2)} s`,
          );
          bad = true;
          break;
        }
    if (bad) break;
  }

  // 3. Gait changes along one course.
  const changes: number[] = rides.map(
    (r: ReturnType<typeof rideHorse>, i: number): number => {
      const change: { label: string; seconds: number } | undefined =
        r.instants.find((x: { label: string }): boolean =>
          x.label.startsWith("gait:"),
        );
      if (change === undefined) findings.push(`horse ${i} never changes gait`);
      return change?.seconds ?? NaN;
    },
  );
  const strides: number[] = rides.map(
    (r: ReturnType<typeof rideHorse>): number => {
      const on: number[] = r.instants
        .filter((x: { label: string }): boolean => x.label === "leftForeOn")
        .map((x: { seconds: number }): number => x.seconds);
      return on.length < 2
        ? Infinity
        : (on[on.length - 1]! - on[0]!) / (on.length - 1);
    },
  );
  if (Math.max(...changes) - Math.min(...changes) > Math.max(...strides))
    findings.push(
      `the gait changes spread ${(Math.max(...changes) - Math.min(...changes)).toFixed(2)} s, beyond a stride`,
    );

  // 4. Posting at the trot: on the saddle at each of the horse's diagonal footfalls.
  for (const m of squadron.members) {
    const ride: IAutoMovieMotionHumanSegment.ISegment | undefined = performance
      .segments(m.subject)
      .find((s: IAutoMovieMotionHumanSegment.ISegment): boolean => s.name === "ride");
    if (ride === undefined) {
      findings.push(`${m.subject} does not ride`);
      continue;
    }
    if (ride.entryTime > WAIT + 1e-9)
      findings.push(
        `${m.subject} starts riding at ${ride.entryTime.toFixed(2)} s, after its horse sets off at ${WAIT} s`,
      );
    for (const cue of HumanCue.instants(rides[m.index]!, ["rightForeOn"])) {
      const seconds: number = cue.seconds;
      if (seconds < changes[m.index]! || seconds > ride.end) continue;
      const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
        rides[m.index]!.at(0).archetype,
        performance.prop(m.prop("horse"), seconds),
        "seat",
      );
      const hips: IAutoMovieVector3 = performance
        .bones(m.subject, seconds)
        .get("hips")!.worldPosition;
      // The seat is its front edge's middle and its depth behind it, facing `yaw`: the pelvis on the floor plan lies between the edge and the depth, and within 0.15 m of its middle line.
      const radians: number = (seat.yaw * Math.PI) / 180;
      const dx: number = hips.x - seat.at.x;
      const dz: number = hips.z - seat.at.z;
      const along: number = dx * Math.sin(radians) + dz * Math.cos(radians);
      const across: number = dx * Math.cos(radians) - dz * Math.sin(radians);
      if (
        !(along <= 1e-9 && along >= -(seat.depth ?? 0) - 1e-9) ||
        Math.abs(across) > 0.15
      ) {
        findings.push(
          `${m.subject} is off its saddle at the footfall at ${seconds.toFixed(2)} s`,
        );
        break;
      }
    }
  }

  // 5. Seeds.
  const grown: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "sq",
    seed: "squadron",
    count: 7,
    bodies: pool,
    preset: "line",
    places: (i: number) => ({ at: { x: i, y: 0, z: 0 }, yaw: 0 }),
  });
  for (const m of squadron.members)
    if (
      HumanEnsemble.seed(grown, m.index, "horse") !==
      HumanEnsemble.seed(squadron, m.index, "horse")
    )
      findings.push(`adding a member moves ${m.subject}'s horse seed`);
  if (
    JSON.stringify(rides[0]!.at(0).archetype) ===
    JSON.stringify(rides[1]!.at(0).archetype)
  )
    findings.push("two members ride the same horse");

  // 6. Replay.
  const again: {
    rides: ReturnType<typeof rideHorse>[];
    performance: IAutoMovieMotionHumanPerformance;
  } = build();
  for (let t: number = WAIT; t <= end; t += 1)
    if (
      JSON.stringify(again.performance.pose("sq.3", t)) !==
      JSON.stringify(performance.pose("sq.3", t))
    ) {
      findings.push(`sq.3 does not replay at ${t} s`);
      break;
    }
  TestValidator.equals("a cavalry squadron riding its slots", findings, []);
}
