import { stageScene } from "@automovie/engine";
import type { IAutoMovieCameraClearanceEnvelope } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceStageInputs } from "./IFilmCameraClearanceStageInputs";
import { makeScriptWrite } from "./filmFixtures";

/** Run the original nested staging envelope and author-alias boundary assertions. */
export function assertFilmCameraClearanceStage(
  input: IFilmCameraClearanceStageInputs,
): void {
  const { envelope, stageWithClearance } = input;
  const authored = stageWithClearance(envelope());
  const staged = stageScene(makeScriptWrite(), authored);
  TestValidator.equals("valid stage envelope lowers", staged.success, true);
  if (staged.success === true) {
    authored.cameras[0]!.clearance!.body.center.x = 99;
    TestValidator.equals(
      "resolved envelope does not alias author input",
      staged.scene.cameras[0]!.clearance!.body.center.x,
      0,
    );
  }
  const malformed = [
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
  ].map((clearance) =>
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
      (result) =>
        result.success === false &&
        result.violations.some((item) => item.path.includes(".clearance")),
    ),
  );
}
