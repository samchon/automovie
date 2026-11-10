import { tessellateAutoMovieContourStrip64 } from "@automovie/engine";

import { AutoMovieHumanTrunkArmscye } from "./AutoMovieHumanTrunkArmscye";
import contours from "./AutoMovieHumanTrunkF1Contours.json";
import { AutoMovieHumanTrunkF1Section } from "./AutoMovieHumanTrunkF1Section";
import type { AutoMovieHumanTrunkPorts } from "./AutoMovieHumanTrunkPorts";

/** Absolute world-mm points shared by the recorded torso sections. */
type V3 = AutoMovieHumanTrunkF1Section.V3;
/** The torso's mutable indexed world-mm output buffer. */
type Mesh = AutoMovieHumanTrunkF1Section.Mesh;
/** Keep the same exact phase and boundary tests used by the recorded section owner. */
const {
  edgeSense,
  increasingPhase,
  point,
}: typeof AutoMovieHumanTrunkF1Section = AutoMovieHumanTrunkF1Section;

/** The fixed F1 pelvis, trunk and neck base between the trunk-owned ports. */
export namespace AutoMovieHumanTrunkF1Skin {
  /** Loft the authored sections, preserving the actual armscye, fork and neck edges. */
  export function f1(ports: AutoMovieHumanTrunkPorts.IFixed): Mesh {
    const {
      skin,
      rails: [lower, upper],
    }: ReturnType<typeof AutoMovieHumanTrunkArmscye.f1> =
      AutoMovieHumanTrunkArmscye.f1(ports.arm);
    const { positions, indices }: Mesh = skin;
    if (lower.direction > 0)
      for (let i: number = 0; i < indices.length; i += 3)
        [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];

    const vertex: Map<V3, number> = new Map();
    for (const rail of [lower, upper])
      for (const [i, point] of rail.points.entries())
        vertex.set(point, rail.indices[i]!);

    /** Reuse only the same section point object; nearby coordinates never imply a weld. */
    const owned: (point: V3) => number = (point: V3): number => {
      const present: number | undefined = vertex.get(point);
      if (present !== undefined) return present;
      const index: number = positions.length / 3;
      positions.push(...point);
      vertex.set(point, index);
      return index;
    };

    /** Emit adjacent measured rings only after both complete directed rails qualify. */
    const append: (rings: V3[][]) => void = (rings: V3[][]): void => {
      for (let i: number = 1; i < rings.length; ++i) {
        const before: V3[] = rings[i - 1]!;
        const after: V3[] = rings[i]!;
        const triangles: [V3, V3, V3][] = [];
        tessellateAutoMovieContourStrip64(
          before,
          after,
          (a: V3, b: V3, c: V3): void => {
            triangles.push([a, b, c]);
          },
          undefined,
          (observation): void => {
            if (!observation.qualified)
              throw new Error(
                `F1 trunk y${before[0]![1]} to y${after[0]![1]}: ${observation.diagnostics.join(" | ")}`,
              );
          },
        );
        const a: number = edgeSense(before, triangles);
        const b: number = edgeSense(after, triangles);
        if (
          Math.abs(a) !== before.length ||
          Math.abs(b) !== after.length ||
          Math.sign(a) === Math.sign(b)
        )
          throw new Error(
            `F1 trunk y${before[0]![1]} to y${after[0]![1]}: an exact rail edge was lost`,
          );
        for (const [p, q, r] of triangles)
          indices.push(owned(p), owned(a < 0 ? q : r), owned(a < 0 ? r : q));
      }
    };

    // The fork retains its original median endpoints. Only the repeated closing
    // marker is discarded; it is not part of the boundary incident to the legs.
    const fork: V3[] = [...ports.fork.ring];
    if (
      fork[0]!.every(
        (value: number, i: number): boolean => value === fork.at(-1)![i],
      )
    )
      fork.pop();

    // Level rails record world X/Z at their physical height. The tilted
    // pelvis rails carry all three coordinates and their original walk order.
    const level: { station: number; ring: V3[] }[] = contours.horizontal.map(
      ([station, samples]: (typeof contours.horizontal)[number]): {
        station: number;
        ring: V3[];
      } => {
        if (typeof station !== "number" || !Array.isArray(samples))
          throw new Error(
            "The recorded F1 level contour has no physical coordinates",
          );
        return {
          station,
          ring: samples.map(
            (p: readonly number[]): V3 => [p[0]!, station, p[1]!],
          ),
        };
      },
    );
    const turned: V3[][] = contours.turned.map(
      ([, samples]: (typeof contours.turned)[number]): V3[] => {
        if (!Array.isArray(samples))
          throw new Error(
            "The recorded F1 fork contour has no physical coordinates",
          );
        return samples.map(point);
      },
    );
    append([
      increasingPhase(fork),
      ...turned,
      ...level
        .filter(
          ({ station }: (typeof level)[number]): boolean =>
            station < lower.station,
        )
        .map(({ ring }: (typeof level)[number]): V3[] => ring),
      lower.points,
    ]);
    append([
      upper.points,
      ...level
        .filter(
          ({ station }: (typeof level)[number]): boolean =>
            station > upper.station,
        )
        .map(({ ring }: (typeof level)[number]): V3[] => ring),
      [...ports.neck],
    ]);
    return skin;
  }
}
