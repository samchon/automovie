import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

/** Rows `population_rows.py` writes: channels, correctives and their sparse rows. */
export interface IPopulationRows {
  channels: IAutoMovieHumanFaceBasis["channels"];
  correctives: NonNullable<IAutoMovieHumanFaceBasis["correctives"]>;
  /** Endpoint or corrective target -> surface id (or `landmarks`) -> flat [index, x, y, z]. */
  rows: Record<string, Record<string, number[]>>;
}

/**
 * Add the source's population model to a face basis: ancestry channels and
 * the product correctives that make ancestry, dimorphism and age combine as
 * MPFB blends them.
 *
 * `prepare-population-basis.ts` calls this with the published basis and the
 * rows `population_rows.py` derived from `extract-face-population.py`'s
 * samples. The three ancestry channels are one-sided shares in [0, 1], each
 * the pure ancestry replacing the source's equal mixture; shares summing past
 * one describe no MPFB human, which the document derivation never writes and
 * the control group's description states. Every corrective is driven by the existing `globalSexualDimorphism`
 * and `globalAgeStructure` channels and the new shares, so a document that
 * sets none of them builds exactly as before; the existing documents are
 * restamped and must build. The control map gains one group per ancestry.
 *
 * Shape endpoints are displacements on the rest surfaces, so the dental
 * revision's maxillary shift, the contact rules and the articulation apply
 * to them unchanged; the joint landmarks follow through their own rows.
 *
 * Pure: returns new values.
 */
export function preparePopulationBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  rows: IPopulationRows;
  revision: string;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    channels: string[];
    correctives: number;
    rowVertices: number;
  };
} {
  const { basis, documents, controls, rows, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A population revision needs a distinct revision.");
  const ids = new Set([
    ...basis.channels.map((one) => one.id),
    ...(basis.correctives ?? []).map((one) => one.id),
  ]);
  for (const channel of rows.channels)
    if (ids.has(channel.id))
      throw new Error(`The basis already has ${channel.id}.`);
  for (const corrective of rows.correctives)
    if (ids.has(corrective.id))
      throw new Error(`The basis already has ${corrective.id}.`);
  const known = new Set([
    ...basis.channels.map((one) => one.id),
    ...rows.channels.map((one) => one.id),
  ]);
  for (const corrective of rows.correctives)
    for (const one of corrective.inputs)
      if (!known.has(one.channel))
        throw new Error(
          `${corrective.id} is driven by an unknown channel ${one.channel}.`,
        );
  const surfaces = new Map(basis.surfaces.map((one) => [one.id, one]));
  let rowVertices = 0;
  for (const [target, bySurface] of Object.entries(rows.rows))
    for (const [surface, flat] of Object.entries(bySurface)) {
      if (flat.length === 0) continue;
      if (flat.length % 4 !== 0)
        throw new Error(`${target} on ${surface} is not a list of rows.`);
      rowVertices += flat.length / 4;
      if (surface === "landmarks") {
        if (basis.landmarks === undefined)
          throw new Error("Landmark rows need a landmark basis.");
        basis.landmarks.targets[target] = flat;
        continue;
      }
      const one = surfaces.get(surface);
      if (one === undefined)
        throw new Error(`${target} names an unknown surface ${surface}.`);
      const count = one.positions.length / 3;
      for (let i = 0; i < flat.length; i += 4)
        if (!Number.isInteger(flat[i]) || flat[i]! < 0 || flat[i]! >= count)
          throw new Error(
            `${target} names vertex ${flat[i]} outside ${surface}.`,
          );
      one.targets[target] = flat;
    }
  basis.channels.push(...rows.channels);
  basis.correctives = [...(basis.correctives ?? []), ...rows.correctives];
  const source = basis.id;
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  const groups = rows.channels.map((channel) => ({
    id: channel.id,
    label: channel.id
      .replace(/Ancestry$/u, " ancestry")
      .replace(/^./u, (c) => c.toUpperCase()),
    description:
      "The source population model's share of this ancestry, replacing its equal mixture; the shares of one document sum to at most one. A population morphology axis of the source asset, not a statement about a person.",
    channels: [channel.id],
  }));
  return {
    basis,
    documents: restamped,
    controls: {
      ...controls,
      basis: revision,
      groups: [...controls.groups, ...groups],
    },
    receipt: {
      source,
      revision,
      channels: rows.channels.map((one) => one.id),
      correctives: rows.correctives.length,
      rowVertices,
    },
  };
}
