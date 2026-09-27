import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import { extendFaceEnvelope } from "./faceEnvelope";
import type { FaceUnseenReading, IFaceUnseenIndex } from "./faceUnseenNorms";

/**
 * The unseen envelope revision of the connected face basis: each control
 * that holds a reading of what a frontal photograph cannot show spans that
 * reading's adult reference interval.
 *
 * The documents' unseen form is the most probable one within the controls'
 * envelopes (`solveFaceNorms`); a control held at its authored end leaves
 * its reading short of adults the populations contain (the source's septum
 * control ends at a nasolabial angle of 93 degrees where African adults
 * average 86 to 88). Each index's control is extended over its reading's
 * `intervals` entry as `extendFaceEnvelope` extends it (the endpoint rows
 * scaled past one while the reading still moves at half its authored rate
 * and can still be read, the surface valid, the lips' contact pair not
 * closed), the reading taken on the source's neutral by `measure`. Two
 * indices sharing a control are extended once, by the first. The revision
 * rewrites only the envelopes, a new `revision` id and the stamps. Pure.
 */
export function prepareUnseenEnvelopeBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  surface: string;
  indices: readonly IFaceUnseenIndex[];
  intervals: Partial<Record<FaceUnseenReading, [number, number]>>;
  measure: (
    positions: readonly number[],
  ) => Partial<Record<FaceUnseenReading, number | null>>;
  step: number;
  reach: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    envelopes: {
      reading: FaceUnseenReading;
      channel: string;
      interval: [number, number];
      from: [number, number];
      to: [number, number];
      reached: [number, number];
      faults: [number, number];
    }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("An unseen envelope revision needs a distinct revision.");
  const surface = basis.surfaces.find((one) => one.id === input.surface);
  if (surface === undefined) throw new Error(`No surface ${input.surface}.`);
  const contact = basis.contact?.lips;
  if (contact === undefined || contact.surface !== input.surface)
    throw new Error("The basis names no lip contact on the surface.");
  const done = new Set<string>();
  const envelopes = input.indices.flatMap((index) => {
    const interval = input.intervals[index.id];
    const channel = index.channels[0]!;
    if (interval === undefined || done.has(channel)) return [];
    done.add(channel);
    return [
      {
        reading: index.id,
        channel,
        interval,
        ...extendFaceEnvelope({
          basis,
          surface,
          channel,
          measure: (positions) => input.measure(positions)[index.id] ?? NaN,
          interval,
          guard: (positions) =>
            positions[3 * contact.upper + 1]! >
            positions[3 * contact.lower + 1]!
              ? 0
              : 1,
          step: input.step,
          reach: input.reach,
        }),
      },
    ];
  });
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...structuredClone(one),
      basis: input.revision,
    })),
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: { source: input.basis.id, revision: input.revision, envelopes },
  };
}
