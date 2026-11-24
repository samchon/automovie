/**
 * The force bounds of the stance's contacts through support changes: each
 * limb asked to step keeps its contacts held while its bearing share of the
 * vertical force bounds their total, ramping to zero before it lifts (Herzog
 * et al. 2016, Section 5.3), both feet of a diagonal pair alike; a foot
 * entering the holds, landed or touching again after it left them, has its
 * bound ramp in with the lesser of its bearing and entry shares, mirrored at
 * lift-off (design-4017-qp3, Section 3, rule 3). A foot fully in has none.
 *
 * @param input The vertical force the stance is asked for, newtons, positive;
 *   the limbs asked to step that have not lifted, in request order; the stance
 *   limbs, in pattern order; and each foot's seating shares.
 * @returns The bounds by limb: the leaving limbs' first, then the entering
 *   ones'.
 */
export function physicalRootBounds(input: {
  force: number;
  requested: readonly string[];
  stance: readonly string[];
  seating?: Readonly<Record<string, { bearing?: number; entry?: number }>>;
}): physicalRootBounds.IBound[] {
  const leaving: physicalRootBounds.IBound[] = input.requested.map(
    (bone: string): physicalRootBounds.IBound => ({
      bone,
      force:
        Math.max(0, Math.min(1, input.seating?.[bone]?.bearing ?? 1)) *
        input.force,
    }),
  );
  const entering: physicalRootBounds.IBound[] = input.stance.flatMap(
    (bone: string): physicalRootBounds.IBound[] => {
      if (input.requested.includes(bone)) return [];
      const seat: { bearing?: number; entry?: number } | undefined =
        input.seating?.[bone];
      const ramp: number = Math.max(
        0,
        Math.min(1, seat?.bearing ?? 1, seat?.entry ?? 1),
      );
      return ramp < 1 ? [{ bone, force: ramp * input.force }] : [];
    },
  );
  return [...leaving, ...entering];
}

/** The bounds {@link physicalRootBounds} sets. */
export namespace physicalRootBounds {
  /** One limb's bound on its contacts' total normal force. */
  export interface IBound {
    /** The limb's endpoint bone. */
    bone: string;
    /** The bound, newtons. */
    force: number;
  }
}
