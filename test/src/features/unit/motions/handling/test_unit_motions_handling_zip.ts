import { createZipperPouch } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanZip,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanRefusal, zip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/** The pouch's zip travel from its closed stop to its open stop, metres. */
const STROKE: number = 0.18;

/**
 * `zip.plan` admits a pouch's zipper action before any hand is moved: a brace
 * that is not a declared site of the pouch, a brace or an index on the pinching
 * thumb's site, and a travel past either stop are refused, each naming what
 * fails.
 *
 * Scenario, the average man standing at the origin facing +Z, the stock zipper
 * pouch held fixed and turned to face him a forearm ahead of his right
 * shoulder: a missing brace, the brace or the index on the thumb's site, and a
 * travel of 0.181 m or of -0.001 m past the 0.18 m stroke are each refused,
 * naming the brace, the opposing digits or the stop.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_zip(): Promise<void> {
  // Plans the pinching and the bracing hand on the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const pouch: IAutoMovieMotionHumanProp = HumanObject.prop(
    "pouch",
    createZipperPouch(),
    {
      position: Vector3.create(
        0,
        body.measure.shoulderHeight - 0.75 * body.measure.upperArm - 0.129,
        shoulder.z + 0.82 * body.measure.forearm,
      ),
      rotation: Quaternion.fromAxisAngle(Vector3.create(0, 1, 0), 180),
      fixed: true,
    },
  );
  const params: IAutoMovieMotionHumanZip = {
    pouch: "pouch",
    thumb: "thumb",
    index: "index",
    brace: "brace",
    travel: STROKE,
    duration: 0.65,
  };
  const plan = (
    of: IAutoMovieMotionHumanZip,
  ): IAutoMovieMotionHumanActionPlan =>
    zip.plan(motionActionContext(body, of, { props: [pouch] }));
  const refusals: readonly (readonly [IAutoMovieMotionHumanZip, string])[] = [
    [{ ...params, brace: "missing" }, "brace"],
    [{ ...params, brace: "thumb" }, "brace"],
    [{ ...params, index: "thumb" }, "opposing"],
    [{ ...params, travel: STROKE + 0.001 }, "stop"],
    [{ ...params, travel: -0.001 }, "stop"],
  ];
  for (const [invalid, why] of refusals) {
    let refused: boolean = false;
    try {
      plan(invalid);
    } catch (error: unknown) {
      refused = error instanceof HumanRefusal && error.message.includes(why);
    }
    TestValidator.predicate(`refused on ${why}`, refused);
  }
}
