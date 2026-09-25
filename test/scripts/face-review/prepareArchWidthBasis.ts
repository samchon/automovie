import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

/**
 * The arch width revision of the connected face basis: the dentition widens
 * with the mouth only as much as the dental arch goes with the mouth among
 * adults.
 *
 * The source's mouth width control carries the whole dentition with the
 * commissures and scales it further than the mouth itself (the arch 19
 * percent per unit where the mouth moves 16), yet teeth are not soft
 * tissue, and the intercanine distance follows the intercommissural width
 * only weakly (r = 0.389 in 409 adults, Wang et al. 2024). The conditional
 * expectation of the arch's width given the mouth's is the regression line,
 * whose slope in relative terms is the `elasticity` (the regression slope
 * times the mean mouth width over the mean arch width). For each endpoint of
 * `channel` the widths are measured at its full weight, the mouth as the
 * lateral extent of the `lips` region of `skin`, the arch as that of the
 * `dentition`, and the dentition's and the `tongue`'s rows (the tongue
 * rides the arch) are scaled by the elasticity times the mouth's relative
 * change over the arch's, so the arch widens by that expectation (a row
 * scaled to nothing is dropped). Every
 * document must build on the revision. Documents and controls are
 * restamped; nothing else changes. Pure.
 */
export function prepareArchWidthBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  channel: string;
  skin: string;
  lips: string;
  dentition: string;
  tongue: string;
  elasticity: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    elasticity: number;
    endpoints: {
      endpoint: string;
      mouth: [number, number];
      arch: [number, number];
      scale: number;
      after: number;
    }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("An arch width revision needs a distinct revision.");
  if (!(input.elasticity >= 0))
    throw new Error("The elasticity must be a finite non-negative number.");
  const surface = (id: string) => {
    const one = basis.surfaces.find((candidate) => candidate.id === id);
    if (one === undefined) throw new Error(`No surface ${id}.`);
    return one;
  };
  const skin = surface(input.skin);
  const dentition = surface(input.dentition);
  const tongue = surface(input.tongue);
  const region = skin.regions.find((one) => one.id === input.lips);
  if (region === undefined) throw new Error(`No region ${input.lips}.`);
  const lips = [...new Set(region.indices)];
  const teeth = [...new Array(dentition.positions.length / 3).keys()];
  const channel = basis.channels.find((one) => one.id === input.channel);
  if (channel === undefined || channel.kind !== "shape")
    throw new Error(`No shape channel ${input.channel}.`);
  const width = (
    one: typeof skin,
    vertices: readonly number[],
    name: string | null,
  ) => {
    const positions = [...one.positions];
    const rows = name === null ? [] : (one.targets[name] ?? []);
    for (let i = 0; i < rows.length; i += 4)
      positions[3 * rows[i]!]! += rows[i + 1]!;
    const x = vertices.map((vertex) => positions[3 * vertex]!);
    return Math.max(...x) - Math.min(...x);
  };
  const endpoints = [channel.positive, channel.negative]
    .filter((one): one is string => one !== null)
    .map((name) => {
      const mouth: [number, number] = [
        width(skin, lips, null),
        width(skin, lips, name),
      ];
      const arch: [number, number] = [
        width(dentition, teeth, null),
        width(dentition, teeth, name),
      ];
      const archChange = arch[1] / arch[0] - 1;
      if (archChange === 0)
        throw new Error(`${name} does not move the dentition.`);
      const scale = (input.elasticity * (mouth[1] / mouth[0] - 1)) / archChange;
      for (const one of [dentition, tongue]) {
        const rows = one.targets[name];
        if (rows === undefined) continue;
        const next: number[] = [];
        for (let i = 0; i < rows.length; i += 4) {
          const d = [1, 2, 3].map((k) => rows[i + k]! * scale);
          if (d.some((v) => v !== 0)) next.push(rows[i]!, ...d);
        }
        if (next.length === 0) delete one.targets[name];
        else one.targets[name] = next;
      }
      return {
        endpoint: name,
        mouth,
        arch,
        scale,
        after: width(dentition, teeth, name),
      };
    });
  basis.id = input.revision;
  const build = createHumanFaceBasisBuilder(basis);
  const documents = input.documents.map((one) => {
    const next = { ...structuredClone(one), basis: input.revision };
    build(next);
    return next;
  });
  return {
    basis,
    documents,
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: {
      source: input.basis.id,
      revision: input.revision,
      elasticity: input.elasticity,
      endpoints,
    },
  };
}
