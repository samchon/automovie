import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit a body basis's toe ray phalanges and each surface's toe split.
 *
 * Rays: unique phalanges, each parent declared earlier in the list (a proximal phalanx hangs from a humanoid toes bone of its own side that the basis declares as a joint), and head and tail landmarks the basis carries. Splits: only on a basis with rays; phalanges among the declared rays; ascending in-range vertices that each carry a positive weight on a toes bone; compressed rows that tile the row arrays; and finite positive shares summing to one per vertex within the source's 1e-7 weight storage unit. Each refusal names the ray, surface or vertex.
 *
 * @evidence contracts/common.md#principled-implementation Parent-first same-side ray identities and resident landmarks precede compressed split-row checks with ordered vertices, actual toes influence and finite positive unit-sum shares.
 * @evidence contracts/common.md#clear-and-simple-design One toe admission stage owns ray/surface split correspondence while the later pose/skinning owners generate transforms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Splits cannot invent phalanges or toes influence; the 1e-7 share allowance is source storage precision rather than an adjustable geometry tolerance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives ray hierarchy, compressed tiling, ordering, positive shares and located refusal identities.
 * @evidence contracts/performance.md#efficient-algorithms Ray parent checks can scan J joints and L landmark IDs per ray; split admission scans skin joint slots, split vertices and all compressed entries with fixed four-influence tests.
 * @evidence contracts/performance.md#reuse-equivalent-work One declared ray set serves every surface and each surface's toes-slot set serves all of its split vertices.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Ray/slot sets and local row readings expire after synchronous admission, leaving source splits unchanged and retaining no posed-ray task.
 * @author Samchon
 */
export function assertHumanBodyToeRays(basis: IAutoMovieHumanBodyBasis): void {
  const rays: NonNullable<IAutoMovieHumanBodyBasis["toeRays"]> =
    basis.toeRays ?? [];
  const declared: Set<string> = new Set<string>();
  for (const ray of rays) {
    const side: "left" | "right" = ray.bone.startsWith("left")
      ? "left"
      : "right";
    const parentOk: boolean =
      ray.parent === `${side}Toes`
        ? basis.joints.some(
            (joint: IAutoMovieHumanBodyBasis["joints"][number]): boolean =>
              joint.bone === ray.parent,
          )
        : declared.has(ray.parent) && ray.parent.startsWith(side);
    if (
      declared.has(ray.bone) ||
      !parentOk ||
      !basis.landmarks.ids.includes(ray.head) ||
      !basis.landmarks.ids.includes(ray.tail)
    )
      throw new Error(
        "Body toe ray needs a unique phalanx, a declared parent of its side and both landmarks: " +
          ray.bone,
      );
    declared.add(ray.bone);
  }
  for (const surface of basis.surfaces) {
    const split: IAutoMovieHumanBodyBasis["surfaces"][number]["toeSplit"] =
      surface.toeSplit;
    if (split === undefined) continue;
    const refuse: (why: string) => never = (why: string): never => {
      throw new Error(`Body toe split of surface ${surface.id} ${why}`);
    };
    if (rays.length === 0) refuse("needs a basis that declares toe rays.");
    if (split.bones.some((bone: string): boolean => !declared.has(bone)))
      refuse("names an undeclared phalanx.");
    const vertices: number = surface.positions.length / 3;
    const toes: Set<number> = new Set(
      surface.skin.joints.flatMap((joint: string, slot: number): number[] =>
        joint === "leftToes" || joint === "rightToes" ? [slot] : [],
      ),
    );
    if (
      split.offsets.length !== split.vertices.length + 1 ||
      split.offsets[0] !== 0 ||
      split.offsets[split.offsets.length - 1] !== split.bonesIndex.length ||
      split.bonesIndex.length !== split.shares.length
    )
      refuse("has rows that do not tile its arrays.");
    split.vertices.forEach((vertex: number, row: number): void => {
      if (
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        vertex >= vertices ||
        (row > 0 && vertex <= split.vertices[row - 1])
      )
        refuse(`lists vertex ${vertex} out of range or order.`);
      const carries: boolean = [0, 1, 2, 3].some(
        (k: number): boolean =>
          surface.skin.weights[vertex * 4 + k] > 0 &&
          toes.has(surface.skin.boneIndices[vertex * 4 + k]),
      );
      if (!carries)
        refuse(`lists vertex ${vertex}, which carries no toes weight.`);
      const start: number = split.offsets[row];
      const end: number = split.offsets[row + 1];
      if (end <= start) refuse(`gives vertex ${vertex} no rows.`);
      let total: number = 0;
      for (let r: number = start; r < end; r++) {
        const index: number = split.bonesIndex[r];
        const share: number = split.shares[r];
        if (
          !Number.isSafeInteger(index) ||
          index < 0 ||
          index >= split.bones.length ||
          !Number.isFinite(share) ||
          share <= 0
        )
          refuse(`has an invalid row for vertex ${vertex}.`);
        total += share;
      }
      if (Math.abs(total - 1) > 1e-7)
        refuse(`gives vertex ${vertex} shares summing to ${total}, not one.`);
    });
  }
}
