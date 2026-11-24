import {
  AutoMovieLoftAdmissionError,
  AutoMovieLoftChain,
  AutoMovieLoftStations,
  AutoMovieSplineCurve,
  AutoMovieViewLoft,
  AutoMovieSolidMesh as Mesh,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import {
  AutoMovieHumanNailLoop as Loop,
  AutoMovieHumanNail as Nail,
  AutoMovieHumanDigitNails as Nails,
} from "@automovie/human";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieHumanDigitNails,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";
import type { FamilyConicMpfbNailStock as Stock } from "./FamilyConicMpfbNailStock";
import { FamilyConicMpfbPairedNail as Paired } from "./FamilyConicMpfbPairedNail";

/**
 * A common indexed edge of the skin and an independently named nail material.
 *
 * @see https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/entities/socketobject/_extra_vertex_groups.py
 * @see https://occt3d.com/dev/doc/refman/html/class_b_rep_builder_a_p_i___sewing.html
 */
export namespace FamilyConicMpfbNailPatch {
  const TURN: number = 2 * Math.PI;

  /** Replace the parent chart's trimmed interior by the original plate crown. */
  export function realize(
    cap: Tips.ICap,
    made: IAutoMovieHumanDigitNails.IMade,
    stock?: Stock.IPatch,
  ) {
    const started: number = performance.now();
    const { nail } = made;
    const rawPlate = Nails.attachmentPlate(nail.plate, nail.bed);
    const rawSkin = Nails.addReliefs(cap.view, cap.family, [
      nail.bed,
      nail.strip,
    ]);
    const plate = AutoMovieViewLoft.create(rawPlate),
      skin = AutoMovieViewLoft.create(rawSkin);
    if (plate.chain === null || skin.chain === null || skin.surface === null)
      throw new AutoMovieLoftAdmissionError(
        JSON.stringify([...plate.diagnostics, ...skin.diagnostics]),
      );
    const host: IAutoMovieSolidSurface = skin.surface;
    const edge = Paired.prepare(nail, rawPlate, rawSkin, cap.tip);
    const footprint = Loop.prepare(nail, plate.chain, skin.chain, cap.tip);
    const original = (s: number, phase: number): P3 =>
      AutoMovieLoftChain.point(skin.chain!, s, phase);
    const onPlate = (s: number, phase: number): P3 =>
      AutoMovieLoftChain.point(plate.chain!, s, phase);
    const fold: number = made.row.proportions.fold;
    const pitch: number =
      (nail.bed.stations[1] - nail.bed.stations[0]) / (nail.bed.rows - 3);
    const reference =
      stock === undefined
        ? undefined
        : measuredOutline(
            stock,
            nail.frame,
            host.jet(...footprint.centre),
            footprint.semi,
          );
    const boundary = outline(
      edge.at,
      footprint.centre,
      footprint.semi,
      host,
      reference,
    );
    const column = (clock: number) => {
      const row = boundary.at(clock);
      const { u, v } = host.jet(...row.point);
      const to: P2 = [
        row.point[0] - footprint.centre[0],
        row.point[1] - footprint.centre[1],
      ];
      const radial: P3 = Vec.add(Vec.scale(u, to[0]), Vec.scale(v, to[1]));
      const along: P3 = Vec.add(
        Vec.scale(u, row.first[0]),
        Vec.scale(v, row.first[1]),
      );
      const tangent: P3 | null = Vec.unit(along);
      if (tangent === null)
        throw new AutoMovieLoftAdmissionError("Nail seam has no tangent");
      const reach: number = Vec.norm(
        Vec.sub(radial, Vec.scale(tangent, Vec.dot(tangent, radial))),
      );
      if (!(reach > fold))
        throw new AutoMovieLoftAdmissionError(
          "Nail conormal cannot carry its measured fold reach",
        );
      return { clock, point: row.point, to, reach, speed: Vec.norm(along) };
    };
    type Column = ReturnType<typeof column>;
    const pilot: Column[] = Array.from(
      { length: 32 },
      (_, i): Column => column((TURN * i) / 32),
    );
    const count: number = Math.max(
      8,
      4 *
        Math.ceil(
          (TURN * Math.max(...pilot.map((p) => p.speed))) / (4 * pitch),
        ),
    );
    const columns: Column[] = Array.from(
      { length: count },
      (_, i): Column => column((TURN * i) / count),
    );
    const ready: number = performance.now();

    /** Carry the exact parent point and its full jet through the seam. */
    const sample = (
      radius: number,
      ray: Column,
    ): { point: P3; inward: number; nominalInward: number } => {
      const chart: P2 = [
        footprint.centre[0] + radius * ray.to[0],
        footprint.centre[1] + radius * ray.to[1],
      ];
      const p: P3 = original(...chart);
      if (radius === 1) return { point: p, inward: 0, nominalInward: 0 };
      const q = footprint.project(p);
      if (q === null)
        throw new AutoMovieLoftAdmissionError(
          "The trimmed crown leaves the original plate at " +
            ray.clock +
            " rad, share " +
            radius,
        );
      const target: P3 = onPlate(q.station, q.phase);
      // Quintic Hermite step in the physical seam conormal, over one fold
      // depth. Both rates vanish at the shared edge and the original crown.
      const conormal: number = Nail.step(((1 - radius) * ray.reach) / fold);
      // Keep the outer envelope where the original plate dips below the bed.
      // One clipping-resolution height joins zero to the native crown in C2.
      const strength: number = conormal * Nail.step(-q.gap / Nails.CLIP_MM);
      return {
        point: Vec.add(p, Vec.scale(Vec.sub(target, p), strength)),
        inward: Math.max(0, q.gap * strength),
        nominalInward: Math.max(0, q.gap * conormal),
      };
    };

    const kernel: IAutoMovieSolidMesh.IMesh = Mesh.create();
    const hostId: number = Mesh.owner(kernel, host);
    const seam: number[] = columns.map(({ point }): number =>
      Mesh.vertex(kernel, original(...point), hostId, ...point),
    );
    const [first, last]: [number, number] = host.domain!;
    const stations: number[] = AutoMovieLoftStations.bisect(
      skin.chain,
      first,
      last,
      Nails.CLIP_MM / 4,
    ).filter((s): boolean => s < cap.tip);
    const phases: number[] =
      skin.chain.phases === undefined
        ? Array.from(
            { length: skin.chain.samples },
            (_, i): number => (TURN * i) / skin.chain!.samples,
          )
        : [...skin.chain.phases];
    const open = Mesh.face(kernel, {
      surface: host,
      stations,
      phases,
      loops: [
        {
          kind: "hole",
          vertices: seam,
          chart: columns.map((p): P2 => p.point),
        },
      ],
    });
    const distal = open.find((ring): boolean => ring.end === "top");
    if (distal === undefined)
      throw new AutoMovieLoftAdmissionError(
        "The skin trim lost its original distal closing ring",
      );
    const pole: number = Mesh.vertex(
      kernel,
      original(cap.tip, 0),
      hostId,
      cap.tip,
      0,
    );
    Mesh.close(
      kernel,
      distal.vertices.map((v, i): [number, number, number] => [
        v,
        distal.vertices[(i + 1) % distal.vertices.length]!,
        pole,
      ]),
      host,
      false,
    );
    const skinDone: number = performance.now();

    const plateFrom: number = kernel.indices.length;
    const material: number =
      kernel.owners.push({
        name: nail.plate.name,
        point: (r, t): P3 => sample(r, column(t)).point,
      }) - 1;
    const centreSample = sample(0, columns[0]!);
    const centre: number = Mesh.vertex(
      kernel,
      centreSample.point,
      material,
      0,
      0,
    );
    const apex: P3 = original(...footprint.centre);
    const radius: number = Math.max(
      ...columns.map((p): number =>
        Vec.norm(Vec.sub(original(...p.point), apex)),
      ),
    );
    const rows: number = Math.ceil(radius / pitch);
    let inward: number = centreSample.inward;
    let nominalInward: number = centreSample.nominalInward;
    let prior: number[] | null = null;
    for (let i: number = 1; i <= rows; ++i) {
      const r: number = i / rows;
      const ring: number[] =
        i === rows
          ? seam
          : columns.map((p): number => {
              const reading = sample(r, p);
              inward = Math.max(inward, reading.inward);
              nominalInward = Math.max(nominalInward, reading.nominalInward);
              return Mesh.vertex(kernel, reading.point, material, r, p.clock);
            });
      for (let j: number = 0; j < count; ++j) {
        const k: number = (j + 1) % count;
        if (prior === null) kernel.indices.push(centre, ring[j]!, ring[k]!);
        else
          kernel.indices.push(
            prior[j]!,
            ring[j]!,
            ring[k]!,
            prior[j]!,
            ring[k]!,
            prior[k]!,
          );
      }
      prior = ring;
    }
    const mesh: IAutoMovieConstructionRealization.IMesh = {
      positions: kernel.positions.map((v): number => v / 1000),
      indices: kernel.indices,
      coordinates: kernel.coordinates,
      owners: kernel.owners.map((o): string => o.name),
    };
    return {
      mesh,
      seam,
      plateFrom,
      columns: count,
      rows,
      support: boundary.scale,
      inward,
      nominalInward,
      milliseconds: {
        prepare: ready - started,
        skin: skinDone - ready,
        crown: performance.now() - skinDone,
      },
    };
  }

  /**
   * Keep the mean and two lowest harmonics of the observed paired radii. They
   * retain the footprint's two principal directions and suppress narrow
   * branches of the buried plate flank. Each periodic cubic scale control uses
   * the least measured exit over its nonnegative basis support.
   */
  function outline(
    trace: ReturnType<typeof Paired.prepare>["at"],
    centre: P2,
    semi: P2,
    host: IAutoMovieSolidSurface,
    reference?: (clock: number) => number | null,
  ) {
    // Sixteen observations per quadrant resolve the measured flank reversals.
    const count: number = 64;
    const raw = Array.from({ length: count }, (_, i) => {
      const t: number = (TURN * i) / count;
      const point: P2 = trace(t).point;
      const delta: P2 = [
        (point[0] - centre[0]) / semi[0],
        (point[1] - centre[1]) / semi[1],
      ];
      const r: number = Math.hypot(...delta);
      return { t, point, r, preferred: reference?.(t) ?? r };
    });
    const mean = (f: (t: number) => number): number =>
      raw.reduce((sum, q): number => sum + q.preferred * f(q.t), 0) / count;
    const c0: number = mean((): number => 1);
    // The fourth harmonic is the first fourfold term of the observed
    // proximal/distal and lateral corners of a material patch.
    const orders: number[] = reference === undefined ? [1, 2] : [1, 2, 4];
    const modes = orders.map((k) => ({
      k,
      c: 2 * mean((t): number => Math.cos(k * t)),
      s: 2 * mean((t): number => Math.sin(k * t)),
    }));
    const radius = (t: number): number =>
      modes.reduce(
        (sum, { k, c, s }): number =>
          sum + c * Math.cos(k * t) + s * Math.sin(k * t),
        c0,
      );
    const limits: number[] = raw.map(({ t, r, point }): number => {
      const field = host.jet(...point);
      const ray: P3 = Vec.add(
        Vec.scale(field.u, semi[0] * Math.cos(t)),
        Vec.scale(field.v, semi[1] * Math.sin(t)),
      );
      const requested: number = radius(t);
      if (!(requested > 0))
        throw new AutoMovieLoftAdmissionError(
          "The fitted nail footprint is not star-shaped",
        );
      return Math.min(1, (r - Nails.CLIP_MM / Vec.norm(ray)) / requested);
    });
    const own: number[] = limits.map((_value, i): number =>
      Math.min(
        ...[-2, -1, 0, 1, 2].map(
          (j): number => limits[(i + j + count) % count]!,
        ),
      ),
    );
    if (!(Math.min(...own) > 0))
      throw new AutoMovieLoftAdmissionError(
        "The fitted nail footprint has no physically retained radius",
      );
    const controls: number[] = [...own, ...own.map((): number => 0)];
    return {
      scale: [Math.min(...own), Math.max(...own)],
      at: (t: number): { point: P2; first: P2 } => {
        const [scale, , speed] = AutoMovieSplineCurve.jet(controls, count, t);
        const c: number = Math.cos(t),
          s: number = Math.sin(t);
        const r: number = scale * radius(t);
        const d: number =
          speed * radius(t) +
          scale *
            modes.reduce(
              (sum, { k, c, s }): number =>
                sum + k * (-c * Math.sin(k * t) + s * Math.cos(k * t)),
              0,
            );
        return {
          point: [centre[0] + semi[0] * r * c, centre[1] + semi[1] * r * s],
          first: [semi[0] * (d * c - r * s), semi[1] * (d * s + r * c)],
        };
      },
    };
  }

  /** Measure the same outline rays in the original visible material plane. */
  function measuredOutline(
    patch: Stock.IPatch,
    frame: IAutoMovieHumanDigitNails.IMade["nail"]["frame"],
    parent: IAutoMovieSolidSurface.IJet,
    semi: P2,
  ): (clock: number) => number | null {
    const lateral: P3 = Vec.cross(frame.distal, frame.dorsal);
    const flat = (point: P3): P2 => [
      Vec.dot(point, frame.distal),
      Vec.dot(point, lateral),
    ];
    const points: P2[] = patch.points.map(
      (p): P2 => flat(Vec.sub(p, frame.origin)),
    );
    const centre: P2 = [0, 1].map((axis): number => {
      const v: number[] = points.map((p): number => p[axis]!);
      return (Math.max(...v) + Math.min(...v)) / 2;
    }) as P2;
    const edges = patch.margins.map(({ edge: [a, b] }): [P2, P2] => {
      const p: P2 = flat(Vec.sub(a, frame.origin));
      const e: P2 = flat(Vec.sub(b, a));
      return [[p[0] - centre[0], p[1] - centre[1]], e];
    });
    return (clock): number | null => {
      const ray: P2 = flat(
        Vec.add(
          Vec.scale(parent.u, semi[0] * Math.cos(clock)),
          Vec.scale(parent.v, semi[1] * Math.sin(clock)),
        ),
      );
      let closest: number = Infinity;
      for (const [p, e] of edges) {
        const root = Vec.solve2(ray[0], -e[0], ray[1], -e[1], p);
        if (root !== null && root[0] > 0 && root[1] >= 0 && root[1] <= 1)
          closest = Math.min(closest, root[0]);
      }
      return Number.isFinite(closest) ? closest : null;
    };
  }
}
