import { Vector3 } from "@automovie/engine";

import type { AutoMovieArchetypeBuilder } from "../core";
import { ArchetypeMassArithmetic } from "../core/ArchetypeMassArithmetic";
import { ArchetypeMassPrimitive } from "../core/ArchetypeMassPrimitive";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedEars } from "./AutoMovieArchetypeQuadrupedEars";
import { QuadrupedJaw } from "./quadruped/QuadrupedJaw";
import { QuadrupedLip } from "./quadruped/QuadrupedLip";
import { QuadrupedNostrils } from "./quadruped/QuadrupedNostrils";
import type { QuadrupedProportions } from "./quadruped/QuadrupedProportions";

/** Head geometry operations shared by quadruped archetypes. */
export namespace AutoMovieArchetypeQuadrupedHead {
  /**
   * Lay the head capsule, optional pinnae, an optional jaw and an optional upper
   * lip under one source head budget.
   *
   * An optional jaw (`QuadrupedJaw`) and upper lip (`QuadrupedLip`) lie inside
   * the head capsule and carry an explicit zero weight, so the head's tissue is
   * weighed once.
   *
   * The existing source study gives a complete head share, not a separate ear
   * density or mass. Its represented capsule and two pinnae divide that unchanged
   * share by solid volume, an explicitly coarse uniform head allocation. Without
   * source shares the builder keeps its existing volume policy. A supplied budget
   * for pinnae must be finite and positive; unknown biological weights remain the
   * existing volume allocation rather than zero.
   *
   * Public only so the package's specs can reach it: it is not part of the
   * authoring surface, and it moves to an internal subpath when one exists.
   */
  export function lay<
    Id extends string,
    Dimension extends string,
  >(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    head: Pick<
      AutoMovieArchetypeQuadrupedBody.IRig,
      "poll" | "nose" | "headRadius"
    >,
    withers: number,
    profile: Readonly<QuadrupedProportions.IHead>,
    color: string,
    share?: number,
  ): void {
    const ears: AutoMovieArchetypeQuadrupedEars.IPrepared | undefined =
      profile.ears === undefined
        ? undefined
        : AutoMovieArchetypeQuadrupedEars.prepare(head, withers, profile.ears);
    let capsuleShare: number | undefined = share;
    let earShare: number | undefined = undefined;
    if (ears !== undefined && share !== undefined) {
      if (!(share > 0))
        throw new RangeError(
          "A physical head with pinnae requires a finite positive source budget or volume allocation",
        );
      const solid: ReturnType<typeof ArchetypeMassPrimitive> =
        ArchetypeMassPrimitive({
          type: "capsule",
          radius: head.headRadius,
          height: Vector3.length(Vector3.subtract(head.nose, head.poll)),
        });
      if (solid === null)
        throw new RangeError(
          "The complete head must have representable positive solid volume",
        );
      const volume: number = solid.volume + ears.volume;
      capsuleShare = ArchetypeMassArithmetic.ratio(
        share,
        solid.volume,
        volume,
        1,
      );
      earShare = ArchetypeMassArithmetic.ratio(share, ears.volume, volume, 1);
      if (!(capsuleShare > 0) || !(earShare / 2 > 0))
        throw new RangeError(
          "Positive head and ear allocations must be representable",
        );
    }
    builder.rod("head", head.headRadius, head.poll, head.nose, {
      color,
      round: true,
      share: capsuleShare,
    });
    ears?.emit(builder, color, earShare);

    // The jaw lies inside the head capsule, so its tissue is weighed with the head's and it carries an explicit zero weight, under source shares and volume allocation alike.
    if (profile.jaw !== undefined)
      QuadrupedJaw.lay(builder, head, profile.jaw, color);

    // The upper lip and the nostrils lie inside the head capsule too, under the same zero weight.
    if (profile.lip !== undefined)
      QuadrupedLip.lay(builder, head, profile.lip, color);
    if (profile.nostrils !== undefined)
      QuadrupedNostrils.lay(builder, head, profile.nostrils, color);
  }
}
