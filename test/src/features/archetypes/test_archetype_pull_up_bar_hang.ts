import { createPullUpBar } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSportWorkout,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every hanging exercise hangs from the bar placed in the scene and from nothing else: a dead hang, a pull-up, a chin-up, a hanging knee raise and a bar swing each name a gym's pull-up bar (`createPullUpBar`) by its `bar`, and the hands hold that bar.
 *
 * The bar stands 0.3 m ahead of the performer, along `X`; each row is done once from standing.
 *
 * Scenarios, on the average man and the small woman, for each hanging row:
 * 1. The row plans; at the middle of the act both grip sockets lie within 50 mm (provisional: the bar's radius and the socket's own offset in the closed hand) of the bar's axis, and both ankles stand more than 50 mm above their standing height (the feet clear the floor).
 * 2. The same row naming no bar is refused on `on`: no bar is imagined above the standing reach.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each hang through the public chain on the real bar and reads the displayed grip sockets and ankles; hands off the bar, feet left on the floor or a hang from no bar fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The bar's axis is the archetype's own contact carried by the placement; the 50 mm bounds are stated provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Five hanging rows, with and without a bar, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and twenty short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 2 scenarios with their bounds.
 */
export function test_archetype_pull_up_bar_hang(): void {
  const bar: ReturnType<typeof createPullUpBar> = createPullUpBar({
    kind: "gym",
  });
  const placed: IAutoMovieVector3 = { x: 0, y: 0, z: 0.3 };
  const axis: IAutoMovieVector3 = Vector3.add(
    placed,
    bar.affordance("bar").frame.translation,
  );
  const rows: readonly IHumanActionLaw<never>[] = [
    HumanSportWorkout.deadHang,
    HumanSportWorkout.pullUp,
    HumanSportWorkout.chinUp,
    HumanSportWorkout.kneeRaise,
    HumanSportWorkout.barSwing,
  ];
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const row of rows) {
      const label: string = `${name} ${row.name}`;
      const perform = (hung: boolean): HumanPerformance =>
        new HumanPerformance({
          seed: "hang",
          laws: [...rows],
          props: [HumanObject.prop("bar", bar, { at: placed, yaw: 0 })],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(row.name, {
              reps: 1,
              hold: 1,
              ...(hung ? { on: { prop: "bar", affordance: "bar" } } : {}),
            }).node,
        });

      // 1. It hangs from the bar.
      let film: HumanPerformance;
      try {
        film = perform(true);
      } catch (error) {
        complaints.push(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const act: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row.name)!;
      const middle: number = (act.start + act.end) / 2;
      const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
        "a",
        middle,
      );
      for (const socket of [
        body.surfaces.sockets.gripLeft,
        body.surfaces.sockets.gripRight,
      ]) {
        const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          socket,
          bones.get(socket.bone)!,
        ).point;
        const off: number = Math.hypot(at.y - axis.y, at.z - axis.z);
        if (!(off <= 0.05))
          complaints.push(
            `${label}: the ${socket.bone} grip lies ${mm(off)} mm off the bar's axis at the act's middle, within 50 mm expected`,
          );
      }
      for (const bone of ["leftFoot", "rightFoot"] as const) {
        const ankle: number = bones.get(bone)!.worldPosition.y;
        if (!(ankle > 0.05 + body.measure.ankleHeight))
          complaints.push(
            `${label}: the ${bone} stands ${mm(ankle - body.measure.ankleHeight)} mm above its standing height at the act's middle, clear of the floor expected`,
          );
      }

      // 2. No bar, no hang.
      try {
        perform(false);
        complaints.push(`${label}: a hang from no bar was planned`);
      } catch (error) {
        if (!(error instanceof HumanRefusal) || error.axis !== "on")
          complaints.push(
            `${label}: a hang from no bar failed with ${error instanceof Error ? error.message : String(error)}, a refusal on on expected`,
          );
      }
    }
  }
  TestValidator.equals(
    "a hanging exercise hangs from the placed bar",
    complaints,
    [],
  );
}
