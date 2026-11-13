import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanEntryState,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A law that plans from another person's path reads, while it plans, where
 * that person will be at any later second, so a follower, an escort or an
 * interception aims at where the other walks to and not at where they stood.
 *
 * The reading is a registered law that stands for two seconds and, while it
 * plans, asks for the leader's root at a list of film seconds
 * (`context.performer(subject).root(seconds)`). What it was told is compared
 * with where the finished film shows the leader.
 *
 * Scenarios, the small woman as leader `b` walking 4 m from 3 m ahead, the
 * average man as `a` reading her, and the reverse pair:
 * 1. At every half second of the leader's walk, the root read while planning
 *    lies within 0.05 of her stature, on the floor plan, of her displayed
 *    pelvis joint at that second: the root is the point the laws place the
 *    body by, which a body carries within its pelvis.
 * 2. The readings move with her: the last lies at least 3.5 m ahead of the
 *    first along the walk, where a reading taken once would not move.
 * 3. Before her walk begins the reading is within 0.1 m of her starting
 *    place (the pelvis stands over the feet, not on the floor point), and
 *    ten seconds after her last action it is where the walk ended, within
 *    the same share of the displayed pelvis at the film's end.
 * 4. Composed the other way round, the reader before the leader, the same
 *    reading is a `participant` refusal located on the reader, whose fix
 *    says to compose the leader first; the first composition is that fix,
 *    and it plans.
 * 5. A person who performs nothing is read at any second without a refusal:
 *    no action of theirs is still to be placed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs both compositions through the public chain with a registered law as the reader, and compares what the law was told at plan time with the displayed joints of the finished film; a reading frozen at one instant, one that reads an unplaced path silently, or a refusal for a person with nothing left to place fails.
 * @evidence contracts/development/testing.md#independent-expectations The displayed pelvis joint comes from the pose pipeline (`HumanSignature.joint`), not from the root query; 0.05 of the stature (74 to 88 mm on these bodies) is about a fifth of the pelvis' breadth and a tenth of one step, so a reading taken at another instant of a walk fails, and 3.5 m is the walk's 4 m less its start and stop. Measured on the first valid run: the root lies 36 to 42 mm from the pelvis joint standing and 65 to 77 mm walking, steady through the walk, so the root is not the pelvis joint itself and the bound is stated on the body, not as 5 cm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two orders of two builds; seconds before, during and after the leader's actions; the two composition orders; a person with no action. How a follow uses the reading is the travel family's test.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how it is read and the 5 scenarios with their bounds.
 */
export function test_human_motion_core_placed_path(): void {
  const complaints: string[] = [];

  // How far the planned root may lie from the displayed pelvis joint on the
  // floor plan, as a share of the stature: the root is the point the laws
  // place a body by, carried within the pelvis' own extent.
  const NEAR: number = 0.05;
  const SECONDS: readonly number[] = [
    0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 15,
  ];

  // A law that keeps the posture it is entered in and records what it is
  // told of another person while it plans.
  const reader = (
    seen: Map<number, IHumanActionContext.IRoot>,
  ): IHumanActionLaw<{ of: string }> => ({
    name: "reader",
    interrupts: {},
    plan: (context: IHumanActionContext<{ of: string }>): IHumanActionPlan => {
      for (const seconds of SECONDS)
        seen.set(
          seconds,
          context.performer(context.params.of).root(seconds),
        );
      return {
        duration: 2,
        events: [],
        contacts: context.entry.supports.map(
          (
            support: IHumanEntryState.ISupport,
          ): IHumanActionPlan["contacts"][number] => ({
            ...support,
            from: 0,
            to: 1,
          }),
        ),
        posture: (): ReturnType<IHumanActionPlan["posture"]> =>
          context.entry.posture,
      };
    },
  });

  for (const names of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${names[0]} reading ${names[1]}`;
    const bodies: Record<"a" | "b" | "c", IHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
      c: motionHumanBody(names[1]),
    };
    const perform = (
      seen: Map<number, IHumanActionContext.IRoot>,
      composition: { node: HumanChain["node"] },
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "path",
        laws: [reader(seen) as IHumanActionLaw<never>],
        performers: (["a", "b", "c"] as const).map(
          (subject: "a" | "b" | "c", index: number) => ({
            subject,
            body: bodies[subject],
            at: { x: subject === "c" ? 2 : 0, y: 0, z: index === 1 ? 3 : 0 },
            yaw: 0,
            proficiency: { level: "trained" as const },
          }),
        ),
        composition: composition.node,
      });
    const leading = (): HumanChain =>
      HumanChain.subject("b")
        .stand({ seconds: 0.5 })
        .walk({ to: { x: 0, y: 0, z: 7 } });
    const reading = (of: string): HumanChain =>
      HumanChain.subject("a").registered("reader", { of });

    // 1 to 3. The leader composed first.
    const seen: Map<number, IHumanActionContext.IRoot> = new Map();
    let film: HumanPerformance;
    try {
      film = perform(seen, leading().with(reading("b")));
    } catch (error) {
      complaints.push(
        `${label}: the leader composed first: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const shown: HumanSignature.IReader = HumanSignature.of(
      film,
      "b",
      bodies.b,
      0,
    );
    const hips = (seconds: number): IAutoMovieVector3 =>
      HumanSignature.joint(shown, seconds, "hips");
    const walked: number = film.segments("b").at(-1)!.end;
    for (const seconds of SECONDS) {
      const told: IHumanActionContext.IRoot | undefined = seen.get(seconds);
      if (told === undefined) {
        complaints.push(`${label}: nothing was read at ${seconds} s`);
        continue;
      }
      const at: IAutoMovieVector3 = hips(Math.min(seconds, walked));
      const off: number = Math.hypot(
        told.position.x - at.x,
        told.position.z - at.z,
      );
      if (off > NEAR * bodies.b.measure.stature)
        complaints.push(
          `${label}: at ${seconds} s the root read while planning lies ${(off * 1000).toFixed(1)} mm from the displayed pelvis on the floor plan, within ${(NEAR * bodies.b.measure.stature * 1000).toFixed(1)} mm (${NEAR} of the stature) expected`,
        );
    }
    const first: IHumanActionContext.IRoot | undefined = seen.get(0);
    const last: IHumanActionContext.IRoot | undefined = seen.get(15);
    if (first !== undefined && last !== undefined) {
      if (last.position.z - first.position.z < 3.5)
        complaints.push(
          `${label}: the readings move ${(last.position.z - first.position.z).toFixed(3)} m along the leader's 4 m walk, at least 3.5 m expected`,
        );
      if (Math.hypot(first.position.x, first.position.z - 3) > 0.1)
        complaints.push(
          `${label}: before the walk the reading is (${first.position.x.toFixed(3)}, ${first.position.z.toFixed(3)}), within 0.1 m of the starting place (0, 3) expected`,
        );
    }

    // 4. The reader composed before the leader.
    let thrown: unknown = null;
    try {
      perform(new Map(), reading("b").with(leading()));
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "participant" &&
        thrown.performer === "a" &&
        thrown.act === "reader" &&
        thrown.value === "b" &&
        thrown.fix.includes("before")
      )
    )
      complaints.push(
        `${label}: the reader composed before the leader: expected a participant refusal located on a.reader naming b, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );

    // 5. A person with nothing to place.
    try {
      const idle: Map<number, IHumanActionContext.IRoot> = new Map();
      perform(idle, reading("c").with(leading()));
      const starts: IHumanActionContext.IRoot | undefined = idle.get(0);
      const stays: IHumanActionContext.IRoot | undefined = idle.get(15);
      if (
        starts === undefined ||
        stays === undefined ||
        Math.hypot(starts.position.x - 2, starts.position.z) > 0.1 ||
        Math.hypot(
          stays.position.x - starts.position.x,
          stays.position.z - starts.position.z,
        ) > 1e-9
      )
        complaints.push(
          `${label}: a person who performs nothing is read at (${starts?.position.x}, ${starts?.position.z}) at 0 s and (${stays?.position.x}, ${stays?.position.z}) at 15 s; within 0.1 m of the starting place (2, 0) and unmoved expected`,
        );
    } catch (error) {
      complaints.push(
        `${label}: reading a person who performs nothing: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals(
    "another person's placed path is read while planning",
    complaints,
    [],
  );
}
