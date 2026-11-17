import { Vector3 } from "@automovie/engine";

import type { ArchetypeBuilder } from "../core";
import { ArchetypeMassArithmetic } from "../core/ArchetypeMassArithmetic";
import { ArchetypeMassPrimitive } from "../core/ArchetypeMassPrimitive";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedEars } from "./QuadrupedEars";

/**
 * Lay the actual head capsule and optional pinnae under one source head budget.
 *
 * The existing source study gives a complete head share, not a separate ear
 * density or mass. Its represented capsule and two pinnae divide that unchanged
 * share by actual solid volume, an explicitly coarse uniform head allocation.
 * Without source shares the builder keeps its existing actual-volume policy.
 * A supplied budget for actual pinnae must be finite and positive; unknown
 * biological weights remain the existing volume allocation rather than zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual neutral metre geometry, optional normalized ear profile, complete source head share and the uniform coarse allocation; no ear density or biological ear mass is asserted.
 * @evidence contracts/development/implementation.md#principled-implementation Prepare optional ears once. For a supplied complete-head share, the exact capsule volume and prepared pair volume divide that same budget. Emit the unchanged capsule primitive and the admitted pair with those weights; unprofiled heads retain the original share directly.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Optional preparation, optional source-budget allocation, one capsule and one pair emission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither massless actual ears nor a guessed ear-mass percentage/density removes geometry from allocation. No body/limb/source total changes; unrepresentable positive allocation refuses instead of silently rounding a real part to zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant head arithmetic and one reusable two-ear preparation occur only during construction; unprofiled heads incur no extra volume allocation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing primitive mass arithmetic owns actual capsule volume and stable proportional weights; the exact prepared ear dimensions/volume serve both allocation and emission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only one call-local ear plan and scalar weights exist; the builder owns emitted parts and no source profile, model, result cache or host is retained.
 */
export function QuadrupedHead<Id extends string, Dimension extends string>(
  builder: ArchetypeBuilder<Id, Dimension>,
  head: Pick<QuadrupedBody.IRig, "poll" | "nose" | "headRadius">,
  withers: number,
  profile: QuadrupedBody.IBody["head"],
  color: string,
  share?: number,
): void {
  const ears: QuadrupedEars.IPrepared | undefined =
    profile.ears === undefined
      ? undefined
      : QuadrupedEars.prepare(head, withers, profile.ears);
  let capsuleShare: number | undefined = share;
  let earShare: number | undefined = undefined;
  if (ears !== undefined && share !== undefined) {
    if (!(Number.isFinite(share) && share > 0))
      throw new RangeError(
        "A physical head with pinnae requires a finite positive source budget or volume allocation",
      );
    const solid: ReturnType<typeof ArchetypeMassPrimitive> =
      ArchetypeMassPrimitive({
        type: "capsule",
        radius: head.headRadius,
        height: Vector3.length(Vector3.subtract(head.nose, head.poll)),
      });
    if (solid === null || !Number.isFinite(solid.volume + ears.volume))
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
}
