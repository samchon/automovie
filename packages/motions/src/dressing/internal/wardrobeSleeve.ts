import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { wardrobeHands } from "./wardrobeHands";
import type { wardrobeModes } from "./wardrobeModes";

/*
 * Fit a real path down the named sleeve axis, leaving positive radial
 * clearance.
 */
export function wardrobeSleeve(
  context: IAutoMovieMotionHumanActionContext<Params>,
  reader: IAutoMovieMotionHumanPropReader,
  model: IAutoMovieRigidTransform,
  side: AutoMovieHumanSide,
): wardrobeSleeve.ISleeve {
  const name: string = side + "Sleeve";
  const opening: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    name + "Opening",
    "aperture",
  );
  const middle: IAutoMovieRigidTransform = HumanPropFrame.compose(
    model,
    wardrobeHands.middle(opening),
  );
  const exit: IAutoMovieRigidTransform = HumanPropFrame.compose(
    model,
    wardrobeHands.frame(
      wardrobeHands.site(reader.prop, name + "Exit", "socket"),
    ),
  );
  const delta: IAutoMovieVector3 = Vector3.subtract(
    exit.position,
    middle.position,
  );
  const depth: number = Vector3.length(delta);
  const openingOut: IAutoMovieVector3 = Quaternion.rotateVector(
    middle.rotation,
    { x: 0, y: 0, z: 1 },
  );
  if (
    !(
      depth > 0 &&
      Vector3.dot(Vector3.scale(delta, -1 / depth), openingOut) > 0.999 &&
      opening.width! >=
        Math.max(
          2 * context.body.measure.upperArmRadius,
          0.55 * context.body.measure.hand,
        ) &&
      opening.height! >=
        Math.max(
          2 * context.body.measure.upperArmRadius,
          0.55 * context.body.measure.hand,
        )
    )
  )
    throw wardrobeHands.refusal(
      "opening",
      opening.id,
      "the named sleeve has no clear aligned hand passage",
    );
  const before: IAutoMovieVector3 = Vector3.add(
    middle.position,
    Vector3.scale(openingOut, CLEAR),
  );
  const after: IAutoMovieVector3 = Vector3.subtract(
    exit.position,
    Vector3.scale(openingOut, CLEAR),
  );
  const facing: IAutoMovieVector3 = Quaternion.rotateVector(model.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  // A square sleeve leaves the hand's roll around the passage axis free.
  const rotations: IAutoMovieQuaternion[] = [
    0, 45, -45, 90, -90, 135, -135, 180,
  ].map(
    (angle: number): IAutoMovieQuaternion =>
      HumanHand.rotation(side, {
        fingers: Vector3.scale(openingOut, -1),
        palm: Quaternion.rotateVector(
          Quaternion.fromAxisAngle(openingOut, angle),
          facing,
        ),
      }),
  );
  // One roll serves both ends: the hand keeps its turn about the sleeve's
  // axis while it passes down the sleeve, as the zipper's hand keeps its own
  // along the slider. Rolling between two separately chosen ends would turn
  // the wrist inside the sleeve and pull the hand off the axis between them.
  const rotation: IAutoMovieQuaternion = wardrobeHands.fittedGrip(
    context,
    side,
    before,
    after,
    rotations,
    "the hand cannot pass this sleeve within its posed reach",
  );
  const endpoint: (position: IAutoMovieVector3) => IAutoMovieRigidTransform = (
    position: IAutoMovieVector3,
  ): IAutoMovieRigidTransform => ({ position, rotation });
  const crossing: number = CLEAR / (2 * CLEAR + depth);
  let earlier: number = 0;
  let later: number = 1;
  // Invert the monotonic timing curve at the actual axial distance to the opening.
  for (let step: number = 0; step < 14; ++step) {
    const middle: number = (earlier + later) / 2;
    if (AutoMovieEngineMotionSampling.minimumJerkShare(middle) < crossing) earlier = middle;
    else later = middle;
  }
  return {
    before: endpoint(before),
    after: endpoint(after),
    passage: (earlier + later) / 2,
  };
}

/*
 * The records of `wardrobeSleeve`.
 */
export namespace wardrobeSleeve {
  /*
   * Two display grip targets lie on opposite sides of a real sleeve.
   */
  export interface ISleeve {
    /*
     * Clear of the opening on the approach side.
     */
    before: IAutoMovieRigidTransform;
    /*
     * Clear of the outlet after passage.
     */
    after: IAutoMovieRigidTransform;
    /*
     * Time share at which the wrist crosses the opening plane.
     */
    passage: number;
  }
}

/*
 * How far a hand clears the physical sleeve plane on each side, metres.
 */
const CLEAR: number = 0.034;

/*
 * The installed wardrobe actions and their requested direction and side.
 */
type Params = wardrobeModes.Params;
