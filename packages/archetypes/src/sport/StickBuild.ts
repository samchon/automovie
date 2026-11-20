import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import type { createStick } from "./createStick";

/** The ice hockey stick read. */
const IIHF: string =
  "IIHF Official Rule Book 2026/27, Rule 10.1: no stick longer than 1.63 m from the heel to the end of the shaft, the blade at most 32.0 cm from the heel and 5.0 to 7.6 cm wide (https://test.rulebook.iihf.com/documents/rule-book-2026-27/10); the shaft at most 3 cm wide and 2.5 cm thick in the older Rule 222 (https://stats.iihf.com/hockey/rules/img/sec2.pdf)";

/** The field hockey stick read. */
const FIH: string =
  "FIH Rules of Hockey 2026, stick specifications 2.17 and 2.18: at most 105 cm from the top of the handle to the bottom of the head, at most 737 g, passing through a ring of 51 mm inside diameter; the head's open end limited by line C, 100 mm above line X (2.2, 2.8) (https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf)";

/** World Lacrosse Sixes stick lengths and head opening. */
const SIXES: string =
  "World Lacrosse Sixes Rules 2026–28, §2.2.1 (https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Sixes-Rule-Book_v2_0526.pdf)";

/** The cricket bat read. */
const MCC: string =
  "MCC Laws of Cricket, 2017 Code 3rd Edition 2022, Law 5, bat size limits: overall length at most 38 in (96.52 cm), width 4.25 in (10.8 cm), depth 2.64 in (6.7 cm), edges 1.56 in (4.0 cm), the handle at most 52% of the overall length (https://www.lords.org/getmedia/81bd1d01-c7e7-42f6-ac70-80473a050c32/Laws-of-Cricket-2017-Code-3rd-Edition-2022_1.docx)";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createStick.Kind, string>> = {
  iceHockey: "ice hockey stick",
  fieldHockey: "field hockey stick",
  lacrosse: "lacrosse crosse",
  cricketBat: "cricket bat",
};

/** Local model points in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * The sport-stick draw and contacts shared by the individual shape producers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the original stick draw namespace and the model record it preserves.
 * @evidence contracts/development/design.md#principled-representation Keeps dimensions in metres and mass in kilograms with the original per-kind bands and provenance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One draw and its tables serve the public producers and the saved-recipe dispatcher.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The same draw records bands, fixed figures and model choices.
 */
export namespace StickBuild {
  /** The units of the recorded stick dimensions. */
  export const UNITS: Readonly<
    Record<createStick.Dimension, ArchetypeDrawSession.Unit>
  > = {
    length: "m",
    head: "m",
    reach: "m",
    width: "m",
    depth: "m",
    mass: "kg",
  };

  /** The bands for each stick profile. */
  export const BANDS: Readonly<
    Record<
      createStick.Kind,
      Readonly<Partial<Record<createStick.Dimension, IArchetypeBand>>>
    >
  > = {
    iceHockey: {
      length: ArchetypeBand.metres(
        1.63,
        1.63,
        `${IIHF}; the model takes the limit`,
      ),
      head: ArchetypeBand.metres(0.05, 0.076, IIHF),
      reach: ArchetypeBand.metres(
        0.32,
        0.32,
        `${IIHF}; the model takes the limit`,
      ),
      width: ArchetypeBand.metres(
        0.03,
        0.03,
        `${IIHF}; the model takes the limit`,
      ),
      depth: ArchetypeBand.metres(
        0.025,
        0.025,
        `${IIHF}; the model takes the limit`,
      ),
      mass: ArchetypeBand.of("kg", 0.4, 0.6, ArchetypeBand.TYPICAL_MASS, true),
    },
    fieldHockey: {
      length: ArchetypeBand.metres(
        1.05,
        1.05,
        `${FIH}; the model takes the limit`,
      ),
      head: ArchetypeBand.metres(0.1, 0.1, FIH),
      width: ArchetypeBand.metres(
        0.051,
        0.051,
        `${FIH}; the model takes the ring`,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.5,
        0.737,
        `${FIH}: at most 737 g; the lower end is ${ArchetypeBand.TYPICAL_MASS}`,
        true,
      ),
    },
    lacrosse: {
      length: ArchetypeBand.metres(0.9, 1.1, SIXES),
      head: ArchetypeBand.metres(0.254, 0.254, SIXES),
      width: ArchetypeBand.metres(0.15, 0.15, SIXES),
      depth: ArchetypeBand.metres(
        0.025,
        0.03,
        "Coarse shaft diameter for grip placement",
        true,
      ),
      mass: ArchetypeBand.of(
        "kg",
        0.28,
        0.45,
        ArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    cricketBat: {
      length: ArchetypeBand.metres(
        0.9652,
        0.9652,
        `${MCC}; the model takes the limit`,
      ),
      head: ArchetypeBand.metres(
        0.9652 * 0.48,
        0.9652 * 0.48,
        `${MCC}: the blade the length less the handle's greatest 52%`,
      ),
      width: ArchetypeBand.metres(
        0.108,
        0.108,
        `${MCC}; the model takes the limit`,
      ),
      depth: ArchetypeBand.metres(
        0.067,
        0.067,
        `${MCC}; the model takes the limit`,
      ),
      mass: ArchetypeBand.of("kg", 1.1, 1.4, ArchetypeBand.TYPICAL_MASS, true),
    },
  };

  /**
   * Draw a stick profile in its original seed domain and prepare its builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the compatibility draw and the local model it fills.
   * @evidence contracts/development/implementation.md#principled-implementation Each sport uses its own cited bands and the retained model coordinates.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keep draw and model assembly together, separate from shape construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserve the published parameter checks and contact conventions.
   * @evidence contracts/development/implementation.md#efficient-algorithms One draw pass over the profile's bands and one construction pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the dimension checks and composite material of the four sports profiles.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or draw state between calls.
   */
  export function draw<Id extends createStick.Affordance>(
    kind: createStick.Kind,
    params: Readonly<Omit<createStick.IParams, "kind">>,
    seed: number | string | undefined,
  ): {
    builder: ArchetypeBuilder<Id, createStick.Dimension>;
    d: Partial<Record<createStick.Dimension, number>>;
  } {
    const draw: ArchetypeDrawSession<createStick.Dimension> =
      new ArchetypeDrawSession("stick", UNITS, seed, params);
    const d: Partial<Record<createStick.Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    const builder: ArchetypeBuilder<Id, createStick.Dimension> =
      new ArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: NAMES[kind],
        draw,
      });
    return { builder, d };
  }

  /**
   * Declare the two-hand grip and a named playing face from the constructed stick dimensions.
   *
   * @param builder The stick builder that receives the two contacts.
   * @param length The total profile length along local Y, in metres.
   * @param head The height of the head measured from the floor, in metres.
   * @param face A point on the model's local playing face, in metres.
   * @param faceWidth The width of the playing face along X, in metres.
   * @param symmetry The grip symmetry from the shaft's section.
   * @param aperture The measured grasp aperture in metres when the profile gives one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shaft span, measured playing face and aperture options.
   * @evidence contracts/development/implementation.md#principled-implementation The grip spans the shaft above the working end. The blade's outward normal follows the local face.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Put one affordance on the shaft and one affordance on the face.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keep the measured head and face anchors. Retain the absence of an aperture on the cricket handle.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The fixed grip and face each contribute one frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shaft and face frames are common to four shapes. Each shape supplies its own face position and width.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or draw state between calls.
   */
  export function contacts(
    builder: ArchetypeBuilder<createStick.Affordance, createStick.Dimension>,
    length: number,
    head: number,
    face: IAutoMovieVector3,
    faceWidth: number,
    symmetry: "half" | "round",
    aperture?: number,
  ): void {
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: symmetry,
      frame: ArchetypeFrame.facing(
        v(0, (length + head) / 2, 0),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "two-hand",
      ...(aperture === undefined ? {} : { aperture }),
      length: length - head,
    });
    builder.affordance({
      id: "blade",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(face, v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      width: faceWidth,
      depth: head,
    });
  }
}
