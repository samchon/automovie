import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { FixtureDraw } from "./FixtureDraw";
import type { createMachine } from "./createMachine";

/** The vending machines read. */
const MERCHANT: string =
  "Crane Merchant brochure: Merchant 4 1830 mm high, 813 mm deep, 895 mm wide; Merchant 6 1830 mm high, 813 mm deep, 1180 mm wide (https://vendtrade.co.uk/wp-content/uploads/2024/08/Crane_Merchant_Brochure.pdf)";

/** The pay station read. */
const STRADA: string =
  "Parkeon/Flowbird StradaPAL installation manual, p. 11: body 290 mm wide, 328 mm deep, 1488 mm high, on it a 90 mm spacer and a 226 mm top 475 mm wide and 379 mm deep (https://us.support.flowbird.group/hc/en-us/article_attachments/13368519985939)";

/** The ATM read. */
const NCR: string =
  "NCR SelfServ 32 Site Preparation B006-6585-B000 (https://tranact.com/pdf/NCR-SS32-Site-Prep.pdf): p. 9, fascia 770 mm wide, 1575 mm high, 800 mm deep, shelf 763 mm high protruding 174 mm; pp. 14-15, heights from the base and depths from the shelf's front; pp. 17-18, each item's distance from the No. 5 key, drawn as a straight arrow on the fascia's front elevation, and its clock position, which gives only its side; the keypad on the centre line as drawn, not dimensioned";

/**
 * The shared measured rectangular cabinet and its two exterior contact frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies what the three service object constructions share.
 * @evidence contracts/development/design.md#principled-representation The measured bands and model choices supply the cabinet's outer box and consistent front and side measurement frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared cabinet setup and two contact frames; each producer supplies its own fascia and other parts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contacts for distinct controls are owned only by the producer recording those controls.
 */
export namespace ServiceCabinet {
  /** Each kind's models with the width each gives, metres, the default first: a vending machine's Merchant 4 and Merchant 6; the other kinds have one read model. */
  export const MODELS: Readonly<
    Partial<
      Record<
        createMachine.Kind,
        Readonly<
          Partial<
            Record<
              createMachine.Model,
              Readonly<Partial<Record<createMachine.Dimension, number>>>
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
      createMachine.Kind,
      Readonly<Partial<Record<createMachine.Dimension, IArchetypeBand>>>
    >
  > = {
    vendingMachine: {
      height: ArchetypeBand.metres(1.83, 1.83, MERCHANT),
      depth: ArchetypeBand.metres(0.813, 0.813, MERCHANT),
      mass: ArchetypeBand.of("kg", 250, 350, ArchetypeBand.TYPICAL_MASS, true),
    },
    atm: {
      width: ArchetypeBand.metres(0.77, 0.77, `${NCR}: the fascia`),
      height: ArchetypeBand.metres(1.575, 1.575, NCR),
      depth: ArchetypeBand.metres(0.8, 0.8, NCR),
      mass: ArchetypeBand.of("kg", 250, 400, ArchetypeBand.TYPICAL_MASS, true),
    },
    payStation: {
      width: ArchetypeBand.metres(0.29, 0.29, `${STRADA}: the body`),
      height: ArchetypeBand.metres(1.488, 1.488, `${STRADA}: the body`),
      depth: ArchetypeBand.metres(0.328, 0.328, `${STRADA}: the body`),
      mass: ArchetypeBand.of("kg", 60, 90, ArchetypeBand.TYPICAL_MASS, true),
    },
  };

  /**
   * The built cabinet with its drawn outside dimensions and mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which part is already built and the sizes and mass that accompany it.
   * @evidence contracts/development/design.md#principled-representation Uses the same drawn metres and kilograms for the cabinet, details and contacts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the builder and the dimensions or mass the selected producer reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The builder's typed contact identifiers preserve the caller's profile.
   */
  export interface ICabinet<Id extends string> {
    /** Builder carrying the exterior cabinet. */
    builder: ArchetypeBuilder<Id, createMachine.Dimension>;

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
   * @param params The scene identifier, possibly a model choice, and fixed dimensions.
   * @param seed The seed for the unresolved draws.
   * @returns The cabinet's builder, mass and external dimensions.
   * @throws {ArchetypeRefusal} When a model or dimension does not fit the given profile.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the selected profile, dimensions and model admission.
   * @evidence contracts/development/implementation.md#principled-implementation Draw a whole model where available and lay its measured figures over the free ranges before drawing the cabinet.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Open the saved draw, admit the model and dimensions and build one rectangular cabinet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reject a model or dimension the selected manufacturer profile does not own.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Draws four dimensions and builds one part.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The three public service machine designs share the same rectangular cabinet construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the builder and the four values are returned.
   */
  export function begin<Id extends string>(
    kind: createMachine.Kind,
    name: string,
    color: string,
    params: Omit<createMachine.IParams, "kind">,
    seed?: number | string,
  ): ICabinet<Id> {
    const draw: ArchetypeDrawSession<createMachine.Dimension> =
      new ArchetypeDrawSession("machine", FixtureDraw.machine, seed, params);
    const model: ArchetypeDrawSession.IModel<
      createMachine.Model,
      createMachine.Dimension
    > = draw.model("model", params.model, MODELS[kind]);
    const d: Partial<Record<createMachine.Dimension, number>> = {
      ...draw.dimensions(BANDS[kind], BANDS),
      ...model.figures,
    };
    const builder: ArchetypeBuilder<Id, createMachine.Dimension> =
      new ArchetypeBuilder({
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

  /**
   * The contact ids {@link faces} builds or reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids in the signature of faces.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal contact ids the construction builds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only faces and the named producers that call it read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It names no contact the construction does not build.
   */
  export type FacesContact = "front" | "side";

  /**
   * The values {@link faces} accepts at this place in its signature.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the admitted values of one place in the signature of faces.
   * @evidence contracts/development/design.md#principled-representation A closed union of the literal values the construction handles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only faces and its callers read this union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It admits no value the construction does not handle.
   */
  export type FacesChoice = "width" | "height" | "depth";

  /**
   * Put the stand and push contacts on the cabinet's front and right side.
   *
   * @param cabinet The already built cabinet and its dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two surface contacts and what puts them in place.
   * @evidence contracts/development/implementation.md#principled-implementation The contact points and extents follow the same cabinet measurements as the box.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two surface frames at the corresponding face centres.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The frames use the face dimensions, not separate estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constructs two affordances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Defines the same rectangular face construction for each cabinet.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Adds only the two faces to the given builder.
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.facing(
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
