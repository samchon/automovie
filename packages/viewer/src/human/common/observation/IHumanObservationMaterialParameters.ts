/**
 * Three material parameters an observation pass applies to every displayed mesh.
 *
 * Each field is the same-named Three.js material parameter; an omitted field
 * keeps the observation material's default. `side` uses Three's FrontSide (0),
 * BackSide (1) and DoubleSide (2) constants.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Optional native material fields specify a structural pass without changing numerical geometry. Values require the native constructor's supported ranges; this type declares color/roughness/side meanings but does not perform runtime admission.
 * @evidence contracts/common.md#clear-and-simple-design Only parameters actually varied by the shared pass table are exposed; per-source albedo preservation belongs to its separate material owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Colors and side choices are declared diagnostic conventions rather than inferred anatomical material measurements or fixture-specific settings.
 * @evidence contracts/common.md#meaningful-documentation Fields state RGB integer, roughness range, native side values and optional default meaning, keeping diagnostic material settings separate from source appearance.
 * @evidence contracts/performance.md#efficient-algorithms The fixed-size record adds no mesh processing; native material creation and scene traversal belong to the consuming pass.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical pass definition shares these numerical settings, while native reversible material state remains independent for each observation owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This record contains scalars only, no material, texture or task. The pass owner retires its native replacements.
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
