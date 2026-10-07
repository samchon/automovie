/**
 * A midline corrective's field made symmetric: the mean of the field and its
 * mirror, so that a vertex and its partner receive mirrored displacements. A
 * vertex the field does not name is read as zero.
 */
export function symmetrizeBodyRows(
  rows: number[],
  partner: number[],
): number[] {
  const field = new Map<number, number[]>();
  for (let at = 0; at < rows.length; at += 4)
    field.set(rows[at], [rows[at + 1], rows[at + 2], rows[at + 3]]);
  const out = new Map<number, number[]>();
  const add = (v: number, d: number[]): void => {
    const held = out.get(v) ?? [0, 0, 0];
    out.set(
      v,
      held.map((one, k) => one + d[k]),
    );
  };
  for (const [v, d] of field) {
    if (partner[v] < 0)
      throw new Error("A corrective row's vertex has no mirror.");
    add(
      v,
      d.map((one) => one / 2),
    );
    add(partner[v], [-d[0] / 2, d[1] / 2, d[2] / 2]);
  }
  return [...out.keys()]
    .sort((a, b) => a - b)
    .flatMap((v) => [v, ...out.get(v)!]);
}
