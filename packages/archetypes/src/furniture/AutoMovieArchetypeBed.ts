import {
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { BED_BANDS } from "./constants/BED_BANDS";
import { AutoMovieArchetypeBunkBed } from "./AutoMovieArchetypeBunkBed";
import { AutoMovieArchetypeCrib } from "./AutoMovieArchetypeCrib";
import { AutoMovieArchetypeGurney } from "./AutoMovieArchetypeGurney";
import { AutoMovieArchetypeHospitalBed } from "./AutoMovieArchetypeHospitalBed";
import { AutoMovieArchetypeMattress } from "./AutoMovieArchetypeMattress";
import { AutoMovieArchetypePlatformBed } from "./AutoMovieArchetypePlatformBed";
import type { IArchetypeDispatch } from "../core/internal/IArchetypeDispatch";

/** Replays saved bed variants through the named furniture producers. */
export namespace AutoMovieArchetypeBed {
/**
 * Replay a stored platform bed, loose mattress, care bed, crib or bunk.
 *
 * @param params Saved kind, scene ID and applicable fixed dimensions.
 *   Only a loose mattress accepts `size`. The ID defaults to `bed`.
 * @param seed Numeric seed for free dimensions and the loose mattress
 *   size. Omit it for band midpoints and a single loose mattress.
 * @returns Geometry and the selected variant's local contact frames.
 * @throws {AutoMovieArchetypeRefusal} If the kind, size or a fixed
 *   dimension is inadmissible for the selected construction.
 */
export function create(
  params: AutoMovieArchetypeBed.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBed.Affordance, AutoMovieArchetypeBed.Dimension> {
  const kind: AutoMovieArchetypeBed.Kind = ArchetypeDraw.choice(
    "bed",
    "kind",
    params.kind,
    AutoMovieArchetypeBed.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeBed.Kind,
      IArchetypeDispatch<
        Omit<AutoMovieArchetypeBed.IParams, "kind">,
        AutoMovieArchetype<AutoMovieArchetypeBed.Affordance, AutoMovieArchetypeBed.Dimension>
      >
    >
  > = {
    single: { build: AutoMovieArchetypePlatformBed.create },
    double: { build: AutoMovieArchetypePlatformBed.create },
    mattress: { build: AutoMovieArchetypeMattress.create },
    hospital: { build: AutoMovieArchetypeHospitalBed.create },
    gurney: { build: AutoMovieArchetypeGurney.create },
    crib: { build: AutoMovieArchetypeCrib.create },
    bunk: { build: AutoMovieArchetypeBunkBed.create },
  };
  return variants[kind].build(params, seed);
}

  /** Resolves each saved bed kind to the named factory that builds it. */
  export interface IProducers {
    /** Platform bed factory accepting the `single` settings. */
    single: typeof AutoMovieArchetypePlatformBed.create;

    /** Platform bed factory accepting the `double` settings. */
    double: typeof AutoMovieArchetypePlatformBed.create;

    /** Floor mattress factory with an optional catalogue size. */
    mattress: typeof AutoMovieArchetypeMattress.create;

    /** Hospital bed factory with a patient surface and side bars. */
    hospital: typeof AutoMovieArchetypeHospitalBed.create;

    /** Caster stretcher factory with a patient surface and side seats. */
    gurney: typeof AutoMovieArchetypeGurney.create;

    /** Crib factory with an enclosed mattress and side grasp bars. */
    crib: typeof AutoMovieArchetypeCrib.create;

    /** Bunk bed factory with two mattress levels and a guard bar. */
    bunk: typeof AutoMovieArchetypeBunkBed.create;
  }

  /**
   * Named factory functions by saved kind. Call the selected factory with its own options.
   */
  export const PRODUCERS: Readonly<IProducers> = {
    get single(): typeof AutoMovieArchetypePlatformBed.create {
      return AutoMovieArchetypePlatformBed.create;
    },
    get double(): typeof AutoMovieArchetypePlatformBed.create {
      return AutoMovieArchetypePlatformBed.create;
    },
    get mattress(): typeof AutoMovieArchetypeMattress.create {
      return AutoMovieArchetypeMattress.create;
    },
    get hospital(): typeof AutoMovieArchetypeHospitalBed.create {
      return AutoMovieArchetypeHospitalBed.create;
    },
    get gurney(): typeof AutoMovieArchetypeGurney.create {
      return AutoMovieArchetypeGurney.create;
    },
    get crib(): typeof AutoMovieArchetypeCrib.create {
      return AutoMovieArchetypeCrib.create;
    },
    get bunk(): typeof AutoMovieArchetypeBunkBed.create {
      return AutoMovieArchetypeBunkBed.create;
    },
  };

  /**
   * Saved choices for raised platform beds, loose mattress, hospital bed, gurney, crib or bunk.
   */
  export type Kind =
    | "single"
    | "double"
    | "mattress"
    | "hospital"
    | "gurney"
    | "crib"
    | "bunk";

  /** Saved kind values accepted by `create`. */
  export const KINDS: readonly Kind[] = [
    "single",
    "double",
    "mattress",
    "hospital",
    "gurney",
    "crib",
    "bunk",
  ];

  /**
   * The contacts available across saved bed kinds.
   *
   * `surface` is the mattress top, with the head at local `-Z`. In a bunk
   * it is the lower mattress. `leftSide` and `rightSide` frame its long
   * edges on `+X` and `-X`. A crib has no side seats. Hospital beds and
   * cribs expose `leftRail` and `rightRail` at their side bars. A bunk
   * adds the `upper` mattress surface and the continuous `-X` `guard`.
   */
  export type Affordance =
    | "surface"
    | "leftSide"
    | "rightSide"
    | "leftRail"
    | "rightRail"
    | "upper"
    | "guard";

  /**
   * The saved bed dimensions use metres, except `mass` in kilograms.
   *
   * `width` and `length` describe the mattress. `thickness` is mattress
   * depth in Y. Platform `height` is the mattress top. Crib `height` is
   * the top of the frame and bunk `height` is its overall height.
   * `overallLength` and `overallWidth` describe applicable outer frames.
   * `litter` is the support height below a care bed's mattress. `rail`
   * is measured from the mattress top on a hospital bed and from the
   * mattress support on a crib. `gap` separates bunk mattress supports
   * and `clearance` gives the lower mattress support height.
   */
  export type Dimension =
    | "width"
    | "length"
    | "height"
    | "thickness"
    | "overallLength"
    | "overallWidth"
    | "litter"
    | "rail"
    | "gap"
    | "clearance"
    | "mass";

  /** Metres for bed geometry and kilograms for empty model mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
    height: "m",
    thickness: "m",
    overallLength: "m",
    overallWidth: "m",
    litter: "m",
    rail: "m",
    gap: "m",
    clearance: "m",
    mass: "kg",
  };

  /** UK single or double catalogue size for a loose mattress. */
  export type Mattress = "single" | "double";

  /**
   * Saved bed kind, optional loose-mattress catalogue size and applicable band dimensions.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the named construction and its applicable dimensions. */
    kind: Kind;

    /**
     * Loose-mattress catalogue size. Defaults to `single` when no value or seed is supplied.
     */
    size?: Mattress;

    /** Scene object ID. Defaults to `bed`. */
    id?: string;
  }

  /**
   * Band dimensions by saved kind. The loose-mattress catalogue owns its width and length.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = BED_BANDS;
}
