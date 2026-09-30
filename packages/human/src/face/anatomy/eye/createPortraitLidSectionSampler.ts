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
 * throw, at construction for the witnesses and at query time for each
 * interpolated section; a query outside [0,1] throws too. Each query returns a
 * fresh object.
 *
 * @evidence contracts/common.md#principled-implementation A convex weight in [0,1] applied to every scalar of two valid sections gives a section whose scalars lie between theirs, so positivity and, for strictly ordered witnesses, the strict order of the offsets survive interpolation, which is why the ordinary profile needs no per-sample ordering test. The optional validator exists because the folded upper lid deliberately breaks the ordering for one role, and there the interpolated section is checked instead of assumed. Smoothstep gives zero slope at each witness, so the tissue rows meet without a kink.
 * @evidence contracts/common.md#clear-and-simple-design One generic function owns witness validation and interpolation for both lids, so the upper and lower profiles differ only by their role lists and validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sampler is a function of the witnesses and query only, with no case named after a subject or fixture and no compensating retry.
 * @evidence contracts/common.md#meaningful-documentation The comment states the interpolation weight, its consequences, the units, the copy, each refusal and when it is raised, and that each query returns a fresh object.
 * @evidence contracts/modeling.md#spatial-conventions Offsets, projections and attachments are millimetres in one section frame and progress is a dimensionless medial-to-lateral fraction, so no unit or frame is converted here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function interpolates section witnesses and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines no channel; the section fields it reads are declared by the section types.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the attachment distance it returns is consumed by the lid rows that meet the host skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part and displays nothing; the lids built from its sections are observed under the eye component.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; it interpolates the witnesses its caller supplies.
 */
export function createPortraitLidSectionSampler<K extends string>(
  input: readonly { at: number; section: Section<K> }[],
  roles: readonly [K, ...K[]],
  name: "Lower-lid" | "Upper-lid",
  validateSection?: (section: Section<K>) => void,
): (at: number) => Section<K> {
  const sections = structuredClone(input);
  const ownedRoles = [...roles];
  if (
    sections.length < 2 ||
    sections.length > 32 ||
    sections[0].at !== 0 ||
    sections[sections.length - 1].at !== 1
  )
    throw new Error(
      `${name} detail needs two through 32 sections spanning zero to one.`,
    );
  for (let i = 0; i < sections.length; i++) {
    const { at, section } = sections[i];
    if (
      !Number.isFinite(at) ||
      at < 0 ||
      at > 1 ||
      (i !== 0 && at <= sections[i - 1].at)
    )
      throw new Error(
        `${name} section progress must be finite and strictly increasing.`,
      );
    let previous = 0;
    for (const role of ownedRoles) {
      const point = section[role];
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
  return (at) => {
    if (!Number.isFinite(at) || at < 0 || at > 1)
      throw new Error(
        `${name} sampling must stay in medial-to-lateral progress [0,1].`,
      );
    let index = 0;
    while (index < sections.length - 2 && at > sections[index + 1].at) index++;
    const left = sections[index],
      right = sections[index + 1];
    const t = (at - left.at) / (right.at - left.at),
      weight = t * t * (3 - 2 * t);
    const mix = (a: number, b: number) => a * (1 - weight) + b * weight;
    const section = {
      ...Object.fromEntries(
        ownedRoles.map((role) => [
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
