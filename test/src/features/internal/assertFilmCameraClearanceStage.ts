import { stageScene } from "@automovie/engine";
import type { IAutoMovieCameraClearanceEnvelope, IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceStageInputs } from "./IFilmCameraClearanceStageInputs";
import { makeScriptWrite } from "./filmFixtures";
import { nclose } from "./nclose";

/** Run the original nested staging envelope and author-alias boundary assertions. */
export function assertFilmCameraClearanceStage(
  input: IFilmCameraClearanceStageInputs,
): void {
  const { envelope, stageWithClearance }: IFilmCameraClearanceStageInputs = input;
  const authored: ReturnType<typeof stageWithClearance> = stageWithClearance(envelope());
  const staged: ReturnType<typeof stageScene> = stageScene(makeScriptWrite(), authored);
  TestValidator.equals("valid stage envelope lowers", staged.success, true);
  if (staged.success === true) {
    authored.cameras[0]!.clearance!.body.center.x = 99;
    TestValidator.predicate(
      "resolved envelope does not alias author input",
      nclose(staged.scene.cameras[0]!.clearance!.body.center.x, 0, 0),
    );
  }
  const malformed: ReturnType<typeof stageScene>[] = [
    null,
    { body: null, parentRig: null },
    { body: { center: [], radius: 0.1 }, parentRig: null },
    {
      body: { center: { x: Number.NaN, y: 0, z: 0 }, radius: 0.1 },
      parentRig: null,
    },
    {
      body: { center: { x: 0, y: 0, z: 0 }, radius: 0 },
      parentRig: null,
    },
    { body: { center: { x: 0, y: 0, z: 0 }, radius: 0.1 } },
    {
      body: { center: { x: 0, y: 0, z: 0 }, radius: 0.1 },
      parentRig: { center: { x: 0, y: Infinity, z: 0 }, radius: -1 },
    },
  ].map((clearance: unknown): ReturnType<typeof stageScene> =>
    stageScene(
      makeScriptWrite(),
      stageWithClearance(
        clearance as unknown as IAutoMovieCameraClearanceEnvelope,
      ),
    ),
  );
  TestValidator.predicate(
    "every malformed envelope is refused at its clearance member",
    malformed.every(
      (result: ReturnType<typeof stageScene>): boolean =>
        result.success === false &&
        result.violations.some((item: IAutoMovieConstraintViolation): boolean => item.path.includes(".clearance")),
    ),
  );
}
