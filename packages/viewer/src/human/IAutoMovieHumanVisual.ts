import type {
  IAutoMovieHumanExpression,
  IAutoMovieHumanPose,
} from "@automovie/human";
import type * as THREE from "three";

/**
 * Existing rigid drawings consumed by the optional Human facade.
 * Successful construction transfers disposal ownership. Targets are bone-local
 * geometry groups with identity scale, below object; each target has one binding.
 * The facade owns target matrices with matrixAutoUpdate disabled and
 * matrixWorldAutoUpdate enabled; position,
 * quaternion and scale are not their sampled placement authority. Keep the
 * hierarchy fixed. Root and ancestor transforms may contain scale and shear
 * when their affine matrices and inverses remain finite and nonsingular.
 * Accepted update calls refresh ancestor placements even while paused; callers
 * using manual ancestor matrixWorld values must keep those values current.
 * Geometry and face construction remain with the caller, outside the facade.
 *
 * @evidence contracts/common.md#principled-implementation Explicit bone identities bind original Object3D groups without name guessing, geometry copying or a normalized humanoid cast.
 * @evidence contracts/common.md#clear-and-simple-design Structural placement slots, optional explicit face updates and one disposer are the complete drawing boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This contract supplies no mannequin catalogue, skin weights, facial animation sampler or physics adapter.
 * @evidence contracts/common.md#meaningful-documentation States geometry frames, identity scale, unique placement ownership, successful transfer and face callback failure responsibilities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares borrowed drawing references and no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse and mutation of drawings belong to the facade and supplied callbacks rather than this erased declaration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The facade snapshots binding arrays and callback identities, retains actual drawing objects until disposal and invokes the transferred disposer once.
 */
export interface IAutoMovieHumanVisual {
  /** Drawing root attached below the facade's whole-character placement root. */
  object: THREE.Object3D;

  /** Exact Human bone ids and their original rigid placement groups. */
  bindings: readonly { bone: string; objects: readonly THREE.Object3D[] }[];

  /**
   * Replace only the explicit face drawing and return unsupported public fields.
   * Inputs are independent copies. Input or construction refusal preserves the
   * previous drawing. A retirement failure may leave a partial drawing and must
   * terminate further face updates; dispose still attempts the other owned resources
   * once and reports that failure. Runs on explicit controls, never per frame.
   *
   * @evidence contracts/common.md#principled-implementation The explicit callback receives independent expression and head-pose snapshots and returns unsupported field names for the actual original drawing.
   * @evidence contracts/common.md#clear-and-simple-design Face geometry stays with the supplied visual instead of the transport or rigid binding.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refusal must retain the prior drawing; retirement failure may be partial and terminal, and no supported-action guarantee is inferred from a label.
   * @evidence contracts/common.md#meaningful-documentation Documents callback input isolation, explicit-only invocation and failure/disposal obligations.
   * @evidence contracts/performance.md#efficient-algorithms The signature is erased; implementation cost belongs to the supplied explicit face update, never an implicit per-frame callback.
   * @evidence contracts/performance.md#reuse-equivalent-work Body geometry and rigid bindings remain reusable across expression updates.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The visual owns replacement resources and one-attempt retirement; the facade copies returned unsupported names.
   */
  updateFace?: (
    expression: IAutoMovieHumanExpression,
    head?: IAutoMovieHumanPose["head"],
  ) => readonly string[];

  /** Release caller-created drawing resources; called once by the successful facade owner.
   *
   * @evidence contracts/common.md#principled-implementation The transferred visual's disposer retires the original drawing resources after successful facade construction.
   * @evidence contracts/common.md#clear-and-simple-design One visual callback owns geometry/material cleanup independently from binding player cleanup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The facade calls it once through failure fan-out; failed construction leaves visual ownership with its caller.
   * @evidence contracts/common.md#meaningful-documentation Documents transfer timing and the original resource owner's cleanup obligation.
   * @evidence contracts/performance.md#efficient-algorithms The signature is erased; cleanup cost scales with resources actually owned by the visual implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated facade disposal reuses terminal success or its stored cause rather than repeating this callback.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The implementation must release owned drawing handles; neither this type nor the binding disposes borrowed geometry.
   */
  dispose: () => void;
}
