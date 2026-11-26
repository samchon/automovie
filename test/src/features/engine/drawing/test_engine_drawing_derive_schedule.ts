import { AutoMovieEngineDrawing } from "@automovie/engine";
import type {
  IAutoMovieDrawingSchedule,
  IAutoMovieDrawingScheduleRow,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingEnvironment } from "../../internal/drawingFixtures";
import { nclose } from "../../internal/nclose";

/** Rounding of a rounded schedule dimension, metres. */
const DIMENSION: number = 1e-9;

/** The row of a kind, or null. */
const row: (
  schedule: IAutoMovieDrawingSchedule,
  kind: string,
) => IAutoMovieDrawingScheduleRow | null = (
  schedule: IAutoMovieDrawingSchedule,
  kind: string,
): IAutoMovieDrawingScheduleRow | null =>
  schedule.rows.find(
    (entry: IAutoMovieDrawingScheduleRow): boolean => entry.kind === kind,
  ) ?? null;

/**
 * `deriveAutoMovieDrawingSchedule` lists the openings (or the rooms,
 * connectors) of a built environment as rows of one kind, with their size.
 *
 * Scenarios, on the authored atelier whose openings are a rectangular door of
 * 0.9 x 2.1 m, an oculus of two half circles of radius 0.3 m, and a vent that
 * has no outline:
 *
 * 1. The opening schedule names its protocol, environment and subject, and holds 3
 *    openings in 3 rows.
 * 2. The door row is 0.9 wide and 2.1 high, measured from its profile.
 * 3. The oculus row is 0.6 x 0.6 (its circle's extent), from its profile.
 * 4. The vent has no size and is unmeasured.
 * 5. The same environment gives the same digest.
 */
export function test_engine_drawing_derive_schedule(): void {
  const schedule: IAutoMovieDrawingSchedule =
    AutoMovieEngineDrawing.deriveAutoMovieDrawingSchedule({
      environment: drawingEnvironment(),
      subject: "opening",
    });
  TestValidator.equals(
    "the schedule's identity and size",
    [
      schedule.protocol,
      schedule.environment,
      schedule.subject,
      schedule.total,
      schedule.rows.length,
    ],
    ["automovie.drawing-schedule.v1", "atelier", "opening", 3, 3],
  );
  const door: IAutoMovieDrawingScheduleRow | null = row(schedule, "door");
  const window: IAutoMovieDrawingScheduleRow | null = row(schedule, "window");
  const vent: IAutoMovieDrawingScheduleRow | null = row(schedule, "vent");
  TestValidator.predicate(
    "the door",
    door !== null &&
      nclose(door.width ?? Number.NaN, 0.9, DIMENSION) &&
      nclose(door.height ?? Number.NaN, 2.1, DIMENSION) &&
      door.basis === "profile" &&
      door.count === 1,
  );
  TestValidator.predicate(
    "the oculus",
    window !== null &&
      nclose(window.width ?? Number.NaN, 0.6, DIMENSION) &&
      nclose(window.height ?? Number.NaN, 0.6, DIMENSION) &&
      window.basis === "profile",
  );
  TestValidator.predicate(
    "the vent",
    vent !== null &&
      vent.width === null &&
      vent.height === null &&
      vent.basis === "unmeasured",
  );
  TestValidator.equals(
    "a stable digest",
    AutoMovieEngineDrawing.deriveAutoMovieDrawingSchedule({
      environment: drawingEnvironment(),
      subject: "opening",
    }).digest,
    schedule.digest,
  );
}
