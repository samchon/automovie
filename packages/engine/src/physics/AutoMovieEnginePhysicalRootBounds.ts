

/** The bounds {@link physicalRootBounds} sets. */
export namespace AutoMovieEnginePhysicalRootBounds {
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
  export function set(input: IInput): AutoMovieEnginePhysicalRootBounds.IBound[] {
    const leaving: AutoMovieEnginePhysicalRootBounds.IBound[] = input.requested.map(
      (bone: string): AutoMovieEnginePhysicalRootBounds.IBound => ({
        bone,
        force:
          Math.max(0, Math.min(1, input.seating?.[bone]?.bearing ?? 1)) *
          input.force,
      }),
    );
    const entering: AutoMovieEnginePhysicalRootBounds.IBound[] = input.stance.flatMap(
      (bone: string): AutoMovieEnginePhysicalRootBounds.IBound[] => {
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

  /** Inputs for one root-bound evaluation. */
  export interface IInput {
    /** Requested total vertical force in newtons. */
    force: number;
    /** Limbs requested to leave their stance. */
    requested: readonly string[];
    /** Endpoint bones in stance order. */
    stance: readonly string[];
    /** Each foot?s bearing and entry shares by bone. */
    seating?: Readonly<Record<string, { bearing?: number; entry?: number }>>;
  }

  /** One limb's bound on its contacts' total normal force. */
  export interface IBound {
    /** The limb's endpoint bone. */
    bone: string;
    /** The bound, newtons. */
    force: number;
  }
}
