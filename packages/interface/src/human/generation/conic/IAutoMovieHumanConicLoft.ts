import type { IAutoMovieHumanConicRecentre } from "./IAutoMovieHumanConicRecentre";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieLoftRelief } from "../../../construction/IAutoMovieLoftRelief";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanConicSection } from "./IAutoMovieHumanConicSection";

/**
 * Conic-family courses, section fields, chart roll and terminal caps in millimetres and radians. Runtime construction and admission remain with AutoMovieHumanConicLoft in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes conic-family courses, section fields, chart roll and terminal caps in millimetres and radians; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Conic-family courses, section fields, chart roll and terminal caps in millimetres and radians. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanConicLoft; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing ConicLoft contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanConicLoft {
  /** The complete authored definition of one part.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The complete authored definition of one part.
   * @evidence contracts/development/design.md#principled-representation `name`: Chain name. `centres`: Course centres: the first end, the joints and the last end, mm. `halves`: Half arclength of the turn at each interior centre, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanConicLoft.mirror, AutoMovieHumanConicPose.repose, AutoMovieHumanF1.rounded. Read by AutoMovieHumanConicLoft.axis, AutoMovieHumanConicLoft.reader, AutoMovieHumanConicLoft.part. Also types AutoMovieHumanF1.BODY, AutoMovieHumanF1.CUTTERS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `roll`: The chart's roll about the course; absent, none. `reliefs`: Reliefs composed onto the wall; absent means none. `tips`: Where the part closes in a point, toward its first knot and toward its last; null leaves that end an open section. `pitch`: Largest distance between two neighbouring phases at the part's widest section, mm; absent, `PHASE_MM`. `phase`: Largest step between neighbouring phases, radians, beside the finest relief net's columns: the mesh's density round the part held apart from its nets'. `turn`: Largest turn of a ring's tangent between two neighbouring phases, radians; absent, the phases are uniform.
   */
  export interface IFamily {
    /** Native source authority for this generation, or the authored wall when absent. */
    native?: INative;

    /** Chain name. */
    name: string;

    /** Course centres: the first end, the joints and the last end, mm. */
    centres: AutoMovieVector3Tuple[];

    /** Half arclength of the turn at each interior centre, mm. */
    halves: number[];

    /** The chart's `u` direction at the first segment before it is squared to the course. */
    up: AutoMovieVector3Tuple;

    /**
     * The chart's roll about the course; absent, none. A part whose sections turn in their planes along the course (a sheet that curls
     * along its length, as the ear's plate does from the lobule up to the helix's top) keeps its long axis on `u` only if the chart turns
     * with it: read in a chart carried by the course alone, its extremes trade places as it turns, and a field that follows one extreme
     * jumps to the next.
     */
    roll?: IRoll;

    /**
     * The line the sections are centred on, as its shift from the course at each knot in the section chart (the rolled chart, where the
     * family rolls); absent, the course itself. The course through `centres` is the line the frames and the poses are carried on; the
     * sections' own centres stand off it wherever the flesh is not centred on that line (the Human skill's Centres Before Curves, step 2),
     * and `values` are written about this origin line, on the course's own section planes
     * (`AutoMovieHumanConicRecentre.axis`). A line whose every shift is zero is the course itself.
     */
    origin?: IAutoMovieHumanConicRecentre.ILine;

    /** The anchors every section is read through. */
    layout: IAutoMovieHumanConicSection.ILayout;

    /** Shared station knots, arclength from the first centre, mm. */
    knots: number[];

    /** Knot values by section field then knot. */
    values: number[][];

    /** Reliefs composed onto the wall; absent means none. */
    reliefs?: IAutoMovieLoftRelief[];

    /** Where the part closes in a point, toward its first knot and toward its last; null leaves that end an open section. */
    tips?: [ITip | null, ITip | null];

    /**
     * Largest distance between two neighbouring phases at the part's widest section, mm; absent, `PHASE_MM`. A small part whose skin turns
     * within a few millimetres takes a finer pitch: at 4 mm the ear's thin rim was sampled by three phases and its edge drew a row of teeth.
     */
    pitch?: number;

    /**
     * Largest step between neighbouring phases, radians, beside the finest relief net's columns: the mesh's density round the part held
     * apart from its nets'. f1's trunk took its phases from its finest net, the eyes' at 105 columns (0.016 rad); with that net coarsened to
     * 73 columns for its own sake the whole face's mesh went from about 400 phases round to 270 and read in level bands and blocks.
     */
    phase?: number;

    /**
     * Largest turn of a ring's tangent between two neighbouring phases, radians; absent, the phases are uniform. With it the phases are
     * spaced by how fast the rings turn as well as by `pitch`: at every phase the density is the most any ring asks there, its length over
     * `pitch` or its turn over this, so a sharp edge that only some sections have (a sole's) takes its phases close together where it
     * stands, and the rest of the part keeps its spacing. f1's leg on uniform phases set by its thigh's girth turned by up to 0.83 rad
     * between two of them round the forefoot's outer edge, which showed as level stripes.
     */
    turn?: number;
  }

  /**
   * A roll of a part's chart about its course: at each station the chart carried by the course is turned by the angle, from `u` toward
   * `v`, so the frames stay C2.
   *
   * Without `eases` the angle is a natural cubic through its values at its own knots (straight past the first and the last): a shape
   * drawn through authored knots, such as a sheet that curls along its course. One cubic through all its knots is not zero between
   * knots of zero, so it is no law for a twist that belongs to one stretch.
   *
   * With `eases` the angle is local: between two neighbouring knots it goes from the first value to the second along a line whose
   * slope rises from nothing over the first knot's ease and falls to nothing over the second's, each by the quintic smoothstep, and it
   * holds the first value before the first knot and the last past the last. With a stretch `L` long, eases `a` and `b` and a difference
   * `d`, the slope between the eases is `d / (L - (a + b) / 2)`. The angle's first and second derivatives vanish at every knot, so two
   * knots of one value hold it exactly and a twist never reaches a stretch that has none (`AutoMovieHumanConicPose.twist`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States station and angle units, local ease behavior and the fallback natural cubic.
   * @evidence contracts/development/design.md#principled-representation Read each angle at its millimetre knot. Optional millimetre eases bound the support between neighbouring knots, with numeric admission in AutoMovieHumanConicLoft.eased.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanConicPose.twist emits the local roll and AutoMovieHumanConicLoft evaluates both supported laws.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared eases distinguish two laws on a shared knot and value representation. Both produce one angle at every station.
   */
  export interface IRoll {
    /** Stations of the angle's knots, mm, increasing; at least two. */
    knots: number[];

    /** The angle at each knot, radians. */
    values: number[];

    /**
     * The length over which the angle's slope rises or falls beside each knot, mm, one per knot, not negative; on each stretch the two
     * eases together are no longer than the stretch. Present, the angle is the local eased law; absent, the natural cubic.
     */
    eases?: number[];
  }

  /**
   * One closed end of a part.
   *
   * Between `from` and `tip` the part is its section at `from` shrunk by one factor, with that section's tangent angles and shoulders kept. With
   * `t = d / H`, `d` the distance to the tip and `H` that of `from`, the factor is `g = sqrt(P(t))` for the cubic `P(t) = a t + b t^2 + c t^3`:
   * upright at the tip (`a > 0`, so `g` grows as `sqrt(t)`), 1 at `from`, leaving `from` at the wall's own taper `q = H mu` (`mu` the wall's
   * relative growth per millimetre away from the tip) and bending there as the wall bends (`g'' = k`, the wall's relative second derivative
   * times `H^2`), so the cap continues the wall without a crease in its slope or its curvature. Those three conditions at `t = 1`, `P = 1`,
   * `P' = 2 q` and `P'' = 2 q^2 + 2 k`, give `c = (1 - q)^2 + k`, `b = 2 q - 1 - 2 c` and `a = 1 - b - c = 2 (1 - q) + c`; `c` is held at 0
   * or more, which keeps `P` positive on the cap. With `c = 0` this is the conic `P = 2 (1 - q) t + (2 q - 1) t^2`, which bends by
   * `-(1 - q)^2` at `from`: the earlier law, which met the slope of every wall but not its bend and left a ring round every finger's and toe's
   * tip, where the wall runs on straight.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One closed end of a part.
   * @evidence contracts/development/design.md#principled-representation `from`: Station of the last section the fields own, between the first and the last knot, mm. `tip`: Station of the point, mm. `covered`: The end is not the figure's skin: buried inside another part, as a digit's root inside its limb, or under the digits merged onto it, as a hand's or a foot's closed end.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanConicLoft.[bottom, top], AutoMovieHumanF1.end.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `covered`: The end is not the figure's skin: buried inside another part, as a digit's root inside its limb, or under the digits merged onto it, as a hand's or a foot's closed end. `centre`: The point of the chart, `[u, v]` mm, the cap's sections gather about while it closes, when the end's top does not stand over the course. `own`: Each coordinate of the cap takes the taper and the bend of its own outline at `from`, instead of the mean extent's. `rings`: How many rings the cap is meshed in between its first section and its tip; absent, one at each of its knots (`CAP_KNOTS`).
   */
  export interface ITip {
    /** Station of the last section the fields own, between the first and the last knot, mm. */
    from: number;

    /** Station of the point, mm. */
    tip: number;

    /**
     * The end is not the figure's skin: buried inside another part, as a digit's root inside its limb, or under the digits merged onto it,
     * as a hand's or a foot's closed end. It closes as the conic (`c = 0`), the slimmest the law allows, instead of bending on as its wall
     * bends: the fuller cap brought the foot's end 5.9 mm below the sole and moved where the outer digits come out of their limbs' ends.
     */
    covered?: boolean;

    /**
     * The point of the chart, `[u, v]` mm, the cap's sections gather about while it closes, when the end's top does not stand over the
     * course. A coordinate `x` of the cap is `x g + 2 c g (1 - g)^2` for its centre's coordinate `c`: at `from` it and its slope in `g` are
     * the plain cap's, so the cap leaves the wall as before; it bulges toward the centre over its middle, by `8 c / 27` at most at
     * `g = 1 / 3`; and it still closes on the course, where the pole is, since `x / g` tends to `x + 2 c`, which keeps the course inside
     * every section while `|2 c|` is less than the section's extent on the far side. f1's crown: the course runs 16 mm behind the skull's
     * top (the reference's top contour at 1,699 mm spans x -4 to 40), and the plain cap shrank the last section, 34 mm behind the course
     * and 83 mm in front, toward it, so the back of the crown stood 4 mm proud of the reference at x -20 and the top was a flat lid with a
     * corner behind.
     */
    centre?: [number, number];

    /**
     * Each coordinate of the cap takes the taper and the bend of its own outline at `from`, instead of the mean extent's. One factor for the
     * whole section met the mean slope but not each side's: f1's crown section narrows 0.95 mm a millimetre in front (on 83 mm) and 1.2 behind
     * (on 34 mm), and the shared factor took 1.9 in front and 0.77 behind, a dip at the crown's front and a corner at its back. A coordinate
     * within `OWN_LEAST` of the section's size of zero keeps the shared factor, since its relative change has no meaning there.
     */
    own?: boolean;

    /**
     * How many rings the cap is meshed in between its first section and its tip; absent, one at each of its knots (`CAP_KNOTS`). A dome
     * turns its normal through a quarter turn over its rings, and twelve showed as a bullseye of flat bands on a toe's tip.
     */
    rings?: number;
  }

  /**
   * Read the conic family's field vector at station s, measured in millimetres along its course. Field order and units follow the family's section layout.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read the conic family's field vector at station s, measured in millimetres along its course. Field order and units follow the family's section layout.
   * @evidence contracts/development/design.md#principled-representation Read the conic family's field vector at station s, measured in millimetres along its course. Field order and units follow the family's section layout.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicLoft.ReaderResult is the canonical exchange used by AutoMovieHumanConicLoft.reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanConicLoft input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type ReaderResult = (s: number) => number[];

  /**
   * Source and reflection functions for a native family generated in one invocation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source and reflection functions for a native family generated in one invocation.
   * @evidence contracts/development/design.md#principled-representation The axis and section stations use physical millimetres. Each reader returns the same view-part shape under its declared scope.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanConicLoft delegates source and sampling to these functions, owned by the native family builder.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reflected family's producer retains its source clock and derivative scope.
   */
  export interface INative {
    /** Actual complete section-plane source in figure-world mm. */
    axis: IAutoMovieViewAxis.IAxis;
    /**
     * Canonical full source in caller cap/relief scope, without loft or turn sampling.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Accepts the logical family whose cap and relief scope to read.
     */
    source: (family: IFamily) => IAutoMovieViewPart;
    /**
     * Original source producer, including every scalar, cap and actual requested relief scope.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Accepts the family and explicit material stations in millimetres.
     */
    part: (family: IFamily, stations: number[]) => IAutoMovieViewPart;
    /**
     * The same original law in the reflected chart, retaining its source clock and all native derivatives.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Accepts the source family and reflected logical name.
     */
    mirror: (family: IFamily, name: string) => IFamily;
  }
}
