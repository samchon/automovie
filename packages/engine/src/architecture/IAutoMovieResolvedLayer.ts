/** One layer placed on the host's own measuring line. */
export interface IAutoMovieResolvedLayer {
  /** The contributing {@link IAutoMovieMaterialLayer.id}. */
  id: string;
  /** The layer's construction role. */
  role: string;
  /** What occupies the layer. */
  substance: "solid" | "cavity" | "membrane";
  /** Substance id, or `null` for a cavity. */
  material: string | null;
  /** Authored layer thickness in metres. */
  thickness: number;
  /** Signed coordinate of the face nearer the reference plane. */
  start: number;
  /** Signed coordinate of the face further from the reference plane. */
  end: number;
  /** Signed coordinate of the layer's midplane. */
  center: number;
  /** Whether the layer is a visible finish. */
  finish: boolean;
  /** Whether the layer continues around an opening's reveal. */
  wrapsOpening: boolean;
}
