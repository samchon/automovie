import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { createHumanFaceHairBuilder } from "../anatomy/hair/createHumanFaceHairBuilder";
import { createHumanFaceHairResultCache } from "../anatomy/hair/createHumanFaceHairResultCache";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Append numerical hair after the face's existing geometry and occlusion stages.
 * The original pose/document cache, collision checks and complete model gate
 * retain their order. Each appended mesh and finish is an owned cache copy.
 * Actual completed hair owners may report transport progress; a cache hit does
 * not pretend that guide or ribbon construction ran again. Observer exceptions
 * propagate and cannot certify or cache an unfinished build.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the existing pose/document cache and model validation order while forwarding actual geometry completion from the production hair owner.
 * @evidence contracts/common.md#clear-and-simple-design One cohesive composition stage owns hair identities, owned cached output and its structural model gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original geometry, request, cache identity and admission remain unchanged; progress is neither a timer nor a validation substitute.
 * @evidence contracts/common.md#meaningful-documentation States placement after occlusion, cache-copy ownership and the observer's noncertifying role.
 * @evidence contracts/modeling.md#part-identity-and-grouping Preserves original hair part and material identities and refuses collisions with the assembled face.
 * @evidence contracts/modeling.md#emitted-geometry Appends the same owned source hair meshes rather than a rendering proxy.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document and hair admission own numerical traits.
 * @evidence contracts/modeling.md#spatial-conventions Appended buffers retain their original head-frame metre coordinates without conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The hair root and clearance owners retain geometric attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The whole face consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no scalp or follicle qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing hair and model admission retain bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes the existing admitted numerical document.
 * @author Samchon
 */
export function createHumanFaceHairComposition(basis: IAutoMovieHumanFaceBasis) {
  const build = createHumanFaceHairResultCache(createHumanFaceHairBuilder(basis));
  return (
    document: IAutoMovieHumanFaceBasisDocument,
    positions: ReadonlyMap<string, readonly number[]>,
    pose: object,
    model: IAutoMovieModel,
    progress?: (owner: string) => void,
  ): string[] => {
    if (document.hair === undefined || document.hair === null) return [];
    assertHumanFaceHair(document.hair);
    const generated = build(document.hair, positions, pose, progress);
    const hair = generated.value;
    const ids = hair.parts.map((part) => part.id);
    if (
      hair.parts.some((part) => model.parts.some((resident) => resident.id === part.id)) ||
      hair.materials.some((material) => model.materials.some((resident) => resident.id === material.id))
    ) throw new Error("Numerical hair identities collide with resident face geometry or finishes.");
    if (generated.certified) {
      const validation = validateModel({ model });
      if (!validation.success)
        throw new Error("The numerical hairstyle did not form a valid resident model: " + JSON.stringify(validation));
    }
    model.parts.push(...hair.parts);
    model.materials.push(...hair.materials);
    if (!generated.certified) {
      const validation = validateModel({ model });
      if (!validation.success)
        throw new Error("The numerical hairstyle did not form a valid resident model: " + JSON.stringify(validation));
      generated.certify();
    }
    progress?.("hair-composition");
    return ids;
  };
}
