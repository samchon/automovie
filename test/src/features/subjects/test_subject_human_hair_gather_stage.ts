import { Vector3 } from "@automovie/engine";
import { createHumanFaceHairGatherStage } from "@automovie/human/face/anatomy/hair/createHumanFaceHairGatherStage";
import { evaluateHumanFaceHairDirection } from "@automovie/human/face/anatomy/hair/evaluateHumanFaceHairDirection";
import { humanFaceHairSequence } from "@automovie/human/face/anatomy/hair/humanFaceHairSequence";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * The gathering stage of one lock: the field before the tie, the tail after
 * it, the crossing of a step through the tie's sphere, and the refusal of a
 * lock that never reaches it.
 * Scenarios:
 * 1. Without a gather the stage is never pending, ignores observation, gives
 *    the ordinary comb field and does not refuse.
 * 2. A gather without its anchor or field refuses; a root inside the radius
 *    starts tied without asking the field.
 * 3. Before the tie the direction is the scalp field at full strength; a
 *    station inside the radius enters the tail, whose direction is the tail
 *    axis, and a spread turns the tail away from that axis.
 * 4. A step through the sphere crosses at the analytic fraction; steps that
 *    miss, stop short, lie behind or have no length do not cross.
 * 5. A lock that stayed outside refuses naming its nearest approach, which a
 *    later, farther station does not replace.
 */
export const test_subject_human_hair_gather_stage = (): void => {
  const fixture = createNumericalHairFixture().layers[0];
  fixture.lift.strength = 0;
  const root = Vector3.create(0, 0, 0);
  const anchor = Vector3.create(0, 0.05, 0);
  const normal = Vector3.create(1, 0, 0);
  const gathered = () => {
    const layer = structuredClone(fixture);
    layer.gather = {
      anchor: { polar: 0, azimuth: 0 },
      radius: 0.005,
      strength: 1,
      tail: { direction: [0, 0, 1] },
    };
    return layer;
  };
  const make = (layer = gathered()) =>
    createHumanFaceHairGatherStage({
      layer,
      reference: root,
      root,
      sequence: 1,
      anchor,
      gatherDirection: () => Vector3.create(0, 5, 0),
    });

  const plain = createHumanFaceHairGatherStage({
    layer: fixture,
    reference: root,
    root,
    sequence: 1,
  });
  plain.observe(anchor, 0.01);
  TestValidator.predicate(
    "an ungathered stage is never pending and gives the comb field",
    !plain.pending() &&
      vclose(
        plain.direction(root, normal, 0.01),
        evaluateHumanFaceHairDirection({
          layer: fixture,
          root,
          normal,
          distance: 0.01,
          phase: 2 * Math.PI * humanFaceHairSequence(1, 11),
        }),
      ),
  );
  plain.assertTied(root);

  TestValidator.predicate(
    "a gather without its anchor and field refuses",
    throwsError(
      () =>
        createHumanFaceHairGatherStage({
          layer: gathered(),
          reference: root,
          root,
          sequence: 1,
        }),
      "attached scalp anchor",
    ),
  );
  let asked = 0;
  const inside = createHumanFaceHairGatherStage({
    layer: gathered(),
    reference: root,
    root: anchor,
    sequence: 1,
    anchor,
    gatherDirection: () => {
      asked++;
      return Vector3.create(0, 1, 0);
    },
  });
  TestValidator.predicate(
    "a root inside the tie starts tied without the field",
    !inside.pending() &&
      vclose(inside.direction(anchor, normal, 0.01), Vector3.create(0, 0, 1)) &&
      asked === 0,
  );

  const stage = make();
  TestValidator.predicate(
    "before the tie the direction is the scalp field",
    stage.pending() &&
      vclose(stage.direction(root, normal, 0.01), Vector3.create(0, 1, 0)),
  );
  stage.observe(Vector3.create(0, 0.02, 0), 0.02);
  TestValidator.predicate("a far station does not enter", stage.pending());
  stage.observe(Vector3.create(0, 0.048, 0), 0.05);
  TestValidator.predicate(
    "a station inside the radius enters the tail",
    !stage.pending() &&
      vclose(stage.direction(anchor, normal, 0.06), Vector3.create(0, 0, 1)),
  );
  stage.observe(Vector3.create(0, 0.049, 0), 0.055);
  stage.assertTied(anchor);
  TestValidator.predicate(
    "a tied lock stays tied and does not refuse",
    !stage.pending(),
  );
  const spread = gathered();
  spread.gather!.tail.spread = { radius: 0.03, reach: 0.02 };
  const wide = make(spread);
  wide.observe(Vector3.create(0, 0.048, 0), 0.05);
  TestValidator.predicate(
    "a tail spread turns the tail off its axis",
    !vclose(
      wide.direction(anchor, normal, 0.06),
      Vector3.create(0, 0, 1),
      1e-3,
    ),
  );

  const through = make();
  TestValidator.predicate(
    "a step through the sphere crosses at the analytic fraction",
    nclose(
      through.crossing(Vector3.create(0, 0.04, 0), Vector3.create(0, 0.05, 0))!,
      0.5,
    ),
  );
  TestValidator.equals(
    "a step that misses does not cross",
    through.crossing(Vector3.create(0.1, 0, 0), Vector3.create(0.1, 0.01, 0)),
    undefined,
  );
  TestValidator.equals(
    "a step that stops short does not cross",
    through.crossing(Vector3.create(0, 0, 0), Vector3.create(0, 0.01, 0)),
    undefined,
  );
  TestValidator.equals(
    "a step already past does not cross",
    through.crossing(Vector3.create(0, 0.06, 0), Vector3.create(0, 0.07, 0)),
    undefined,
  );
  TestValidator.equals(
    "a step with no length does not cross",
    through.crossing(Vector3.create(0, 0.04, 0), Vector3.create(0, 0.04, 0)),
    undefined,
  );

  const lost = make();
  lost.observe(Vector3.create(0, 0.03, 0), 0.02);
  lost.observe(Vector3.create(0, 0.01, 0), 0.03);
  TestValidator.predicate(
    "a lock that never enters refuses with its nearest approach",
    throwsError(() => lost.assertTied(Vector3.create(0, 0.01, 0)), [
      "before it reached its scalp tie",
      "nearest 0.02",
    ]),
  );
};
