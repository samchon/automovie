import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import { faceSupportFaults } from "./faceEnvelope";

/** One side of a channel to bring inside where its surface stays valid. */
export interface IFaceValidLimit {
  channel: string;
  side: "minimum" | "maximum";
  /**
   * The new end, where a render study found the shape first leaves the
   * human face or shows a defect the fault count does not see; omitted, the
   * end is the last step before the first fault.
   */
  value?: number;
  /** The render study behind `value`. */
  study?: string;
}

/**
 * The valid envelope revision of the connected face basis: each listed
 * channel side ends where its surface is still a face.
 *
 * A channel's endpoint rows reach their authored end, and some of the
 * source's own targets fold the skin before it (the upper lid fold, the
 * epicanthus, the auricle's wing), while an envelope an earlier revision
 * extended past the authored end can keep its measure and stay fault-free
 * yet stop looking like any face (a septum turned into a lump). A limit
 * without a `value` ends at the last multiple of `step` before the first
 * fault on the way out (`faceSupportFaults`: triangles turned over against
 * the source, or surface pairs crossing that did not, the triangles of the
 * `contact` regions among themselves excepted, since the lips' overlap is
 * their contact); a limit with one ends there, and the surface at that
 * value must be fault-free. Every limit only brings its end inward, and a
 * document the new envelope would leave outside refuses the revision.
 * Documents and controls are restamped; nothing else changes. Pure.
 */
export function prepareValidEnvelopeBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  surface: string;
  contact: readonly string[];
  step: number;
  limits: readonly IFaceValidLimit[];
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    limits: {
      channel: string;
      side: "minimum" | "maximum";
      from: number;
      to: number;
      faults: number;
      evidence: string;
    }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("A valid envelope revision needs a distinct revision.");
  const surface = basis.surfaces.find((one) => one.id === input.surface);
  if (surface === undefined) throw new Error(`No surface ${input.surface}.`);
  const I = surface.indices;
  const key = (a: number, b: number, c: number) => `${a},${b},${c}`;
  const start = new Map<string, number>();
  for (let t = 0; t < I.length; t += 3)
    start.set(key(I[t]!, I[t + 1]!, I[t + 2]!), t);
  const contact = new Set<number>();
  for (const id of input.contact) {
    const region = surface.regions.find((one) => one.id === id);
    if (region === undefined) throw new Error(`No region ${id}.`);
    for (let t = 0; t < region.indices.length; t += 3)
      contact.add(
        start.get(
          key(
            region.indices[t]!,
            region.indices[t + 1]!,
            region.indices[t + 2]!,
          ),
        )!,
      );
  }
  const limits = input.limits.map((limit) => {
    const channel = basis.channels.find((one) => one.id === limit.channel);
    if (channel === undefined || channel.kind !== "shape")
      throw new Error(`No shape channel ${limit.channel}.`);
    const sign = limit.side === "maximum" ? 1 : -1;
    const name = sign > 0 ? channel.positive : channel.negative;
    const end = channel[limit.side];
    if (name === null || !(sign * end > 0))
      throw new Error(`${limit.channel} has no ${limit.side} side.`);
    const rows = surface.targets[name] ?? [];
    const moved = new Set<number>();
    for (let i = 0; i < rows.length; i += 4) moved.add(rows[i]!);
    const triangles: number[] = [];
    for (let t = 0; t < I.length; t += 3)
      if ([0, 1, 2].some((e) => moved.has(I[t + e]!))) triangles.push(t);
    const faults = (value: number) => {
      const positions = [...surface.positions];
      for (let i = 0; i < rows.length; i += 4)
        for (let k = 0; k < 3; ++k)
          positions[3 * rows[i]! + k]! += Math.abs(value) * rows[i + 1 + k]!;
      return faceSupportFaults({
        source: surface.positions,
        positions,
        indices: I,
        triangles,
        contact,
      });
    };
    let to: number;
    if (limit.value === undefined) {
      let k = 1;
      while (
        k * input.step < sign * end - 1e-9 &&
        faults(sign * k * input.step) === 0
      )
        ++k;
      to = sign * Number(((k - 1) * input.step).toFixed(9));
      if (k * input.step >= sign * end - 1e-9 && faults(end) === 0)
        throw new Error(`${limit.channel} is valid to its ${limit.side}.`);
    } else {
      to = limit.value;
      if (!(sign * to >= 0 && sign * to < sign * end))
        throw new Error(
          `${limit.channel}'s ${limit.side} ${to} does not bring ${end} inward.`,
        );
      if (faults(to) !== 0)
        throw new Error(`${limit.channel} at ${to} is not fault-free.`);
    }
    const outside = input.documents.filter((document) => {
      const value = document.shape[limit.channel];
      return value !== undefined && sign * value > sign * to;
    });
    if (outside.length !== 0)
      throw new Error(
        `${outside.map((one) => one.id).join(", ")} would leave ${limit.channel}'s envelope.`,
      );
    channel[limit.side] = to;
    return {
      channel: limit.channel,
      side: limit.side,
      from: end,
      to,
      faults: faults(end),
      evidence: limit.study ?? "faults",
    };
  });
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...structuredClone(one),
      basis: input.revision,
    })),
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: { source: input.basis.id, revision: input.revision, limits },
  };
}
