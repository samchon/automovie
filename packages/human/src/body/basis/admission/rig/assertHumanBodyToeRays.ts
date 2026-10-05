import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit a body basis's toe ray phalanges and each surface's toe split.
 *
 * Rays: unique phalanges, each parent declared earlier in the list (a
 * proximal phalanx hangs from a humanoid toes bone of its own side that the
 * basis declares as a joint), and head and tail landmarks the basis carries.
 * Splits: only on a basis with rays; phalanges among the declared rays;
 * ascending in-range vertices that each carry a positive weight on a toes
 * bone; compressed rows that tile the row arrays; and finite positive shares
 * summing to one per vertex within the source's 1e-7 weight storage unit.
 * Each refusal names the ray, surface or vertex.
 *
 * @evidence contracts/common.md#principled-implementation Admission checks every structural promise the toe ray resolver and skinning rely on, once per compiled basis.
 * @evidence contracts/common.md#clear-and-simple-design Rays first, then each surface's split.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed data refuses by name instead of being normalized or skipped.
 * @evidence contracts/common.md#meaningful-documentation Lists each admitted condition.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each phalanx is unique and hangs from a declared parent of its own ray and side.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It checks references, not positions.
 * @evidence contracts/modeling.md#shared-boundaries Shares that sum to one keep the split vertices' total weight and every other weight unchanged.
 * @evidenceExclude contracts/modeling.md#rendered-observation The posed toes are observed through the builder's consumer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The resolver owns pose admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It admits basis data, not authoring input.
 * @author Samchon
 */
export function assertHumanBodyToeRays(basis: IAutoMovieHumanBodyBasis): void {
  const rays = basis.toeRays ?? [];
  const declared = new Set<string>();
  for (const ray of rays) {
    const side = ray.bone.startsWith("left") ? "left" : "right";
    const parentOk =
      ray.parent === `${side}Toes`
        ? basis.joints.some((joint) => joint.bone === ray.parent)
        : declared.has(ray.parent) && ray.parent.startsWith(side);
    if (declared.has(ray.bone) || !parentOk || !basis.landmarks.ids.includes(ray.head) || !basis.landmarks.ids.includes(ray.tail))
      throw new Error("Body toe ray needs a unique phalanx, a declared parent of its side and both landmarks: " + ray.bone);
    declared.add(ray.bone);
  }
  for (const surface of basis.surfaces) {
    const split = surface.toeSplit;
    if (split === undefined) continue;
    const refuse = (why: string): never => {
      throw new Error(`Body toe split of surface ${surface.id} ${why}`);
    };
    if (rays.length === 0) refuse("needs a basis that declares toe rays.");
    if (split.bones.some((bone) => !declared.has(bone))) refuse("names an undeclared phalanx.");
    const vertices = surface.positions.length / 3;
    const toes = new Set(
      surface.skin.joints.flatMap((joint, slot) => (joint === "leftToes" || joint === "rightToes" ? [slot] : [])),
    );
    if (split.offsets.length !== split.vertices.length + 1 || split.offsets[0] !== 0 ||
      split.offsets[split.offsets.length - 1] !== split.bonesIndex.length || split.bonesIndex.length !== split.shares.length)
      refuse("has rows that do not tile its arrays.");
    split.vertices.forEach((vertex, row) => {
      if (!Number.isSafeInteger(vertex) || vertex < 0 || vertex >= vertices || (row > 0 && vertex <= split.vertices[row - 1]))
        refuse(`lists vertex ${vertex} out of range or order.`);
      const carries = [0, 1, 2, 3].some((k) => surface.skin.weights[vertex * 4 + k] > 0 && toes.has(surface.skin.boneIndices[vertex * 4 + k]));
      if (!carries) refuse(`lists vertex ${vertex}, which carries no toes weight.`);
      const start = split.offsets[row];
      const end = split.offsets[row + 1];
      if (end <= start) refuse(`gives vertex ${vertex} no rows.`);
      let total = 0;
      for (let r = start; r < end; r++) {
        const index = split.bonesIndex[r];
        const share = split.shares[r];
        if (!Number.isSafeInteger(index) || index < 0 || index >= split.bones.length || !Number.isFinite(share) || share <= 0)
          refuse(`has an invalid row for vertex ${vertex}.`);
        total += share;
      }
      if (Math.abs(total - 1) > 1e-7) refuse(`gives vertex ${vertex} shares summing to ${total}, not one.`);
    });
  }
}
