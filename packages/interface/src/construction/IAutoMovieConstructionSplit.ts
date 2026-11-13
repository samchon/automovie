import type { AutoMovieConstructionNode } from "./AutoMovieConstructionNode";

/**
 * Two or more parts continued from one open end of a host face (`outer` for more than two), the end split into the children's loops along shared seam chords: the pants topology, a trunk's crotch end into both thighs, where a closing pole has no room for two ports of the children's girth.
 *
 * The seam's two ends are host phases `a < b` on that end's ring. Child 0's loop is the ring arc from `a` to `b`, then the straight chord back from the ring point at `b` to the one at `a`; child 1's loop is the arc from `b` to `a + 2 pi`, then the same chord the other way, so the two loops share it. Each loop clock `c` runs over `[0, 2 pi)`: `[0, pi]` on the arc, linear in host phase, `[pi, 2 pi)` on the chord, linear in its length. Each child's band spans from its loop to the child face's ring at `rail`, and the child keeps its stations beyond that ring.
 *
 * Each band is the engine's join strip between two ribbons (each side's own 2-jet across its rail, spanned by the quintic Hermite blend): on the arc the host face's own surface leaving its end, on the chord the end section's normal line out of the host (a declared ruling, so the two bands meet back to back along the chord, the seam's declared crease), and on the child its own surface leaving the rail toward its kept side, both ribbons scaled by one factor at which no column turns back along its chord. A band is G2 to the host along the arc and G2 to the child along its rail, except where `crease` declares the child-side meeting C0. With the straight chord the loop corners at the seam's ends are declared creases; a `profile` curves the seam so that it leaves both ends along the host's surface (`IProfile`). A failed premise leaves both children, both bands and the host's end as they were, with one diagnostic naming the split.
 *
 * Engine admission: `hostFace` a view part of the host's subtree; each `partFace` a view part of its child's subtree; the two `band` names unique in the tree; `a < b < a + 2 pi`, both finite; `count` a multiple of 4 of at least 8; `rows` a positive integer; `rail` positive and finite; a crease's bounds finite, `start <= end < start + 2 pi`, and its transition positive.
 *
 * @evidence contracts/development/design.md#principled-representation An open end divided by one chord into two loops gives each child a closed port on the parent's own boundary (construction.md, Connections: end the parent open and split that end into the children's loops along a shared chord), and the bands are the existing join strip between each side's 2-jet across its rail (Hartmann 2001, parametric G^n blending), so the children meet the parent G2 without a Taylor continuation of the parent's field.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One host end, a two-phase seam and two child records with their bands and rails are the whole declaration; column count and rows are the strip's existing sampling inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Declares geometry only: no person, fixture or fitted coefficient; the crease is an authored window, and a refusal leaves the whole split out rather than one child with an open chord.
 * @evidence contracts/development/common.md#meaningful-documentation States both loops and their clocks, the band's sides and continuity, the declared creases, the failure effect, the metre and radian units and the admission rules.
 */
export interface IAutoMovieConstructionSplit {
  /** Discriminator. */
  type: "split";

  /** The split's name, unique in its tree, named in diagnostics. */
  name: string;

  /** The solid whose face's end is split. */
  host: AutoMovieConstructionNode;

  /** The host face whose end is split: a view part's name in the host's subtree. */
  hostFace: string;

  /** Which end of the host face: its first station's (`bottom`) or its last's (`top`); it must be open, neither a pole nor already cut. */
  hostEnd: "bottom" | "top";

  /** The seam chord's two ends as host phases `[a, b]` on that end's ring, radians, `a < b < a + 2 pi`: child 0 takes the arc `[a, b]`, child 1 the arc `[b, a + 2 pi]`. */
  seam: [number, number];

  /**
   * The seam's curve, or absent for the straight chord. With a profile, the seam leaves each of its two ends (the forks) along the host's own surface, so the bands meet the host G1 at the forks instead of at the declared corner creases, and each band's chord columns follow the curve.
   */
  profile?: IAutoMovieConstructionSplit.IProfile;

  /**
   * Further seams for an end split into more than two children, each enclosing the one before: seam `j` runs from host phase `a_j` to `b_j`
   * with `a_j < a_(j-1)` and `b_j > b_(j-1)` (`seam` is seam 0), and `b_j < a_j + 2 pi`, so the seams cross the end side by side, as the webs
   * between the fingers cross a hand's end from its back to its palm. Child 0 takes the arc `[a_0, b_0]` and seam 0; child `j` between seams
   * `j - 1` and `j` takes the arc `[a_j, a_(j-1)]`, seam `j - 1`, the arc `[b_(j-1), b_j]` and seam `j`; the last child takes the arc
   * `[b_last, a_last + 2 pi]` and the last seam. Every seam is shared by the two children beside it, and its bands meet G1 across it as a
   * two-way split's do. With further seams each band's loop gives a quarter of its columns to each seam it takes and the rest to its arcs:
   * three quarters to the one arc of an outer child, a quarter to each arc of an inner one. Absent or empty, the end is split in two.
   */
  outer?: IAutoMovieConstructionSplit.ISeam[];

  /** Columns of each band round its loop, a multiple of 4 of at least 8: half on the arc, half on the chord (a quarter per seam with `outer`). */
  count: number;

  /** Grid stations of each band face across its span, at least 1. */
  rows: number;

  /** The children in the seams' order, one more than the seams. */
  children: [IAutoMovieConstructionSplit.IChild, IAutoMovieConstructionSplit.IChild, ...IAutoMovieConstructionSplit.IChild[]];
}

export namespace IAutoMovieConstructionSplit {
  /**
   * A curved seam: the shared contour both bands start from in place of the straight chord, such as a crotch's midsagittal line from the front fork under the perineum to the back fork.
   *
   * The seam plane holds the chord and the host end section's outward normal. In it the seam is the clamped cubic spline, on chord-length parameters between its knots, through the chord's first end (host phase `a`), the authored knots and its second end (phase `b`). It is parameterized by its own course, not by the chord, so its knots need not advance along the chord: a seam whose web stands well out of the end beside a fork, as between the toes on top of the foot, runs out along the host first and then turns across. At each end its tangent is the line where the host's tangent plane meets the seam plane, oriented out of the host, with a derivative as long as the adjacent knot distance. So the seam leaves each fork along the host's own surface. Each band's chord columns stand on the curve at equal arclength shares. Their start ribbon is the seam plane's unit normal toward the band's own arc, of length `L` with second derivative zero. The two bands therefore leave the seam in opposite directions with a common tangent plane, G1 across it.
   *
   * Within `corner` of clock on each side of a fork, the cross ribbons turn by the quintic smoothstep through the inward diagonal at the fork. On the arc they turn from the host's own ribbon toward the ruling, inside the host's tangent plane. On the seam they turn from the ruling toward the seam's direction away from the fork. The corner column then leaves the fork between both boundaries instead of along either one. The bands are G1 to the host there, not G2. The forks are G1 when the host's normal at each fork lies in the seam plane, as on the midline of a mirror-symmetric host. Otherwise the remaining angle stays measurable and is not hidden.
   *
   * Engine admission: at least one knot; every knot finite, `along` not negative, and apart from the knot before it (the first from the seam's first end, `[0, 0]`); the realization refuses a knot whose `along` exceeds the chord's length, which needs the host's geometry; `corner` finite, positive and below `pi / 2`; `reach`, when given, finite in `(0, 1]`.
   *
   * @evidence contracts/development/design.md#principled-representation A seam tangent to the host at the forks lies in the host's tangent plane there, so the arc's ribbons (the host's own 2-jet), the seam and its lateral ruling share one tangent plane at each fork, the G1 condition a straight chord in the end plane cannot meet; the clamped cubic spline is the C2 interpolant of authored knots with prescribed end tangents (de Boor 1978), and the corner turn keeps every ribbon in its side's tangent plane while giving the corner column a direction transverse to both boundaries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A knot list and one corner width; the seam's ends, tangents and ruling come from the host and the chord, and its parameter from its own knots.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored knots only, nothing fitted or searched; a seam whose knots leave the chord's span is refused, never clamped.
   * @evidence contracts/development/common.md#meaningful-documentation States the plane, the curve, its end tangents, the ruling, the corner turn, the continuity it keeps and the admission rules, in metres and radians.
   */
  export interface IProfile {
    /** Interior knots in the seam plane, metres, in the seam's own order: `[along, depth]`, `along` the distance from the seam's first end toward its second along the chord, in `[0, chord]` and not necessarily increasing, `depth` along the host end's outward normal (positive out of the host). */
    knots: [number, number][];

    /** The ribbons' turn at each fork: radians of the loop clock on each side, positive, below `pi / 2`. */
    corner: number;

    /**
     * In a split into more than two (`outer`), the share of its length each band's cross ribbon keeps at a fork, rising to the whole by the
     * quintic smoothstep over `corner` of clock on each side: the first derivative by the share, the second by its square, so a column only
     * slows across its start and the band's tangent plane and curvature there, G2 to the host along an arc, are kept. Inside a fork the
     * band's corner is convex, and columns leaving square to the ring and to the seam converge within about the turn's window; shorter
     * ribbons leave the rest of each column to its rail, which runs round the child in order. In `(0, 1]`; absent, 1. The first seam with
     * a profile gives the split's, as it gives `corner`.
     */
    reach?: number;

    /**
     * In a split into more than two (`outer`), whether each band leaves the host's arc square to the end ring: along the chart line
     * `(into, -into (S_u . S_v) / (S_v . S_v))`, whose image is square to the ring in the host's tangent plane, with the host's own 2-jet
     * along that line, so the band stays G2 to the host. Absent or false, along the host's station line, whose image leans along the ring
     * wherever the host's points slide round it with the station (a section changing shape under a polar phase): on f1's foot the
     * station lines at the end ring swung by 40 degrees within 0.07 rad of phase round the top of the big toe's root, and the big toe's
     * band pleated there. The first seam with a profile gives the split's, as it gives `corner`.
     */
    square?: boolean;

    /**
     * The radius of the disc about each of this seam's two forks over which the drawn skin is faired, as a share of the seam's chord (the
     * distance between its two forks): the vertices whose path along the mesh from the fork is shorter than the radius are moved so that
     * the bi-Laplacian of their positions vanishes, with the two rings outside the disc held, so the fill meets the skin round it G1 (the
     * fork patch of the branching-surface literature, Gabrielides, Ginnis and Kaklis 2007, in the discrete form of Botsch and Kobbelt
     * 2004). At a fork the host's end and two bands meet in a corner no one surface owns, and each band turns sharply beside it over about
     * its corner window, which grows with the seam. The fill belongs to no surface: its vertices keep the chart coordinates they were drawn
     * at. In `(0, 1]`, one share for both forks or one for each, `[a, b]` in the seam's order; absent, the forks are left as drawn. The
     * two sides of an end may want their own: between toes the web stands deep on the sole and shallow on top.
     */
    fair?: number | [number, number];

    /**
     * A world direction the seam plane holds in place of the host end's outward normal, unit or not, not along the chord; `depth` is then
     * measured along its part square to the chord, oriented out of the host. A seam between two digits that leave a limb's end aslant to
     * its course lies in the plane between the digits, which holds their direction and not the course's. Absent, the end normal.
     */
    heading?: [number, number, number];
  }

  /**
   * One further seam of a split into more than two children (`outer`): its two forks as host phases and its curve.
   *
   * Engine admission: as the split's own `seam` and `profile`, and each seam encloses the one before it.
   *
   * @evidence contracts/development/design.md#principled-representation A seam is the same two forks and curve as the split's own, so every seam of an end is read and ruled alike and shared by the two bands beside it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two phases and an optional profile, the split's own seam fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored forks and knots only; seams that do not nest are refused, never reordered.
   * @evidence contracts/development/common.md#meaningful-documentation States the fields, their units and the admission rule.
   */
  export interface ISeam {
    /** The seam's two ends as host phases `[a, b]` on the end's ring, radians. */
    seam: [number, number];

    /** The seam's curve, or absent for the straight chord. */
    profile?: IProfile;
  }

  /**
   * One child of a split: its subtree, the face that meets the host's end, its rail and its band.
   *
   * @evidence contracts/development/design.md#principled-representation The child's own face supplies the band's far ribbon at a declared station, so the band reaches the child's actual surface where the child keeps it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A band name, the child's subtree and face, the end that faces the host, one rail depth and an optional crease window.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rail is an authored depth, not searched; a rail outside the child's realized domain is a diagnostic, never clamped.
   * @evidence contracts/development/common.md#meaningful-documentation States each field's role, its unit and which side of the rail the child keeps.
   */
  export interface IChild {
    /** The band's face and chain name, unique in the tree. */
    band: string;

    /** The child's subtree. */
    part: AutoMovieConstructionNode;

    /** The child face the band reaches: a view part's name in the child's subtree. */
    partFace: string;

    /** The child face's end that faces the host: the band replaces the child's surface between that end and the rail. */
    partEnd: "bottom" | "top";

    /** The rail's distance from that end into the child along its station, metres, positive: the child keeps the stations beyond it. */
    rail: number;

    /** A declared crease where the band meets the child, or absent for G2 all round. */
    crease?: ICrease;

    /**
     * How the child's rail is matched to the band's loop column by column. `angle` (the default): the rail point at the loop point's angle
     * about the rail ring's centroid, which both curves must turn round once monotonically. `length`: the first column by that angle, every
     * other at the same share of the rail's length round it as the column's of the loop's, so neither need be star-shaped about the
     * centroid, as a finger's loop, its back on the hand's end and its sides on the webs, is not about its rail far down the finger.
     */
    correspondence?: "angle" | "length";
  }

  /**
   * A crease window on a band's loop clock where the band meets its child C0 instead of G2.
   *
   * Inside `[start, end]` the band arrives at the child's rail along the straight chord from its loop (its child-side ribbon's first derivative is that chord, its second zero), so it meets the child at an angle; outside the window, over `transition` on each side, the child-side ribbon returns to the child's own 2-jet by the quintic smoothstep `10 x^3 - 15 x^4 + 6 x^5`, whose first and second derivatives vanish at both ends, so the band stays C2 along its loop. The band remains G2 to the host everywhere.
   *
   * @evidence contracts/development/design.md#principled-representation The child side is a C0 meeting by its own contract (a skin fold such as the gluteal sulcus), and the smoothstep's flat ends keep the ribbon fields C2 in the clock, as the strip requires.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two clock bounds and one transition width; the crease's shape is the chord arrival, with no further option.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An authored window; nothing is detected from the surfaces.
   * @evidence contracts/development/common.md#meaningful-documentation States the clock, the window's effect on both ribbons and the transition's law.
   */
  export interface ICrease {
    /** The window's first clock, radians on the band's loop clock. */
    start: number;

    /** The window's last clock, radians, `start <= end < start + 2 pi` (a window may run past `2 pi` and wrap). */
    end: number;

    /** The fall from the crease to G2 on each side of the window, radians of clock, positive. */
    transition: number;
  }
}
