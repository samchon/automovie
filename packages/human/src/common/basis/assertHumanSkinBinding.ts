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
 */
export function assertHumanSkinBinding(
  input: IHumanSkinBindingAdmission,
): void {
  const { binding, vertices, declared, surface, description } = input;
  const invalid = (): never => {
    throw new Error(
      `${description} needs four declared-joint influences with nonnegative weights per vertex: ${surface}`,
    );
  };
  if (
    !Number.isInteger(vertices) ||
    vertices < 0 ||
    binding.joints.length === 0 ||
    new Set(binding.joints).size !== binding.joints.length ||
    binding.joints.some((bone) => !declared.has(bone)) ||
    binding.boneIndices.length !== vertices * 4 ||
    binding.weights.length !== vertices * 4
  )
    invalid();
  for (let slot = 0; slot < vertices * 4; slot++) {
    const index = binding.boneIndices[slot];
    const weight = binding.weights[slot];
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= binding.joints.length ||
      !Number.isFinite(weight) ||
      weight < 0
    )
      invalid();
  }
  for (let vertex = 0; vertex < vertices; vertex++) {
    const total =
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
