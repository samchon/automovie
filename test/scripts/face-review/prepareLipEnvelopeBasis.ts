import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import { extendFaceEnvelope } from "./faceEnvelope";

/**
 * The lip envelope revision of the connected face basis: each vermilion
 * height control spans the heights adults show.
 *
 * A control that means one anatomical measure reaches every value the
 * sampled populations' adults show: its envelope spans the measure's
 * reference interval, the union over the populations of their mean plus and
 * minus two standard deviations, as far as the control's geometry stays
 * valid. The source's lip height controls end at plus and minus one, where
 * its upper vermilion is 0.160 of the mouth's width and its lower 0.182,
 * the means of European men: half of them lay beyond the envelope, and the
 * photographs of thin lips held the controls at their bounds.
 *
 * The measure is the vermilion's height on the midline over the mouth's
 * width (`faceVermilionRatios`), labrale superius and inferius read where
 * the lip region's outer surface crosses the midsagittal plane, as the
 * vermilion revision reads the first (`faceUpperVermilionHeight`). The
 * earlier revision brought the population corners of the source to their
 * norms and left the neutral, so a document of fine controls alone, which
 * starts from the neutral, needs this envelope.
 *
 * Each side of each control is followed outward from its authored end in
 * steps of `step` (the endpoint rows scaled past one, which keeps the
 * source's deformation) until the measure crosses the interval's edge,
 * interpolated between the last two steps; an edge inside the authored
 * range leaves that side at one. The extension goes no further than the
 * control still means its measure: a step that changes the measure at less
 * than half the rate the authored range does ends it (the source's upper
 * lip height thins the vermilion by 0.050 of the mouth's width per unit to
 * -2 and by 0.012 beyond, where the lip's lower edge starts to wave), as
 * does `reach`. The extension is kept only where the surface stays valid:
 * no triangle of the control's support turned over against the source, no
 * pair of its triangles crossing that did not cross before
 * (`faceSupportFaults`, `extendFaceEnvelope`), and the lips' contact pair
 * not closed past each other; otherwise the side stops at the last valid
 * step. The revision rewrites only the envelopes, a new `revision` id, and
 * the documents' and simple controls' basis stamps. Pure.
 */
export function prepareLipEnvelopeBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  surface: string;
  lips: string;
  skin: string;
  channels: { upper: string; lower: string };
  intervals: { upper: [number, number]; lower: [number, number] };
  depth: number;
  step: number;
  reach: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    neutral: { upper: number; lower: number };
    envelopes: {
      channel: string;
      measure: "upper" | "lower";
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
    throw new Error("A lip envelope revision needs a distinct revision.");
  const surface = basis.surfaces.find((one) => one.id === input.surface);
  if (surface === undefined) throw new Error(`No surface ${input.surface}.`);
  const region = (id: string) => {
    const found = surface.regions.find((one) => one.id === id);
    if (found === undefined) throw new Error(`No region ${id}.`);
    return found.indices;
  };
  const lips = region(input.lips);
  const skin = new Set(region(input.skin));
  const contact = basis.contact?.lips;
  if (contact === undefined || contact.surface !== input.surface)
    throw new Error("The basis names no lip contact on the surface.");
  const ratios = (positions: readonly number[]) =>
    faceVermilionRatios({
      positions,
      lips,
      skin,
      contact,
      depth: input.depth,
    });
  const neutral = ratios(surface.positions);
  const envelopes = (["upper", "lower"] as const).map((measure) => {
    const id = input.channels[measure];
    const interval = input.intervals[measure];
    return {
      channel: id,
      measure,
      interval,
      ...extendFaceEnvelope({
        basis,
        surface,
        channel: id,
        measure: (positions) => ratios(positions)[measure],
        interval,
        guard: (positions) =>
          positions[3 * contact.upper + 1]! > positions[3 * contact.lower + 1]!
            ? 0
            : 1,
        step: input.step,
        reach: input.reach,
      }),
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
    receipt: {
      source: input.basis.id,
      revision: input.revision,
      neutral,
      envelopes,
    },
  };
}

/**
 * The upper and lower vermilion heights on the midline over the mouth's
 * width. The heights are read as `faceUpperVermilionHeight` reads the
 * upper: where the lip region's triangles cross the midsagittal plane in
 * front of stomion's depth less `depth` (the lining behind does not count),
 * the highest crossing above stomion (labrale superius) and the lowest below
 * (labrale inferius), stomion midway between the lips' contact pair; the
 * width lies between the lip region's extreme border vertices, those it
 * shares with the skin (the cheilia).
 */
export function faceVermilionRatios(props: {
  positions: readonly number[];
  lips: readonly number[];
  skin: ReadonlySet<number>;
  contact: { upper: number; lower: number };
  depth: number;
}): { upper: number; lower: number } {
  const P = props.positions;
  const stomion =
    (P[3 * props.contact.upper + 1]! + P[3 * props.contact.lower + 1]!) / 2;
  const front = P[3 * props.contact.upper + 2]! - props.depth;
  let [top, bottom] = [-Infinity, Infinity];
  for (let t = 0; t + 2 < props.lips.length; t += 3)
    for (let e = 0; e < 3; ++e) {
      const i = props.lips[t + e]!;
      const j = props.lips[t + ((e + 1) % 3)]!;
      const [xi, xj] = [P[3 * i]!, P[3 * j]!];
      if (xi > 0 === xj > 0) continue;
      const f = xi / (xi - xj);
      const y = P[3 * i + 1]! + f * (P[3 * j + 1]! - P[3 * i + 1]!);
      const z = P[3 * i + 2]! + f * (P[3 * j + 2]! - P[3 * i + 2]!);
      if (z <= front) continue;
      top = Math.max(top, y);
      bottom = Math.min(bottom, y);
    }
  const xs = [...new Set(props.lips)]
    .filter((v) => props.skin.has(v))
    .map((v) => P[3 * v]!);
  if (top <= stomion || bottom >= stomion || xs.length === 0)
    throw new Error("The lip region crosses no outer midline about stomion.");
  const width = Math.max(...xs) - Math.min(...xs);
  return { upper: (top - stomion) / width, lower: (stomion - bottom) / width };
}
