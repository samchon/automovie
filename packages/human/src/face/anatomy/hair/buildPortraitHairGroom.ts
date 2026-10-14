import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { IPortraitHairLayer } from "./IPortraitHairLayer";
import { IPortraitHairShape } from "./IPortraitHairShape";
import { buildPortraitHairCards } from "./buildPortraitHairCards";
import { createPortraitHairMaterial } from "./createPortraitHairMaterial";

/**
 * Assemble legacy hair and up to eight additional independent surface layers. Each populated profile owns one derived finish and one merged mesh. Base finishes are resolved only from the caller's resident palette, never from a preceding layer's generated material. Omitted layers preserve legacy output. The layer limit bounds authoring cost, not anatomical density. Invalid empty profiles still refuse; no texture or unused finish is allocated for them.
 *
 * @evidence contracts/common.md#principled-implementation Each populated legacy profile builds a card mesh and derives its finish from the original resident palette.
 * @evidence contracts/common.md#clear-and-simple-design Optional additional layers reuse the base card/material owners and receive independent layer identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate ids, resident finish collisions and malformed empty profiles refuse; eight layers is a resource bound, not anatomical density.
 * @evidence contracts/common.md#meaningful-documentation Omitted layers preserve legacy output and empty valid profiles allocate no derived finish.
 * @evidence contracts/performance.md#efficient-algorithms Layer checks and card construction scale with at most eight additional profiles and their card resolutions.
 * @evidence contracts/performance.md#reuse-equivalent-work Base finishes always resolve from the original palette so earlier generated layers cannot alter later semantics.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned palette is cloned and generated parts are owned; caller profiles and materials are borrowed.
 */
export function buildPortraitHairGroom(props: {
  hair?: IPortraitHairShape;
  layers?: readonly IPortraitHairLayer[];
  materials: readonly IAutoMovieMaterial[];
}): { parts: IAutoMovieModelPart[]; materials: IAutoMovieMaterial[] } {
  const layers: readonly IPortraitHairLayer[] = props.layers ?? [];
  if (layers.length > 8)
    throw new Error("A face accepts at most eight additional hair layers.");
  const identities: Set<string> = new Set<string>();
  for (const layer of layers) {
    if (layer.id.trim().length === 0 || identities.has(layer.id))
      throw new Error("Hair layer identities must be nonblank and unique.");
    identities.add(layer.id);
  }
  const parts: IAutoMovieModelPart[] = [];
  const materials: IAutoMovieMaterial[] = structuredClone([...props.materials]);
  const append: (shape: IPortraitHairShape, layerId?: string) => void = (
    shape: IPortraitHairShape,
    layerId?: string,
  ): void => {
    const cards: IAutoMovieModelPart[] = buildPortraitHairCards(shape);
    if (cards.length === 0) return;
    const finish: IAutoMovieMaterial | undefined = props.materials.find(
      (item: IAutoMovieMaterial): boolean => item.id === shape.material,
    );
    if (finish === undefined)
      throw new Error("Hair cards require their named resident finish.");
    const material: IAutoMovieMaterial = createPortraitHairMaterial(
      finish,
      shape,
    );
    if (layerId !== undefined) {
      material.id = `human-hair-layer:${layerId}`;
      material.name = material.id;
      for (const part of cards) {
        part.id = `scalp-hair-layer:${layerId}`;
        part.name = part.id;
      }
    }
    if (
      materials.some(
        (item: IAutoMovieMaterial): boolean => item.id === material.id,
      )
    )
      throw new Error(
        "Generated hair finish identity collides with a resident material.",
      );
    materials.push(material);
    for (const part of cards) part.material = material.id;
    parts.push(...cards);
  };
  if (props.hair !== undefined) append(props.hair);
  for (const layer of layers) append(layer.profile, layer.id);
  return { parts, materials };
}
