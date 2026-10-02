import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodyShoulderPose,
  evaluateHumanBodyLandmarks,
  humanBodyBasisWeights,
  resolveHumanBodyShapedShoulderRest,
} from "@automovie/human";

import { humanBodyShoulderFixture } from "./humanBodyShoulderFixture";

/**
 * The analytic shoulder fixture with one shaped arm and the correctives that
 * read an arm's rest.
 *
 * The `tall` channel carries a landmark row that lifts the left elbow by
 * 0.1 m, so the shaped left arm runs from (0.2,3,0) to (0.4,2.9,0) and hangs
 * atan(2), about 63.435 degrees, from the vertical, while the right arm and the
 * basis's declared A-pose stay at 45 degrees. Three correctives read the rest
 * and no skin target is added, because the weights stage never reads a
 * surface:
 *
 * - `kernelLeft` and `kernelRight`, each a kernel at plane 0, elevation 80,
 *   outer radius 25 degrees. The base A-pose is 35 degrees from it, so it is
 *   off at the base rest, as admission requires; the shaped left arm is 16.565
 *   degrees from it, inside its support.
 * - `driverLeft`, a left-arm elevation ramp from 5 to 25 degrees of travel.
 *
 * Every expectation in the scenarios that use it is closed-form from these
 * figures.
 */
export function humanBodyShapedShoulderFixture(): {
  basis: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanBodyBasisDocument;
  shaped: Record<string, number>;
  rest: ReadonlyMap<
    IAutoMovieHumanBodyShoulderPose["bone"],
    IAutoMovieHumanBodyShoulderPose
  >;
} {
  const { basis, document } = humanBodyShoulderFixture(true);
  basis.landmarks.targets.raised.push(
    basis.landmarks.ids.indexOf("left-elbow"),
    0,
    0.1,
    0,
  );
  const kernel = (
    bone: IAutoMovieHumanBodyShoulderPose["bone"],
  ): NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number] => ({
    id: bone + "Kernel",
    target: bone + "Kernel",
    weight: 1,
    inputs: [
      {
        shoulder: bone,
        orientation: { plane: 0, elevation: 80, axialRotation: 0 },
        innerDegrees: 0,
        outerDegrees: 25,
      },
    ],
  });
  basis.correctives!.push(kernel("leftUpperArm"), kernel("rightUpperArm"), {
    id: "driverLeft",
    target: "driverLeft",
    weight: 1,
    inputs: [
      {
        bone: "leftUpperArm",
        axis: "elevation",
        side: "positive",
        onset: 5,
        full: 25,
      },
    ],
  });
  const shaped = { tall: 1 };
  const rest = resolveHumanBodyShapedShoulderRest(
    basis,
    evaluateHumanBodyLandmarks(
      basis,
      humanBodyBasisWeights(basis, { shape: shaped, pose: undefined }),
    ),
  );
  return { basis, document, shaped, rest };
}
