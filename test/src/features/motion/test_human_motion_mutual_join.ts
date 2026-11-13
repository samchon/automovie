import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanActionRow,
  HumanChain,
  HumanMutual,
  HumanPerformance,
  type HumanSegment,
  type IHumanActionLaw,
  type IHumanBody,
  type IHumanMutual,
  highFive,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A mutual action is stated once for everyone in it: the cast is joined
 * through its roles, every role plans from one meeting, and it does not
 * matter who is named first.
 *
 * Two people who slap palms do one thing, not two things that happen to
 * coincide: their hands arrive together at one place. So both roles' `meet`
 * falls at one film second, their palms are at one point there, and
 * swapping the roles swaps nothing in the film.
 *
 * Scenarios, the average man and the small woman 0.7 m apart, facing:
 * 1. A high five joined by `HumanChain.mutual`: both roles' `meet` is at
 *    the same film second, and at that second the two right wrists lie
 *    within half of each hand's length of one point, so within the mean of
 *    the two hands' lengths of each other, as two palms laid on one point
 *    leave them.
 * 2. Casting the same two people the other way round shows the same film:
 *    every joint centre of both agrees to the micrometre at five sampled
 *    seconds.
 * 3. The pair surface is the mutual join: `HumanChain.pair(a, b).handshake`
 *    and `HumanChain.mutual(HumanMutual.handshake, ...)` give one
 *    composition.
 * 4. A production's own mutual action over a registered row: a fist bump
 *    as a row of `highFive` with its kind fixed, joined by its own record,
 *    meets like the shipped one (one `meet` second for both).
 * 5. An anchored mutual action anchors each role's action as
 *    `anchor.role`, so a third person's nod synced to `greet.one`'s `meet`
 *    starts its stroke within a 24 Hz frame of it.
 * 6. One person cast in two roles is refused, naming the roles.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Joins chains through the public surface, performs them on real bodies and reads placed instants and displayed joint centres; roles that meet apart, a film that depends on the cast's order, or a join that differs from the pair surface fails.
 * @evidence contracts/development/testing.md#independent-expectations One meeting second and one meeting place follow from what a mutual action is; the order of the cast is compared between two films, and the pair surface against the join, never against stored values.
 * @evidence contracts/development/testing.md#distinguishing-cases A shipped and a production's mutual action, both orders of a cast, two bodies of different stature, a third person syncing to a role, and a wrong cast.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and builds short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 6 scenarios with their bounds.
 */
export function test_human_motion_mutual_join(): void {
  const FRAME: number = 1 / 24;
  const bodies: Readonly<Record<string, IHumanBody>> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
    c: motionHumanBody("m-average"),
  };
  const complaints: string[] = [];
  const fistBump: IHumanActionLaw<Omit<highFive.IParams, "kind">> =
    HumanActionRow.of("fistBump", highFive, { kind: "fist" });
  const bump: IHumanMutual<object, "one" | "other"> = {
    name: "fistBump",
    roles: ["one", "other"],
    act: (role, _params, cast) => ({
      name: "fistBump",
      params: { partner: cast[role === "one" ? "other" : "one"] },
    }),
  };
  const perform = (
    composition: { node: HumanPerformance.IInput["composition"] },
    cast: readonly string[] = ["a", "b"],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "mutual",
      laws: [fistBump],
      performers: cast.map((subject: string) => ({
        subject,
        body: bodies[subject]!,
        // a and b face each other 0.7 m apart; c stands aside.
        at:
          subject === "a"
            ? { x: 0, y: 0, z: 0 }
            : subject === "b"
              ? { x: 0, y: 0, z: 0.7 }
              : { x: 1.5, y: 0, z: 0.35 },
        yaw: subject === "b" ? 180 : 0,
        proficiency: { level: "trained" as const },
      })),
      composition: composition.node,
    });
  const chain = (subject: string): HumanChain =>
    HumanChain.subject(subject).stand({ seconds: 0.3 });
  const instant = (segment: HumanSegment.ISegment, event: string): number =>
    segment.start +
    (segment.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
      segment.plan.duration;
  const joints = (
    performance: HumanPerformance,
    subject: string,
    seconds: number,
  ): IAutoMovieVector3[] =>
    [...performance.bones(subject, seconds).values()].map(
      (bone): IAutoMovieVector3 => bone.worldPosition,
    );
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);

  // 1. One meeting second, one meeting place.
  const slap: HumanPerformance = perform(
    HumanChain.mutual(HumanMutual.highFive, {
      one: chain("a"),
      other: chain("b"),
    }),
  );
  const meets: number[] = ["a", "b"].map((subject: string): number =>
    instant(slap.segments(subject)[1]!, "meet"),
  );
  if (!(Math.abs(meets[0]! - meets[1]!) <= 1e-9))
    complaints.push(
      `the two roles of a high five meet at ${meets[0]!.toFixed(4)} s and ${meets[1]!.toFixed(4)} s, one second expected`,
    );
  const palms: number = gap(
    slap.bones("a", meets[0]!).get("rightHand")!.worldPosition,
    slap.bones("b", meets[0]!).get("rightHand")!.worldPosition,
  );

  // Each wrist is half its hand's length from the palms' meeting point.
  const reach: number = (bodies.a!.measure.hand + bodies.b!.measure.hand) / 2;
  if (!(palms <= reach))
    complaints.push(
      `at their meeting the two right wrists are ${(palms * 1000).toFixed(0)} mm apart, within the mean hand length (${(reach * 1000).toFixed(0)} mm) expected`,
    );

  // 2. Who is named first changes nothing.
  const swapped: HumanPerformance = perform(
    HumanChain.mutual(HumanMutual.highFive, {
      one: chain("b"),
      other: chain("a"),
    }),
    ["b", "a"],
  );
  for (const subject of ["a", "b"])
    for (const share of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const seconds: number = share * slap.duration;
      const there: IAutoMovieVector3[] = joints(swapped, subject, seconds);
      const far: number = Math.max(
        ...joints(slap, subject, seconds).map(
          (p: IAutoMovieVector3, index: number): number =>
            gap(p, there[index]!),
        ),
      );
      if (far > 1e-6) {
        complaints.push(
          `cast the other way round, ${subject} differs by ${(far * 1000).toFixed(3)} mm at ${seconds.toFixed(2)} s`,
        );
        break;
      }
    }

  // 3. The pair surface is the join.
  TestValidator.equals(
    "pair is the mutual join of a handshake",
    HumanChain.pair(chain("a"), chain("b")).handshake({ pumps: 2 }).node,
    HumanChain.mutual(
      HumanMutual.handshake,
      { one: chain("a"), other: chain("b") },
      { pumps: 2 },
    ).node,
  );

  // 4. A production's own mutual action over a registered row.
  const bumped: HumanPerformance = perform(
    HumanChain.mutual(bump, { one: chain("a"), other: chain("b") }),
  );
  const fists: number[] = ["a", "b"].map((subject: string): number =>
    instant(bumped.segments(subject)[1]!, "meet"),
  );
  if (
    bumped.segments("a")[1]!.name !== "fistBump" ||
    !(Math.abs(fists[0]! - fists[1]!) <= 1e-9)
  )
    complaints.push(
      `a registered fist bump joined by its own record: placed as ${bumped.segments("a")[1]!.name}, meeting at ${fists[0]!.toFixed(4)} s and ${fists[1]!.toFixed(4)} s`,
    );

  // 5. A role's action is anchored for others to sync to.
  const watched: HumanPerformance = perform(
    HumanChain.mutual(
      HumanMutual.highFive,
      { one: chain("a"), other: chain("b") },
      {},
      "greet",
    ).with(
      HumanChain.subject("c")
        .stand({ seconds: 5 })
        .gesture({ kind: "nod" })
        .sync({ of: "greet.one", event: "meet", align: "strokeStart" }),
    ),
    ["a", "b", "c"],
  );
  const nodded: number = instant(watched.segments("c")[1]!, "strokeStart");
  const met: number = watched.instant({ of: "greet.one", event: "meet" });
  if (!(Math.abs(nodded - met) <= FRAME))
    complaints.push(
      `a watcher's nod synced to the high five starts its stroke at ${nodded.toFixed(3)} s, within a frame of the meeting at ${met.toFixed(3)} s expected`,
    );

  // 6. One person, two roles.
  let thrown: unknown = null;
  try {
    HumanChain.mutual(HumanMutual.highFive, {
      one: chain("a"),
      other: chain("a"),
    });
  } catch (error) {
    thrown = error;
  }
  if (!(thrown instanceof Error && thrown.message.includes("two roles")))
    complaints.push(
      `one person cast as both roles: expected a refusal naming the roles, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
    );

  TestValidator.equals("a mutual action is one meeting", complaints, []);
}
