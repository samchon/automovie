/**
 * Three material parameters an observation pass applies to every displayed mesh.
 *
 * Each field is the same-named Three.js material parameter; an omitted field
 * keeps the observation material's default. `side` uses Three's FrontSide (0),
 * BackSide (1) and DoubleSide (2) constants.
 *
 * @author Samchon
 */
export interface IHumanObservationMaterialParameters {
  /** Base colour as a 24-bit RGB integer. */
  color?: number;

  /** Physical roughness in [0, 1]. */
  roughness?: number;

  /** Whether faces are shaded flat. */
  flatShading?: boolean;

  /** Whether triangles are drawn as edges. */
  wireframe?: boolean;

  /** Rendered face side: front (0), back (1) or double (2). */
  side?: 0 | 1 | 2;

  /** Whether the renderer's tone mapping applies. */
  toneMapped?: boolean;
}
