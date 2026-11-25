import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPerformanceAim,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanPerception,
  HumanPerformanceAim,
  HumanPerformanceRead,
  HumanRefusal,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../../internal/fixtures/standingPerformanceState";
import { testAffordance } from "../../../internal/fixtures/testAffordance";

/**
 * How far an aimed point or normal may stand from its closed form: products and
 * sums of metre values and a stature, far above their rounding.
 */
const AIM: number = 1e-12;

/**
 * `HumanPerformanceAim.frame` builds a performer's aiming frame, and `aim`
 * places a target: a world point, a point in the performer's frame or in
 * statures, no target at all on a virtual opponent's line, a prop's point, the
 * performer's own region, or another person's region where they were a
 * reaction time earlier.
 *
 * Scenarios, for the standing man aiming from (10, 0, 0) facing yaw 90, `+X`:
 *
 * 1. The frame's lines are the thigh's middle, the chest and the chin, and its
 *    range is the arm's length.
 * 2. A world point is itself, facing back along the heading unless it names a
 *    normal.
 * 3. A performer point (0.5 left, 1 up, 2 forward) is at (12, 1, -0.5), facing
 *    back; one stated in statures is scaled by the stature.
 * 4. No target lies on the chin's line at the arm's length ahead, or at a given
 *    line and range.
 * 5. A cup's rim at (0, 0.1, 0) on the cup at (1, 0, 0) is at (1, 0.1, 0) facing
 *    up.
 * 6. The performer's own region is placed on their own bones; another person's
 *    on that person's bones a reaction time earlier.
 * 7. Refused: an unknown prop, point or region, and an unknown person.
 */
export async function test_unit_motions_perform_aim(): Promise<void> {
  const cup = HumanObject.prop(
    "cup",
    { affordances: [testAffordance("rim", "socket", { x: 0, y: 0.1, z: 0 })] },
    { at: { x: 1, y: 0, z: 0 }, yaw: 0 },
  );
  const { state } = await standingPerformanceState([cup]);
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const body = person.performer.body;
  const m = body.measure;
  const bones = (requested?: ReadonlySet<AutoMovieHumanoidBone>) =>
    HumanPerformanceRead.bones(state, "actor", 0.5, requested);
  const frame: IAutoMovieMotionHumanPerformanceAim.IFrame =
    HumanPerformanceAim.frame(
      body,
      { root: { x: 10, y: 0.9, z: 0 }, yaw: 90 },
      bones,
    );

  // 1. The frame.
  TestValidator.predicate(
    "the aiming frame",
    near1(frame.heights.low, m.hipHeight - m.thigh / 2) &&
      near1(frame.heights.middle, m.chestHeight) &&
      near1(frame.heights.high, (m.neckHeight + m.headHeight) / 2) &&
      near1(frame.range, m.upperArm + m.forearm + m.hand) &&
      frame.subject === undefined &&
      HumanPerformanceAim.frame(body, frame, bones, "actor").subject ===
        "actor",
  );
  const aim = (target: Parameters<typeof HumanPerformanceAim.aim>[1]) =>
    HumanPerformanceAim.aim(state, target, 0.5, frame);

  // 2. World points.
  const world = aim({ kind: "point", frame: "world", at: { x: 1, y: 2, z: 3 } });
  TestValidator.predicate(
    "a world point",
    near(world.point, { x: 1, y: 2, z: 3 }) &&
      near(world.normal, { x: -1, y: 0, z: 0 }) &&
      near(
        aim({
          kind: "point",
          frame: "world",
          at: { x: 1, y: 2, z: 3 },
          normal: { x: 0, y: 2, z: 0 },
        }).normal,
        { x: 0, y: 1, z: 0 },
      ),
  );

  // 3. Performer points.
  const ahead = aim({
    kind: "point",
    frame: "performer",
    at: { x: 0.5, y: 1, z: 2 },
  });
  const tall = aim({
    kind: "point",
    frame: "stature",
    at: { x: 0, y: 0.5, z: 1 },
    normal: { x: 0, y: 0, z: 1 },
  });
  TestValidator.predicate(
    "points in the performer's frame",
    near(ahead.point, { x: 12, y: 1, z: -0.5 }) &&
      near(ahead.normal, { x: -1, y: 0, z: 0 }) &&
      near(tall.point, { x: 10 + m.stature, y: 0.5 * m.stature, z: 0 }) &&
      near(tall.normal, { x: 1, y: 0, z: 0 }),
  );

  // 4. No target.
  const none = aim({ kind: "none" });
  const low = aim({ kind: "none", line: "low", range: 2 });
  TestValidator.predicate(
    "a virtual opponent's line",
    near(none.point, { x: 10 + frame.range, y: frame.heights.middle, z: 0 }) &&
      near(none.normal, { x: -1, y: 0, z: 0 }) &&
      near(low.point, { x: 12, y: frame.heights.low, z: 0 }),
  );

  // 5. A prop's point.
  const rim = aim({ kind: "prop", subject: "cup", point: "rim" });
  TestValidator.predicate(
    "a prop's point",
    near(rim.point, { x: 1, y: 0.1, z: 0 }) &&
      near(rim.normal, { x: 0, y: 1, z: 0 }),
  );

  // 6. Regions.
  const surface = body.surfaces.regions.chin!;
  const own = aim({ kind: "self", region: "chin" });
  const mine = resolveAutoMovieHumanoidSurfaces.place(
    surface,
    bones().get(surface.bone)!,
  );
  const other: IAutoMovieMotionHumanPerformanceState = {
    ...state,
    people: new Map([
      ["actor", person],
      [
        "other",
        { ...person, performer: { ...person.performer, subject: "other" } },
      ],
    ]),
  };
  const theirs = HumanPerformanceAim.aim(
    other,
    { kind: "person", subject: "other", region: "chin" },
    0.5,
    frame,
  );
  const earlier = resolveAutoMovieHumanoidSurfaces.place(
    surface,
    HumanPerformanceRead.bones(
      other,
      "other",
      0.5 - HumanPerception.REACTION,
    ).get(surface.bone)!,
  );
  const selfNamed = HumanPerformanceAim.aim(
    other,
    { kind: "person", subject: "actor", region: "chin" },
    0.5,
    { ...frame, subject: "actor" },
  );
  TestValidator.predicate(
    "regions on bodies",
    near(own.point, mine.point) &&
      near(own.normal, mine.normal) &&
      near(theirs.point, earlier.point) &&
      near(theirs.normal, earlier.normal) &&
      near(selfNamed.point, mine.point),
  );

  // 7. Refusals.
  TestValidator.predicate(
    "refused targets",
    refused(() => aim({ kind: "prop", subject: "mug", point: "rim" }), "prop") &&
      refused(
        () => aim({ kind: "prop", subject: "cup", point: "lid" }),
        "target",
      ) &&
      refused(
        () => aim({ kind: "person", subject: "ghost", region: "chin" }),
        "performer",
      ),
  );
}

/** Whether a length is the expected one. */
function near1(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= AIM;
}

/** Whether two points agree within the aim bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return near1(a.x, b.x) && near1(a.y, b.y) && near1(a.z, b.z);
}

/** Whether a task refuses on the axis. */
function refused(task: () => unknown, axis: string): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return error instanceof HumanRefusal && error.axis === axis;
  }
}
