import type { IHumanSkinBindingAdmission } from "./IHumanSkinBindingAdmission";

/**
 * Admit one four-influence table before any skinning reads its slots.
 *
 * Every joint name is declared once and every slot, including zero-weight
 * padding, addresses that table with an integer index. Weights are finite
 * and nonnegative; each row sums to one using the existing body's 1e-5
 * serialization allowance for seven-decimal source weights. Repeated slot
 * indices remain legal. Indexed iteration also checks missing array slots,
 * whose undefined values cannot be valid influences. A refusal changes no
 * caller-owned table and establishes no anatomical or contact qualification.
 *
 * @evidence contracts/common.md#principled-implementation Admits four slots per actual vertex, unique declared joints, finite nonnegative weights and unit sums within the seven-decimal serialization allowance, leaving source tables unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One common guard owns numerical rules for body and head; the input supplies their actual vertex denominator and labels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Four slots and the 1e-5 allowance belong to the serialized binding contract, not a fixture, person measurement or relaxed contact test.
 * @evidence contracts/common.md#meaningful-documentation Documents zero-weight padding, repeated legal indices, sparse-slot refusal and the limits of binding validity.
 * @evidence contracts/performance.md#efficient-algorithms For J joints and V vertices, uniqueness and fixed-four-slot scans cost O(J+V) time and O(J) temporary storage; indexed iteration also visits missing slots.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the caller's declared set and current table directly; replaced mutable weights require fresh admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The joint uniqueness set ends on success/refusal; no binding arrays, handles or tasks are retained.
 */
export function assertHumanSkinBinding(
  input: IHumanSkinBindingAdmission,
): void {
  const { binding, vertices, declared, surface, description }: IHumanSkinBindingAdmission = input;
  const invalid: () => never = (): never => {
    throw new Error(
      `${description} needs four declared-joint influences with nonnegative weights per vertex: ${surface}`,
    );
  };
  if (
    !Number.isInteger(vertices) ||
    vertices < 0 ||
    binding.joints.length === 0 ||
    new Set(binding.joints).size !== binding.joints.length ||
    binding.boneIndices.length !== vertices * 4 ||
    binding.weights.length !== vertices * 4
  )
    invalid();
  for (let joint: number = 0; joint < binding.joints.length; joint++)
    if (!declared.has(binding.joints[joint])) invalid();
  for (let slot: number = 0; slot < vertices * 4; slot++) {
    const index: number = binding.boneIndices[slot];
    const weight: number = binding.weights[slot];
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= binding.joints.length ||
      !Number.isFinite(weight) ||
      weight < 0
    )
      invalid();
  }
  for (let vertex: number = 0; vertex < vertices; vertex++) {
    const total: number =
      binding.weights[4 * vertex] +
      binding.weights[4 * vertex + 1] +
      binding.weights[4 * vertex + 2] +
      binding.weights[4 * vertex + 3];
    if (Math.abs(total - 1) > 1e-5)
      throw new Error(
        `${description} weights must sum to one per vertex: ${surface}`,
      );
  }
}
