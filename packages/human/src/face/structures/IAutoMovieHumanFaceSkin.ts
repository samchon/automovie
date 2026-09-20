/**
 * One subject's observed surface appearance, addressed by resident material.
 *
 * A connected facial basis ships one flat base colour and one roughness for
 * skin, which is why every face built from it reads as the same person in a
 * different size. What separates a sixty-five year old face from a twenty year
 * old one is mostly not geometry: it is pores, the creases that do not move,
 * the softened lip border, the discoloured sclera and brow. None of that is
 * expressible as a shape weight, and no amount of fitting recovers it, because
 * the fit only ever sees 468 landmark positions.
 *
 * So appearance is a separate authored resource, like the basis and like a
 * groom. It names existing material identities and replaces their maps; it
 * never introduces a material, because a map for a surface this face does not
 * have would silently do nothing.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps an authored appearance profile replaceable independently of the shape it is worn on.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Separates complete appearance replacement from the numeric colour and roughness controls.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkin {
  /** Stable identity of this authored appearance. */
  id: string;

  /** Identity of the facial basis whose UV layout the maps are painted in. */
  basis: string;

  /**
   * Replacement maps by resident material identity.
   *
   * Each map is a complete self-describing image, because an appearance has to
   * travel to a worker and into an export without a second resolution step
   * that could fail after the face is already built.
   */
  maps: Record<
    string,
    {
      /** Base colour map as a complete `data:` URL. */
      baseColorTexture: string;
    }
  >;
}
