import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { FixtureDraw } from "./FixtureDraw";
import type { AutoMovieArchetypeMachine } from "../AutoMovieArchetypeMachine";

/** The vending machines read. */
const MERCHANT: string =
  "Crane Merchant brochure: Merchant 4 1830 mm high, 813 mm deep, 895 mm wide; Merchant 6 1830 mm high, 813 mm deep, 1180 mm wide (https://vendtrade.co.uk/wp-content/uploads/2024/08/Crane_Merchant_Brochure.pdf)";

/** The pay station read. */
const STRADA: string =
  "Parkeon/Flowbird StradaPAL installation manual, p. 11: body 290 mm wide, 328 mm deep, 1488 mm high, on it a 90 mm spacer and a 226 mm top 475 mm wide and 379 mm deep (https://us.support.flowbird.group/hc/en-us/article_attachments/13368519985939)";

/** The ATM read. */
const NCR: string =
  "NCR SelfServ 32 Site Preparation B006-6585-B000 (https://tranact.com/pdf/NCR-SS32-Site-Prep.pdf): p. 9, fascia 770 mm wide, 1575 mm high, 800 mm deep, shelf 763 mm high protruding 174 mm; pp. 14-15, heights from the base and depths from the shelf's front; pp. 17-18, each item's distance from the No. 5 key, drawn as a straight arrow on the fascia's front elevation, and its clock position, which gives only its side; the keypad on the centre line as drawn, not dimensioned";

/** The shared measured rectangular cabinet and its two exterior contact frames. */
export namespace ServiceCabinet {
  /**
   * Each kind's models with the width each gives, metres, the default first: a
   * vending machine's Merchant 4 and Merchant 6; the other kinds have one read
   * model.
   */
  export const MODELS: Readonly<
    Partial<
      Record<
        AutoMovieArchetypeMachine.Kind,
        Readonly<
          Partial<
            Record<
              AutoMovieArchetypeMachine.Model,
              Readonly<Partial<Record<AutoMovieArchetypeMachine.Dimension, number>>>
            >
          >
        >
      >
    >
  > = {
    vendingMachine: {
      "Merchant 4": { width: 0.895 },
      "Merchant 6": { width: 1.18 },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<
      AutoMovieArchetypeMachine.Kind,
      Readonly<
        Partial<Record<AutoMovieArchetypeMachine.Dimension, IAutoMovieArchetypeBand>>
      >
    >
  > = {
    vendingMachine: {
      height: AutoMovieArchetypeBand.metres(1.83, 1.83, MERCHANT),
      depth: AutoMovieArchetypeBand.metres(0.813, 0.813, MERCHANT),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        250,
        350,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    atm: {
      width: AutoMovieArchetypeBand.metres(0.77, 0.77, `${NCR}: the fascia`),
      height: AutoMovieArchetypeBand.metres(1.575, 1.575, NCR),
      depth: AutoMovieArchetypeBand.metres(0.8, 0.8, NCR),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        250,
        400,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    payStation: {
      width: AutoMovieArchetypeBand.metres(0.29, 0.29, `${STRADA}: the body`),
      height: AutoMovieArchetypeBand.metres(
        1.488,
        1.488,
        `${STRADA}: the body`,
      ),
      depth: AutoMovieArchetypeBand.metres(0.328, 0.328, `${STRADA}: the body`),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        60,
        90,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };

  /** The built cabinet with its drawn outside dimensions and mass. */
  export interface ICabinet<Id extends string> {
    /** Builder carrying the exterior cabinet. */
    builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeMachine.Dimension>;

    /** Cabinet width along X, metres. */
    width: number;

    /** Cabinet height above the floor, metres. */
    height: number;

    /** Cabinet depth along Z, metres. */
    depth: number;

    /** Total build mass, kilograms. */
    mass: number;
  }

  /**
   * Draw the measurements and place the cabinet on the floor.
   *
   * @param kind The fixed profile and model table to draw.
   * @param name Display name before the optional model name.
   * @param color The cabinet finish.
   * @param params The scene identifier, possibly a model choice, and fixed
   *   dimensions.
   * @param seed The seed for the unresolved draws.
   * @returns The cabinet's builder, mass and external dimensions.
   * @throws {AutoMovieArchetypeRefusal} When a model or dimension does not fit
   *   the given profile.
   */
  export function begin<Id extends string>(
    kind: AutoMovieArchetypeMachine.Kind,
    name: string,
    color: string,
    params: Omit<AutoMovieArchetypeMachine.IParams, "kind">,
    seed?: number,
  ): ICabinet<Id> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeMachine.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "machine",
        FixtureDraw.machine,
        seed,
        params,
      );
    const model: AutoMovieArchetypeDrawSession.IModel<
      AutoMovieArchetypeMachine.Model,
      AutoMovieArchetypeMachine.Dimension
    > = draw.model("model", params.model, MODELS[kind]);
    const d: Partial<Record<AutoMovieArchetypeMachine.Dimension, number>> = {
      ...draw.dimensions(BANDS[kind], BANDS),
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeMachine.Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: model.name === undefined ? name : `${name} ${model.name}`,
        draw,
      });
    const width: number = d.width!;
    const height: number = d.height!;
    const depth: number = d.depth!;
    builder.box(
      "cabinet",
      Vector3.create(width, height, depth),
      Vector3.create(0, height / 2, 0),
      {
        color,
        density: 0.4,
      },
    );
    return { builder, width, height, depth, mass: d.mass! };
  }

  /** The contact ids {@link faces} builds or reads. */
  export type FacesContact = "front" | "side";

  /** The values {@link faces} accepts at this place in its signature. */
  export type FacesChoice = "width" | "height" | "depth";

  /**
   * Put the stand and push contacts on the cabinet's front and right side.
   *
   * @param cabinet The already built cabinet and its dimensions.
   */
  export function faces(
    cabinet: Pick<ICabinet<FacesContact>, FacesChoice> & {
      builder: FixtureDraw.IContactWriter<FacesContact>;
    },
  ): void {
    const { builder, width, height, depth }: typeof cabinet = cabinet;
    const v: typeof Vector3.create = Vector3.create;
    builder.affordance({
      id: "front",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, height / 2, depth / 2),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      width,
      depth: height,
    });
    builder.affordance({
      id: "side",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v(width / 2, height / 2, 0),
        v(1, 0, 0),
        v(0, 0, -1),
      ),
      extent: null,
      width: depth,
      depth: height,
    });
  }
}
