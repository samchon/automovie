import { IAutoMovieSkeleton } from "@automovie/interface";
import {
  applyPose,
  buildModel,
  createImportedModelObject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { IDENTITY_TRANSFORM, createModel } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";

const ROOT_ONLY: IAutoMovieSkeleton = {
  id: "root-only",
  bones: [
    { bone: "hips", parent: null, rest: IDENTITY_TRANSFORM, constraint: null },
  ],
};

/**
 * Rig bone rests and pose roots ignore their declared scale under the translation/rotation convention. These two existing cases observe the X scale component plus pose-root X and bone-rest Y translation; all-axis/rotation behavior, ordinary node scale, collision and rendered framing are not independently asserted here.
 *
 * Scenarios:
 *
 * 1. A pose root with scale 2 moves the model root but leaves its scale at 1.
 * 2. A bone rest with scale 2 places the bone but leaves its scale at 1.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds a generated rig and wraps an imported Group, applies a pose and reads actual root/bone transform fields; catches applying authored rig scales while allowing their translations.
 * @evidence contracts/testing.md#independent-expectations The rig convention excludes rest and pose-root scale, so authored scale two must leave the observed X scale at one while the selected literal translations remain one; finite scalar predicates compare those fields without a second pose solver or a complete all-axis oracle.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts ignored pose-root scale and ignored bone-rest scale with retained translation in each path; object-motion and scene-node scale remain obligations of their separate tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit calls maintained Viewer entries and observes CPU-side Three transforms without rendering, a browser, process or new Human model; its existing generic fixture supplies the generated rig.
 */
export function test_viewer_rig_scale_convention(): void {
  // 1. pose-root scale is dropped, its translation applies
  const model: ReturnType<typeof createImportedModelObject> = createImportedModelObject({ object: new THREE.Group() });
  applyPose(
    model,
    {
      skeleton: ROOT_ONLY.id,
      root: {
        translation: { x: 1, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 2, y: 2, z: 2 },
      },
      joints: [],
    },
    ROOT_ONLY,
  );
  TestValidator.equals(
    "a pose-root scale is dropped while its translation applies",
    namedFacts([
      ["modelObjectPosition", (): boolean => nclose(model.object.position.x, 1, 0)],
      [
        "modelObjectScale",
        (): boolean => nclose(model.object.position.x, 1, 0) && nclose(model.object.scale.x, 1, 0),
      ],
    ]),
    { modelObjectPosition: true, modelObjectScale: true },
  );

  // 2. bone-rest scale is dropped, its translation applies
  const built: ReturnType<typeof buildModel> = buildModel({
    ...createModel(),
    id: "scaled-rest",
    skeleton: {
      id: "scaled-rest-skeleton",
      bones: [
        {
          bone: "hips",
          parent: null,
          rest: {
            translation: { x: 0, y: 1, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 2, y: 2, z: 2 },
          },
          constraint: null,
        },
      ],
    },
  });
  const hips: THREE.Object3D = built.bones.get("hips")!;
  TestValidator.equals(
    "a bone-rest scale is dropped while its translation applies",
    namedFacts([
      ["hipsPositionY", (): boolean => nclose(hips.position.y, 1, 0)],
      ["hipsScaleX", (): boolean => nclose(hips.position.y, 1, 0) && nclose(hips.scale.x, 1, 0)],
    ]),
    { hipsPositionY: true, hipsScaleX: true },
  );
}
