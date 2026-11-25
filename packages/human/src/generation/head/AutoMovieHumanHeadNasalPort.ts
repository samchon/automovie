import {
  AutoMovieLoftViewFullSource,
  AutoMovieSolidVector as Vector,
  bracketedCrossing,
} from "@automovie/engine";
import type {
  IAutoMovieHumanHeadDome,
  IAutoMovieHumanHeadFeatures,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";

/**
 * The original nose owns the aperture. The subject's width scales the adult
 * calipers and the independent CT mean's vestibule course. The declared
 * aperture lives in the local tangent plane at native alar contact and is
 * pulled back to the original nose. The lining is derived from this one line.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the measured physical aperture, then reads its projection on the same host and places the lining from independent normal CT sections.
 * @evidence contracts/common.md#clear-and-simple-design One prepared nose reader serves both native apertures. Child outlets and section outlines belong to one course function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no emitted mesh, reference fitting, boundary tolerance changes or modification of the original nasal root.
 * @evidence contracts/common.md#meaningful-documentation Explains the datum choice, chart and source units, anatomy and the closed modeling extent.
 * @evidence contracts/performance.md#efficient-algorithms Each port clock checks at most the original station and quarter-section boundaries on its chart ray, followed by one bracketed scalar root and the lining's periodic correspondence.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepares one original nose and reuses the aperture samples for the lining's transverse supports and station rail.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The preparation belongs to one source request; only declared port controls and the original lining owner survive.
 */
export namespace AutoMovieHumanHeadNasalPort {
  /** Prepare both apertures in the same original nose chart. */
  export function prepare(nose: IAutoMovieViewPart, breadth: number) {
    const surface = AutoMovieLoftViewFullSource.create(nose);
    const scale = breadth / 34.35;
    const count = AutoMovieHumanHeadDome.SAMPLES;
    const turn = 2 * Math.PI;
    const clock = (k: number): number => (turn * k) / count;

    return (
      attempt: IAutoMovieHumanHeadDome.IAttempt,
      nominal: IAutoMovieViewPart,
    ): Pick<IAutoMovieHumanHeadFeatures.IFeature, "part"> & {
      port: NonNullable<IAutoMovieHumanHeadFeatures.IFeature["port"]>;
    } => {
      const contact = attempt.attachment;
      if (contact === null || contact.parameter === null)
        throw new Error(`${nominal.name} needs an original material contact`);
      const first = nominal.stations[0]!;
      const frame = nominal.axis.at(first);
      const radial = Vector.sub(contact.point, contact.frame.origin);
      const phase = Math.atan2(
        Vector.dot(radial, contact.frame.v),
        Vector.dot(radial, contact.frame.u),
      );
      const centre = surface.jet(contact.station, phase);
      const normal = Vector.unit(Vector.cross(centre.u, centre.v));
      if (normal === null)
        throw new Error(`${nominal.name} has a singular nasal chart`);
      const long = Vector.unit(
        Vector.sub(frame.u, Vector.scale(normal, Vector.dot(frame.u, normal))),
      );
      if (long === null)
        throw new Error(`${nominal.name} has no tangent aperture axis`);
      const across = Vector.cross(normal, long);
      const [ahead, left, behind, right] = attempt.definition.extents;
      const semi: [number, number] = [
        left / Vector.norm(centre.u),
        left / Vector.norm(centre.v),
      ];
      const point = (angle: number, r: number) => {
        const station = contact.station + r * semi[0] * Math.cos(angle);
        // A radius bounded by an actual domain endpoint can round just past
        // its computed station; the endpoint itself owns that reading.
        return surface.point(
          Math.min(surface.domain[1], Math.max(surface.domain[0], station)),
          phase + r * semi[1] * Math.sin(angle),
        );
      };
      const quarter = turn / 4;
      const phaseCuts: number[] = [];
      for (
        let k = Math.ceil((phase - Math.PI) / quarter);
        k * quarter <= phase + Math.PI;
        k++
      )
        phaseCuts.push(k * quarter);
      // Work outward across original station knots and conic quadrant ends.
      // The first outward sign change brackets the projected aperture.
      const shape = Array.from({ length: count }, (_, k) => {
        const angle = clock(k);
        const ds = semi[0] * Math.cos(angle);
        const dt = semi[1] * Math.sin(angle);
        const end = ds < 0 ? surface.domain[0] : surface.domain[1];
        // The port measures phase on the branch nearest its centre; beyond a
        // half-turn its radial chart address would belong to the other ray.
        const limit = Math.min(
          ds === 0 ? Infinity : (end - contact.station) / ds,
          dt === 0 ? Infinity : Math.PI / Math.abs(dt),
        );
        const cuts = [
          ...nose.stations.map((station) => (station - contact.station) / ds),
          ...phaseCuts.map((boundary) => (boundary - phase) / dt),
        ]
          .filter((r) => r > 0 && r < limit)
          .sort((a, b) => a - b);
        const residual = (r: number): number => {
          const relative = Vector.sub(point(angle, r), centre.p);
          const x = Vector.dot(relative, long);
          const y = Vector.dot(relative, across);
          return (
            (x / (x < 0 ? behind : ahead)) ** 2 +
            (y / (y < 0 ? right : left)) ** 2 -
            1
          );
        };
        // At the contact the normalized radius is zero. Illinois secant
        // steps and bisection retain the first sign-changing native span.
        // The 1e-8 normalized bracket width is below a micrometre here.
        let low = 0;
        let below = -1;
        for (const high of [...cuts, limit]) {
          const above = residual(high);
          if (above >= 0)
            return bracketedCrossing({
              f: residual,
              past: (value) => value >= 0,
              low,
              high,
              known: { low: below, high: above },
              tolerance: 1e-8,
            }).high;
          low = high;
          below = above;
        }
        throw new Error(
          `${nominal.name} aperture clock ${k} leaves the original nose`,
        );
      });
      const opening = shape.map((r, k) => point(clock(k), r));
      const relative = opening.map((p) => Vector.sub(p, contact.point));
      const directions = [
        frame.u,
        frame.v,
        Vector.scale(frame.u, -1),
        Vector.scale(frame.v, -1),
      ];
      // Brüning et al. (DOI 10.6084/m9.figshare.9585410). The area of the
      // first measured inner section is 80.84 mm² vs 84.026 mm² at the inlet.
      const contraction = Math.sqrt(80.84 / 84.026);
      const supports = directions.map(
        (axis) =>
          contraction * Math.max(...relative.map((p) => Vector.dot(p, axis))),
      ) as [number, number, number, number];
      const phases = relative
        .map((p, k) => ({
          phase:
            (Math.atan2(Vector.dot(p, frame.v), Vector.dot(p, frame.u)) +
              turn) %
            turn,
          station: opening[k]![1] - frame.origin[1],
        }))
        .sort((a, b) => a.phase - b.phase);
      const rise = 2.03 * scale;
      const rails = shape.map((_, k) => {
        const t = clock(k);
        const next = phases.findIndex(({ phase }) => phase > t);
        const low = phases[(next < 0 ? count - 1 : next - 1 + count) % count]!;
        const high = phases[next < 0 ? 0 : next]!;
        const a = low.phase - (next === 0 ? turn : 0);
        const b = high.phase + (next < 0 ? turn : 0);
        return (
          (low.station +
            ((high.station - low.station) * (t - a)) / (b - a) +
            rise -
            first) /
          1000
        );
      });
      return {
        part: lining(attempt.definition, contact, supports, scale, rise),
        port: {
          loop: {
            centre: [contact.station / 1000, phase],
            semi: [semi[0] / 1000, semi[1]],
            sense: 1,
            shape,
          },
          rails,
        },
      };
    };
  }

  /** The native lining, its midcourse turn and bounded interior pole. */
  function lining(
    definition: IAutoMovieHumanHeadDome.IAttempt["definition"],
    host: NonNullable<IAutoMovieHumanHeadDome.IAttempt["attachment"]>,
    [ahead, left, behind, right]: [number, number, number, number],
    scale: number,
    initial: number,
  ): IAutoMovieViewPart {
    // The CT mean section centres supply the 6.06 mm superior rise to the
    // final section, 4.69 mm posterior and 2.88 mm medial displacement. The
    // first visible span's 2.03 mm rise precedes the posterior bend.
    const height = 6.06 * scale;
    const posterior = 4.69 * scale;
    const medial = 2.88 * scale;
    const areaGrowth = 115.72 / 80.84 - 1;
    // ESTIMATE: close the represented vestibule one outer minor semiaxis
    // beyond the last measured course, preserving the full visible span.
    const source = AutoMovieHumanHeadDome.of({
      ...definition,
      height: host.parameter! + height + definition.extents[1],
      host,
    });
    const first = source.stations[0]!;
    const last = source.stations.at(-1)!;
    const frame = source.axis.at(first);
    const [x, y, z] = frame.origin;
    const centre = host.point[1] - y;
    const end = centre + height;
    const zEnd = z - Math.sign(z) * medial;
    const zero = { first: 0, second: 0 };
    const knot = (station: number, value: number) => ({
      site: `${definition.name}.vestibule.${station}`,
      station,
      value,
    });
    const axis = AutoMovieHumanHeadSourceAxis.of(
      {
        x: {
          knots: [
            knot(first, x),
            knot(centre + initial, x),
            knot(end, x - posterior),
            knot(last, x - posterior),
          ].map((k) => ({ ...k, jet: zero })),
        },
        y: { knots: [knot(first, y), knot(last, y + last - first)] },
        z: {
          knots: [
            knot(first, z),
            knot(centre, z),
            knot(end, zEnd),
            knot(last, zEnd),
          ].map((k) => ({ ...k, jet: zero })),
        },
      },
      frame.u,
      frame.v,
    );
    const stations = [
      ...new Set([...source.stations, centre, centre + initial, end]),
    ].sort((a, b) => a - b);
    // Area is proportional to the product of the two full supports. The CT
    // span grows rearward. A quintic handover and a cubic square-root pole
    // term give zero first and second changes where the courses meet.
    const outline = (
      radius: number,
      grow: boolean,
    ): IAutoMovieViewPart.IOutline => ({
      knots: stations.map((station) => {
        const q = Math.min(1, Math.max(0, (station - centre) / height));
        const handover = q ** 3 * (10 + q * (-15 + 6 * q));
        const pole = Math.max(0, (station - end) / (last - end));
        const rear = grow ? handover * (ahead + behind) * areaGrowth : 0;
        return knot(
          station,
          (radius - rear) * Math.sqrt(Math.max(0, 1 - pole ** 3)),
        );
      }),
    });
    return {
      ...source,
      axis,
      stations,
      front: {
        positive: outline(ahead, false),
        negative: outline(-behind, true),
      },
      side: {
        positive: outline(left, false),
        negative: outline(-right, false),
      },
    };
  }
}
