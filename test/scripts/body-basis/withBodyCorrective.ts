import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

/** One driver of a corrective: a joint ramp or a channel side. */
export type BodyCorrectiveDriver = NonNullable<
  IAutoMovieHumanBodyBasis["correctives"]
>[number]["inputs"][number];

/** Rest rows are stored to this many decimals, 10 micrometres. */
const STORED_DECIMALS = 5;

/**
 * A copy of the basis carrying one more corrective, driven by the product of
 * `inputs` at gain one and holding the rest displacement `rest`.
 *
 * The rows are sorted by vertex and stored at 10 micrometres, as the
 * published basis stores them. A row that moves nothing a micrometre is
 * dropped, and a solve whose every row is dropped returns `null`: there is
 * no corrective to publish. The corrective's id is also the name of its
 * endpoint, which is how the basis resolves a corrective's target. The id
 * must be new: a basis admits one corrective per id, and the caller names a
 * fresh one for every visit. The input basis is not mutated; the other
 * surfaces are shared, not copied.
 */
export function withBodyCorrective(
  basis: IAutoMovieHumanBodyBasis,
  id: string,
  inputs: BodyCorrectiveDriver[],
  rest: Map<number, number[]>,
): IAutoMovieHumanBodyBasis | null {
  const rows: number[] = [];
  for (const v of [...rest.keys()].sort((x, y) => x - y)) {
    const d = rest.get(v)!;
    const stored = d.map((one) => {
      const scale = 10 ** STORED_DECIMALS;
      return Number((Math.round(one * scale) / scale).toFixed(STORED_DECIMALS));
    });
    if (Math.hypot(d[0], d[1], d[2]) < 1e-6 || stored.every((one) => one === 0))
      continue;
    rows.push(v, ...stored);
  }
  if (rows.length === 0) return null;
  return {
    ...basis,
    correctives: [
      ...(basis.correctives ?? []),
      { id, inputs, weight: 1, target: id },
    ],
    surfaces: [
      {
        ...basis.surfaces[0],
        targets: { ...basis.surfaces[0].targets, [id]: rows },
      },
      ...basis.surfaces.slice(1),
    ],
  };
}
