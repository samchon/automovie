import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { createBodyContactWatch } from "@automovie/playground/src/human/bodyContactWatch";
import { TestValidator } from "@nestia/e2e";

/**
 * The editor reads each committed body's skin contact after the author
 * pauses and reports it, unless a newer intent superseded the reading.
 *
 * Scenarios:
 * 1. A current reading with crossings reports each pair in the Check
 *    contacts wording, asks the worker with `measure` on, and disposes the
 *    model it was handed; an empty reading reports that nothing crosses.
 * 2. An intent superseded before the pause ends asks nothing.
 * 3. An intent superseded while the worker reads reports nothing.
 * 4. A failed reading reports its reason while current and nothing once
 *    superseded.
 * 5. A build without a reading reports nothing, and `describe` names it null.
 */
export const test_human_body_contact_watch = async (): Promise<void> => {
  const document: IAutoMovieHumanBodyBasisDocument = {
    id: "b",
    name: "B",
    basis: "basis",
    shape: {},
  };
  let latest = 1;
  const reports: string[] = [];
  const asked: boolean[] = [];
  const disposed: unknown[] = [];
  let reading: () => Promise<{
    crossings?: IAutoMovieModelCrossing[] | null;
  }> = async () => ({
    crossings: [
      {
        part: "chest",
        other: "leftUpperArm",
        triangles: 3,
        otherTriangles: 4,
        coplanar: 0,
      },
      {
        part: "hips",
        other: "hips",
        triangles: 2,
        otherTriangles: 2,
        coplanar: 0,
      },
    ],
  });
  let pending: (() => void) | null = null;
  const watch = createBodyContactWatch({
    build: (_document, measure) => {
      asked.push(measure);
      return reading();
    },
    dispose: (model) => disposed.push(model),
    isCurrent: (ticket) => ticket === latest,
    report: (text) => reports.push(text),
    delayMs: 600,
    schedule: (callback) => {
      pending = callback;
    },
  });
  const fire = (): void => {
    const callback = pending!;
    pending = null;
    callback();
  };

  let done = watch.after(document, 1);
  fire();
  await done;
  TestValidator.equals("a crossing reading is reported", reports, [
    "Crossing segments: chest x leftUpperArm 3/4, hips x hips 2/2",
  ]);
  TestValidator.equals("the worker is asked to measure", asked, [true]);
  TestValidator.equals("the read model is disposed", disposed.length, 1);
  reading = async () => ({ crossings: [] });
  done = watch.after(document, 1);
  fire();
  await done;
  TestValidator.equals(
    "an empty reading says nothing crosses",
    reports[1],
    "No skin segment crosses itself or another in this pose.",
  );

  done = watch.after(document, 1);
  latest = 2;
  fire();
  await done;
  TestValidator.equals(
    "superseded before the pause asks nothing",
    asked.length,
    2,
  );

  let release: () => void = () => undefined;
  reading = () =>
    new Promise((resolve) => {
      release = () => resolve({ crossings: [] });
    });
  done = watch.after(document, 2);
  fire();
  latest = 3;
  release();
  await done;
  TestValidator.equals(
    "superseded while reading reports nothing",
    reports.length,
    2,
  );

  reading = async () => {
    throw new Error("worker lost");
  };
  done = watch.after(document, 3);
  fire();
  await done;
  TestValidator.equals(
    "a current failure is reported",
    reports[2],
    "Contact reading failed: worker lost",
  );
  reading = () =>
    new Promise((resolve, reject) => {
      release = () => reject(new Error("late"));
      void resolve;
    });
  done = watch.after(document, 3);
  fire();
  latest = 4;
  release();
  await done;
  TestValidator.equals("a superseded failure is silent", reports.length, 3);

  reading = async () => ({ crossings: null });
  done = watch.after(document, 4);
  fire();
  await done;
  TestValidator.equals("no reading reports nothing", reports.length, 3);
  TestValidator.equals(
    "describe names no reading null",
    watch.describe(undefined),
    null,
  );
};
