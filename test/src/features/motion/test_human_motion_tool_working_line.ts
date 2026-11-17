import { createBow } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, StrikingHeld } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/vclose";

/**
 * A tool's working line can join two affordance points independently of a
 * surface's contact normal, with its roll carried by the point's own frame.
 *
 * Scenarios on a real bow's nock and arrow rest:
 * 1. The held axis points from nock to rest and its working length is their
 *    separation, within 1e-9; the rest's sideways normal is a different axis.
 * 2. Translating and rotating the held frame carries the tip, axis and roll
 *    reference by that same rigid transform, within 1e-9.
 * 3. Coincident named endpoints are refused on from as a parameter error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometric distinction, covariance, numerical bounds and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads a real archetype through the public held-tool seam; using its surface normal or an arbitrary hand-frame roll fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected line joins the bow's nock and arrow rest; covariance is the rigid-frame relation, independent of the reader's axis construction.
 * @evidence contracts/development/testing.md#distinguishing-cases A surface normal transverse to the working line, an independently translated and rotated offset, and coincident endpoints.
 * @evidence contracts/development/testing.md#execution-ownership Pure in-memory package exports and one bow, with no body preparation or external host.
 */
export function test_human_motion_tool_working_line(): void {
  const bow: ReturnType<typeof createBow> = createBow({ kind: "longbow" });
  const read = (
    frame: IAutoMovieMotionHumanProp.IFrame,
    from: string = "nock",
  ): IAutoMovieMotionHumanStrikingHeld.ITool => {
    const held: IAutoMovieMotionHumanHeld.IHeld = {
      prop: "bow",
      side: "left",
      frame,
      affordances: bow.affordances,
    };
    return StrikingHeld.read(held, { from, tip: "rest" });
  };
  const identity: IAutoMovieMotionHumanProp.IFrame = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const initial: IAutoMovieMotionHumanStrikingHeld.ITool = read(identity);
  const line: IAutoMovieVector3 = Vector3.subtract(
    bow.affordance("rest").frame.translation,
    bow.affordance("nock").frame.translation,
  );
  TestValidator.predicate(
    "the working axis joins nock to rest",
    vclose(initial.axis, Vector3.normalize(line), 1e-9),
  );
  TestValidator.predicate(
    "the working length joins the named endpoints",
    Math.abs(initial.length - Vector3.length(line)) <= 1e-9,
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    bow.affordance("rest").frame.rotation,
    { x: 0, y: 1, z: 0 },
  );
  TestValidator.predicate(
    "the rest's contact normal is transverse to the arrow line",
    Math.abs(Vector3.dot(normal, initial.axis)) < 0.2,
  );
  const moved: IAutoMovieMotionHumanProp.IFrame = {
    position: { x: 0.4, y: -0.2, z: 0.3 },
    rotation: Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 73),
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -31),
    ),
  };
  const turned: IAutoMovieMotionHumanStrikingHeld.ITool = read(moved);
  TestValidator.predicate(
    "the tip follows its rigid offset",
    vclose(
      turned.tip,
      Vector3.add(
        moved.position,
        Quaternion.rotateVector(moved.rotation, initial.tip),
      ),
      1e-9,
    ),
  );
  TestValidator.predicate(
    "the working axis rotates with the prop",
    vclose(
      turned.axis,
      Quaternion.rotateVector(moved.rotation, initial.axis),
      1e-9,
    ),
  );
  TestValidator.predicate(
    "the roll reference rotates with the prop",
    vclose(
      turned.edge,
      Quaternion.rotateVector(moved.rotation, initial.edge),
      1e-9,
    ),
  );
  TestValidator.predicate(
    "a rigid frame preserves the working length",
    Math.abs(turned.length - initial.length) <= 1e-9,
  );
  let refused: boolean = false;
  try {
    read(identity, "rest");
  } catch (error) {
    refused =
      error instanceof HumanRefusal &&
      error.kind === "parameter" &&
      error.axis === "from";
  }
  TestValidator.predicate(
    "coincident working-line endpoints are refused",
    refused,
  );
}
