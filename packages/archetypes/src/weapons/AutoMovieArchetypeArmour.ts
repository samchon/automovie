import type {
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";

import "../core/index";

import type { AutoMovieArchetype } from "../core/AutoMovieArchetype";
import type { AutoMovieArchetypeDrawSession } from "../core/AutoMovieArchetypeDrawSession";
import type { IAutoMovieArchetypeBand } from "../core/IAutoMovieArchetypeBand";
import { ArchetypeDraw } from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeCostumeCuirass } from "./AutoMovieArchetypeCostumeCuirass";
import { AutoMovieArchetypeCostumeGauntlet } from "./AutoMovieArchetypeCostumeGauntlet";
import { AutoMovieArchetypeCostumeGreave } from "./AutoMovieArchetypeCostumeGreave";
import { AutoMovieArchetypeCostumeHelmet } from "./AutoMovieArchetypeCostumeHelmet";
import { AutoMovieArchetypeCostumeMail } from "./AutoMovieArchetypeCostumeMail";
import { AutoMovieArchetypeCostumeVambrace } from "./AutoMovieArchetypeCostumeVambrace";
import { armourBone } from "./internal/armourBone";
import { assembleCostumeArmour as assembleCostumeArmourImplementation } from "./internal/assembleCostumeArmour";
import { AutoMovieArchetypeArmourData } from "./internal/AutoMovieArchetypeArmourData";
/** Creates catalogue armour pieces and binds separate pieces to a wearer. */
export namespace AutoMovieArchetypeArmour {
  /** Selects the shell, catalogue and body measurements for one piece. */
  export type Kind =
    | "openHelmet"
    | "closedHelmet"
    | "brimmedHelmet"
    | "cuirass"
    | "mail"
    | "gauntlet"
    | "vambrace"
    | "greave";

  /**
   * The affordance id: `wear`, the centre of the body part the piece covers,
   * `+Y` up the segment, where it rides its bone.
   */
  export type Affordance = "wear";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`, `width`, `depth`: the read piece's, as its record measures it; a
   *   mail shirt's height is its length.
   * - `thickness`: the plate's normal gauge; a minimum on unfitted elliptical
   *   walls.
   * - `pad`: a helmet's padding inside its plate.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "width"
    | "depth"
    | "thickness"
    | "pad"
    | "mass";

  /** Identifies a catalogue piece by its Metropolitan Museum object ID. */
  export type Model =
    | "met26453"
    | "met25388"
    | "met23232"
    | "met26508"
    | "met26512"
    | "met21972"
    | "met22359"
    | "met23084"
    | "met34324"
    | "met22415"
    | "met633538"
    | "met27635"
    | "met23255"
    | "met23256"
    | "met23199"
    | "met24896"
    | "met35850"
    | "met22970"
    | "met22276";

  /** Selects a piece, its optional fit, and fixed dimensions for its profile. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The silhouette and body segment to cover. */
    kind: Kind;

    /** A catalogue record for this kind. The first record is the unseeded default. */
    model?: Model;

    /**
     * Measurements in metres used by the selected profile. Leave this unset
     * for the catalogue envelope. Supply finite positive values for the
     * measurements the profile reads. A cuirass needs shoulders above waist.
     * Mail adds its equivalent wall outside the fitted torso. A gauntlet
     * uses the forearm radius for its cuff.
     */
    measure?: Partial<IAutoMovieBodyMeasure>;

    /** Scene model ID. Defaults to `armour`. */
    id?: string;
  }

  /** Bones supported by the existing head, chest, hand and limb costume pieces. */
  export type IAssemblySlot =
    | "head"
    | "chest"
    | "leftHand"
    | "rightHand"
    | "leftLowerArm"
    | "rightLowerArm"
    | "leftLowerLeg"
    | "rightLowerLeg";

  /** An armour model whose `wear` socket aligns it to the covered segment. */
  export type IAssemblyModel = AutoMovieArchetype<Affordance, Dimension>;

  /**
   * The wearer's canonical T-pose rest positions in world metres, its bone
   * hierarchy and the measurements needed by the selected pieces.
   */
  export type IAssemblyWearer = Pick<
    IAutoMovieMotionHumanBody,
    "rest" | "bones" | "measure"
  >;

  /** Scene identity, body and costume pieces to bind without merging models. */
  export interface IAssemblyParams {
    /** The performer's scene identity. */
    subject: string;

    /** The performer's body, read at its rest to find each covered segment. */
    body: IAssemblyWearer;

    /** At most one independent and anatomically corresponding model per bone. */
    pieces: Readonly<Partial<Record<IAssemblySlot, IAssemblyModel>>>;
  }

  /** A source model and its bone-relative placement for scene composition. */
  export interface IAssemblyPiece {
    /** The original source model with its existing id and geometry. */
    model: IAssemblyModel;

    /** The resolved binding for the performance and renderer. */
    worn: IAutoMovieMotionHumanProp.IWorn;
  }

  /**
   * Creates a catalogue or fitted armour piece with a single `wear` socket.
   *
   * Closed wall cells leave face, neck, arm, hem and limb cavities open. Museum
   * H/W/D and total mass remain the selected record's; fitted body boundaries
   * retain their exact measure, plate and provisional helmet pad. Unfitted
   * elliptical walls use the plate band as a minimum normal gauge; their
   * varying gauge preserves shared inner edges and the record envelope. This
   * coarse construction does not claim a uniform historical plate gauge. Fitted
   * mail places its wall outside the body's breadth/depth. Its wall is the
   * recorded mass's equivalent volume under the existing structural-steel
   * density, not a measurement of wire, weave or historical alloy. A gauntlet's
   * forearm radius sizes its cuff; its rigid mitten/thumb regions are coarse
   * authored envelopes, not a measured hand. The selected armet23232 retains
   * its missing visor and arm-defense35850 excludes its separate elbow
   * reinforce. Coarse opening fractions distinguish the kinds without claiming
   * calibrated artifact profiles. Each piece stays on one bone, +Y up, +Z
   * front; wear is its origin. Brim depth and plate metadata retain their
   * existing contracts.
   *
   * @param params The kind, the read piece, the body's measure, and any
   *   dimension the author fixes.
   * @param seed The seed that picks the read piece left free and draws every
   *   dimension left free inside its band; absent, the first piece and the
   *   middle of each band.
   * @returns The piece.
   * @throws {AutoMovieArchetypeRefusal} For an unsupported piece/dimension,
   *   invalid used body measures, inverted cuirass heights or a mail
   *   mass/coverage that cannot contain a positive wall and cavity.
   */
  export function create(
    params: AutoMovieArchetypeArmour.IParams,
    seed?: number,
  ): AutoMovieArchetype<Affordance, Dimension> {
    const kind: AutoMovieArchetypeArmour.Kind = ArchetypeDraw.choice(
      "armour",
      "kind",
      params.kind,
      AutoMovieArchetypeArmour.KINDS,
    );
    // The saved input spans every variant, so each variant narrows its own kind
    // and model against the lists it makes before it draws.
    const variants: Readonly<
      Record<
        AutoMovieArchetypeArmour.Kind,
        (
          params: AutoMovieArchetypeArmour.IParams,
          seed?: number,
        ) => AutoMovieArchetype<Affordance, Dimension>
      >
    > = {
      openHelmet: (p, s) =>
        AutoMovieArchetypeCostumeHelmet.create(
          {
            ...p,
            kind: "openHelmet",
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met26453",
              "met25388",
              "met23232",
              "met26508",
              "met26512",
              "met21972",
            ] as const),
          },
          s,
        ),
      closedHelmet: (p, s) =>
        AutoMovieArchetypeCostumeHelmet.create(
          {
            ...p,
            kind: "closedHelmet",
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met26453",
              "met25388",
              "met23232",
              "met26508",
              "met26512",
              "met21972",
            ] as const),
          },
          s,
        ),
      brimmedHelmet: (p, s) =>
        AutoMovieArchetypeCostumeHelmet.create(
          {
            ...p,
            kind: "brimmedHelmet",
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met26453",
              "met25388",
              "met23232",
              "met26508",
              "met26512",
              "met21972",
            ] as const),
          },
          s,
        ),
      cuirass: (p, s) =>
        AutoMovieArchetypeCostumeCuirass.create(
          {
            ...p,
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met22359",
              "met23084",
            ] as const),
          },
          s,
        ),
      mail: (p, s) =>
        AutoMovieArchetypeCostumeMail.create(
          {
            ...p,
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met34324",
              "met22415",
              "met633538",
              "met27635",
            ] as const),
          },
          s,
        ),
      gauntlet: (p, s) =>
        AutoMovieArchetypeCostumeGauntlet.create(
          {
            ...p,
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met23255",
              "met23256",
              "met23199",
            ] as const),
          },
          s,
        ),
      vambrace: (p, s) =>
        AutoMovieArchetypeCostumeVambrace.create(
          {
            ...p,
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met24896",
              "met35850",
            ] as const),
          },
          s,
        ),
      greave: (p, s) =>
        AutoMovieArchetypeCostumeGreave.create(
          {
            ...p,
            model: ArchetypeDraw.admit("armour", "model", p.model, [
              "met22970",
              "met22276",
            ] as const),
          },
          s,
        ),
    };
    return variants[kind](params, seed);
  }

  /**
   * Binds separate costume models to one performer's canonical bones.
   *
   * Each piece remains its own model. Its `wear` socket, the centre of the body
   * part it covers, is placed on that part's centre on the wearer's T-pose rest
   * with `+Y` up the segment and `+Z` toward the body's front. The binding is
   * that placement expressed in the slot bone's rest frame, so the piece rides
   * the bone through every pose:
   *
   * - A forearm or shank piece centres between the slot joint and the next joint
   *   down the limb (elbow and wrist, knee and ankle), `+Y` toward the upper
   *   joint;
   * - A gauntlet centres half the measured hand length from the wrist toward the
   *   middle finger's base, `+Y` toward the wrist;
   * - A helmet centres midway between the head joint and the vertex at stature;
   * - A cuirass or mail shirt hangs from the shoulder height, its centre half the
   *   piece's own height below it, over the chest joint.
   *
   * @param params The performer id and body, and up to one distinct costume
   *   model per slot.
   * @returns The models and their initial worn bindings for the scene.
   * @throws {AutoMovieArchetypeRefusal} For an empty subject or selection, an
   *   incompatible slot, a repeated scene ID, missing rest data, or absent
   *   trunk height.
   */
  export function assembleCostumeArmour(
    params: AutoMovieArchetypeArmour.IAssemblyParams,
  ): readonly AutoMovieArchetypeArmour.IAssemblyPiece[] {
    return assembleCostumeArmourImplementation(params);
  }

  /** Resolves the kind-specific public factory when its key is read. */
  export const PRODUCERS = {
    get openHelmet(): typeof AutoMovieArchetypeCostumeHelmet.create {
      return AutoMovieArchetypeCostumeHelmet.create;
    },
    get closedHelmet(): typeof AutoMovieArchetypeCostumeHelmet.create {
      return AutoMovieArchetypeCostumeHelmet.create;
    },
    get brimmedHelmet(): typeof AutoMovieArchetypeCostumeHelmet.create {
      return AutoMovieArchetypeCostumeHelmet.create;
    },
    get cuirass(): typeof AutoMovieArchetypeCostumeCuirass.create {
      return AutoMovieArchetypeCostumeCuirass.create;
    },
    get mail(): typeof AutoMovieArchetypeCostumeMail.create {
      return AutoMovieArchetypeCostumeMail.create;
    },
    get gauntlet(): typeof AutoMovieArchetypeCostumeGauntlet.create {
      return AutoMovieArchetypeCostumeGauntlet.create;
    },
    get vambrace(): typeof AutoMovieArchetypeCostumeVambrace.create {
      return AutoMovieArchetypeCostumeVambrace.create;
    },
    get greave(): typeof AutoMovieArchetypeCostumeGreave.create {
      return AutoMovieArchetypeCostumeGreave.create;
    },
  } satisfies Readonly<Record<Kind, unknown>>;

  /** Lists the kind IDs accepted by `create`, for runtime selection. */
  export const KINDS: readonly Kind[] = [
    "openHelmet",
    "closedHelmet",
    "brimmedHelmet",
    "cuirass",
    "mail",
    "gauntlet",
    "vambrace",
    "greave",
  ];

  /** Uses metres for lengths and kilograms for mass in bands and records. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    depth: "m",
    thickness: "m",
    pad: "m",
    mass: "kg",
  };

  /**
   * Each kind's read pieces whole, the default first, as the Metropolitan
   * Museum's records give them (H, W, D, Wt.;
   * https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}):
   *
   * - Open helmets: sallets 26453 (24.1, 28.6, 33.7 cm, 2984 g) and 25388 (26.7,
   *   23.5, 39.37 cm, 2769 g);
   * - Closed helmets: armet 23232 (29.2, 21.6, 28.6 cm, 2749 g) and close-helmet
   *   26508 (29.8, 22.2, 33.7 cm, 2656 g);
   * - Brimmed helmets: cabassets 26512 (27, 23.81, 34.3 cm, 1449 g) and 21972
   *   (25.4, 23.2, 33.5 cm, 1701 g);
   * - Cuirasses: 22359, breast and back 35.6 and 36.2 cm high, 30.5 cm wide, 4536
   *   g, its depth not stated, taken as its width; 23084's breastplate 37.5 x
   *   37.5 x 19.5 cm, 3112 g, with its backplate's 2340 g;
   * - Mail shirts: 34324 (91.5 cm long, 143 cm wide, 9071.9 g), 22415 (84, 132,
   *   9869 g), 633538 (86.4, 144.8, 7520.6 g) and 27635 (81, 137, 5562 g),
   *   their depth not stated, taken as their chest's;
   * - Gauntlets: 23255 (29.4, 14.6, 15.9 cm, 793.8 g), 23256 (21, 12.7, 12.4 cm,
   *   300.5 g), 23199 (26.7, 12.7, 11.1 cm, 581.2 g);
   * - Vambraces: 24896 (21, 11.4, 8.9 cm, 351 g) and 35850 (46.1, 16.8, 13.2 cm,
   *   1089 g);
   * - Greaves: 22970 (35.3, 12.7, 11.4 cm, 669 g) and 22276 (38.3, 11.7, 14.3 cm,
   *   854 g).
   */
  export const MODELS: Readonly<
    Record<
      Kind,
      Readonly<
        Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    openHelmet: {
      met26453: AutoMovieArchetypeArmourData.read(24.1, 28.6, 33.7, 2984),
      met25388: AutoMovieArchetypeArmourData.read(26.7, 23.5, 39.37, 2769),
    },
    closedHelmet: {
      met23232: AutoMovieArchetypeArmourData.read(29.2, 21.6, 28.6, 2749),
      met26508: AutoMovieArchetypeArmourData.read(29.8, 22.2, 33.7, 2656),
    },
    brimmedHelmet: {
      met26512: AutoMovieArchetypeArmourData.read(27, 23.81, 34.3, 1449),
      met21972: AutoMovieArchetypeArmourData.read(25.4, 23.2, 33.5, 1701),
    },
    cuirass: {
      met22359: AutoMovieArchetypeArmourData.read(36.2, 30.5, 30.5, 4536),
      met23084: AutoMovieArchetypeArmourData.read(37.5, 37.5, 19.5, 3112 + 2340),
    },
    mail: {
      met34324: AutoMovieArchetypeArmourData.read(91.5, 143, 62, 9071.9),
      met22415: AutoMovieArchetypeArmourData.read(84, 132, 62, 9869),
      met633538: AutoMovieArchetypeArmourData.read(86.4, 144.8, 62, 7520.6),
      met27635: AutoMovieArchetypeArmourData.read(81, 137, 62, 5562),
    },
    gauntlet: {
      met23255: AutoMovieArchetypeArmourData.read(29.4, 14.6, 15.9, 793.8),
      met23256: AutoMovieArchetypeArmourData.read(21, 12.7, 12.4, 300.5),
      met23199: AutoMovieArchetypeArmourData.read(26.7, 12.7, 11.1, 581.2),
    },
    vambrace: {
      met24896: AutoMovieArchetypeArmourData.read(21, 11.4, 8.9, 351),
      met35850: AutoMovieArchetypeArmourData.read(46.1, 16.8, 13.2, 1089),
    },
    greave: {
      met22970: AutoMovieArchetypeArmourData.read(35.3, 12.7, 11.4, 669),
      met22276: AutoMovieArchetypeArmourData.read(38.3, 11.7, 14.3, 854),
    },
  };

  /**
   * A plate piece's glance angle, degrees from the plate's normal, a
   * provisional value: Peter Jones's long bodkin against 1.5 mm mild steel
   * "penetrated perhaps 2 mm beyond the inner surface of the plate and then
   * broke while the rest of the arrow ricocheted" at 60 degrees and ricocheted
   * at 70 (Hardy, Longbow, as quoted at
   * https://willscommonplacebook.blogspot.com/2007/02/glancing-blows-and-armor-penetration.html,
   * not read at the book), the prototype publishes 60 degrees from this quoted
   * trial, not a universal critical angle. Williams's table of the energy to
   * defeat mild steel at an angle (The Knight and the Blast Furnace, 2003,
   * quoted there), rising to twice the square-on energy at 60 degrees, and
   * Hinsley's 30-degree strikes (The Historian, 2015, pp. 31-32) give no glance
   * angle. Searched for #3500 without a primary figure: Jones 1992 (Materials
   * Characterization 29) and the DTIC report ADA030268 on spheres ricocheting
   * from thin plates (unreadable). Magier et al. 2017, DOI
   * 10.5604/01.3001.0010.5152, uses two specific 96 g arrow types against 2 mm
   * steel in finite-element simulations and reports ricochet near 52 degrees;
   * those specimen-specific outcomes do not establish a universal cutoff
   * (author-hosted primary PDF,
   * https://www.researchgate.net/profile/Pawel-Zochowski/publication/320288999_NUMERICAL_ANALYSIS_OF_ENGLISH_BOWS_USED_IN_BATTLE_OF_CRECY/links/59ef29ae458515ec0c7a1284/NUMERICAL-ANALYSIS-OF-ENGLISH-BOWS-USED-IN-BATTLE-OF-CRECY.pdf).
   */
  export const GLANCE: number = 60;

  /**
   * The band of each free dimension a piece's record leaves, by kind: the
   * plate's thickness, a breastplate's band applied to the thinner limb plates,
   * provisional for them, and a helmet's padding.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    openHelmet: { thickness: AutoMovieArchetypeArmourData.thickness, pad: AutoMovieArchetypeArmourData.pad },
    closedHelmet: { thickness: AutoMovieArchetypeArmourData.thickness, pad: AutoMovieArchetypeArmourData.pad },
    brimmedHelmet: { thickness: AutoMovieArchetypeArmourData.thickness, pad: AutoMovieArchetypeArmourData.pad },
    cuirass: { thickness: AutoMovieArchetypeArmourData.thickness },
    mail: {},
    gauntlet: { thickness: { ...AutoMovieArchetypeArmourData.thickness, provisional: true } },
    vambrace: { thickness: { ...AutoMovieArchetypeArmourData.thickness, provisional: true } },
    greave: { thickness: { ...AutoMovieArchetypeArmourData.thickness, provisional: true } },
  };

  /** Chooses the covered bone by kind, using the left side for omitted limb sides. */
  export const bone: typeof armourBone = armourBone;
}
