import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { LIGHT_BANDS } from "./LIGHT_BANDS";
import { createCandle } from "./createCandle";
import { createFireTorch } from "./createFireTorch";
import { createLantern } from "./createLantern";
import { createPendantLamp } from "./createPendantLamp";
import { createStandingLamp } from "./createStandingLamp";

/** A saved recipe's producer as the dispatcher calls it. */
type Producer = (
  params: createLight.IParams,
  seed?: number | string,
) => AutoMovieArchetype<createLight.Affordance, createLight.Dimension>;

/**
 * Replay a saved light variant with the original dimensions, identifier and model choices.
 *
 * @param params The historic selector and optional fixed settings in the original units.
 * @param seed Draws the omitted settings. Omit it for the original seedless defaults.
 * @returns The original generated model and its local contacts.
 * @throws {AutoMovieArchetypeRefusal} If the selector or any author setting is outside its admitted range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Replay a saved light variant with the original dimensions, identifier and model choices.
 * @evidence contracts/development/implementation.md#principled-implementation Validate the saved selector and call its named producer, which runs the original shape construction in the light draw namespace.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Dispatch one checked selector through the public producer table. Each named producer owns its geometry and contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pass author inputs through to the same dimension and model checks.
 * @evidence contracts/development/implementation.md#efficient-algorithms One table lookup followed by the selected producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls are the same producer with the same seed data.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call hands its model data to the caller and acquires no external resource.
 */
export function createLight(
  params: createLight.IParams,
  seed?: number | string,
): AutoMovieArchetype<createLight.Affordance, createLight.Dimension> {
  const kind: createLight.Kind = ArchetypeDraw.choice(
    "light",
    "kind",
    params.kind,
    createLight.KINDS,
  );

  // Saved inputs are a wider record. The selected producer checks them with its own draw.
  const produce: Producer = createLight.PRODUCERS[kind] as Producer;
  return produce(params, seed);
}

/**
 * Companion types, constants and bands of {@link createLight}.
 */
export namespace createLight {
  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `candle` selector. */
    candle: typeof createCandle;

    /** The named producer for the saved `fireTorch` selector. */
    fireTorch: typeof createFireTorch;

    /** The named producer for the saved `pendant` selector. */
    pendant: typeof createPendantLamp;

    /** The named producer for the saved `tableLamp` selector. */
    tableLamp: typeof createStandingLamp;

    /** The named producer for the saved `floorLamp` selector. */
    floorLamp: typeof createStandingLamp;

    /** The named producer for the saved `lantern` selector. */
    lantern: typeof createLantern;
  }

  /** Resolve the exact named producer for a saved selector on demand. */
  export const PRODUCERS: Readonly<IProducers> = {
    get candle(): typeof createCandle {
      return createCandle;
    },
    get fireTorch(): typeof createFireTorch {
      return createFireTorch;
    },
    get pendant(): typeof createPendantLamp {
      return createPendantLamp;
    },
    get tableLamp(): typeof createStandingLamp {
      return createStandingLamp;
    },
    get floorLamp(): typeof createStandingLamp {
      return createStandingLamp;
    },
    get lantern(): typeof createLantern {
      return createLantern;
    },
  };

  /** The kinds: a taper candle, a hand-held fire torch, a pendant lamp, a table lamp, a floor lamp and a hurricane lantern. */
  export type Kind =
    | "candle"
    | "fireTorch"
    | "pendant"
    | "tableLamp"
    | "floorLamp"
    | "lantern";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "candle",
    "fireTorch",
    "pendant",
    "tableLamp",
    "floorLamp",
    "lantern",
  ];

  /** A lantern's globe across its top, metres: Dietz's 2 3/8 in, the width its cap is drawn at. */
  export const GLOBE_TOP: number = (2 + 3 / 8) * AutoMovieArchetypeUnits.INCH;

  /**
   * A lantern's parts no source read sizes, metres, provisional estimates: `fount`, the burner's height over the floor, where the globe stands and the flame burns; `wire`, the bail's wire across, the hooked grip's aperture; `globe`, the clear glass globe's opacity, a look estimate low enough that the flame inside reads through it, drawn as blended glass rather than transmission because a transmission material samples only opaque objects and would hide the additive flame. The search 'Dietz No. 20 Junior lantern fount height inches dimensions bail' found the lantern's height, base, globe, fount capacity and a bail-up height, neither of these.
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

  /** A pendant cord's radius, metres: a construction estimate that no act reads and no band declares. */
  export const CORD: number = 0.003;

  /** A standing lamp's base plate thickness as a share of its read base diameter: a construction estimate that no act reads and no band declares. */
  export const BASE: number = 0.1;

  /** A standing lamp's stem radius as a share of its read base diameter: a construction estimate that no act reads and no band declares. */
  export const STEM: number = 0.04;

  /** A standing lamp's shade's net weight, kilograms, which places its balance: the RINGSTA shades' 0.19 kg (search only) and 0.49 kg (read), the rest of the lamp's mass its base's. */
  export const SHADE_MASS: Readonly<Record<createStandingLamp.Kind, number>> = {
    tableLamp: 0.19,
    floorLamp: 0.49,
  };

  /**
   * The affordance ids:
   *
   * - `grip`: a candle's taper, a torch's shaft below its head, a lamp's shade, a lantern's bail top.
   * - `hook`: a pendant's ceiling end or a lantern's bail top, to hang it by.
   * - `light`: the top of a wick or a torch's head, or a lantern's burner, `+Y` up the flame; a pendant's shade mouth, `+Y` down its beam; a standing lamp's lampholder top, `+Y` up.
   */
  export type Affordance = "grip" | "hook" | "light";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: a candle's taper or a torch, end to end.
   * - `diameter`: a candle's taper or a torch's shaft, across.
   * - `headDiameter`: a torch's wick head.
   * - `height`: a lamp's shade or a lantern's globe, bottom to top.
   * - `shade`: a lamp's shade across, or a lantern's globe across its bottom.
   * - `cord`: a pendant's cord from the ceiling to its shade.
   * - `overall`: a standing lamp, floor to the shade's top; a lantern, floor to its cap's top.
   * - `stem`: a standing lamp's base with its stem, floor to the lampholder's top.
   * - `base`: a standing lamp's or a lantern's base across.
   * - `bail`: a lantern with its bail raised, floor to the bail's top.
   * - `mass`: kilograms; a standing lamp's is its base's and its shade's net weights together.
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which light. */
    kind: Kind;

    /** The model's id, unique in a scene; `light` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = LIGHT_BANDS;
}
