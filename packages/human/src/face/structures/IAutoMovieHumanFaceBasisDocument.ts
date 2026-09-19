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
   * Optional per-vertex identity, by surface, moving the neutral this document
   * is edited from.
   *
   * The named channels reach the faces the basis was authored to reach, and no
   * further. A fit against 468 landmarks has 84 shape degrees of freedom and
   * nearly a thousand constraints, and it converges: the residual at the
   * landmarks is about a millimetre. What remains is between them — the shape
   * of a cheek across the span where no landmark sits — and no amount of
   * channel weight recovers it, because the channels do not describe it.
   *
   * MetaHuman's DNA carries a character's neutral as vertex positions and keeps
   * its rig parametric above them (`GeometryReader.h`: `getVertexPosition`).
   * This is the same separation. A shared neutral with identity expressed only
   * as channel weights is the layer this basis was missing.
   *
   * Rows are sparse and packed as `[vertex, dx, dy, dz]`, exactly as an
   * endpoint's `targets` are, and are applied before any channel: identity
   * moves the neutral, and an expression moves from the neutral this face
   * actually has. Applying it afterwards would mix the two, so a wider jaw
   * would open differently from a narrow one for no authored reason.
   *
   * Omission is the shared neutral, which is what every face built from this
   * basis was before. Nothing here infers a delta; it is authored or derived
   * by the caller like any other geometry.
   */
  identity?: Record<string, number[]>;

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
