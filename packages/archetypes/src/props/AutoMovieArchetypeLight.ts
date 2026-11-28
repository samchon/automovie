import {
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { LIGHT_BANDS } from "./constants/LIGHT_BANDS";
import { AutoMovieArchetypeCandle } from "./AutoMovieArchetypeCandle";
import { AutoMovieArchetypeFireTorch } from "./AutoMovieArchetypeFireTorch";
import { AutoMovieArchetypeLantern } from "./AutoMovieArchetypeLantern";
import { AutoMovieArchetypePendantLamp } from "./AutoMovieArchetypePendantLamp";
import { AutoMovieArchetypeStandingLamp } from "./AutoMovieArchetypeStandingLamp";
import type { IArchetypeDispatch } from "../core/internal/IArchetypeDispatch";

/**
 * Replays saved practical-light recipes as props with local emitter sockets.
 */
export namespace AutoMovieArchetypeLight {
/**
 * Build the selected practical-light prop from a saved recipe.
 *
 * @param params Saved kind, optional scene ID and applicable finite
 *   dimensions in metres or kilograms. The ID defaults to `light`.
 * @param seed Numeric seed for omitted measurements. Omit it to use
 *   the recorded band defaults.
 * @returns The named prop with a local `light` emitter socket and its
 *   applicable holding or mounting contacts.
 * @throws {AutoMovieArchetypeRefusal} If the kind or a fixed value is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeLight.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLight.Affordance, AutoMovieArchetypeLight.Dimension> {
  const kind: AutoMovieArchetypeLight.Kind = ArchetypeDraw.choice(
    "light",
    "kind",
    params.kind,
    AutoMovieArchetypeLight.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeLight.Kind,
      IArchetypeDispatch<
        Omit<AutoMovieArchetypeLight.IParams, "kind">,
        AutoMovieArchetype<AutoMovieArchetypeLight.Affordance, AutoMovieArchetypeLight.Dimension>
      >
    >
  > = {
    candle: { build: AutoMovieArchetypeCandle.create },
    fireTorch: { build: AutoMovieArchetypeFireTorch.create },
    pendant: { build: AutoMovieArchetypePendantLamp.create },
    tableLamp: { build: AutoMovieArchetypeStandingLamp.create },
    floorLamp: { build: AutoMovieArchetypeStandingLamp.create },
    lantern: { build: AutoMovieArchetypeLantern.create },
  };
  return variants[kind].build(params, seed);
}

  /** Signatures of the named constructors selected by the six saved kinds. */
  export interface IProducers {
    /** The upright taper constructor with a wick socket. */
    candle: typeof AutoMovieArchetypeCandle.create;

    /** The period scene torch constructor with an upward head socket. */
    fireTorch: typeof AutoMovieArchetypeFireTorch.create;

    /** The ceiling-mounted pendant constructor. */
    pendant: typeof AutoMovieArchetypePendantLamp.create;

    /** The standing lamp constructor used with `kind: "tableLamp"`. */
    tableLamp: typeof AutoMovieArchetypeStandingLamp.create;

    /** The standing lamp constructor used with `kind: "floorLamp"`. */
    floorLamp: typeof AutoMovieArchetypeStandingLamp.create;

    /** The raised-bail lantern constructor. */
    lantern: typeof AutoMovieArchetypeLantern.create;
  }

  /** Named factory lookup for each admitted saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    get candle(): typeof AutoMovieArchetypeCandle.create {
      return AutoMovieArchetypeCandle.create;
    },
    get fireTorch(): typeof AutoMovieArchetypeFireTorch.create {
      return AutoMovieArchetypeFireTorch.create;
    },
    get pendant(): typeof AutoMovieArchetypePendantLamp.create {
      return AutoMovieArchetypePendantLamp.create;
    },
    get tableLamp(): typeof AutoMovieArchetypeStandingLamp.create {
      return AutoMovieArchetypeStandingLamp.create;
    },
    get floorLamp(): typeof AutoMovieArchetypeStandingLamp.create {
      return AutoMovieArchetypeStandingLamp.create;
    },
    get lantern(): typeof AutoMovieArchetypeLantern.create {
      return AutoMovieArchetypeLantern.create;
    },
  };

  /**
   * Saved selectors for a candle, period scene torch, pendant, standing
   * table or floor lamp, and raised-bail lantern.
   */
  export type Kind =
    | "candle"
    | "fireTorch"
    | "pendant"
    | "tableLamp"
    | "floorLamp"
    | "lantern";

  /** The six saved practical-light choices in gallery order. */
  export const KINDS: readonly Kind[] = [
    "candle",
    "fireTorch",
    "pendant",
    "tableLamp",
    "floorLamp",
    "lantern",
  ];

  /** Dietz globe upper diameter in metres, converted from 2 3/8 inches. */
  export const GLOBE_TOP: number = (2 + 3 / 8) * AutoMovieArchetypeUnits.INCH;

  /**
   * Provisionally sets a burner height of 0.09 metres, bail wire diameter
   * of 0.003 metres and globe opacity of 0.15. The blended globe leaves
   * a staged emitter visible through the glass.
   */
  export const LANTERN_ESTIMATES: Readonly<{
    fount: number;
    wire: number;
    globe: number;
  }> = {
    fount: 0.09,
    wire: 0.003,
    globe: 0.15,
  };

  /** Authored pendant cord radius, 0.003 metres. */
  export const CORD: number = 0.003;

  /** Standing lamp base plate thickness as 0.1 times the base diameter. */
  export const BASE: number = 0.1;

  /** Standing lamp stem radius as 0.04 times the base diameter. */
  export const STEM: number = 0.04;

  /**
   * Shade masses in kilograms for the RINGSTA table and floor forms.
   * The respective 0.19 and 0.49 kilogram values set the shade's share
   * of the standing model's total mass.
   */
  export const SHADE_MASS: Readonly<Record<AutoMovieArchetypeStandingLamp.Kind, number>> = {
    tableLamp: 0.19,
    floorLamp: 0.49,
  };

  /**
   * Holding `grip`, pendant or lantern mounting `hook` and `light` socket.
   * The socket points down on a pendant and up on the other kinds.
   */
  export type Affordance = "grip" | "hook" | "light";

  /**
   * Applicable geometry in metres and whole mass in kilograms.
   *
   * - Candle and torch length and shaft diameter describe the upright body.
   * - Torch `headDiameter` measures its wider head.
   * - Shade `height` and `shade` describe axial height and diameter.
   * - Pendant `cord` measures the length from its hook to the shade.
   * - Standing lamp `overall`, `stem` and `base` measure overall height,
   *   socket height and base diameter.
   * - Lantern `overall`, `base` and `bail` measure body height, base
   *   diameter and raised-bail height. Its shade values describe the globe.
   */
  export type Dimension =
    | "length"
    | "diameter"
    | "headDiameter"
    | "height"
    | "shade"
    | "cord"
    | "overall"
    | "stem"
    | "base"
    | "bail"
    | "mass";

  /** Common units for the saved practical-light measurement tables. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    headDiameter: "m",
    height: "m",
    shade: "m",
    cord: "m",
    overall: "m",
    stem: "m",
    base: "m",
    bail: "m",
    mass: "kg",
  };

  /**
   * Saved kind, optional scene ID and finite measurements admitted by that form.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the construction and applicable physical measurement bands. */
    kind: Kind;

    /** Scene object ID, defaulting to `light`. */
    id?: string;
  }

  /**
   * Applicable finite measurements for candle, torch, pendant, standing forms and lantern.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = LIGHT_BANDS;
}
