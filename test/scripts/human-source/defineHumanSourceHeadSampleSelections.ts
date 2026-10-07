import { HUMAN_SOURCE_HEAD_CONVENTION } from "./HUMAN_SOURCE_HEAD_CONVENTION.ts";
import { HUMAN_SOURCE_READ_HEAD_SAMPLES } from "./HUMAN_SOURCE_READ_HEAD_SAMPLES.ts";
import type { IHumanSourceHeadSampleSelectionInput } from "./structures/IHumanSourceHeadSampleSelectionInput.ts";
import type { IHumanSourceHeadSampleSelections } from "./structures/IHumanSourceHeadSampleSelections.ts";

/**
 * Register explicitly selected native head samples for report-only readers.
 *
 * Each hm08 sample must map to exactly one native head-view vertex. Right
 * selections own the reading and the pinned source mirror owns the left;
 * there is no position search, subdivision fill or inferred boundary. The
 * returned region is a sorted set, while its manifest record states the
 * source-selection limitations. Strict filled ear regions retain their
 * separate loop proof under `defineHumanSourceHeadRegions`.
 */
export function defineHumanSourceHeadSampleSelections(
  input: IHumanSourceHeadSampleSelectionInput,
): IHumanSourceHeadSampleSelections {
  const out: IHumanSourceHeadSampleSelections = {
    skinRegions: {},
    records: [],
  };
  const viewOf = new Map<number, number>();
  input.faceToG1.forEach((sample, vertex) => {
    if (viewOf.has(sample))
      throw new Error(
        `Head sample selection: source sample ${sample} maps to two head vertices.`,
      );
    viewOf.set(sample, vertex);
  });
  for (const [part, right] of Object.entries(HUMAN_SOURCE_READ_HEAD_SAMPLES)) {
    for (const side of ["right", "left"] as const) {
      const name = `${part}-${side}`;
      const port =
        part === "naris-margin" && input.nasalPorts !== undefined
          ? input.nasalPorts.filter((record) => record.side === side)
          : undefined;
      if (port !== undefined && port.length !== 1)
        throw new Error(
          `Head sample selection ${name}: current source needs one owned native contour.`,
        );
      const originalVertices =
        port === undefined
          ? side === "right"
            ? [...right]
            : right.map((sample) => input.mirror.twin[sample])
          : [...port[0].orderedNativeBoundary];
      if (
        originalVertices.some(
          (sample) => !Number.isInteger(sample) || sample < 0,
        ) ||
        new Set(originalVertices).size !== originalVertices.length
      )
        throw new Error(
          `Head sample selection ${name}: the source mirror must supply distinct native samples.`,
        );
      const viewVertices = originalVertices
        .map((sample) => {
          const canonical =
            input.nativeToSource === undefined
              ? sample
              : input.nativeToSource[sample];
          if (!Number.isSafeInteger(canonical) || canonical < 0)
            throw new Error(
              `Head sample selection ${name}: native sample ${sample} is retired or absent from this source.`,
            );
          const vertex = viewOf.get(canonical);
          if (vertex === undefined)
            throw new Error(
              `Head sample selection ${name}: source sample ${sample} has no head vertex.`,
            );
          return vertex;
        })
        .sort((a, b) => a - b);
      const naris = part === "naris-margin";
      out.skinRegions[name] = { surface: 0, vertices: viewVertices };
      out.records.push({
        name,
        originalVertices,
        viewVertices,
        definition:
          port !== undefined
            ? "Current source-owned nasal socket boundary samples; this region is a sorted set, not the ordered projection protocol."
            : naris
              ? "Sparse samples of the visible basal naris transition for a projected-sample polygon."
              : `Sparse samples of the ${part} source surface for a source-conditioned extent.`,
        rule:
          port !== undefined
            ? "Actual provider native contour carried through its explicit native-to-source-to-head map; the emitted region sorts indices without changing the separate owned boundary order."
            : "The source owner's right-side frame selection, reflected by pinned hm08 mirror correspondence on the left, carried by exact native sample identity and sorted as a head-skin set; no boundary fill.",
        uncertainty:
          port !== undefined
            ? "Authored socket boundary, not a measured aperture or clinical reconstruction; projected quantities require the separate ordered contour and source plane."
            : naris
              ? "Four of eighteen angular selection sectors were empty; no continuous crease or closed rim was established. Angular sorting is a projected-sample convention, not an actual aperture or clinical reconstruction."
              : "The source segmentation was read from neutral views and is not a measured tissue boundary. Conchal sets include raised surface samples, so they do not establish a bowl contour or depth; lobule samples do not establish a tissue section.",
        frames: naris
          ? "neutral person basal clay with selected transition samples marked; re-read at campaign resume to identify sparse and missing sectors"
          : "neutral person right lateral, front and back, clay with source part samples marked; re-read at campaign resume to identify uncertain conchal extent",
        convention: HUMAN_SOURCE_HEAD_CONVENTION,
      });
    }
  }
  return out;
}
