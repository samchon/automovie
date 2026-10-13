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
 * Compile the legacy final face-skin evaluation in its performed body's metre/Y-up/Z-forward frame. Actual post-contact face region corners gather into a zero-initialized skin array, collar-derived weights pose them through body bones after eye-anchor shift, and the frozen source cut precedes collar conformation. Current and reference calls use this same owner and body build; a pre-contact face is not the final reference.
 *
 * Compiled basis/seam/region inputs remain unchanged and source-region coverage is an admitted producer premise. Each call owns its returned coordinate arrays and head transform. This assembly creates no anatomical proportions and performs no new lip-contact solve or global embedding check.
 *
 * @evidence contracts/common.md#principled-implementation Exact region source corners recover the performed face, actual collar weights and body rest/pose bones carry it, and the same frozen cut/collar owners form current and reference skin.
 * @evidence contracts/common.md#clear-and-simple-design One closure shares final-skin phase order; head carry, collar weights, dual-quaternion skinning, cut evaluation and conformation retain dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Post-contact input is required and complete region coverage is a premise; a zero-initialized buffer is not advertised as missing-sample repair or clinical neck-fit proof.
 * @evidence contracts/common.md#meaningful-documentation Prose states performed metre frame, invariant-input purity, reference timing and returned-array ownership.
 * @evidence contracts/performance.md#efficient-algorithms Each call maps J bones, gathers actual render corners and allocates F face coordinates, then pays collar-weight, four-slot skinning, cut and collar-owner topology costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Invariant region/seam/basis records serve current and reference through one closure; performed weights and coordinates are recomputed for each actual face/body pair.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains supplied invariants until dropped; bone maps/raw/weight buffers are call-local and only owned coordinates plus head transform escape.
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
  }: IAutoMovieHumanPersonSourceSkinProps = props;
  const cut: NonNullable<IAutoMovieHumanPersonSourceSkinProps["seam"]["cut"]> = seam.cut!;
  return ({ face, body }: IAutoMovieHumanPersonSourceSkinInput): IAutoMovieHumanPersonSourceSkin => {
    const bones: Map<IAutoMovieHumanPersonSourceSkinInput["body"]["bones"][number]["bone"], IAutoMovieHumanPersonSourceSkinInput["body"]["bones"][number]> = new Map(body.bones.map((one: IAutoMovieHumanPersonSourceSkinInput["body"]["bones"][number]): [typeof one.bone, typeof one] => [one.bone, one]));
    const head: ReturnType<typeof createHumanPersonHeadTransform> = createHumanPersonHeadTransform({
      anchor: {
        neutral: neutralAnchor,
        shaped: humanPersonEyeCentre(body.landmarks),
      },
      rest: bones.get("head")!.rest,
      posed: bones.get("head")!.posed,
    });

    // the face skin's shared vertices, read back from its render parts
    const raw: number[] = new Array<number>(faceCount * 3).fill(0);
    for (const part of face.parts) {
      const sources: readonly number[] | undefined = faceRegions.get(part.id);
      if (sources === undefined) continue;
      const { positions }: ReturnType<typeof meshOfHumanPart> = meshOfHumanPart(part);
      sources.forEach((source: number, vertex: number): void => {
        for (let axis: number = 0; axis < 3; axis++)
          raw[source * 3 + axis] = positions[vertex * 3 + axis];
      });
    }
    const faceWeights: ReturnType<typeof createHumanPersonFaceSkin> = createHumanPersonFaceSkin({
      seam,
      face: raw,
      body: neutralBody,
      bodySkin: bodySkin.surface.skin,
      jawVertices,
    });
    const facePosed: number[] = skinHumanBodySurface(
      raw.map(
        (value: number, at: number): number =>
          value + [head.shift.x, head.shift.y, head.shift.z][at % 3],
      ),
      faceWeights,
      bodyBasis.joints,
      bones,
    );
    const bodyBeforeCollar: number[] = evaluateHumanPersonCut(
      body.posedSurfaces[bodySkin.index].positions,
      cut,
    );
    const bodyPosed: number[] = conformHumanPersonCollar({
      seam,
      face: facePosed,
      body: bodyBeforeCollar,
    });
    return { face: facePosed, body: bodyPosed, bodyBeforeCollar, head };
  };
}
