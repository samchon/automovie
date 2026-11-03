import { HumanAnatomy } from "./HumanAnatomy";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;

/** One component of a plane's section through the skin, as an ordered polyline. */
type ILine = ReturnType<typeof HumanAnatomy.polylines>[number];

/** The closed loops a plane cuts through the hand and fingers, each with the centre and girth a finger's path follows. */
export namespace HumanAnatomyHandSection {
  /** One closed loop of a plane's section. */
  export interface ISection {
    /** Area centroid of the loop. */
    centre: V3;

    /** Taut girth, mm. */
    girth: number;

    /** Loop points. */
    points: V3[];

    /** Whether the loop encloses a point of its plane. */
    encloses: (p: V3) => boolean;
  }

  /**
   * The closed loops of a plane's section through some triangles.
   *
   * A loop under eight points is a sliver of one triangle's corner, not a
   * digit or a hand. The centroid is the loop's area centroid by the shoelace
   * formula, so a finger's path runs through the middle of its flesh and not
   * the middle of its few densest vertices.
   */
  export function sections(skin: HumanAnatomy.ISkin, origin: V3, normal: V3, tris: Uint32Array): ISection[] {
    const [u, w]: [V3, V3] = A.basis(normal);
    const flat: (p: V3) => [number, number] = (p: V3): [number, number] => [A.dot(A.sub(p, origin), u), A.dot(A.sub(p, origin), w)];

    return A.polylines(skin, origin, normal, tris)
      .filter((l: ILine): boolean => l.closed && l.points.length >= 8)
      .map((l: ILine): ISection => {
        const q: [number, number][] = l.points.map(flat);
        let area: number = 0;
        let cx: number = 0;
        let cy: number = 0;
        for (let i: number = 0; i < q.length; i++) {
          const [x0, y0]: [number, number] = q[i]!;
          const [x1, y1]: [number, number] = q[(i + 1) % q.length]!;
          const cr: number = x0 * y1 - x1 * y0;
          area += cr / 2;
          cx += ((x0 + x1) * cr) / 6;
          cy += ((y0 + y1) * cr) / 6;
        }
        const centre: V3 = A.add(origin, A.add(A.scale(u, cx / area), A.scale(w, cy / area)));

        return {
          centre,
          girth: A.hull(q),
          points: l.points,
          encloses: (p: V3): boolean => {
            const [px, py]: [number, number] = flat(p);
            let inside: boolean = false;
            for (let i: number = 0, j: number = q.length - 1; i < q.length; j = i++) {
              const [xi, yi]: [number, number] = q[i]!;
              const [xj, yj]: [number, number] = q[j]!;
              if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
            }
            return inside;
          },
        };
      });
  }
}
