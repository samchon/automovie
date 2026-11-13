import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanFrame,
  HumanPerformance,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Each pursuit ends where its name says, relative to the person pursued: a
 * follower behind them at a social distance, an escort at their left within
 * personal distance, a chaser within arm's length, and a confronter face to
 * face.
 *
 * The distance between two people is read as Hall reads it, chest to chest:
 * the horizontal gap from the front of the arriving chest (the sternum
 * region) to the other's sternum. The side is read in the standing person's
 * own frame, where their front is their heading.
 *
 * Scenarios, the average man pursuing the small woman and the reverse; the
 * pursued stands 3.5 m away, turned 40 degrees from the line between them:
 * 1. `follow` ends behind the person (within 30 degrees of straight behind
 *    them) with the chests 1.2 to 2.1 m apart, the close phase of Hall's
 *    social distance (Hall 1966).
 * 2. `escort` ends at the person's left (within 30 degrees of straight to
 *    their left) with the chests 0.75 to 1.2 m apart, the far phase of
 *    personal distance.
 * 3. `chase` ends with the chests inside personal distance, 0.45 to 1.2 m,
 *    and no further apart than the two people's arms together reach
 *    (upper arm, forearm and hand of each), so a grab can follow.
 * 4. `confront` ends in front of the person (within 30 degrees of straight
 *    ahead of them) with the chests 0.45 to 0.75 m apart, the close phase
 *    of personal distance.
 * 5. Every pursuit ends facing the person's sternum, the point the gap is
 *    measured to, within 5 degrees (the approach's acceptance), standing
 *    with both feet bearing.
 * 6. On the way, sampled four times a second, the two bodies never overlap
 *    by more than 10 mm (the campaign's penetration bound): a place behind
 *    the person is reached round them, not through them.
 * 7. `flee` of 5 m from a person standing 2.2 m away, behind and to one
 *    side: the pelvis ends 5 m further from them within 0.1 m (the distance
 *    asked), having run within 5 degrees of the line straight away from
 *    them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the pursuit rows through the public input, performs each toward a standing person and reads both displayed bodies at its end; a pursuer on the wrong side, too near, too far or facing away fails.
 * @evidence contracts/development/testing.md#independent-expectations The bands are Hall's zones and phases, and the arm's reach is the bodies' own measures; none is read from the proxemics table under test. The 30 degree sector is a provisional reading of "behind", "left" and "front". A pursuer stopped on the line of approach, at another band or with the back turned reads outside its sector, band or facing. Limitation: the person pursued stands still, so following someone who walks is another test's.
 * @evidence contracts/development/testing.md#distinguishing-cases Four pursuits on four sides and four bands, the two orders of a tall and a short person, and a target turned off the line so that a side and the line of approach differ.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds eight short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States how distance and side are read and the 7 scenarios with their bounds and sources.
 */
export function test_human_motion_travel_pursuit(): void {
  const complaints: string[] = [];
  const FACING: number = 220;
  const rows: readonly {
    name: string;
    band: readonly [number, number];
    side: number | null;
  }[] = [
    { name: "follow", band: [1.2, 2.1], side: 180 },
    { name: "escort", band: [0.75, 1.2], side: 90 },
    { name: "chase", band: [0.45, 1.2], side: null },
    { name: "confront", band: [0.45, 0.75], side: 0 },
  ];
  for (const names of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const bodies: readonly [IHumanBody, IHumanBody] = [
      motionHumanBody(names[0]),
      motionHumanBody(names[1]),
    ];
    const arms: number = bodies
      .map(
        (b: IHumanBody): number =>
          b.measure.upperArm + b.measure.forearm + b.measure.hand,
      )
      .reduce((sum: number, arm: number): number => sum + arm, 0);
    for (const row of rows) {
      const label: string = `${names[0]} in ${row.name} of ${names[1]}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "pursuit",
          laws: [...HUMAN_LEXICON.pursuit!],
          performers: [
            {
              subject: "a",
              body: bodies[0],
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
            {
              subject: "b",
              body: bodies[1],
              at: { x: 0, y: 0, z: 3.5 },
              yaw: FACING,
              proficiency: { level: "trained" },
            },
          ],

          // The person pursued is composed first: a pursuit reads where they go.
          composition: HumanChain.subject("b")
            .stand({ seconds: 0.3 })
            .with(
              HumanChain.subject("a")
                .stand({ seconds: 0.3 })
                .registered(row.name, {
                  target: { kind: "person", subject: "b", region: "sternum" },
                }),
            ).node,
        });
      } catch (error) {
        complaints.push(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const end: number = performance.segments("a")[1]!.end;
      const a: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        bodies[0],
        0,
      );
      const b: HumanSignature.IReader = HumanSignature.of(
        performance,
        "b",
        bodies[1],
        FACING,
      );
      const mine: IAutoMovieVector3 = HumanSignature.region(a, "sternum", end);
      const theirs: IAutoMovieVector3 = HumanSignature.region(
        b,
        "sternum",
        end,
      );

      // The chest-to-chest gap, inside the row's band.
      const gap: number = Math.hypot(mine.x - theirs.x, mine.z - theirs.z);
      if (gap < row.band[0] || gap > row.band[1])
        complaints.push(
          `${label}: the chests end ${gap.toFixed(3)} m apart, ${row.band[0]} to ${row.band[1]} m expected`,
        );
      if (row.side === null && gap > arms)
        complaints.push(
          `${label}: the chests end ${gap.toFixed(3)} m apart, beyond the two arms' ${arms.toFixed(3)} m`,
        );

      // The side, in the pursued person's frame: 0 ahead of them, 90 at their left, 180 behind.
      const hips = (reader: HumanSignature.IReader): IAutoMovieVector3 => {
        const l: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          end,
          "leftUpperLeg",
        );
        const r: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          end,
          "rightUpperLeg",
        );
        return { x: (l.x + r.x) / 2, y: 0, z: (l.z + r.z) / 2 };
      };
      const stood: IAutoMovieVector3 = hips(b);
      const local: IAutoMovieVector3 = HumanFrame.local(
        { origin: stood, yaw: FACING },
        hips(a),
      );
      if (row.side !== null) {
        const bearing: number = (Math.atan2(local.x, local.z) * 180) / Math.PI;
        const off: number = Math.abs(((bearing - row.side + 540) % 360) - 180);
        if (off > 30)
          complaints.push(
            `${label}: ends ${bearing.toFixed(0)} degrees round the person from their front, within 30 of ${row.side} expected`,
          );
      }

      // 5. Facing the person, standing.
      const here: IAutoMovieVector3 = hips(a);
      const toward: number =
        (Math.atan2(theirs.x - here.x, theirs.z - here.z) * 180) / Math.PI;
      const faces: number = performance.posture("a", end).yaw;
      const turned: number = Math.abs(((faces - toward + 540) % 360) - 180);
      if (turned > 5)
        complaints.push(
          `${label}: ends facing ${turned.toFixed(1)} degrees off the person, within 5 expected`,
        );
      for (const side of ["left", "right"] as const)
        if (!HumanSignature.bears(a, end, side))
          complaints.push(
            `${label}: the ${side} foot does not bear at the end`,
          );

      // 6. Round the person, never through them.
      let nearest: number = Infinity;
      let when: number = 0;
      for (const t of HumanSignature.times(0.3, end, 4)) {
        const apart: number = HumanSignature.apart(a, b, t);
        if (apart < nearest) {
          nearest = apart;
          when = t;
        }
      }
      if (nearest < -0.01)
        complaints.push(
          `${label}: the bodies overlap by ${(-nearest * 1000).toFixed(1)} mm at ${when.toFixed(2)} s, at most 10 mm expected`,
        );
    }
  }

  // 7. A flight ends further from the person by the distance asked, straight away from them.
  for (const names of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${names[0]} fleeing ${names[1]}`;
    const bodies: readonly [IHumanBody, IHumanBody] = [
      motionHumanBody(names[0]),
      motionHumanBody(names[1]),
    ];
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "pursuit",
        laws: [...HUMAN_LEXICON.pursuit!],
        performers: [
          {
            subject: "a",
            body: bodies[0],
            at: { x: 0, y: 0, z: 0 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: bodies[1],
            at: { x: 1, y: 0, z: -2 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("b")
          .stand({ seconds: 0.3 })
          .with(
            HumanChain.subject("a")
              .stand({ seconds: 0.3 })
              .registered("flee", { from: "b", metres: 5 }),
          ).node,
      });
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const end: number = performance.segments("a")[1]!.end;
    const a: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      bodies[0],
      0,
    );
    const pelvis = (t: number): IAutoMovieVector3 => {
      const l: IAutoMovieVector3 = HumanSignature.joint(a, t, "leftUpperLeg");
      const r: IAutoMovieVector3 = HumanSignature.joint(a, t, "rightUpperLeg");
      return { x: (l.x + r.x) / 2, y: 0, z: (l.z + r.z) / 2 };
    };
    const from: IAutoMovieVector3 = pelvis(0.3);
    const to: IAutoMovieVector3 = pelvis(end);
    const gained: number =
      Math.hypot(to.x - 1, to.z + 2) - Math.hypot(from.x - 1, from.z + 2);
    if (Math.abs(gained - 5) > 0.1)
      complaints.push(
        `${label}: ends ${gained.toFixed(3)} m further from the person, 5 m within 0.1 expected`,
      );
    const ran: number = (Math.atan2(to.x - from.x, to.z - from.z) * 180) / Math.PI;
    const straight: number =
      (Math.atan2(from.x - 1, from.z + 2) * 180) / Math.PI;
    const off: number = Math.abs(((ran - straight + 540) % 360) - 180);
    if (off > 5)
      complaints.push(
        `${label}: runs ${off.toFixed(1)} degrees off the line straight away from the person, within 5 expected`,
      );
  }
  TestValidator.equals("each pursuit ends at its place", complaints, []);
}
