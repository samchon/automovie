/**
 * Compact edits against a separately supplied immutable facial basis.
 * Zero is the source neutral; omitted channels are zero. Negative controls use
 * their authored negative endpoint, not an extrapolated positive endpoint.
 * The document contains no photo, mesh cache, renderer or Blender dependency.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Separates compact shape and performance edits from reusable source geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Binds deterministic edits to one exact basis revision and preserves material overrides independently.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisDocument {
  /** Stable identity of this authored face. */
  id: string;

  /** Display name, independent of basis selection. */
  name: string;

  /** Must equal the supplied basis identity; no implicit migration occurs. */
  basis: string;

  /** Persistent identity edits against the basis's named shape endpoints. */
  shape: Record<string, number>;

  /** Current transient expression; omitted channels mean source neutral. */
  expression: Record<string, number>;

  /**
   * Optional identity of the seated groom this face wears. Omission is bald,
   * which is what a connected basis carries on its own: the prior has no hair
   * surface, so a face only has hair because its document named one. The groom
   * itself is a separate resource, like the basis, and the consumer resolves
   * this identity against the grooms it holds.
   */
  hair?: string | null;

  /**
   * Optional identity of the observed appearance this face wears. Omission is
   * the basis's own flat finishes, which is what a connected prior carries: it
   * has one base colour per material and no maps for skin. The appearance is a
   * separate resource, like the basis and the groom, and the consumer resolves
   * this identity against the appearances it holds.
   */
  skin?: string | null;

  /** Optional linear RGB and roughness, each in [0,1], by existing material ID. */
  materials?: Record<
    string,
    { color?: { r: number; g: number; b: number }; roughness?: number }
  >;
}
