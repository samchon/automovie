import type { IAutoMovieConstructionNode } from "./IAutoMovieConstructionNode";

/**
 * Two or more parts continued from one open end of a host face (`outer` for
 * more than two), the end split into the children's loops along shared seam
 * chords: the pants topology, a trunk's crotch end into both thighs, where a
 * closing pole has no room for two ports of the children's girth.
 *
 * The seam's two ends are host phases `a < b` on that end's ring. Child 0's
 * loop is the ring arc from `a` to `b`, then the straight chord back from the
 * ring point at `b` to the one at `a`. Child 1 takes the remaining arc `[b, a +
 * 2 pi]` and the same chord in reverse. The loop clock `c` runs from 0 to pi on
 * the arc, linear in host phase, then to 2 pi on the chord, linear in its
 * length. Each child's band spans from its loop to the child face's ring at
 * `rail`. The child keeps its stations beyond that ring.
 *
 * Each band is the engine's join strip between two ribbons (each side's own
 * 2-jet across its rail, spanned by the quintic Hermite blend): on the arc the
 * host face's own surface leaving its end, on the chord the end section's
 * normal line out of the host (a declared ruling, so the two bands meet back to
 * back along the chord, the seam's declared crease), and on the child its own
 * surface leaving the rail toward its kept side, both ribbons scaled by one
 * factor at which no column turns back along its chord. A band is G2 to the
 * host along the arc and G2 to the child along its rail, except where `crease`
 * declares the child-side meeting C0. With the straight chord the loop corners
 * at the seam's ends are declared creases; a `profile` curves the seam so that
 * it leaves both ends along the host's surface (`IProfile`). A failed premise
 * leaves both children, both bands and the host's end as they were, with one
 * diagnostic naming the split.
 *
 * Engine admission: `hostFace` a view part of the host's subtree; each
 * `partFace` a view part of its child's subtree; the two `band` names unique in
 * the tree; `a < b < a + 2 pi`, both finite; `count` a multiple of 4 of at
 * least 8; `rows` a positive integer; `rail` positive and finite; a crease's
 * bounds finite, `start <= end < start + 2 pi`, and its transition positive.
 */
export interface IAutoMovieConstructionSplit {
  /** Discriminator. */
  type: "split";

  /** The split's name, unique in its tree, named in diagnostics. */
  name: string;

  /** The solid whose face's end is split. */
  host: IAutoMovieConstructionNode;

  /** The host face whose end is split: a view part's name in the host's subtree. */
  hostFace: string;

  /**
   * Which end of the host face: its first station's (`bottom`) or its last's
   * (`top`); it must be open unless a host cut replaces it, and cannot already
   * be shared or cut.
   */
  hostEnd: "bottom" | "top";

  /**
   * The parent boundary inside its original skin. It uses the original phase
   * and replaces the stations between the cut and `hostEnd`. Absent, the
   * boundary is the open end's station ring.
   */
  hostCut?: IAutoMovieConstructionSplit.IHostCut;

  /**
   * The seam chord's two ends as host phases `[a, b]` on that end's ring,
   * radians, `a < b < a + 2 pi`: child 0 takes the arc `[a, b]`, child 1 the
   * arc `[b, a + 2 pi]`.
   */
  seam: [number, number];

  /**
   * The seam's curve, or absent for the straight chord. With a profile, the
   * seam leaves each of its two ends (the forks) along the host's own surface,
   * so the bands meet the host G1 at the forks instead of at the declared
   * corner creases, and each band's chord columns follow the curve.
   */
  profile?: IAutoMovieConstructionSplit.IProfile;

  /**
   * Further seams for an end split into more than two children, each enclosing
   * the one before: seam `j` runs from host phase `a_j` to `b_j` with `a_j <
   * a_(j-1)` and `b_j > b_(j-1)` (`seam` is seam 0), and `b_j < a_j + 2 pi`, so
   * the seams cross the end side by side, as the webs between the fingers cross
   * a hand's end from its back to its palm. Child 0 takes the arc `[a_0, b_0]`
   * and seam 0; child `j` between seams `j - 1` and `j` takes the arc `[a_j,
   * a_(j-1)]`, seam `j - 1`, the arc `[b_(j-1), b_j]` and seam `j`; the last
   * child takes the arc `[b_last, a_last + 2 pi]` and the last seam. Every seam
   * is shared by the two children beside it, and its bands meet G1 across it as
   * a two-way split's do. With further seams each band's loop gives a quarter
   * of its columns to each seam it takes and the rest to its arcs: three
   * quarters to the one arc of an outer child, a quarter to each arc of an
   * inner one. Absent or empty, the end is split in two.
   */
  outer?: IAutoMovieConstructionSplit.ISeam[];

  /**
   * Columns of each band round its loop, a multiple of 4 of at least 8: half on
   * the arc, half on the chord (a quarter per seam with `outer`).
   */
  count: number;

  /** Grid stations of each band face across its span, at least 1. */
  rows: number;

  /** The children in the seams' order, one more than the seams. */
  children: [
    IAutoMovieConstructionSplit.IChild,
    IAutoMovieConstructionSplit.IChild,
    ...IAutoMovieConstructionSplit.IChild[],
  ];

  /**
   * The end as the composition of the children's own sections in one declared
   * plane (`ICompose`), so its forks, its seam planes and every child's rail
   * follow from the children and move with them. Absent, the forks are the
   * authored `seam` phases and each rail the child's `rail` station or its own
   * `cut`.
   */
  compose?: IAutoMovieConstructionSplit.ICompose;
}

/** Child bands, seam curves and declared crease windows at a split end. */
export namespace IAutoMovieConstructionSplit {
  /**
   * One plane cutting the parent's regular station interval. At each phase the
   * engine brackets the first transverse entry to its kept side from `hostEnd`,
   * using the host's regular declared stations. The plane's outward normal
   * points from the kept host toward the children. The original face keeps its
   * station chart. The bands read the cut's exact positions and phase
   * derivatives at and between columns. They use the owner's transverse jets at
   * the columns and interpolate them between columns.
   */
  export interface IHostCut {
    /** Tree coordinates or the nominal host end's section frame (`ICut`). */
    frame: "tree" | "host";

    /** Cut plane with its normal pointing toward the retained host. */
    plane: IPlane;
  }

  /**
   * A plane with a kept side: the points `x` with `normal . (x - point) >= 0`
   * are kept.
   *
   * Engine admission: every coordinate finite and the normal not zero; the
   * normal need not be unit.
   */
  export interface IPlane {
    /** A point of the plane, metres, in the holding record's frame. */
    point: [number, number, number];

    /**
     * The plane's normal toward the kept side, in the holding record's frame;
     * any positive length.
     */
    normal: [number, number, number];
  }

  /**
   * A child's rail as a curve on the child: the child's own skin cut by a
   * declared surface fixed in a named frame, in place of one station ring.
   *
   * The surface is the boundary of the region every plane keeps (`IPlane`):
   * with one plane, that plane; with several, the planes' common kept wedge,
   * such as the end plane and the two planes that part a child from its
   * neighbours. At each child phase the rail's station is the first, from the
   * end that faces the host, at which the child's skin enters that region, so
   * the child keeps exactly its skin inside the region and the band replaces
   * the rest. The rail is read with its first and second derivatives round the
   * child by the implicit function theorem on the child's own 2-jet, and the
   * child's rail cycle, the band's end edge and the crossing between them read
   * that one curve between the band's columns as well as at them. Two parallel
   * positions of the same planes give two curves that are offsets of one
   * another, so a loop on the first and a rail on the second bound a strip as
   * wide as the planes stand apart.
   *
   * With `round` the wedge's edges are rounded: the region's boundary is the
   * zero set of the smooth minimum `-round ln(sum_i exp(-g_i / round))` of the
   * planes' signed distances `g_i` (millimetres in the kernel), which tends to
   * the plane distance itself away from an edge and turns from one plane to the
   * next over about `round`, staying inside the wedge by at most `round
   * ln(planes)`. The rail is then one smooth curve; without it the rail keeps a
   * corner where two planes cross on the child.
   *
   * Frames: `tree`, the construction's own coordinates; `host`, the host end
   * section's frame, its origin the section's planar origin and its axes the
   * section's first and second axes and its normal out of the host; `part`, the
   * child's facing end section's frame likewise, its third axis into the child.
   * A plane written in a section's frame follows that section when the part
   * moves.
   *
   * Engine admission: at least one plane, each as `IPlane` states; `round`,
   * when given, finite and positive; `frame` one of the three. The realization
   * refuses, naming the child and the phase: a phase whose skin never enters
   * the region inside the child's domain (two children that do not part, a
   * plane beyond the child's far end); a phase already inside the region at the
   * facing end (the cut lies before the child's end); a phase where the skin is
   * tangent to the surface.
   */
  export interface ICut {
    /** The frame the planes are written in. */
    frame: "tree" | "host" | "part";

    /** The planes; the child keeps its skin on every plane's kept side. */
    planes: [IPlane, ...IPlane[]];

    /**
     * The rounding length of the wedge's edges, metres, positive; absent, the
     * edges are sharp.
     */
    round?: number;
  }

  /**
   * An end composed of its children: the children's root sections, each child's
   * own skin cut by one declared end plane, laid side by side in that plane in
   * the children's order.
   *
   * What follows from the children, with nothing authored twice:
   *
   * - Each child's root section is its skin cut by the end plane (`ICut` with
   *   that one plane), a closed curve in the plane.
   * - Each pair of neighbouring sections crosses in two points, the pair's forks;
   *   the composed outline is every section's arcs outside its neighbours (its
   *   lobes), so each lobe's extremes are the child's own, and the valley
   *   between two lobes ends in the pair's forks.
   * - The pair's seam plane passes through both forks and holds the bisector of
   *   the two children's axes (each the mean direction of the child's stations
   *   across its root section, into the child), so the seam between two
   *   children turns as either child turns.
   * - On the host's end ring, seam `j`'s two forks are the two points where its
   *   seam plane crosses the ring; the authored `seam` phases of the split and
   *   of `outer` are then not read, each entry declaring only that its seam
   *   exists.
   * - Each seam is its children's valley: in the seam plane, at each place along
   *   the chord between the pair's forks, the deeper of the two children's
   *   skins cut by that plane, which is where the two children's union crosses
   *   the plane (the two cuts are one curve when the children mirror each other
   *   in the plane). It is read at the shares `i / (count / 4)` of that chord,
   *   the seam's own columns, and joined by the seam's spline from fork to fork
   *   on the host's ring. A `profile` under `compose` therefore declares no
   *   curve: its `knots` must be empty and its `heading` absent, either one
   *   refused by name as a second definition, and it carries only `corner`,
   *   `reach`, `square` and `fair`; without a profile the ribbons do not turn
   *   at the forks.
   * - The composed outline is the sections' lobes joined through the forks, in
   *   order round the end. Sections that cross leave no gap, so the saddle rule
   *   (a radius of half the gap between two root sections) gives each fork a
   *   zero radius: a fork is a corner of the outline and a point of both lobes.
   *   The host's end ring is measured against that outline in the end plane,
   *   and a ring that stands farther from it anywhere than the shortest child
   *   `rail` is refused with the greatest and the mean distance, since a band
   *   `rail` long would then run more across the children than along them. A
   *   host family that adopts the outline for its last section stands at zero.
   * - Each band's loop edge is its owners' curves between columns as well as at
   *   them: the host's ring on an arc and the shared seam on a seam, so the two
   *   bands beside a seam share its points and tangents everywhere.
   * - Each child's rail is its skin cut by the end plane and its one or two seam
   *   planes, each moved along the child's axis by the child's `rail` distance,
   *   with `round` on the wedge's edges (`ICut`); a child's own `cut`, when
   *   declared, is used instead. On a straight child the rail is therefore the
   *   child's own boundary in the composition, moved along its stations by
   *   `rail`: where the host's end ring is the composed outline and a seam the
   *   children's own valley, each child's loop and its rail are offsets of one
   *   curve and the band between them is a strip `rail` wide all round. A plane
   *   moved along its own normal instead would carry a seam plane, which stands
   *   nearly along the child, many times `rail` down the child.
   *
   * The plane is written in `frame`: `tree`, the construction's coordinates, or
   * `host`, the host end section's frame (`ICut`). Its normal points out of the
   * host, into the children.
   *
   * Engine admission: the plane as `IPlane` states; `round`, when given, finite
   * and positive. The realization refuses, naming the children: a child whose
   * skin does not cross the end plane all round inside its domain (its section
   * is not admitted in the plane); two neighbours whose sections do not cross
   * exactly twice (lobes apart, or one inside the other); two children that are
   * not neighbours whose sections overlap; a pair whose bisector runs along the
   * chord between its forks; a seam plane that does not cross the host's end
   * ring exactly twice, or whose forks do not enclose the seam before it; a
   * host end ring farther from the composed outline than the shortest `rail`; a
   * profile with knots or a heading; a valley that leaves the chord between the
   * host's forks; and every refusal of a child's rail (`ICut`).
   */
  export interface ICompose {
    /** The frame the end plane is written in. */
    frame: "tree" | "host";

    /** The end plane; its normal points out of the host, into the children. */
    plane: IPlane;

    /**
     * The rounding length of each derived rail's wedge edges, metres, positive
     * (`ICut.round`); absent, sharp.
     */
    round?: number;
  }

  /**
   * A curved seam: the shared contour both bands start from in place of the
   * straight chord, such as a crotch's midsagittal line from the front fork
   * under the perineum to the back fork.
   *
   * The seam plane holds the chord and the host end section's outward normal.
   * In it the seam is the clamped cubic spline, on chord-length parameters
   * between its knots, through the chord's first end (host phase `a`), the
   * authored knots and its second end (phase `b`). It is parameterized by its
   * own course, not by the chord, so its knots need not advance along the
   * chord: a seam whose web stands well out of the end beside a fork, as
   * between the toes on top of the foot, runs out along the host first and then
   * turns across. At each end its tangent is the line where the host's tangent
   * plane meets the seam plane, oriented out of the host, with a derivative as
   * long as the adjacent knot distance. So the seam leaves each fork along the
   * host's own surface. Each band's chord columns stand on the curve at equal
   * arclength shares. Their start ribbon is the seam plane's unit normal toward
   * the band's own arc, of length `L` with second derivative zero. The two
   * bands therefore leave the seam in opposite directions with a common tangent
   * plane, G1 across it.
   *
   * Within `corner` of clock on each side of a fork, the cross ribbons turn by
   * the quintic smoothstep through the inward diagonal at the fork. On the arc
   * they turn from the host's own ribbon toward the ruling, inside the host's
   * tangent plane. On the seam they turn from the ruling toward the seam's
   * direction away from the fork. The corner column then leaves the fork
   * between both boundaries instead of along either one. The bands are G1 to
   * the host there, not G2. The forks are G1 when the host's normal at each
   * fork lies in the seam plane, as on the midline of a mirror-symmetric host.
   * Otherwise the remaining angle stays measurable and is not hidden.
   *
   * Engine admission: at least one knot; every knot finite, `along` not
   * negative, and apart from the knot before it (the first from the seam's
   * first end, `[0, 0]`); the realization refuses a knot whose `along` exceeds
   * the chord's length, which needs the host's geometry; `corner` finite,
   * positive and below `pi / 2`; `reach`, when given, finite in `(0, 1]`.
   */
  export interface IProfile {
    /**
     * Interior knots in the seam plane, metres, in the seam's own order:
     * `[along, depth]`, `along` the distance from the seam's first end toward
     * its second along the chord, in `[0, chord]` and not necessarily
     * increasing, `depth` along the host end's outward normal (positive out of
     * the host).
     */
    knots: [number, number][];

    /**
     * The ribbons' turn at each fork: radians of the loop clock on each side,
     * positive, below `pi / 2`.
     */
    corner: number;

    /**
     * In a split into more than two (`outer`), the share of its length each
     * band's cross ribbon keeps at a fork, rising to the whole by the quintic
     * smoothstep over `corner` of clock on each side: the first derivative by
     * the share, the second by its square, so a column only slows across its
     * start and the band's tangent plane and curvature there, G2 to the host
     * along an arc, are kept. Inside a fork the band's corner is convex, and
     * columns leaving square to the ring and to the seam converge within about
     * the turn's window; shorter ribbons leave the rest of each column to its
     * rail, which runs round the child in order. In `(0, 1]`; absent, 1. The
     * first seam with a profile gives the split's, as it gives `corner`.
     */
    reach?: number;

    /**
     * In a split into more than two (`outer`), whether each band leaves the
     * host's arc square to the end ring: along the chart line `(into, -into
     * (S_u . S_v) / (S_v . S_v))`, whose image is square to the ring in the
     * host's tangent plane, with the host's own 2-jet along that line, so the
     * band stays G2 to the host. Absent or false, along the host's station
     * line, whose image leans along the ring wherever the host's points slide
     * round it with the station (a section changing shape under a polar phase):
     * on f1's foot the station lines at the end ring swung by 40 degrees within
     * 0.07 rad of phase round the top of the big toe's root, and the big toe's
     * band pleated there. The first seam with a profile gives the split's, as
     * it gives `corner`.
     */
    square?: boolean;

    /**
     * The radius of the disc about each of this seam's two forks over which the
     * drawn skin is faired, as a share of the seam's chord (the distance
     * between its two forks): the vertices whose path along the mesh from the
     * fork is shorter than the radius are moved so that the bi-Laplacian of
     * their positions vanishes, with the two rings outside the disc held, so
     * the fill meets the skin round it G1 (the fork patch of the
     * branching-surface literature, Gabrielides, Ginnis and Kaklis 2007, in the
     * discrete form of Botsch and Kobbelt 2004). At a fork the host's end and
     * two bands meet in a corner no one surface owns, and each band turns
     * sharply beside it over about its corner window, which grows with the
     * seam. The fill belongs to no surface: its vertices keep the chart
     * coordinates they were drawn at. In `(0, 1]`, one share for both forks or
     * one for each, `[a, b]` in the seam's order; absent, the forks are left as
     * drawn. The two sides of an end may want their own: between toes the web
     * stands deep on the sole and shallow on top.
     */
    fair?: number | [number, number];

    /**
     * A world direction the seam plane holds in place of the host end's outward
     * normal, unit or not, not along the chord; `depth` is then measured along
     * its part square to the chord, oriented out of the host. A seam between
     * two digits that leave a limb's end aslant to its course lies in the plane
     * between the digits, which holds their direction and not the course's.
     * Absent, the end normal.
     */
    heading?: [number, number, number];
  }

  /**
   * One further seam of a split into more than two children (`outer`): its two
   * forks as host phases and its curve.
   *
   * Engine admission: as the split's own `seam` and `profile`, and each seam
   * encloses the one before it.
   */
  export interface ISeam {
    /** The seam's two ends as host phases `[a, b]` on the end's ring, radians. */
    seam: [number, number];

    /** The seam's curve, or absent for the straight chord. */
    profile?: IProfile;
  }

  /**
   * One child of a split: its subtree, the face that meets the host's end, its
   * rail and its band.
   */
  export interface IChild {
    /** The band's face and chain name, unique in the tree. */
    band: string;

    /** The child's subtree. */
    part: IAutoMovieConstructionNode;

    /**
     * The child face the band reaches: a view part's name in the child's
     * subtree.
     */
    partFace: string;

    /**
     * The child face's end that faces the host: the band replaces the child's
     * surface between that end and the rail.
     */
    partEnd: "bottom" | "top";

    /**
     * The rail's distance from that end into the child along its station,
     * metres, positive: the child keeps the stations beyond it. Not read when
     * `cut` is given; under the split's `compose` it is the distance the
     * derived rail's planes are moved along the child's axis.
     */
    rail: number;

    /**
     * The rail as a curve on the child, its skin cut by a declared surface
     * (`ICut`), in place of the one station `rail`: for a child whose root does
     * not lie in one of its own section planes, as a digit's does where it
     * leaves an end aslant and is parted from its neighbours by the planes
     * between them. Absent, the rail is the one station, or under the split's
     * `compose` the derived cut.
     */
    cut?: ICut;

    /**
     * A declared crease where the band meets the child, or absent for G2 all
     * round.
     */
    crease?: ICrease;

    /**
     * How the child's rail is matched to the band's loop column by column.
     * `angle` (the default): the rail point at the loop point's angle about the
     * rail ring's centroid, which both curves must turn round once
     * monotonically. `length`: the first column by that angle, every other at
     * the same share of the rail's length round it as the column's of the
     * loop's, so neither need be star-shaped about the centroid, as a finger's
     * loop, its back on the hand's end and its sides on the webs, is not about
     * its rail far down the finger.
     */
    correspondence?: "angle" | "length";
  }

  /**
   * A crease window on a band's loop clock where the band meets its child C0
   * instead of G2.
   *
   * Inside `[start, end]` the band arrives at the child's rail along the
   * straight chord from its loop (its child-side ribbon's first derivative is
   * that chord, its second zero), so it meets the child at an angle; outside
   * the window, over `transition` on each side, the child-side ribbon returns
   * to the child's own 2-jet by the quintic smoothstep `10 x^3 - 15 x^4 + 6
   * x^5`, whose first and second derivatives vanish at both ends, so the band
   * stays C2 along its loop. The band remains G2 to the host everywhere.
   */
  export interface ICrease {
    /** The window's first clock, radians on the band's loop clock. */
    start: number;

    /**
     * The window's last clock, radians, `start <= end < start + 2 pi` (a window
     * may run past `2 pi` and wrap).
     */
    end: number;

    /**
     * The fall from the crease to G2 on each side of the window, radians of
     * clock, positive.
     */
    transition: number;
  }
}
