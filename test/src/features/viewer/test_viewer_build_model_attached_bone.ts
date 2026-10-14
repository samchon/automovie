import { AutoMovieHumanoidBone, type IAutoMovieModelPart } from "@automovie/interface";
import { buildModel } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { createModel, primitivePart } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";

/**
 * A rigid part naming an absent attachment bone must throw instead of silently parenting to the model root, which formerly left a held prop at the origin.
 *
 * Scenarios:
 *
 * 1. `attachedBone: "rightHand"` on a skeleton without that bone throws naming the
 *    part and the bone.
 * 2. Negative twin: the same part attached to an existing bone rides that bone
 *    (parented under it, not the group).
 * 3. `attachedBone: null` still parents the part to the model group.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual model graphs and observes missing-bone refusal versus native child parenting for known and absent attachment. A rigid part cannot silently fall back to the model root when its declared bone is missing.
 * @evidence contracts/testing.md#independent-expectations The existing authored twelve-bone fixture includes hips and omits rightHand; a part named sword must appear under the specified known bone or under the model group when attachment is null. These declared identities supply the oracle independently of builder output; animation and rendered placement are not measured.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts missing rightHand, present first fixture bone and explicit null attachment while retaining the same primitive part. Skinned meshes and skin-versus-rigid precedence belong to other model construction tests; this unit owns the rigid attachment decision.
 * @evidence contracts/testing.md#execution-ownership This named portable unit invokes native metadata graph construction with existing nonclinical engine fixtures. It starts no viewer, GPU or Human inspection host and all refusal/parenting cases belong to this entry.
 */
export function test_viewer_build_model_attached_bone(): void {
  const sword: (attachedBone: AutoMovieHumanoidBone | null) => IAutoMovieModelPart = (attachedBone: AutoMovieHumanoidBone | null): IAutoMovieModelPart => ({
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
      (): ReturnType<typeof buildModel> =>
        buildModel({
          ...createModel(),
          parts: [sword("rightHand")],
        }),
      ['part "sword"', 'missing bone "rightHand"'],
    ),
  );

  // 2. negative twin: a known attachedBone rides that bone
  const model: ReturnType<typeof createModel> = createModel();
  const knownBone: AutoMovieHumanoidBone = model.skeleton!.bones[0]!.bone;
  const built: ReturnType<typeof buildModel> = buildModel({ ...model, parts: [sword(knownBone)] });
  const bone: THREE.Object3D = built.bones.get(knownBone)!;
  TestValidator.equals(
    "a known attachedBone parents the part under that bone",
    bone.children.some((child: THREE.Object3D): boolean => child.name === "sword"),
    true,
  );

  // 3. a null attachedBone still parents to the model group
  const loose: ReturnType<typeof buildModel> = buildModel({ ...createModel(), parts: [sword(null)] });
  TestValidator.equals(
    "an unattached part parents to the model group",
    loose.object.children.some((child: THREE.Object3D): boolean => child.name === "sword"),
    true,
  );
}
