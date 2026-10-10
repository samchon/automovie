import { skinHumanBodySurface } from "../../body/basis/skinHumanBodySurface";
import { conformHumanPersonCollar } from "../seam/conformHumanPersonCollar";
import { createHumanPersonFaceSkin } from "../seam/createHumanPersonFaceSkin";
import { evaluateHumanPersonCut } from "../seam/evaluateHumanPersonCut";
import type { IAutoMovieHumanPersonSourceSkin } from "../structures/IAutoMovieHumanPersonSourceSkin";
import type { IAutoMovieHumanPersonSourceSkinInput } from "../structures/IAutoMovieHumanPersonSourceSkinInput";
import type { IAutoMovieHumanPersonSourceSkinProps } from "../structures/IAutoMovieHumanPersonSourceSkinProps";
import { createHumanPersonHeadTransform } from "./createHumanPersonHeadTransform";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Evaluate one final face skin in its performed person's body frame.
 * Face parts already contain the face owner's final contact result. Their
 * shared region sources are gathered, the body's actual head rest/pose frames
 * place the face, and collar-derived skin weights and the canonical body cut
 * provide the joined skin. Reference and current faces use this same owner
 * with the same body build; a pre-contact face is not a final reference.
 * Every returned coordinate array is owned, in metres/Y-up/Z-forward.
 * This assembly does not create anatomical proportions or solve lip contact.
 */
export function createHumanPersonSourceSkin(
  props: IAutoMovieHumanPersonSourceSkinProps,
): (
  input: IAutoMovieHumanPersonSourceSkinInput,
) => IAutoMovieHumanPersonSourceSkin {
  const {
    faceCount,
    faceRegions,
    bodyBasis,
    bodySkin,
    seam,
    neutralBody,
    jawVertices,
    neutralAnchor,
  } = props;
  const cut = seam.cut!;
  return ({ face, body }) => {
    const bones = new Map(body.bones.map((one) => [one.bone, one]));
    const head = createHumanPersonHeadTransform({
      anchor: {
        neutral: neutralAnchor,
        shaped: humanPersonEyeCentre(body.landmarks),
      },
      rest: bones.get("head")!.rest,
      posed: bones.get("head")!.posed,
    });

    // the face skin's shared vertices, read back from its render parts
    const raw = new Array<number>(faceCount * 3).fill(0);
    for (const part of face.parts) {
      const sources = faceRegions.get(part.id);
      if (sources === undefined) continue;
      const { positions } = meshOfHumanPart(part);
      sources.forEach((source, vertex) => {
        for (let axis = 0; axis < 3; axis++)
          raw[source * 3 + axis] = positions[vertex * 3 + axis];
      });
    }
    const faceWeights = createHumanPersonFaceSkin({
      seam,
      face: raw,
      body: neutralBody,
      bodySkin: bodySkin.surface.skin,
      jawVertices,
    });
    const facePosed = skinHumanBodySurface(
      raw.map(
        (value, at) =>
          value + [head.shift.x, head.shift.y, head.shift.z][at % 3],
      ),
      faceWeights,
      bodyBasis.joints,
      bones,
    );
    const bodyBeforeCollar = evaluateHumanPersonCut(
      body.posedSurfaces[bodySkin.index].positions,
      cut,
    );
    const bodyPosed = conformHumanPersonCollar({
      seam,
      face: facePosed,
      body: bodyBeforeCollar,
    });
    return { face: facePosed, body: bodyPosed, bodyBeforeCollar, head };
  };
}
