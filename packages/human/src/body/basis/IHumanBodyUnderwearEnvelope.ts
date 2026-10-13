import type { IHumanBodyUnderwearEnvelopeReading } from "./IHumanBodyUnderwearEnvelopeReading";
import type { IHumanBodyUnderwearEnvelopeFaceReading } from "./IHumanBodyUnderwearEnvelopeFaceReading";

/**
 * One original qualified centre field, shared by fitting and final evaluation.
 *
 * @evidence contracts/common.md#principled-implementation Free own-ball anchors, immutable center count and point/face readers describe one qualified nearest-center field with deterministic active-branch identity.
 * @evidence contracts/common.md#clear-and-simple-design One compiled envelope exposes scalar point and complete planar-face queries to both fitting and final evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fitting cannot alter the qualified center population or replace a complete face-direction check with point samples.
 * @evidence contracts/common.md#meaningful-documentation Members explain anchor flags, resident center count, continuous distance and complete face-direction scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Envelope typing chooses no nearest-center hierarchy or restricted Voronoi algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared query methods describe one compiled field; its creator owns actual center/hierarchy reuse and active-seed identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface declares callbacks but acquires no center hierarchy or closure lifetime itself.
 * @author Samchon
 */
export interface IHumanBodyUnderwearEnvelope {
  /** Qualified own balls whose original surface points remain exact anchors. */
  free: Uint8Array;

  /** Actual qualified centre population; fitting does not alter it. */
  centres: number;

  /**
   * Continuous nearest-centre distance with one deterministic active branch.
   *
   * @evidence contracts/common.md#principled-implementation The compiled hierarchy searches all potentially nearer qualified centres and resolves equal represented distances by lower centre ID.
   * @evidence contracts/common.md#clear-and-simple-design One point query returns distance, copied active-centre coordinates and a radial gradient for the shared ball field.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The finite three-coordinate point belongs to posed metres; a piecewise gradient or proximity reading does not admit the complete connected garment.
   * @evidence contracts/common.md#meaningful-documentation Distance is in metres, the gradient is zero at a centre, and deterministic branch choice does not make the gradient globally smooth.
   * @evidence contracts/performance.md#efficient-algorithms Bounding-box pruning can reduce traversal, but the worst case visits every qualified centre rather than guaranteeing logarithmic work.
   * @evidence contracts/performance.md#reuse-equivalent-work The immutable hierarchy and last selected centre seed subsequent bounds without suppressing necessary search or lower-ID ties.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each reading owns small copied arrays; the envelope retains the shared hierarchy and one recent centre until its query closures become unreachable.
   */
  read(point: readonly number[]): IHumanBodyUnderwearEnvelopeReading;

  /**
   * Complete exterior direction over the actual planar face.
   *
   * @evidence contracts/common.md#principled-implementation The shared face reader restricts the actual triangle against qualified-centre Voronoi cells and checks the represented exterior direction over each resulting polygon.
   * @evidence contracts/common.md#clear-and-simple-design The envelope delegates complete face analysis while supplying its unchanged centres, hierarchy and one nearest-point seed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Nine finite posed-metre coordinates identify the actual face; vertex samples cannot replace complete face coverage and unavailable arithmetic remains explicit.
   * @evidence contracts/common.md#meaningful-documentation The result concerns the represented planar triangle and qualified field, without certifying continuous body motion or physical cloth behavior.
   * @evidence contracts/performance.md#efficient-algorithms The complete reader prunes by hierarchy bounds but worst-case cell clipping grows cubically with centre count and exact arithmetic cost depends on operand bit width.
   * @evidence contracts/performance.md#reuse-equivalent-work Point seeding and the immutable centre hierarchy are shared; polygon identity reuses exact bounds during the current cell's hierarchy walk without equating changed polygons.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate, cell-polygon and arithmetic state, including its polygon-bound cache, are call-local and expire after the scalar reading returns; no external solver or task is acquired.
   */
  readFace(face: readonly number[]): IHumanBodyUnderwearEnvelopeFaceReading;
}
