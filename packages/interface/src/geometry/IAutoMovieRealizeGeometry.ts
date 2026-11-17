import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";

/**
 * Finite mesh output and processing diagnostics for a public geometry recipe.
 *
 * Mesh coordinates are model-local metres; complete describes recipe processing rather than embedding, source fidelity or watertightness. Display requests may receive incomplete finite atlases; an explicit complete requirement throws on incomplete processing, while source-fit diagnostics can remain on complete output.
 *
 * @evidence contracts/development/design.md#principled-representation Mesh coordinates are model-local metres; complete describes recipe processing rather than embedding, source fidelity or watertightness.
 * @evidence contracts/development/design.md#minimal-and-owned-surface realizeAutoMovieGeometry shares one dispatch for drawing, framing and measurement; existing meshes are borrowed and generated buffers transfer to the caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Display requests may receive incomplete finite atlases; an explicit complete requirement throws on incomplete processing, while source-fit diagnostics can remain on complete output.
 * @evidence contracts/development/common.md#meaningful-documentation Finite mesh output and processing diagnostics for a public geometry recipe. Mesh coordinates are model-local metres; complete describes recipe processing rather than embedding, source fidelity or watertightness.
 */
export namespace IAutoMovieRealizeGeometry {
  /**
   * The result of resolving a public recipe through its deterministic engine owner.
   * Mesh input is borrowed unchanged; recipes produce newly owned arrays.
   * Atlas completion and diagnostics describe processing, not shape quality.
   * Retained finite geometry is returned by default, including for indirect
   * framing and drawing callers. Only an explicit complete-processing query
   * refuses partial output; display never opts into that gate.
   *
   * @evidence contracts/development/design.md#principled-representation Mesh coordinates are model-local metres; complete describes recipe processing rather than embedding, source fidelity or watertightness.
   * @evidence contracts/development/design.md#minimal-and-owned-surface realizeAutoMovieGeometry shares one dispatch for drawing, framing and measurement; existing meshes are borrowed and generated buffers transfer to the caller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Display requests may receive incomplete finite atlases; an explicit complete requirement throws on incomplete processing, while source-fit diagnostics can remain on complete output.
   * @evidence contracts/development/common.md#meaningful-documentation Finite mesh output and processing diagnostics for a public geometry recipe. Mesh coordinates are model-local metres; complete describes recipe processing rather than embedding, source fidelity or watertightness.
   */
  export type IResult = {
    /**
     * Renderable metre mesh; an explicit mesh recipe returns the same object, while primitive and atlas recipes allocate geometry. Borrowed mesh mutation remains visible to its owner.
     */
    mesh: IAutoMovieMesh;

    /**
     * Whether recipe processing completed under its structural and resource rules; explicit meshes and primitives report true, even though this is no geometric-quality certificate.
     */
    complete: boolean;

    /**
     * New processing and source-fit messages; empty for primitive and explicit-mesh dispatch. A nonempty list alone does not imply complete is false.
     */
    diagnostics: string[];
  };
}
