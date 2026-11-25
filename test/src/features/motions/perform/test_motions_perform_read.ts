import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleContext,
} from "@automovie/interface";
import {
  HumanPerformanceHold,
  HumanPerformanceRead,
  HumanRefusal,
  HumanSegment,
  readPlacedHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * `HumanPerformanceRead` reads a performance: a person and their placed
 * actions, pose, posture, bones, hand and root, a prop's frame, and, for a
 * law's read of another performer while the schedule is resolved, the second
 * they may be read at (`when`), with their waiting part placed on demand
 * (`placeDemandedHumanPerformer`) or the read refused.
 *
 * The standing actor's two actions end at 1 and 2 s; three of their intents are
 * composed, so one still waits.
 *
 * Scenarios:
 *
 * 1. An unknown person is refused, offering the people.
 * 2. Segments and overlays are the person's own; the pose is the displayed one;
 *    bones read on request keep the full read's places; prepared bones read the
 *    same; the hand is the grip socket's; the root and projectile root are the
 *    placed posture's.
 * 3. A prop's frame is the hold's where no line holds it.
 * 4. Not resolving, any second is read as asked; resolving, a second within the
 *    placed actions is.
 * 5. Resolving past them, with nothing to place the waiting part, the read is
 *    refused on the reader's axis, offering up to 2 s.
 * 6. Up to the waiting part's start (the horizon, 5 s) the read holds the last
 *    placed pose: 4 s is read at 4 s, nothing demanded.
 * 7. A demand that places the part is asked once, and the read proceeds.
 * 8. A demand that finds a cycle refuses the read, unless the person is the
 *    reader's partner, who is then read no later than their placed actions'
 *    end: 2 s.
 */
export async function test_motions_perform_read(): Promise<void> {
  const { state } = await standingPerformanceState();
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const ended = (end: number, index: number): IAutoMovieMotionHumanSegment => ({
    ...person.segments[index]!,
    end,
  });
  const intent: IAutoMovieIntent = { subject: "actor", capability: "stand" };
  const resolving = (
    context: Partial<
      Pick<IAutoMovieScheduleContext, "demand" | "horizon">
    > = {},
  ): IAutoMovieMotionHumanPerformanceState => {
    const self: IAutoMovieMotionHumanPerformanceState = {
      ...state,
      people: new Map([
        ["actor", { ...person, segments: [ended(1, 0), ended(2, 1)] }],
      ]),
      intended: new Map([["actor", [intent, intent, intent]]]),
      resolving: true,
      demand: undefined,
      horizon: undefined,
    };
    self.demand = context.demand;
    self.horizon = context.horizon;
    return self;
  };
  const axis = (): string => "partner";

  // 1. Unknown people.
  TestValidator.predicate(
    "an unknown person",
    refused(
      () => HumanPerformanceRead.person(state, "ghost"),
      (error: HumanRefusal): boolean =>
        error.kind === "participant" &&
        error.feasible?.kind === "alternatives" &&
        error.feasible.values.join() === "actor",
    ),
  );

  // 2. A person's reads.
  const pose = HumanPerformanceRead.pose(state, "actor", 0.5);
  const full = HumanPerformanceRead.bones(state, "actor", 0.5);
  const some = HumanPerformanceRead.bones(
    state,
    "actor",
    0.5,
    new Set(["head"]),
  );
  const prepared = HumanPerformanceRead.prepareBones(
    state,
    "actor",
    new Set(["head"]),
  )(0.5);
  const socket = person.performer.body.surfaces.sockets.gripRight;
  const placed = readPlacedHumanPosture(person, 0.5);
  TestValidator.predicate(
    "a person's reads",
    HumanPerformanceRead.segments(state, "actor") === person.segments &&
      HumanPerformanceRead.overlays(state, "actor") === person.overlays &&
      JSON.stringify(pose) ===
        JSON.stringify(HumanSegment.displayed(person, 0.5)) &&
      some.has("head") &&
      JSON.stringify(some.get("head")) === JSON.stringify(full.get("head")) &&
      JSON.stringify(prepared.get("head")) ===
        JSON.stringify(full.get("head")) &&
      HumanPerformanceRead.hand(state, "actor", "right", 0.5).rotation.w ===
        full.get(socket.bone)!.worldRotation.w &&
      JSON.stringify(
        HumanPerformanceRead.root(state, "actor", 0.5, axis).position,
      ) === JSON.stringify(placed.root) &&
      HumanPerformanceRead.root(state, "actor", 0.5, axis).yaw === placed.yaw &&
      JSON.stringify(HumanPerformanceRead.projectileRoot(state, "actor", 0.5)) ===
        JSON.stringify(placed.root),
  );

  // 3. A prop.
  TestValidator.predicate(
    "a prop without a line",
    refused(
      () => HumanPerformanceRead.prop(state, "cup", 0.5),
      (error: HumanRefusal): boolean => error.kind === "affordance",
    ) &&
      refused(
        () => HumanPerformanceHold.prop(state, "cup", 0.5),
        (error: HumanRefusal): boolean => error.kind === "affordance",
      ),
  );

  // 4. Placed seconds.
  TestValidator.predicate(
    "seconds read as asked",
    HumanPerformanceRead.when(state, "actor", 9, axis) === 9 &&
      HumanPerformanceRead.when(resolving(), "actor", 1.5, axis) === 1.5,
  );

  // 5. Unknown future.
  TestValidator.predicate(
    "a future not placed yet",
    refused(
      () => HumanPerformanceRead.when(resolving(), "actor", 4, axis),
      (error: HumanRefusal): boolean =>
        error.axis === "partner" &&
        error.kind === "participant" &&
        error.feasible?.kind === "range" &&
        error.feasible.maximum === 2,
    ),
  );

  // 6. The horizon.
  let asked: number = 0;
  TestValidator.equals(
    "held to the waiting part's start",
    HumanPerformanceRead.when(
      resolving({
        horizon: (): number => 5,
        demand: (): IAutoMovieScheduleContext.Demand => {
          ++asked;
          return "none";
        },
      }),
      "actor",
      4,
      axis,
    ),
    4,
  );
  TestValidator.equals("nothing demanded", asked, 0);

  // 7. Placed on demand.
  const growing: IAutoMovieMotionHumanPerformanceState = resolving();
  growing.demand = (): IAutoMovieScheduleContext.Demand => {
    ++asked;
    growing.people.get("actor")!.segments.push(ended(6, 0));
    return "placed";
  };
  TestValidator.equals(
    "the waiting part placed",
    HumanPerformanceRead.when(growing, "actor", 4, axis),
    4,
  );
  TestValidator.equals("asked once", asked, 1);

  // 8. A cycle.
  const cycle = (): IAutoMovieScheduleContext.Demand => "cycle";
  TestValidator.predicate(
    "a cycle of reads",
    refused(
      () =>
        HumanPerformanceRead.when(resolving({ demand: cycle }), "actor", 4, axis),
      (error: HumanRefusal): boolean =>
        error.axis === "partner" && error.feasible === null,
    ) &&
      HumanPerformanceRead.when(
        resolving({ demand: cycle }),
        "actor",
        4,
        axis,
        1.5,
      ) === 2,
  );
}

/** Whether a task throws a refusal the check accepts. */
function refused(
  task: () => unknown,
  check: (error: HumanRefusal) => boolean,
): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return error instanceof HumanRefusal && check(error);
  }
}
