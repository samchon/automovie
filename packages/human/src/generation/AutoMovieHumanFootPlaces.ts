/**
 * The standing foot's yaw, the ankle centre's place along it and the
 * forefoot's dorsum heights: the foot part's frame and side-view knots the
 * published foot measures leave open.
 *
 * Estimated from the private reference set; no published source found. The
 * reading `test_human_estimate_body_places` aggregates six of the reference
 * feet (f1, f2, m1, m2, where the foot reads) on their horizontal sections:
 * the yaw of the heel's rearmost to the toe's foremost point, toe out, 2.30
 * (SD 1.02) degrees; the ankle loop's centre 0.1706 (SD 0.0326) of the foot's
 * length ahead of the heel; and the dorsum's height, the highest section
 * whose loop spans a place along the foot, over the foot's length, at the
 * forefoot's shares ({@link FOREFOOT}). The dorsum at half the foot's length
 * is published and stays with `AutoMovieHumanFootArch` (the reading's 0.209,
 * SD 0.063, agrees with its 0.214 of the foot length standing).
 *
 * Limits: six feet of four people; the sections stand 10 mm apart, so the
 * heights are read to about 0.04 of the foot's length; the replacement stays
 * open.
 */
export namespace AutoMovieHumanFootPlaces {
  /** The foot's yaw, toe out, degrees. */
  export const YAW: number = 2.3;

  /** The ankle centre ahead of the heel, per foot length. */
  export const ANKLE: number = 0.1706;

  /** The forefoot's dorsum height per foot length, at shares of the foot's length from the heel. */
  export const FOREFOOT: readonly { readonly share: number; readonly height: number }[] = [
    { share: 0.6, height: 0.1704 },
    { share: 0.7, height: 0.1002 },
    { share: 0.8, height: 0.0827 },
    { share: 0.9, height: 0.0537 },
  ];

  /**
   * The ankle centre's place along the foot.
   *
   * @param footLength The foot's length, mm.
   * @returns Distance ahead of the heel's rearmost point, mm.
   */
  export function ankle(footLength: number): number {
    return ANKLE * footLength;
  }

  /**
   * The forefoot's dorsum height at a share of the foot's length from the
   * heel, linear between the rows and held beyond them.
   *
   * @param footLength The foot's length, mm.
   * @param share Share of the length from the heel, 0.6 to 0.9.
   * @returns Height above the floor, mm.
   */
  export function dorsum(footLength: number, share: number): number {
    const rows: readonly { readonly share: number; readonly height: number }[] = FOREFOOT;
    if (share <= rows[0]!.share) return rows[0]!.height * footLength;
    for (let i: number = 0; i + 1 < rows.length; i++) {
      const a: { readonly share: number; readonly height: number } = rows[i]!;
      const b: { readonly share: number; readonly height: number } = rows[i + 1]!;
      if (share <= b.share) return (a.height + ((share - a.share) / (b.share - a.share)) * (b.height - a.height)) * footLength;
    }
    return rows[rows.length - 1]!.height * footLength;
  }
}
