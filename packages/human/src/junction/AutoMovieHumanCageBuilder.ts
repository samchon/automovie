import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanCageFrame } from "./AutoMovieHumanCageFrame";
import { capAutoMovieHumanCage } from "./capAutoMovieHumanCage";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "./IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";

/**
 * Assembles one part's control cage from stations, the closed loops of vertices a tube-like part is made of, with each face's corners addressed on the part's chart.
 *
 * A station lists its vertices counterclockwise about the direction the part is built in, which for a limb or the neck is the site axis pointing distally, so its chart coordinate `v` grows with the index. Consecutive stations of equal count are bridged by quads, stations whose counts differ are tapered by a fixed pattern, and an end is closed by a quad grid. A junction ring is opened from its `IAutoMovieHumanRingLayout`; `build` drops vertices no face uses, so a hole is made by skipping faces.
 *
 * @author Samchon
 */
export class AutoMovieHumanCageBuilder {
  private readonly positions_: IAutoMovieVector3[] = [];
  private readonly faces_: IAutoMovieHumanCage.IFace[] = [];
  private readonly creases_: IAutoMovieHumanCage.ICrease[] = [];
  private readonly rings_: Array<{
    layout: IAutoMovieHumanRingLayout;
    vertices: number[];
  }> = [];

  public constructor(
    /** The part being built, written into every corner address. */
    public readonly part: AutoMovieHumanPart,

    /** Its side, or null for the trunk, neck and head. */
    public readonly side: AutoMovieHumanSide | null,
  ) {}

  /**
   * Add a control point.
   *
   * @param position Model frame, millimetres
   * @returns Its index
   */
  public vertex(position: IAutoMovieVector3): number {
    this.positions_.push(position);
    return this.positions_.length - 1;
  }

  /**
   * Position of a control point added before.
   *
   * @param index Vertex index
   * @returns Its position
   */
  public position(index: number): IAutoMovieVector3 {
    return this.positions_[index]!;
  }

  /**
   * Add a station of new vertices.
   *
   * @param positions Positions in station order
   * @param u Chart coordinate along the part shared by the station
   * @returns The station, its `v` spread evenly from 0
   */
  public station(
    positions: IAutoMovieVector3[],
    u: number,
  ): AutoMovieHumanCageBuilder.IStation {
    return {
      vertices: positions.map((p: IAutoMovieVector3): number => this.vertex(p)),
      coordinates: positions.map(
        (
          _: IAutoMovieVector3,
          k: number,
        ): AutoMovieHumanCageBuilder.IChart => ({
          u,
          v: k / positions.length,
        }),
      ),
    };
  }

  /**
   * Open the junction ring this part has at a site at radii of the part's own choosing and return it as a station. The junction refuses a ring off the site's shared boundary, so a part opens its rings with `place` and keeps this for rings it shapes to that boundary itself.
   *
   * Vertex `k` of the station, in build order, is placed at `layout.origin + radius(direction) · direction` along its layout direction. The ring is recorded in the layout's own order, counterclockwise about its normal, so the junction can pair it.
   *
   * @param layout The part's ring layout at the site
   * @param radius Distance of each vertex from the origin, by its direction
   * @param u Chart coordinate of the ring
   * @returns The ring as a station in build order
   */
  public open(
    layout: IAutoMovieHumanRingLayout,
    radius: (direction: IAutoMovieVector3) => number,
    u: number,
  ): AutoMovieHumanCageBuilder.IStation {
    const order: number[] = AutoMovieHumanCageBuilder.buildOrder(layout);
    const station: AutoMovieHumanCageBuilder.IStation = this.station(
      order.map(
        (j: number): IAutoMovieVector3 =>
          AutoMovieHumanVector.offset(layout.frame.origin, [
            layout.directions[j]!,
            radius(layout.directions[j]!),
          ]),
      ),
      u,
    );
    this.record(layout, station);
    return station;
  }

  /**
   * Open the junction ring this part has at a site exactly on the site's shared boundary and return it as a station.
   *
   * Vertex `k` of the station, in build order, is the shape's position for layout vertex `buildOrder(shape)[k]`, so the ring coincides point for point with the other part's ring at the site. The ring is recorded in the layout's own order.
   *
   * @param shape The part's ring shape at the site, from `shapeAutoMovieHumanRing`
   * @param u Chart coordinate of the ring
   * @returns The ring as a station in build order
   */
  public place(
    shape: IAutoMovieHumanRingShape,
    u: number,
  ): AutoMovieHumanCageBuilder.IStation {
    const station: AutoMovieHumanCageBuilder.IStation = this.station(
      AutoMovieHumanCageBuilder.buildOrder(shape).map(
        (j: number): IAutoMovieVector3 => ({ ...shape.positions[j]! }),
      ),
      u,
    );
    this.record(shape, station);
    return station;
  }

  /**
   * Record an existing station of this part as its junction ring at a site.
   *
   * @param layout The part's ring layout at the site
   * @param station The station, in build order, whose vertex `k` lies along the layout direction `buildOrder(layout)[k]`
   */
  public record(
    layout: IAutoMovieHumanRingLayout,
    station: AutoMovieHumanCageBuilder.IStation,
  ): void {
    if (station.vertices.length !== layout.count)
      throw new Error(
        `ring at ${layout.site} needs ${layout.count} vertices, got ${station.vertices.length}`,
      );
    const order: number[] = AutoMovieHumanCageBuilder.buildOrder(layout);
    const vertices: number[] = new Array<number>(layout.count);
    order.forEach((j: number, k: number): void => {
      vertices[j] = station.vertices[k]!;
    });
    this.rings_.push({ layout, vertices });
  }

  /**
   * Add one quad.
   *
   * @param vertices Corners counterclockwise seen from outside
   * @param coordinates Chart coordinates of the corners; a face across the wrap meridian is unwrapped so its corners lie within half a turn
   */
  public face(
    vertices: [number, number, number, number],
    coordinates: [
      AutoMovieHumanCageBuilder.IChart,
      AutoMovieHumanCageBuilder.IChart,
      AutoMovieHumanCageBuilder.IChart,
      AutoMovieHumanCageBuilder.IChart,
    ],
  ): void {
    const vs: number[] = coordinates.map(
      (c: AutoMovieHumanCageBuilder.IChart): number => c.v,
    );
    const wrap: boolean = Math.max(...vs) - Math.min(...vs) > 0.5;
    this.faces_.push({
      vertices,
      coordinates: coordinates.map((c: AutoMovieHumanCageBuilder.IChart): IAutoMovieHumanCage.IFace["coordinates"][number] => ({
        part: this.part,
        side: this.side,
        u: c.u,
        v: wrap && c.v < 0.5 ? c.v + 1 : c.v,
      })) as IAutoMovieHumanCage.IFace["coordinates"],
    });
  }

  /**
   * Add a station of new vertices between two stations of equal count, by linear interpolation of positions and chart coordinates.
   *
   * @param from First station
   * @param to Second station
   * @param t Fraction from `from` to `to`
   * @returns The new station
   */
  public blend(
    from: AutoMovieHumanCageBuilder.IStation,
    to: AutoMovieHumanCageBuilder.IStation,
    t: number,
  ): AutoMovieHumanCageBuilder.IStation {
    return {
      vertices: from.vertices.map((a: number, k: number): number =>
        this.vertex(
          AutoMovieHumanVector.offset(
            AutoMovieHumanVector.of(0, 0, 0),
            [this.position(a), 1 - t],
            [this.position(to.vertices[k]!), t],
          ),
        ),
      ),
      coordinates: from.coordinates.map(
        (
          c: AutoMovieHumanCageBuilder.IChart,
          k: number,
        ): AutoMovieHumanCageBuilder.IChart => ({
          u: c.u + (to.coordinates[k]!.u - c.u) * t,
          v: c.v + (to.coordinates[k]!.v - c.v) * t,
        }),
      ),
    };
  }

  /**
   * Bridge two stations of equal count with one quad per span.
   *
   * @param from The station nearer the start of the build direction
   * @param to The next station
   * @param skip Spans to leave open, by the index of their first vertex, to cut a hole
   */
  public bridge(
    from: AutoMovieHumanCageBuilder.IStation,
    to: AutoMovieHumanCageBuilder.IStation,
    skip: ReadonlySet<number> = new Set(),
  ): void {
    const n: number = from.vertices.length;
    if (to.vertices.length !== n)
      throw new Error(
        `bridge needs equal stations, got ${n} and ${to.vertices.length}`,
      );
    for (let k: number = 0; k < n; ++k) {
      if (skip.has(k)) continue;
      const l: number = (k + 1) % n;
      this.face(
        [
          from.vertices[k]!,
          from.vertices[l]!,
          to.vertices[l]!,
          to.vertices[k]!,
        ],
        [
          from.coordinates[k]!,
          wrapped(from.coordinates, k, l),
          wrapped(to.coordinates, k, l),
          to.coordinates[k]!,
        ],
      );
    }
  }

  /**
   * Bridge a station to a smaller one, with every span of `to` facing one or three spans of `from`.
   *
   * A three-span sector is split by the edge from its third `from` vertex to its first `to` vertex into two quads, which leaves a valence 3 vertex on `from` and a valence 5 vertex on `to`; each sector reduces the count by two.
   *
   * @param from The larger station
   * @param to The smaller station
   * @param spans Number of `from` spans each span of `to` faces, 1 or 3, summing to the count of `from`
   */
  public taper(
    from: AutoMovieHumanCageBuilder.IStation,
    to: AutoMovieHumanCageBuilder.IStation,
    spans: number[],
  ): void {
    const n: number = from.vertices.length;
    const m: number = to.vertices.length;
    if (
      spans.length !== m ||
      spans.reduce((a: number, b: number): number => a + b, 0) !== n
    )
      throw new Error(`taper spans must cover ${n} spans in ${m} sectors`);
    let i: number = 0;
    spans.forEach((span: number, j: number): void => {
      const a: number[] = Array.from(
        { length: span + 1 },
        (_: unknown, s: number): number => (i + s) % n,
      );
      const b: [number, number] = [j, (j + 1) % m];
      const fc: (s: number) => AutoMovieHumanCageBuilder.IChart = (s: number): AutoMovieHumanCageBuilder.IChart =>
        s === 0
          ? from.coordinates[a[0]!]!
          : wrapped(from.coordinates, a[0]!, a[s]!);
      const tc: (s: number) => AutoMovieHumanCageBuilder.IChart = (s: number): AutoMovieHumanCageBuilder.IChart =>
        s === 0 ? to.coordinates[b[0]]! : wrapped(to.coordinates, b[0], b[1]);
      if (span === 1)
        this.face(
          [
            from.vertices[a[0]!]!,
            from.vertices[a[1]!]!,
            to.vertices[b[1]]!,
            to.vertices[b[0]]!,
          ],
          [fc(0), fc(1), tc(1), tc(0)],
        );
      else if (span === 3) {
        this.face(
          [
            from.vertices[a[0]!]!,
            from.vertices[a[1]!]!,
            from.vertices[a[2]!]!,
            to.vertices[b[0]]!,
          ],
          [fc(0), fc(1), fc(2), tc(0)],
        );
        this.face(
          [
            from.vertices[a[2]!]!,
            from.vertices[a[3]!]!,
            to.vertices[b[1]]!,
            to.vertices[b[0]]!,
          ],
          [fc(2), fc(3), tc(1), tc(0)],
        );
      } else throw new Error(`taper span must be 1 or 3, got ${span}`);
      i += span;
    });
  }

  /**
   * Close a station with a square grid of quads, domed along the build direction.
   *
   * A station of `4m` vertices bounds an `m` by `m` grid; its four corners become valence 3 vertices. Interior points follow the Coons patch of the station and rise by `height` times how far they lie inside it. Their chart coordinates are polar: `u` runs from the station's to 1 at the centre and `v` is the angle about the centre.
   *
   * @param station The station to close, counterclockwise about `axis`
   * @param axis Unit direction the cap faces, the build direction
   * @param height Rise of the cap's centre above the station, millimetres
   */
  public cap(
    station: AutoMovieHumanCageBuilder.IStation,
    axis: IAutoMovieVector3,
    height: number,
  ): void {
    capAutoMovieHumanCage(this, station, axis, height);
  }

  /**
   * Mark a cage edge semi-sharp.
   *
   * @param edge The edge's two vertex indices
   * @param sharpness Subdivision levels it stays sharp
   */
  public crease(edge: [number, number], sharpness: number): void {
    this.creases_.push({ edge, sharpness });
  }

  /**
   * Finish the cage, dropping vertices no face uses and renumbering the rest in order.
   *
   * @returns The cage
   */
  public build(): IAutoMovieHumanCage {
    const used: number[] = new Array<number>(this.positions_.length).fill(-1);
    for (const face of this.faces_) for (const v of face.vertices) used[v] = 0;
    const vertices: IAutoMovieHumanCage.IVertex[] = [];
    used.forEach((u: number, i: number): void => {
      if (u === -1) return;
      used[i] = vertices.length;
      vertices.push({ position: this.positions_[i]! });
    });
    const map: (i: number) => number = (i: number): number => {
      if (used[i] === -1) throw new Error(`vertex ${i} belongs to no face`);
      return used[i]!;
    };
    return {
      vertices,
      faces: this.faces_.map(
        (f: IAutoMovieHumanCage.IFace): IAutoMovieHumanCage.IFace => ({
          vertices: f.vertices.map(
            map,
          ) as IAutoMovieHumanCage.IFace["vertices"],
          coordinates: f.coordinates,
        }),
      ),
      creases: this.creases_.map(
        (c: IAutoMovieHumanCage.ICrease): IAutoMovieHumanCage.ICrease => ({
          edge: [map(c.edge[0]), map(c.edge[1])],
          sharpness: c.sharpness,
        }),
      ),
      rings: this.rings_.map(({ layout, vertices }: { layout: IAutoMovieHumanRingLayout; vertices: number[] }): IAutoMovieHumanCage["rings"][number] => ({
        site: layout.site,
        side: layout.side,
        vertices: vertices.map(map),
        start: layout.start,
        frame: layout.frame,
      })),
    };
  }
}
export namespace AutoMovieHumanCageBuilder {
  /**
   * A chart coordinate without the part and side, which the builder adds.
   *
   * @author Samchon
   */
  export interface IChart {
    /** Along the part, 0 to 1. */
    u: number;

    /** Around the part, 0 to 1. */
    v: number;
  }

  /**
   * A closed loop of vertices in build order, with each vertex's chart coordinate.
   *
   * @author Samchon
   */
  export interface IStation {
    /** Vertex indices, counterclockwise about the build direction. */
    vertices: number[];

    /** Chart coordinate of each vertex, aligned with `vertices`. */
    coordinates: IChart[];
  }

  /** Layout indices in the site axis's build order; only the distal part reverses the shared ring winding. */
  export const buildOrder: typeof AutoMovieHumanCageFrame.buildOrder = AutoMovieHumanCageFrame.buildOrder;

  /** Shared ring unit directions in build order, retaining the layout's model frame. */
  export const buildDirections: typeof AutoMovieHumanCageFrame.buildDirections = AutoMovieHumanCageFrame.buildDirections;

  /** Station positions from a common origin and directional radii; lengths retain the caller's one unit and frame. */
  export const around: typeof AutoMovieHumanCageFrame.around = AutoMovieHumanCageFrame.around;

  /** Right-handed rotation in radians about a unit axis, retaining the input vector's unit and frame. */
  export const rotate: typeof AutoMovieHumanCageFrame.rotate = AutoMovieHumanCageFrame.rotate;

  /** Signed radians between perpendicular directions around their common unit axis, in (-pi, pi]. */
  export const angle: typeof AutoMovieHumanCageFrame.angle = AutoMovieHumanCageFrame.angle;

  /** Physical ellipse radius along a polar angle in radians; both semi-axes use the caller's one length unit. */
  export const ellipse: typeof AutoMovieHumanCageFrame.ellipse = AutoMovieHumanCageFrame.ellipse;

  /** Counterclockwise unit directions in the common axis/reference frame; reference is perpendicular to the unit axis. */
  export const turn: typeof AutoMovieHumanCageFrame.turn = AutoMovieHumanCageFrame.turn;

}

/** Coordinate of vertex `l` as seen from vertex `k` of the same station, 1 instead of 0 when the span closes the loop. */
const wrapped: (coordinates: AutoMovieHumanCageBuilder.IChart[], k: number, l: number) => AutoMovieHumanCageBuilder.IChart = (
  coordinates: AutoMovieHumanCageBuilder.IChart[],
  k: number,
  l: number,
): AutoMovieHumanCageBuilder.IChart => {
  const c: AutoMovieHumanCageBuilder.IChart = coordinates[l]!;
  return l < k && c.v === 0 ? { u: c.u, v: 1 } : c;
};
