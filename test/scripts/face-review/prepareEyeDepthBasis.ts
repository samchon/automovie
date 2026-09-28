import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/** One eye: its channel, the blink that moves its lids, its pivot and aim. */
export interface IFaceEyeDepthSide {
  channel: string;
  blink: string;
  centre: string;
  target: string;
}

/**
 * The eye depth revision of the connected face basis: a control per eye
 * that moves the globe forward or back in its orbit, the lids draped over
 * it following and the skin at the orbital rim staying.
 *
 * How deep-set an eye is, the corneal apex's distance ahead of the lateral
 * orbital rim (exophthalmometry), differs by sex and ancestry by millimetres
 * (15.4 to 18.5 mm, Migliori and Gladstone 1984), and the source has no
 * target for it. Per side, one unit moves the globe (`eye` surface vertices
 * nearer this side's `centre` landmark) and the side's `centre` and
 * `target` landmarks by `unit` metres along the orbit axis (centre to
 * target). The lids lie on the globe: the `skin` vertices nearer this
 * side's centre that the side's `blink` moves at least half as far as it
 * moves any (the mobile lid, which slides over the globe; the brow and
 * cheek it drags follow less). Within the globe's silhouette about the
 * axis they move with it whole; toward the canthi, which the canthal
 * tendons tie to the orbital rim, they belong to the field below, except
 * that none is left inside the globe: a lid vertex the field moves less
 * along its contact normal (the radial direction from the centre) than the
 * globe's surface moves there is pushed out to it and held, and the field
 * is solved again. Skin outside the orbital aperture (an
 * ellipse of `aperture` half-width and half-height about the axis, in the
 * plane across it) or deeper than the globe's back stays; the socket's
 * lining within the aperture, which the conjunctiva ties to the globe, is
 * part of the field. Between them the skin follows a harmonic field (each
 * vertex's displacement the mean of its neighbours': the membrane of least
 * bending between the two), so no weight is authored by hand. Each vertex
 * of the `attached` surfaces nearer this side (the lashes rooted in the lid
 * margin, the brows in the brow's skin) moves as the moving skin vertex
 * nearest it.
 * The positive endpoint moves the eye forward, the negative back, and the
 * channel spans `envelope` of them. Pure.
 */
export function prepareEyeDepthBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  eye: string;
  attached: readonly string[];
  sides: readonly IFaceEyeDepthSide[];
  unit: number;
  envelope: [number, number];
  aperture: { halfWidth: number; halfHeight: number };
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    sides: {
      channel: string;
      axis: number[];
      globe: number;
      lids: number;
      field: number;
      attached: Record<string, number>;
      sweeps: number;
      pushed: number;
    }[];
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("An eye depth revision needs a distinct revision.");
  if (!(input.unit > 0)) throw new Error("The unit must be positive.");
  if (!(input.envelope[0] < 0 && input.envelope[1] > 0))
    throw new Error("The envelope must hold both directions.");
  const surface = (id: string) => {
    const one = basis.surfaces.find((candidate) => candidate.id === id);
    if (one === undefined) throw new Error(`No surface ${id}.`);
    return one;
  };
  const skin = surface(input.skin);
  const eye = surface(input.eye);
  const attached = input.attached.map(surface);
  const landmarks = basis.landmarks;
  const landmark = (id: string) => {
    const index = landmarks?.ids.indexOf(id) ?? -1;
    if (index < 0) throw new Error(`No landmark ${id}.`);
    return [0, 1, 2].map((k) => landmarks!.positions[3 * index + k]!);
  };
  const centres = input.sides.map((side) => landmark(side.centre));
  const nearest = (p: readonly number[]) =>
    centres.reduce(
      (best, c, i) =>
        Math.hypot(...[0, 1, 2].map((k) => p[k]! - c[k]!)) <
        Math.hypot(...[0, 1, 2].map((k) => p[k]! - centres[best]![k]!))
          ? i
          : best,
      0,
    );
  const at = (positions: readonly number[], vertex: number) =>
    [0, 1, 2].map((k) => positions[3 * vertex + k]!);
  // Neighbours of every skin vertex, over its triangles.
  const neighbours = new Map<number, Set<number>>();
  for (let t = 0; t < skin.indices.length; t += 3)
    for (let e = 0; e < 3; ++e) {
      const a = skin.indices[t + e]!;
      const b = skin.indices[t + ((e + 1) % 3)]!;
      if (!neighbours.has(a)) neighbours.set(a, new Set());
      if (!neighbours.has(b)) neighbours.set(b, new Set());
      neighbours.get(a)!.add(b);
      neighbours.get(b)!.add(a);
    }
  const sides = input.sides.map((side, s) => {
    const channel = basis.channels.find((one) => one.id === side.channel);
    if (channel !== undefined)
      throw new Error(`The basis already has a channel ${side.channel}.`);
    const blink = basis.channels.find((one) => one.id === side.blink);
    if (blink === undefined || blink.positive === null)
      throw new Error(`No blink ${side.blink}.`);
    const centre = centres[s]!;
    const aim = landmark(side.target).map((v, k) => v - centre[k]!);
    const length = Math.hypot(...aim);
    const axis = aim.map((v) => v / length);
    // The globe: this side's eye vertices.
    const globe = [...new Array(eye.positions.length / 3).keys()].filter(
      (vertex) => nearest(at(eye.positions, vertex)) === s,
    );
    if (globe.length === 0) throw new Error(`No globe near ${side.centre}.`);
    const radius = Math.max(
      ...globe.map((vertex) =>
        Math.hypot(...at(eye.positions, vertex).map((v, k) => v - centre[k]!)),
      ),
    );
    // The lids: this side's skin the blink moves at least half its most.
    const blinkRows = skin.targets[blink.positive] ?? [];
    const moves: [number, number][] = [];
    for (let i = 0; i < blinkRows.length; i += 4)
      if (nearest(at(skin.positions, blinkRows[i]!)) === s)
        moves.push([
          blinkRows[i]!,
          Math.hypot(blinkRows[i + 1]!, blinkRows[i + 2]!, blinkRows[i + 3]!),
        ]);
    const most = Math.max(0, ...moves.map(([, d]) => d));
    const lids = moves
      .filter(([, d]) => d >= most / 2)
      .map(([vertex]) => vertex);
    if (lids.length === 0) throw new Error(`${side.blink} moves no lid.`);
    // The aperture: skin within the ellipse about the axis, no deeper than
    // the globe's back.
    const across = (p: readonly number[]) => {
      const d = p.map((v, k) => v - centre[k]!);
      const along = d.reduce((sum, v, k) => sum + v * axis[k]!, 0);
      const lateral = d.map((v, k) => v - along * axis[k]!);
      // Across the axis: x (width) and y (height) of the lateral offset.
      return {
        along,
        inside:
          (lateral[0]! / input.aperture.halfWidth) ** 2 +
            (lateral[1]! / input.aperture.halfHeight) ** 2 <
          1,
      };
    };
    // Per unit of the axis. The lid over the globe's front, within its
    // silhouette about the axis, moves with it whole; the rest of the
    // aperture is a membrane; and no lid is left inside the globe: a lid
    // vertex the membrane moves less along its contact normal (the radial
    // direction from the centre) than the globe's surface moves there is
    // pushed out to it and held, and the membrane is solved again.
    const radial = (p: readonly number[]) => {
      const d = p.map((v, k) => v - centre[k]!);
      const along = d.reduce((sum, v, k) => sum + v * axis[k]!, 0);
      return Math.hypot(...d.map((v, k) => v - along * axis[k]!));
    };
    const silhouette = Math.max(
      ...globe.map((vertex) => radial(at(eye.positions, vertex))),
    );
    const field = new Map<number, number[]>();
    const held = new Set<number>();
    for (const vertex of lids)
      if (radial(at(skin.positions, vertex)) <= silhouette) {
        field.set(vertex, [...axis]);
        held.add(vertex);
      }
    for (const vertex of neighbours.keys()) {
      if (field.has(vertex)) continue;
      const where = across(at(skin.positions, vertex));
      if (where.inside && where.along > -radius) field.set(vertex, [0, 0, 0]);
    }
    // Gauss-Seidel on the uniform graph Laplacian, each component; vertices
    // outside the aperture stay still.
    let sweeps = 0;
    let pushed = 0;
    for (let round = 0; round < 50; ++round) {
      const free = [...field.keys()].filter((vertex) => !held.has(vertex));
      for (let sweep = 0; sweep < 10000; ++sweep, ++sweeps) {
        let change = 0;
        for (const vertex of free) {
          const around = [...neighbours.get(vertex)!];
          const mean = [0, 1, 2].map(
            (k) =>
              around.reduce((sum, n) => sum + (field.get(n)?.[k] ?? 0), 0) /
              around.length,
          );
          const before = field.get(vertex)!;
          change = Math.max(
            change,
            ...mean.map((v, k) => Math.abs(v - before[k]!)),
          );
          field.set(vertex, mean);
        }
        if (change < 1e-7) break;
      }
      let entered = 0;
      for (const vertex of lids) {
        // A lid outside the aperture stays, as the skin there does.
        if (held.has(vertex) || !field.has(vertex)) continue;
        const d = at(skin.positions, vertex).map((v, k) => v - centre[k]!);
        const n = d.map((v) => v / Math.hypot(...d));
        const need = n.reduce((sum, v, k) => sum + v * axis[k]!, 0);
        const move = field.get(vertex)!;
        const has = n.reduce((sum, v, k) => sum + v * move[k]!, 0);
        if (has < need - 1e-6) {
          field.set(
            vertex,
            move.map((v, k) => v + (need - has) * n[k]!),
          );
          held.add(vertex);
          ++entered;
        }
      }
      pushed += entered;
      if (entered === 0) break;
    }
    const free = [...field.keys()].filter((vertex) => !held.has(vertex));
    const moving = [...field].filter(([, d]) => Math.hypot(...d) > 1e-6);
    // Each attached vertex moves as the moving skin vertex nearest it.
    const riding = attached.map((one) =>
      [...new Array(one.positions.length / 3).keys()]
        .filter((vertex) => nearest(at(one.positions, vertex)) === s)
        .map((vertex): [number, number[]] => {
          const p = at(one.positions, vertex);
          let best = Infinity;
          let d = [0, 0, 0];
          for (const [other, value] of moving) {
            const e = Math.hypot(
              ...at(skin.positions, other).map((v, k) => v - p[k]!),
            );
            if (e < best) [best, d] = [e, value];
          }
          return [vertex, d];
        })
        .filter(([, d]) => Math.hypot(...d) > 1e-6),
    );
    const skinField = moving.sort(([a], [b]) => a - b);
    for (const [suffix, sign] of [
      ["forward", 1],
      ["back", -1],
    ] as const) {
      const name = `${side.channel}.${suffix}`;
      const scale = sign * input.unit;
      const rows = (field: readonly [number, number[]][]) =>
        field.flatMap(([vertex, d]) => [vertex, ...d.map((v) => scale * v)]);
      skin.targets[name] = rows(skinField);
      eye.targets[name] = rows(
        [...globe].sort((a, b) => a - b).map((vertex) => [vertex, axis]),
      );
      attached.forEach((one, a) => {
        if (riding[a]!.length !== 0) one.targets[name] = rows(riding[a]!);
      });
      landmarks!.targets[name] = [side.centre, side.target]
        .map((id) => landmarks!.ids.indexOf(id))
        .sort((a, b) => a - b)
        .flatMap((index) => [index, ...axis.map((v) => scale * v)]);
    }
    basis.channels.push({
      id: side.channel,
      description: `The globe back into its orbit (deep-set) to forward (prominent), ${Number((input.unit * 1000).toFixed(3))} mm per unit along the orbit axis, the lids resting on it.`,
      kind: "shape",
      minimum: input.envelope[0],
      maximum: input.envelope[1],
      positive: `${side.channel}.forward`,
      negative: `${side.channel}.back`,
    });
    return {
      channel: side.channel,
      axis,
      globe: globe.length,
      lids: lids.length,
      field: free.length,
      attached: Object.fromEntries(
        attached.map((one, a) => [one.id, riding[a]!.length]),
      ),
      sweeps,
      pushed,
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
    receipt: { source: input.basis.id, revision: input.revision, sides },
  };
}
