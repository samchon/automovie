import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import type { IDentalClinicalRegistration } from "./IDentalClinicalRegistration";
import { measureDentalClinicalHeight } from "./measureDentalClinicalHeight";
import {
  faceClinicalCrowns,
  faceFrontRaster,
  faceFrontVisible,
  meshComponents,
} from "./prepareGingivaBasis";

/**
 * A gum vertex's rise: linear in its x between the anterior crowns' zenith
 * knots (`knots`, sorted by x), flat beyond the outermost, then held under
 * the ring ceiling of every crown whose ring's x span meets `span`, the x
 * range of the triangles the vertex belongs to (`ceilings`, each
 * `[left, right, headroom]`): the gum between two vertices is their
 * interpolation, so a vertex beside a ring carries it too. Pure.
 */
export function faceGingivaScallopRise(
  knots: readonly (readonly [number, number])[],
  ceilings: readonly (readonly [number, number, number])[],
  x: number,
  span: readonly [number, number],
): number {
  const first = knots[0]!;
  const last = knots[knots.length - 1]!;
  let rise = x <= first[0] ? first[1] : x >= last[0] ? last[1] : Number.NaN;
  for (let k = 0; Number.isNaN(rise); ++k) {
    const [x0, r0] = knots[k]!;
    const [x1, r1] = knots[k + 1]!;
    if (x <= x1) rise = r0 + ((r1 - r0) * (x - x0)) / (x1 - x0);
  }
  for (const [left, right, headroom] of ceilings)
    if (span[0] <= right && span[1] >= left) rise = Math.min(rise, headroom);
  return rise;
}

/**
 * The maxillary gum scalloped to each anterior crown's clinical height, as
 * a new basis revision.
 *
 * The gingiva revision raised the upper gum as one body, and the canines'
 * root rings bounded the rise (their crown meshes are the shortest), so the
 * central incisors still show 7.75 mm of the 9.35 their norm gives and a
 * frontal display is not the axial clinical measurement. Registered axis,
 * gingival-zenith and incisal/cusp anchors are required before any norm drives
 * a rise. A real gingival margin is scalloped: each crown has its own
 * zenith. Here each of the six anterior maxillary crowns (paired with
 * `norms` by rank from the midline: centrals, laterals, canines, as in the
 * gingiva revision) wants its zenith raised by its shortfall (norm less the
 * registered axial height), converted to Y rise by its fixed-axis and moving-
 * anchor response. The front raster selects visible crowns and checks rings;
 * it supplies no clinical landmark. Every upper crown
 * (anterior or not) has a ring headroom: the largest rigid rise of the gum
 * at which the front view shows no part of its root ring it did not show
 * before, found by bisection to one of the raster's pixels. Each
 * upper-gum vertex rises by `faceGingivaScallopRise`: linear in x between
 * the anterior zeniths and the papillae halfway between neighbouring
 * zeniths, which do not rise (the crowns do not move, and a papilla fills
 * the embrasure up to their contact: raised with the zeniths, it opened a
 * triangle between the central incisors), never above the headroom of a
 * crown whose ring's x span its triangles meet, less one of the raster's
 * pixels (its grid follows the geometry's bounds). A zenith's knot starts at
 * its wish, held to its own ring's headroom less a pixel; the margin is read
 * on the gum's triangles around the zenith, which rise less than the knot
 * where no vertex stands on it, so each knot is then raised by the registered
 * height shortfall converted to Y movement until each change is within the
 * supplied geometric resolution or its
 * knot stands at its ring's ceiling. A final front view refuses if any ring
 * opens after all. The receipt lists each anterior crown's norm, height
 * before, wish, headroom, the scallop's value at its zenith (before the
 * ceilings of other rings that the gum's triangles there meet) and height
 * after. Documents are rebuilt to check them and restamped with the control
 * map. The receipt labels registered-landmark axial measurements. Sample
 * means are targets under their recorded population conditions and define
 * no permitted range. Landmark identity and acquisition remain the registrar's
 * evidence obligation. Inputs are cloned and no source is changed in place.
 */
export function prepareGingivaScallopBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  norms: readonly [number, number, number];
  resolution: number;
  /** Source-component registrations; absent metadata cannot drive clinical norms. */
  registrations?: ReadonlyMap<number, IDentalClinicalRegistration>;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    clinicalMeasurement: "registered-landmark-axis-distance";
    source: string;
    revision: string;
    anterior: {
      centre: number;
      normMetres: number;
      beforeMetres: number;
      wishMetres: number;
      headroomMetres: number;
      riseMetres: number;
      afterMetres: number;
    }[];
  };
} {
  const { basis, documents, controls, revision, resolution } =
    structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A scalloped gum needs a distinct revision.");
  const contact = basis.contact;
  const teeth = basis.surfaces.find(
    (one) => one.id === contact?.incisors.surface,
  );
  if (teeth === undefined)
    throw new Error("A scalloped gum needs a contact basis and its dentition.");
  const P = teeth.positions;
  const component = meshComponents(P.length / 3, teeth.indices);
  const rings = new Map<number, number[]>();
  for (const collider of contact!.colliders)
    if (collider.surface === teeth.id)
      for (const vertex of collider.closure) {
        const crown = component[vertex]!;
        rings.set(crown, [...(rings.get(crown) ?? []), vertex]);
      }
  const jaw = teeth.attachments?.find((one) => one.owner === "jaw")?.rows ?? [];
  const mandibular = new Set(
    jaw
      .filter((_v, i) => i % 2 === 0 && jaw[i + 1] === 1)
      .map((vertex) => component[vertex]!),
  );
  const upperCrowns = [...rings.keys()].filter((one) => !mandibular.has(one));
  const gum = new Set([...new Set(component)].filter((one) => !rings.has(one)));
  const upperGum = (v: number) =>
    gum.has(component[v]!) && !mandibular.has(component[v]!);
  const original = P.slice();
  const lift = (rise: (v: number) => number) =>
    original.map((value, i) => {
      const v = (i - 1) / 3;
      return i % 3 === 1 && upperGum(v) ? value + rise(v) : value;
    });
  // Each vertex's triangles' x range.
  const spans = original
    .filter((_v, i) => i % 3 === 0)
    .map((x) => [x, x] as [number, number]);
  for (let t = 0; t < teeth.indices.length; t += 3) {
    const ids = [0, 1, 2].map((k) => teeth.indices[t + k]!);
    const xs = ids.map((v) => original[3 * v]!);
    for (const v of ids) {
      spans[v]![0] = Math.min(spans[v]![0], ...xs);
      spans[v]![1] = Math.max(spans[v]![1], ...xs);
    }
  }
  const open = (positions: readonly number[]) => {
    const raster = faceFrontRaster({
      positions,
      indices: teeth.indices,
      component,
      resolution,
    });
    return new Set(
      upperCrowns.filter((crown) =>
        rings
          .get(crown)!
          .some((vertex) =>
            faceFrontVisible(
              raster,
              [
                positions[3 * vertex]!,
                positions[3 * vertex + 1]! - resolution,
                positions[3 * vertex + 2]!,
              ],
              crown,
              resolution,
            ),
          ),
      ),
    );
  };
  const already = open(original);
  // No rise past the largest norm is ever wished.
  const reach = Math.max(...input.norms);
  const full = open(lift(() => reach));
  const headroom = new Map(
    upperCrowns.map((crown) => {
      if (already.has(crown)) return [crown, 0];
      if (!full.has(crown)) return [crown, reach];
      let low = 0;
      let high = reach;
      while (high - low > resolution) {
        const middle = (low + high) / 2;
        if (open(lift(() => middle)).has(crown)) high = middle;
        else low = middle;
      }
      return [crown, low];
    }),
  );
  const measure = (positions: readonly number[]) =>
    faceClinicalCrowns({
      positions,
      indices: teeth.indices,
      component,
      crowns: upperCrowns,
      gum,
      resolution,
    });
  const before = measure(original);
  const anterior = [...before.entries()]
    .sort((a, b) => Math.abs(a[1].centre) - Math.abs(b[1].centre))
    .slice(0, 6);
  if (anterior.length < 6)
    throw new Error("The front view shows fewer than six maxillary crowns.");
  const moving = new Set([...component.keys()].filter(upperGum));
  const clinical = (positions: readonly number[], crown: number) => {
    const measured = measureDentalClinicalHeight(
      positions,
      basis.id,
      input.registrations?.get(crown),
      moving,
    );
    if (!(measured.metresPerUpShift > 0))
      throw new Error(
        "A clinical gingival zenith must follow the maxillary gum in the cervical direction.",
      );
    return measured;
  };
  const initial = new Map(
    anterior.map(([crown]) => [crown, clinical(original, crown)]),
  );
  const wish = anterior.map(([crown], rank) =>
    Math.max(
      0,
      (input.norms[Math.floor(rank / 2)]! - initial.get(crown)!.heightMetres) /
        initial.get(crown)!.metresPerUpShift,
    ),
  );
  const ceilings = upperCrowns.map((crown) => {
    const xs = rings.get(crown)!.map((vertex) => P[3 * vertex]!);
    // One pixel short: the raster's grid follows the geometry's bounds, so
    // a rise at the headroom itself can land on the other side of a pixel.
    return [
      Math.min(...xs),
      Math.max(...xs),
      Math.max(0, headroom.get(crown)! - resolution),
    ] as const;
  });
  // Zeniths rise; the papillae between neighbouring crowns stay, filling
  // the embrasure up to the contact the crowns keep.
  const scallop = (zenith: readonly number[]) => {
    const zeniths = anterior
      .map(([, crown], rank) => [crown.centre, zenith[rank]!] as const)
      .sort((a, b) => a[0] - b[0]);
    const knots = zeniths.flatMap((one, k) =>
      k === 0 ? [one] : [[(zeniths[k - 1]![0] + one[0]) / 2, 0] as const, one],
    );
    return {
      knots,
      moved: lift((v) =>
        faceGingivaScallopRise(knots, ceilings, original[3 * v]!, spans[v]!),
      ),
    };
  };
  // The margin is read on the gum's triangles around each zenith, so it
  // rises less than the zenith's knot: the knots are raised by what the
  // margin still lacks until every margin is within a pixel of its norm or
  // its knot stands at its own ring's ceiling.
  const own = anterior.map(([crown]) =>
    Math.max(0, headroom.get(crown)! - resolution),
  );
  let zenith = wish.map((one, rank) => Math.min(one, own[rank]!));
  let { knots, moved } = scallop(zenith);
  for (let pass = 0; pass < 8; ++pass) {
    const shown = new Map(
      anterior.map(([crown]) => [crown, clinical(moved, crown)]),
    );
    const next = anterior.map(([crown], rank) =>
      Math.min(
        own[rank]!,
        zenith[rank]! +
          Math.max(
            0,
            (input.norms[Math.floor(rank / 2)]! -
              shown.get(crown)!.heightMetres) /
              shown.get(crown)!.metresPerUpShift,
          ),
      ),
    );
    if (next.every((one, rank) => one - zenith[rank]! <= resolution)) break;
    zenith = next;
    ({ knots, moved } = scallop(zenith));
  }
  const opened = [...open(moved)].filter((crown) => !already.has(crown));
  if (opened.length > 0)
    throw new Error(
      `The scalloped gum opens the rings of the crowns at x ${opened
        .map(
          (crown) =>
            `${before.get(crown)?.centre.toFixed(4)} (headroom ${headroom.get(crown)!.toFixed(5)})`,
        )
        .join(", ")} after all.`,
    );
  moved.forEach((value, i) => (P[i] = value));
  const after = new Map(anterior.map(([crown]) => [crown, clinical(P, crown)]));
  const source = basis.id;
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      clinicalMeasurement: "registered-landmark-axis-distance",
      source,
      revision,
      anterior: anterior.map(([crown, measured], rank) => ({
        centre: measured.centre,
        normMetres: input.norms[Math.floor(rank / 2)]!,
        beforeMetres: initial.get(crown)!.heightMetres,
        wishMetres: wish[rank]!,
        headroomMetres: headroom.get(crown)!,
        riseMetres: faceGingivaScallopRise(knots, ceilings, measured.centre, [
          measured.centre,
          measured.centre,
        ]),
        afterMetres: after.get(crown)!.heightMetres,
      })),
    },
  };
}
