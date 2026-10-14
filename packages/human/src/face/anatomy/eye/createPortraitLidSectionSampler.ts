type Section<K extends string> = { attachment: number } & Record<
  K,
  { offset: number; projection: number }
>;
/**
 * The shared longitudinal calculation for named upper and lower tissue rows.
 * Both profiles use the same convex weights. Ordered sections preserve their
 * row order; an anatomical validator may instead admit a returning fold and
 * is then applied to every authored and interpolated section. Positive finite
 * offsets and an attachment outside all tissue remain common requirements.
 *
 * The witnesses are copied on entry. Between two of them every offset,
 * projection and the attachment take the weight `3t^2 - 2t^3`, so each value
 * stays between its two witnesses and the curve has zero longitudinal slope at
 * every witness. Offsets and projections are millimetres in the lid's section
 * frame and progress is dimensionless. Fewer than two or more than 32
 * witnesses, a first or last progress other than exactly zero and one,
 * non-increasing progress, a non-finite or non-positive offset, an attachment
 * not beyond the outermost offset, and any failure of the optional validator
 * throw during witness admission. A query outside [0,1] throws, and the supplied
 * optional validator checks each interpolated section. Without a validator,
 * strict order and positivity after binary64 interpolation are not checked
 * again; very close represented controls may lose strict separation. Each
 * query returns a fresh object.
 *
 * @evidence contracts/common.md#principled-implementation Copied longitudinal witnesses use cubic smoothstep convex weights; common positive offsets/outer attachment and optional anatomical section validation define admission.
 * @evidence contracts/common.md#clear-and-simple-design One generic sampler supplies upper/lower roles while their owners decide returning-fold semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid witness order/ranges and optional query-validator failures refuse. Without a supplied validator, strict separation after binary64 interpolation is not independently checked; whole spatial skin/contact feasibility remains downstream.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetre sections, dimensionless progress, 2..32 witness bounds and fresh query results.
 * @evidence contracts/performance.md#efficient-algorithms Construction scans W witnesses and K roles; each query scans at most 32 brackets and interpolates K fields plus its validator cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Owned witness and role copies serve repeated queries with the same admitted profile; a supplied optional validator checks each current section, while omission performs no query-time revalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains 2..32 cloned witnesses, copied role names and the optional validator until caller release. Role count is caller-controlled without its own bound; every query creates a fresh section and acquires no handles or tasks.
 */
export function createPortraitLidSectionSampler<K extends string>(
  input: readonly { at: number; section: Section<K> }[],
  roles: readonly [K, ...K[]],
  name: "Lower-lid" | "Upper-lid",
  validateSection?: (section: Section<K>) => void,
): (at: number) => Section<K> {
  const sections: readonly { at: number; section: Section<K>; }[] = structuredClone(input);
  const ownedRoles: K[] = [...roles];
  if (
    sections.length < 2 ||
    sections.length > 32 ||
    sections[0].at !== 0 ||
    sections[sections.length - 1].at !== 1
  )
    throw new Error(
      `${name} detail needs two through 32 sections spanning zero to one.`,
    );
  for (let i: number = 0; i < sections.length; i++) {
    const { at, section }: { at: number; section: Section<K>; } = sections[i];
    if (
      !Number.isFinite(at) ||
      at < 0 ||
      at > 1 ||
      (i !== 0 && at <= sections[i - 1].at)
    )
      throw new Error(
        `${name} section progress must be finite and strictly increasing.`,
      );
    let previous: number = 0;
    for (const role of ownedRoles) {
      const point: Section<K>[K] = section[role];
      if (
        !Number.isFinite(point.offset) ||
        !Number.isFinite(point.projection) ||
        point.offset <= 0 ||
        (validateSection === undefined && point.offset <= previous)
      )
        throw new Error(
          `${name} tissue offsets must be finite, positive and strictly ordered.`,
        );
      previous = Math.max(previous, point.offset);
    }
    if (!Number.isFinite(section.attachment) || section.attachment <= previous)
      throw new Error(
        `${name} skin attachment must lie beyond its tissue section.`,
      );
    validateSection?.(section);
  }
  return (at: number): Section<K>  => {
    if (!Number.isFinite(at) || at < 0 || at > 1)
      throw new Error(
        `${name} sampling must stay in medial-to-lateral progress [0,1].`,
      );
    let index: number = 0;
    while (index < sections.length - 2 && at > sections[index + 1].at) index++;
    const left: { at: number; section: Section<K>; } = sections[index],
      right: { at: number; section: Section<K>; } = sections[index + 1];
    const t: number = (at - left.at) / (right.at - left.at),
      weight: number = t * t * (3 - 2 * t);
    const mix: (a: number, b: number) => number = (a: number, b: number): number  => a * (1 - weight) + b * weight;
    const section: Section<K> = {
      ...Object.fromEntries(
        ownedRoles.map((role: K): [K, { offset: number; projection: number; }]  => [
          role,
          {
            offset: mix(left.section[role].offset, right.section[role].offset),
            projection: mix(
              left.section[role].projection,
              right.section[role].projection,
            ),
          },
        ]),
      ),
      attachment: mix(left.section.attachment, right.section.attachment),
    } as Section<K>;
    validateSection?.(section);
    return section;
  };
}
