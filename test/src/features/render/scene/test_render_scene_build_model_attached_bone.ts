import {
  AutoMovieHumanoidBone,
  type IAutoMovieModelPart,
} from "@automovie/interface";
import { AutoMovieRenderSceneLayout } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { createModel, primitivePart } from "../../internal/fixtures";
import { throwsError } from "../../internal/predicates";

/**
 * A rigid part naming an absent attachment bone must throw instead of silently
 * parenting to the model root, which formerly left a held prop at the origin.
 *
 * Scenarios:
 *
 * 1. `attachedBone: "rightHand"` on a skeleton without that bone throws naming the
 *    part and the bone.
 * 2. Negative twin: the same part attached to an existing bone rides that bone
 *    (parented under it, not the group).
 * 3. `attachedBone: null` still parents the part to the model group.
 */
export function test_render_scene_build_model_attached_bone(): void {
  const sword: (
    attachedBone: AutoMovieHumanoidBone | null,
  ) => IAutoMovieModelPart = (
    attachedBone: AutoMovieHumanoidBone | null,
  ): IAutoMovieModelPart => ({
    ...primitivePart("sword", {
      type: "box" as const,
      width: 0.05,
      height: 0.7,
      depth: 0.05,
    }),
    attachedBone,
  });

  // 1. unknown attachedBone throws with the part and bone named
  TestValidator.predicate(
    "an unknown attachedBone throws",
    throwsError(
      (): ReturnType<typeof AutoMovieRenderSceneLayout.buildModel> =>
        AutoMovieRenderSceneLayout.buildModel({
          ...createModel(),
          parts: [sword("rightHand")],
        }),
      ['part "sword"', 'missing bone "rightHand"'],
    ),
  );

  // 2. negative twin: a known attachedBone rides that bone
  const model: ReturnType<typeof createModel> = createModel();
  const knownBone: AutoMovieHumanoidBone = model.skeleton!.bones[0]!.bone;
  const built: ReturnType<typeof AutoMovieRenderSceneLayout.buildModel> = AutoMovieRenderSceneLayout.buildModel({
    ...model,
    parts: [sword(knownBone)],
  });
  const bone: THREE.Object3D = built.bones.get(knownBone)!;
  TestValidator.equals(
    "a known attachedBone parents the part under that bone",
    bone.children.some(
      (child: THREE.Object3D): boolean => child.name === "sword",
    ),
    true,
  );

  // 3. a null attachedBone still parents to the model group
  const loose: ReturnType<typeof AutoMovieRenderSceneLayout.buildModel> = AutoMovieRenderSceneLayout.buildModel({
    ...createModel(),
    parts: [sword(null)],
  });
  TestValidator.equals(
    "an unattached part parents to the model group",
    loose.object.children.some(
      (child: THREE.Object3D): boolean => child.name === "sword",
    ),
    true,
  );
}
