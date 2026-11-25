import {
  AutoMovieLoftAdmissionError,
  AutoMovieLoftStations,
  AutoMovieSplineCurve,
  AutoMovieViewLoft,
  AutoMovieSolidMesh as Mesh,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieHumanDigitNails,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanDigitNails as Nails } from "./AutoMovieHumanDigitNails";
import { AutoMovieHumanNail as Nail } from "./AutoMovieHumanNail";
import { AutoMovieHumanNailContact as Paired } from "./AutoMovieHumanNailContact";

/**
 * Retain a native nail and its surrounding skin over a common indexed edge. The
 * consumer keeps its own proximal trim and pole; the facing skin is cut in its
 * original chart, and the crown uses the same edge vertex identities.
 *
 * @see https://github.com/Open-Cascade-SAS/OCCT/blob/master/dox/user_guides/mesh/mesh.md Shared-edge and face-interior tessellation have separate deflections.
 * @see https://doi.org/10.1016/S0010-4485(97)00047-X Subdivide by physical error and triangulate in the trim chart.
 */
export namespace AutoMovieHumanNailPatch {
  /** One full turn of the contact clock, radians. */
  const TURN: number = 2 * Math.PI;

  /** One distal source preparation for its contact and exterior. */
  export interface IPrepared {
    /** The original digit and its fitted plate. */
    readonly made: IAutoMovieHumanDigitNails.IMade;
    /** Digit declaration with its own reliefs and local sample rows. */
    readonly digit: IAutoMovieViewPart;
    /** The lofts, paired charts and their shared source projection. */
    readonly contact: Paired.IPrepared;
    /** Elapsed time for preparing these inputs, milliseconds. */
    readonly milliseconds: number;
  }

  /** Prepare the exact lofts and paired contact once for this fitted digit. */
  export function prepare(
    made: IAutoMovieHumanDigitNails.IMade,
    sampling: Parameters<typeof Nails.addReliefs>[1],
  ): IPrepared {
    const started: number = performance.now();
    const { nail, original: source } = made;
    const digit: IAutoMovieViewPart = Nails.addReliefs(source, sampling, [
      nail.bed,
      nail.strip,
    ]);
    const plate: IAutoMovieViewPart = Nails.attachmentPlate(
      nail.plate,
      nail.bed,
    );
    const contact: Paired.IPrepared = Paired.prepareLofts(
      nail,
      AutoMovieViewLoft.create(plate),
      AutoMovieViewLoft.create(digit),
      made.support.domain[1],
    );
    return { made, digit, contact, milliseconds: performance.now() - started };
  }

  /** Build the common trim and crown from the same prepared original charts. */
  export function shape(
    prepared: IPrepared,
    reference?: (clock: number) => number | null,
  ) {
    const {
      made,
      digit,
      contact: { host: skin, edge, footprint },
    } = prepared;
    const { nail } = made;
    const host: IAutoMovieSolidSurface = skin.surface;
    const original: NonNullable<IAutoMovieSolidSurface["point"]> = host.point!;
    const fold: number = made.row.proportions.fold;
    const pitch: number =
      (nail.bed.stations[1] - nail.bed.stations[0]) / (nail.bed.rows - 3);
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
      const target: P3 = q.point;
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

    const marks: number[] = columns.map(({ point }): number => point[0]);
    const local: readonly (readonly [number, number])[] = [
      [Math.min(...marks), Math.max(...marks)],
      ...(digit.reliefs ?? []).map(({ stations }) => stations),
    ];
    // Sample the material boundary and its authored reliefs to the same chord
    // as before. Away from them only the campaign's geometry resolution is due.
    const chord =
      (away: number) =>
      (a: number, b: number): number =>
        local.some(([low, high]): boolean => a < high && b > low)
          ? Nails.CLIP_MM / 4
          : away;
    const phases: number[] =
      skin.chain.phases === undefined
        ? Array.from(
            { length: skin.chain.samples },
            (_, i): number => (TURN * i) / skin.chain.samples,
          )
        : [...skin.chain.phases];

    /** Keep the prescribed outline and its one set of world vertices. */
    const seam = (
      kernel: IAutoMovieSolidMesh.IMesh,
    ): IAutoMovieSolidMesh.ILoop => {
      const hostId: number = Mesh.owner(kernel, host);
      return {
        kind: "hole",
        vertices: columns.map(({ point }): number =>
          Mesh.vertex(kernel, original(...point), hostId, ...point),
        ),
        chart: columns.map(({ point }): P2 => point),
      };
    };

    /** Skin stations meeting the trim's error within the caller's own extent. */
    const stations = (from: number, to: number, away: number): number[] =>
      AutoMovieLoftStations.bisect(skin.chain, from, to, chord(away));

    /** Append the crown in this kernel, terminating on the skin's same IDs. */
    const crown = (kernel: IAutoMovieSolidMesh.IMesh, seam: number[]) => {
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

      return { rows, inward, nominalInward };
    };
    return {
      host,
      columns: count,
      support: boundary.scale,
      stations,
      phases,
      seam,
      crown,
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
}
