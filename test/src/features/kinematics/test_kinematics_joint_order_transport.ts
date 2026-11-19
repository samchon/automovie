import { prepareArticulatedRig } from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PoseResolutionSnapshot } from "../../../../packages/engine/src/kinematics/PoseResolutionSnapshot";
import { normalizeJointAxes } from "../../../../packages/engine/src/kinematics/normalizeJointAxes";
import { readsSwingTwistFrame } from "../../../../packages/engine/src/kinematics/readsSwingTwistFrame";
import { validateJointAxesBasis } from "../../../../packages/engine/src/kinematics/validateJointAxesBasis";
import { vclose } from "../internal/vclose";

/** The two nodes used to track a rotating root and a translated marker. */
type Bone = "root" | "marker";

/**
 * Explicit joint order survives basis preparation and distinguishes otherwise equal ranges.
 *
 * Scenarios:
 * 1. A source basis edited from implicit order to explicit order invalidates its normalized entry and leaves previous snapshots intact.
 * 2. A range uses the direct rotation only when its axis and order declarations agree with the caller.
 * 3. Prepared rigid FK preserves the order across edits to the source.
 * 4. The literal order admits omitted or distal placement and reports contradictory or unknown declarations on their own fields.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the snapshot, equivalence, forward kinematics and refusal scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Reads real frozen bases, comparison results, prepared world frames and validation issues before and after source edits.
 * @evidence contracts/development/testing.md#independent-expectations Starting on +Y, the intrinsic X-Z-Y product of quarter turns acts as Y then Z then X on the marker, taking it to -X. The old proximal product takes it to +X. Optional declarations are checked directly.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers omitted order, explicit order with absent or distal twist placement, a conflicting proximal placement and a misspelled rotation order.
 * @evidence contracts/development/testing.md#execution-ownership One local test reads two rigid nodes and test-owned inputs without a renderer or host.
 */
export function test_kinematics_joint_order_transport(): void {
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 2, y: 0, z: 0 },
    abduction: { x: 0, y: 0, z: 3 },
    twist: { x: 0, y: 4, z: 0 },
  };
  const path: string = "test.axes";
  const legacy: IAutoMovieJointAxes = normalizeJointAxes(axes, path);
  axes.rotationOrder = "flexion-abduction-twist";
  const explicit: IAutoMovieJointAxes = normalizeJointAxes(axes, path);
  const snapshot: IAutoMovieJointAxes = PoseResolutionSnapshot.axes(axes);

  TestValidator.predicate(
    "only unchanged admitted axes share the same normalized result",
    legacy.rotationOrder === undefined &&
      explicit.rotationOrder === "flexion-abduction-twist" &&
      normalizeJointAxes(axes, path) === explicit &&
      !readsSwingTwistFrame(legacy, undefined, { axes: snapshot }) &&
      readsSwingTwistFrame(explicit, undefined, { axes: snapshot }),
  );

  const rest: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const rig: IAutoMovieArticulatedRig<Bone> = {
    id: "rotation-order",
    bones: [
      { bone: "root", parent: null, axes, rest, limits: null },
      {
        bone: "marker",
        parent: "root",
        axes: legacy,
        rest: { ...rest, translation: { x: 0, y: 1, z: 0 } },
        limits: null,
      },
    ],
  };
  const reader: ReturnType<typeof prepareArticulatedRig<Bone>> =
    prepareArticulatedRig(rig);
  const joints: ReadonlyMap<
    Bone,
    Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
  > = new Map([["root", { flexion: 90, abduction: 90, twist: 90 }]]);
  delete axes.rotationOrder;

  TestValidator.predicate(
    "prepared frames and snapshots retain the old declaration after source edits",
    snapshot.rotationOrder === "flexion-abduction-twist" &&
      Object.isFrozen(snapshot) &&
      vclose(reader.read(joints).get("marker")!.translation, {
        x: -1,
        y: 0,
        z: 0,
      }) &&
      vclose(
        prepareArticulatedRig(rig).read(joints).get("marker")!.translation,
        { x: 1, y: 0, z: 0 },
      ),
  );

  TestValidator.equals(
    "explicit order accepts distal placement",
    [],
    validateJointAxesBasis({ ...snapshot, twistPlacement: "distal" }, path),
  );
  TestValidator.equals(
    "proximal placement conflicts with explicit order",
    [`${path}.twistPlacement`],
    validateJointAxesBasis(
      { ...snapshot, twistPlacement: "proximal" },
      path,
    ).map((issue) => issue.path),
  );
  const malformed: IAutoMovieJointAxes = {
    ...legacy,
    rotationOrder: "flexion-twist-abduction",
  } as unknown as IAutoMovieJointAxes;
  TestValidator.equals(
    "a locally typed record still validates an external order spelling",
    [`${path}.rotationOrder`],
    validateJointAxesBasis(malformed, path).map((issue) => issue.path),
  );
}
