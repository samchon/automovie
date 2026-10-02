import {
  type IAutoMovieHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { buildBodyCorrectiveSample } from "../../../scripts/body-basis/buildBodyCorrectiveSample";
import { createBodyCorrectiveWorld } from "../../../scripts/body-basis/bodyCorrectiveWorld";
import { readBodyCorrectiveShoulderRest } from "../../../scripts/body-basis/readBodyCorrectiveShoulderRest";
import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Fractional corrective samples use the same public builder for their shape's
 * native TT rest and final complete goal. Endpoints need only one build and
 * a refused native-rest build propagates its actual cause.
 *
 * Scenarios:
 * 1. At shape0.5 the analytic arm is (0.2,-0.15,0), so its independent rest
 *    angle is atan2(0.2,0.15); a half sample to90 is their angular midpoint.
 * 2. Zero/full TT samples, non-TT and explicitly empty TT samples need one
 *    build; full goals retain their exact representations.
 * 3. The rest reader returns both humeri and no unrelated bones.
 * 4. A refused native-rest build cannot be replaced by a fixed rest/sample.
 */
export const test_human_body_tt_corrective_sample = (): void => {
  const { basis } = humanBodyShoulderFixture();
  basis.landmarks.targets.raised.push(
    basis.landmarks.ids.indexOf("left-elbow"), 0, 0.1, 0,
  );
  const compiled = createHumanBodyBasisBuilder(basis);
  const documents: IAutoMovieHumanBodyBasisDocument[] = [];
  const input: Parameters<typeof buildBodyCorrectiveSample>[0] = {
    world: createBodyCorrectiveWorld(basis),
    state: {
      name: "analytic", set: "shapes", group: "shoulders",
      shape: { tall: 1 }, pose: [],
      shoulders: [{ bone: "leftUpperArm", plane: 0, elevation: 90, axialRotation: 0 }],
    },
    t: 0.5, u: 0.5, basis: basis.id,
    build: (document) => { documents.push(document); return compiled(document); },
  };
  const sample = buildBodyCorrectiveSample(input);
  TestValidator.equals("fractional TT uses a native-rest build and final build", documents.length, 2);
  TestValidator.equals("the preliminary build omits TT travel", documents[0].shoulders, []);
  TestValidator.predicate("both builds use the same fractional shape", nclose(documents[0].shape.tall, 0.5) && nclose(documents[1].shape.tall, 0.5));
  const target = documents[1].shoulders![0];
  const expected = (Math.atan2(0.2, 0.15) * 180 / Math.PI + 90) / 2;
  TestValidator.predicate("physical sampling begins at the current shape's rest", nclose(target.plane, 0) && nclose(target.elevation, expected, 1e-9) && nclose(target.axialRotation, 0));
  const rests = readBodyCorrectiveShoulderRest(sample);
  TestValidator.equals("only the two humeri provide TT rests", rests.map((pose) => pose.bone), ["leftUpperArm", "rightUpperArm"]);
  TestValidator.predicate("the reader uses shaped skeleton rest frames", nclose(rests[0].elevation, Math.atan2(0.2, 0.15) * 180 / Math.PI, 1e-9));
  TestValidator.equals("no humerus produces no invented rest", readBodyCorrectiveShoulderRest({ bones: [] }), []);
  for (const variant of [
    { ...input, t: 0 },
    { ...input, t: 1 },
    { ...input, state: { ...input.state, shoulders: undefined } },
    { ...input, state: { ...input.state, shoulders: [] } },
  ]) {
    documents.length = 0;
    buildBodyCorrectiveSample(variant);
    TestValidator.equals("an endpoint or non-TT state needs one build", documents.length, 1);
  }
  documents.length = 0;
  buildBodyCorrectiveSample({ ...input, t: 1 });
  TestValidator.equals("the full authored goal survives exactly", JSON.stringify(documents[0].shoulders), JSON.stringify(input.state.shoulders));
  TestValidator.predicate("the actual native-rest refusal propagates", throwsError(() =>
    buildBodyCorrectiveSample({ ...input, build: () => { throw new Error("native-rest range refusal"); } }),
    "native-rest range refusal",
  ));
};
