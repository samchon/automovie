/**
 * The standing foot's observed yaw, ankle skin-loop place, dorsum heights
 * and toe skin reaches ({@link TOES}, from `test_human_estimate_sites`).
 * Their source normalizers differ: body-X projection for ankle/dorsum,
 * rotated heel-to-foremost length for toes.
 *
 * Estimated from the private reference set; no published source found. The
 * reading `test_human_estimate_body_places` aggregates six of the reference
 * feet (f1, f2, m1, m2, where the foot reads) on their horizontal sections:
 * the yaw of the heel's rearmost to the toe's foremost point, toe out, 2.30
 * (SD 1.02) degrees; the ankle loop's centre 0.1706 (SD 0.0326) of the foot's
 * body-X span ahead of the heel; and the dorsum's height, the highest section
 * whose loop spans a body-X place, divided by that same projected span, at
 * the forefoot's projected shares ({@link FOREFOOT}). The dorsum at half that
 * projected span reads 0.209 (SD 0.063). `AutoMovieHumanFootArch` instead uses
 * a published standing ratio, 0.214 of foot length. These distinct length
 * normalizers and station definitions do not establish numeric agreement.
 *
 * Limits: six feet of four people; the sections stand 10 mm apart, so the
 * heights are read to about 0.04 of the foot's length; the replacement stays
 * open. The observed loop centre is not an independently measured ankle
 * joint centre; applying its offset to that joint is a placement assumption.
 * Reusing body-X ratios as rotated along-axis ratios is another assumption,
 * not an exact frame conversion recovered by these aggregates.
 *
 * @evidence contracts/common.md#principled-implementation Publishes the existing skin observations with their distinct body-X and heel-to-foremost normalizers, separating them from bone-joint measurements and exact frame conversions.
 * @evidence contracts/common.md#clear-and-simple-design Keeps placement data and its two scalar helpers together; consumers own breadth normalization and skeletal placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no observation, person branch or new coefficient; existing four-person estimates retain their stated limits.
 * @evidence contracts/common.md#meaningful-documentation Gives readers, sample counts, axes, normalizers, uncertainty and the distinction between skin reaches and bony joints.
 * @evidence contracts/performance.md#efficient-algorithms Two scalar helpers use constant arithmetic or scan four fixed dorsum rows; the data performs no geometry work.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share one fixed data set; no output-dependent or effectful work is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed module tables persist; helper results are numbers and retain no figure or reference data.
 */
export namespace AutoMovieHumanFootPlaces {
  /**
   * Observed heel-to-foremost yaw, toe out, degrees.
   */
  export const YAW: number = 2.3;

  /**
   * Observed ankle skin-loop vertex-mean X ahead of heel X, per body-X span.
   */
  export const ANKLE: number = 0.1706;

  /**
   * Dorsum height per body-X span, at projected shares from heel X.
   */
  export const FOREFOOT: readonly { readonly share: number; readonly height: number }[] = [
    { share: 0.6, height: 0.1704 },
    { share: 0.7, height: 0.1002 },
    { share: 0.8, height: 0.0827 },
    { share: 0.9, height: 0.0537 },
  ];

  /**
   * Scale the observed body-X ankle ratio by the caller's length.
   * FootInterim uses the result along its rotated axis; that basis transfer
   * and the skin-loop-to-joint transfer are placement assumptions.
   *
   * @param footLength The foot's length, mm.
   * @returns Estimated offset from the heel, mm, in the caller's chosen basis.
   *
   * @evidence contracts/common.md#principled-implementation Multiplies the retained dimensionless body-X ratio by supplied length; a skeletal-joint or rotated-basis interpretation remains a caller assumption.
   * @evidence contracts/common.md#clear-and-simple-design Scales one ratio without pretending to reconstruct the missing two-dimensional frame translation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamp, fitted correction or person branch is present.
   * @evidence contracts/common.md#meaningful-documentation Names the observed datum, millimetres and heel origin.
   * @evidence contracts/performance.md#efficient-algorithms One multiplication has constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar conversion has no equivalent cross-request work to share.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no call state and returns one number.
   */
  export function ankle(footLength: number): number {
    return ANKLE * footLength;
  }

  /**
   * Scale the observed body-X dorsum profile by the caller's length,
   * linear between rows and held beyond them. Applying its station/value
   * ratios along a rotated axis is a modelling approximation.
   *
   * @param footLength The foot's length, mm.
   * @param share Source projected-span share from the heel, 0.6 to 0.9.
   * @returns Height above the floor, mm.
   *
   * @evidence contracts/common.md#principled-implementation Linearly interpolates the observed body-X-normalized heights and holds endpoint values, then scales by supplied length with any basis transfer left explicit.
   * @evidence contracts/common.md#clear-and-simple-design Reads the one source table directly without a duplicate spline or builder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Makes no unsupported curvature, body-specific correction or newly observed row.
   * @evidence contracts/common.md#meaningful-documentation States station shares, floor datum, linear interpolation and endpoint holding.
   * @evidence contracts/performance.md#efficient-algorithms Scans at most four fixed rows with constant local storage and no allocation.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the shared immutable-by-type table directly; no geometry or result cache is created.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Locals retain only the module table during the call; the returned scalar owns no resource.
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

  /**
   * The toes' skin reaches, medial (the hallux) to lateral: each foremost point
   * ahead of the heel along the axis from the heel's rearmost to the foot's
   * foremost point, and its first loop's vertex-mean across that axis
   * toward the little toe, per foot length.
   *
   * `test_human_estimate_sites` reads foot-axis projections of horizontal
   * skin loops on four feet, below 25 mm and ahead of 0.7 of the foot's
   * length, each toe's tip the foremost over its
   * sections; SDs: tip 0.021, 0.018, 0.021, 0.020 and
   * 0.013, across 0.008, 0.006, 0.002, 0.007 and 0.008. The sections part six
   * loops per foot on average (SD 1.1), so the feet where they part other
   * than five are left out.
   *
   * These are skin observations, not metatarsal heads or MTP/PIP/DIP joint
   * centres. Reusing their across centres for a rig requires a separate
   * placement convention. The independent public breadth is applied by the
   * consumer; these retained ratios are still normalized by foot length.
   * Across means are not toe-normal breadths; gap-based width packing is a
   * construction proxy. Combining the along maximum and first-loop across
   * mean gives a generated apex proxy, not an observed three-dimensional tip.
   */
  export const TOES: readonly { readonly tip: number; readonly across: number }[] = [
    { tip: 0.9681, across: 0.0072 },
    { tip: 0.9782, across: 0.1119 },
    { tip: 0.9354, across: 0.1639 },
    { tip: 0.8726, across: 0.2209 },
    { tip: 0.7883, across: 0.2574 },
  ];
}
