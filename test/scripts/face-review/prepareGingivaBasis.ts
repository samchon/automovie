import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

/** One crown as a frontal view shows it, metres. */
export interface IClinicalCrown {
  /** The crown's centroid across the face (x). */
  centre: number;
  /** Height of the crown seen from the front, its edge up to what covers it. */
  visible: number;
  /** What the front view shows directly above the visible crown. */
  above: "gum" | "tooth" | "none";
}

/**
 * The connected components of a triangle mesh, as a component index per
 * vertex. Pure.
 */
export function meshComponents(
  vertices: number,
  indices: readonly number[],
): Int32Array {
  const parent = Int32Array.from({ length: vertices }, (_, k) => k);
  const find = (k: number): number => {
    while (parent[k] !== k) {
      parent[k] = parent[parent[k]!]!;
      k = parent[k]!;
    }
    return k;
  };
  for (let t = 0; t + 2 < indices.length; t += 3)
    for (let e = 0; e < 2; ++e) {
      const a = find(indices[t + e]!);
      const b = find(indices[t + e + 1]!);
      if (a !== b) parent[a] = b;
    }
  const label = new Int32Array(vertices);
  const names = new Map<number, number>();
  for (let k = 0; k < vertices; ++k) {
    const root = find(k);
    if (!names.has(root)) names.set(root, names.size);
    label[k] = names.get(root)!;
  }
  return label;
}

/** A frontal orthographic raster of a mesh: the nearest component per pixel. */
export interface IFrontRaster {
  width: number;
  height: number;
  x0: number;
  y1: number;
  resolution: number;
  depth: Float64Array;
  owner: Int32Array;
}

/**
 * Rasterize a mesh orthographically along -z at `resolution`, keeping the
 * nearest surface's depth and component per pixel. Pure.
 */
export function faceFrontRaster(props: {
  positions: readonly number[];
  indices: readonly number[];
  component: Int32Array;
  resolution: number;
}): IFrontRaster {
  const { positions: p, indices, component, resolution } = props;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let v = 0; v < p.length / 3; ++v) {
    x0 = Math.min(x0, p[3 * v]!);
    x1 = Math.max(x1, p[3 * v]!);
    y0 = Math.min(y0, p[3 * v + 1]!);
    y1 = Math.max(y1, p[3 * v + 1]!);
  }
  const width = Math.ceil((x1 - x0) / resolution) + 1;
  const height = Math.ceil((y1 - y0) / resolution) + 1;
  const depth = new Float64Array(width * height).fill(-Infinity);
  const owner = new Int32Array(width * height).fill(-1);
  for (let t = 0; t + 2 < indices.length; t += 3) {
    const v = [indices[t]!, indices[t + 1]!, indices[t + 2]!];
    const x = v.map((k) => (p[3 * k]! - x0) / resolution);
    const y = v.map((k) => (y1 - p[3 * k + 1]!) / resolution);
    const z = v.map((k) => p[3 * k + 2]!);
    const area =
      (x[1]! - x[0]!) * (y[2]! - y[0]!) - (x[2]! - x[0]!) * (y[1]! - y[0]!);
    if (area === 0) continue;
    const label = component[v[0]!]!;
    for (
      let r = Math.max(0, Math.floor(Math.min(...y)));
      r <= Math.min(height - 1, Math.ceil(Math.max(...y)));
      ++r
    )
      for (
        let c = Math.max(0, Math.floor(Math.min(...x)));
        c <= Math.min(width - 1, Math.ceil(Math.max(...x)));
        ++c
      ) {
        const px = c + 0.5;
        const py = r + 0.5;
        const w1 =
          ((px - x[0]!) * (y[2]! - y[0]!) - (x[2]! - x[0]!) * (py - y[0]!)) /
          area;
        const w2 =
          ((x[1]! - x[0]!) * (py - y[0]!) - (px - x[0]!) * (y[1]! - y[0]!)) /
          area;
        const w0 = 1 - w1 - w2;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const d = w0 * z[0]! + w1 * z[1]! + w2 * z[2]!;
        const at = r * width + c;
        if (d > depth[at]!) {
          depth[at] = d;
          owner[at] = label;
        }
      }
  }
  return { width, height, x0, y1, resolution, depth, owner };
}

/** Whether a vertex shows in a front raster: its own component, not behind another surface. */
export function faceFrontVisible(
  raster: IFrontRaster,
  point: readonly [number, number, number],
  component: number,
  tolerance: number,
): boolean {
  const c = Math.floor((point[0] - raster.x0) / raster.resolution);
  const r = Math.floor((raster.y1 - point[1]) / raster.resolution);
  if (c < 0 || r < 0 || c >= raster.width || r >= raster.height) return false;
  const at = r * raster.width + c;
  return (
    raster.owner[at] === component && raster.depth[at]! <= point[2] + tolerance
  );
}

/**
 * How much of each crown a frontal view shows: the dentition rasterized
 * orthographically along -z at `resolution`, nearest surface winning, and
 * for each crown the run of its own pixels up from its lowest one in the
 * column through its centroid, and what lies directly above that run. The
 * clinical crown of an anterior tooth is measured this way on casts, from
 * the incisal edge to the gingival zenith along the tooth's axis (Melo et
 * al., Sci Rep 2019;9:730). `crowns` lists each crown's component; `gum` the
 * components that are gingiva. Pure.
 */
export function faceClinicalCrowns(props: {
  positions: readonly number[];
  indices: readonly number[];
  component: Int32Array;
  crowns: readonly number[];
  gum: ReadonlySet<number>;
  resolution: number;
}): Map<number, IClinicalCrown> {
  const { positions: p, component } = props;
  const { width, height, x0, resolution, owner } = faceFrontRaster(props);
  const result = new Map<number, IClinicalCrown>();
  for (const crown of props.crowns) {
    let sum = 0;
    let count = 0;
    for (let v = 0; v < component.length; ++v)
      if (component[v] === crown) {
        sum += p[3 * v]!;
        ++count;
      }
    if (count === 0) continue;
    const centre = sum / count;
    const c = Math.min(
      width - 1,
      Math.max(0, Math.floor((centre - x0) / resolution)),
    );
    let bottom = -1;
    for (let r = height - 1; r >= 0; --r)
      if (owner[r * width + c] === crown) {
        bottom = r;
        break;
      }
    if (bottom < 0) continue;
    let top = bottom;
    while (top > 0 && owner[(top - 1) * width + c] === crown) --top;
    const next = top > 0 ? owner[(top - 1) * width + c]! : -1;
    result.set(crown, {
      centre,
      visible: (bottom - top + 1) * resolution,
      above: next < 0 ? "none" : props.gum.has(next) ? "gum" : "tooth",
    });
  }
  return result;
}

/**
 * Raise the maxillary gingiva to the population's clinical crown heights, as
 * a new basis revision.
 *
 * The source's gum covers the upper crowns well short of their ends: seen
 * from the front, the central incisors show 6.3 mm, the laterals 5.6 and the
 * canines 5.4, where 384 young adults show 9.35, 7.75 and 8.68 from the
 * incisal edge to the gingival zenith (Melo et al., Sci Rep 2019;9:730),
 * although the crown meshes run 9.3 to 11.3 mm. A smile that parts the lips
 * as far as the photograph's therefore shows gum where the photograph shows
 * teeth. The crowns stay where the dental revision seated them; the
 * maxillary gum (the dentition components that are neither a sealed crown,
 * `contact.colliders`, nor bound to the mandible) rises as one body by the
 * mean shortfall of the six anterior crowns (the six maxillary crowns
 * nearest the midline, paired with `norms` in that order: centrals, laterals,
 * canines), or by less: the largest rise at which the front view shows no
 * root ring (the sealed rim, `contact.colliders`) of a maxillary crown it
 * did not show before, since past it that crown would stand open above its
 * gum. The receipt names which bound held. Endpoint rows are displacements and stay valid; documents and
 * controls are restamped. Pure: the inputs are cloned.
 */
export function prepareGingivaBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  /** Clinical crown heights of the central, lateral and canine, metres. */
  norms: readonly [number, number, number];
  resolution: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    shiftMetres: number;
    normShiftMetres: number;
    bound: "norm" | "ring";
    movedVertices: number;
    anterior: {
      centre: number;
      normMetres: number;
      beforeMetres: number;
      afterMetres: number;
    }[];
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  const contact = basis.contact;
  if (contact === undefined)
    throw new Error("Gingival placement needs a contact basis.");
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("Gingival placement needs a distinct revision.");
  const teeth = basis.surfaces.find(
    (one) => one.id === contact.incisors.surface,
  );
  if (teeth === undefined)
    throw new Error("The incisors name no dentition surface.");
  const vertices = teeth.positions.length / 3;
  const component = meshComponents(vertices, teeth.indices);
  const crowns = new Set<number>();
  for (const collider of contact.colliders ?? [])
    if (collider.surface === teeth.id)
      for (const vertex of collider.closure) crowns.add(component[vertex]!);
  const rows = teeth.attachments?.find((one) => one.owner === "jaw")?.rows;
  const mandibular = new Set<number>();
  for (let i = 0; rows !== undefined && i < rows.length; i += 2)
    if (rows[i + 1] === 1) mandibular.add(component[rows[i]!]!);
  const all = new Set(component);
  const gum = new Set([...all].filter((one) => !crowns.has(one)));
  const maxillary = (set: Set<number>) =>
    [...set].filter((one) => !mandibular.has(one));
  const upperGum = new Set(maxillary(gum));
  const upperCrowns = maxillary(crowns);
  if (upperGum.size === 0 || upperCrowns.length < 6)
    throw new Error("The dentition has no maxillary gum or anterior crowns.");
  const measure = (positions: readonly number[]) =>
    faceClinicalCrowns({
      positions,
      indices: teeth.indices,
      component,
      crowns: upperCrowns,
      gum,
      resolution: input.resolution,
    });
  const before = measure(teeth.positions);
  const anterior = [...before.entries()]
    .sort((a, b) => Math.abs(a[1].centre) - Math.abs(b[1].centre))
    .slice(0, 6);
  if (anterior.length < 6)
    throw new Error("The front view shows fewer than six maxillary crowns.");
  const normOf = (rank: number) => input.norms[Math.floor(rank / 2)]!;
  const byNorm =
    anterior.reduce(
      (sum, [, crown], rank) => sum + normOf(rank) - crown.visible,
      0,
    ) / anterior.length;
  const original = teeth.positions.slice();
  const shifted = (amount: number) =>
    original.map((value, i) =>
      i % 3 === 1 && upperGum.has(component[(i - 1) / 3]!)
        ? value + amount
        : value,
    );
  const rings = new Map<number, Set<number>>();
  for (const collider of contact.colliders ?? [])
    if (collider.surface === teeth.id)
      for (const vertex of collider.closure) {
        const crown = component[vertex]!;
        if (!rings.has(crown)) rings.set(crown, new Set());
        rings.get(crown)!.add(vertex);
      }
  // A root ring the front view shows is a crown standing open above its gum:
  // the crown's face just below its rim is in view.
  const exposed = (positions: readonly number[]) => {
    const raster = faceFrontRaster({
      positions,
      indices: teeth.indices,
      component,
      resolution: input.resolution,
    });
    return upperCrowns.filter((crown) =>
      [...(rings.get(crown) ?? [])].some((vertex) =>
        faceFrontVisible(
          raster,
          // One pixel below the rim, on the crown's own face.
          [
            positions[3 * vertex]!,
            positions[3 * vertex + 1]! - input.resolution,
            positions[3 * vertex + 2]!,
          ],
          crown,
          input.resolution,
        ),
      ),
    );
  };
  const already = new Set(exposed(original));
  const opens = (amount: number) =>
    exposed(shifted(amount)).some((crown) => !already.has(crown));
  // The largest rise that opens no ring, to a quarter of the raster's pixel.
  let byRing = Infinity;
  if (byNorm > 0 && opens(byNorm)) {
    let low = 0;
    let high = byNorm;
    while (high - low > input.resolution / 4) {
      const middle = (low + high) / 2;
      if (opens(middle)) high = middle;
      else low = middle;
    }
    byRing = low;
  }
  const shift = Math.min(byNorm, byRing);
  const moved = shifted(shift);
  moved.forEach((value, i) => (teeth.positions[i] = value));
  let movedVertices = 0;
  for (let v = 0; v < vertices; ++v)
    if (upperGum.has(component[v]!)) ++movedVertices;
  const after = measure(teeth.positions);
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
      source,
      revision,
      shiftMetres: shift,
      normShiftMetres: byNorm,
      bound: byNorm <= byRing ? "norm" : "ring",
      movedVertices,
      anterior: anterior.map(([crown, measured], rank) => ({
        centre: measured.centre,
        normMetres: normOf(rank),
        beforeMetres: measured.visible,
        afterMetres: after.get(crown)!.visible,
      })),
    },
  };
}
