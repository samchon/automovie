import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
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

/** The sport-stick draw and contacts shared by the individual shape producers. */
export namespace StickBuild {
  /** The units of the recorded stick dimensions. */
  export const UNITS: Readonly<
    Record<createStick.Dimension, AutoMovieArchetypeDrawSession.Unit>
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
      Readonly<Partial<Record<createStick.Dimension, IAutoMovieArchetypeBand>>>
    >
  > = {
    iceHockey: {
      length: AutoMovieArchetypeBand.metres(
        1.63,
        1.63,
        `${IIHF}; the model takes the limit`,
      ),
      head: AutoMovieArchetypeBand.metres(0.05, 0.076, IIHF),
      reach: AutoMovieArchetypeBand.metres(
        0.32,
        0.32,
        `${IIHF}; the model takes the limit`,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.03,
        0.03,
        `${IIHF}; the model takes the limit`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        0.025,
        0.025,
        `${IIHF}; the model takes the limit`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.4,
        0.6,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    fieldHockey: {
      length: AutoMovieArchetypeBand.metres(
        1.05,
        1.05,
        `${FIH}; the model takes the limit`,
      ),
      head: AutoMovieArchetypeBand.metres(0.1, 0.1, FIH),
      width: AutoMovieArchetypeBand.metres(
        0.051,
        0.051,
        `${FIH}; the model takes the ring`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.5,
        0.737,
        `${FIH}: at most 737 g; the lower end is ${AutoMovieArchetypeBand.TYPICAL_MASS}`,
        true,
      ),
    },
    lacrosse: {
      length: AutoMovieArchetypeBand.metres(0.9, 1.1, SIXES),
      head: AutoMovieArchetypeBand.metres(0.254, 0.254, SIXES),
      width: AutoMovieArchetypeBand.metres(0.15, 0.15, SIXES),
      depth: AutoMovieArchetypeBand.metres(
        0.025,
        0.03,
        "Coarse shaft diameter for grip placement",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.28,
        0.45,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    cricketBat: {
      length: AutoMovieArchetypeBand.metres(
        0.9652,
        0.9652,
        `${MCC}; the model takes the limit`,
      ),
      head: AutoMovieArchetypeBand.metres(
        0.9652 * 0.48,
        0.9652 * 0.48,
        `${MCC}: the blade the length less the handle's greatest 52%`,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.108,
        0.108,
        `${MCC}; the model takes the limit`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        0.067,
        0.067,
        `${MCC}; the model takes the limit`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1.1,
        1.4,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };

  /** What {@link draw} prepares for its caller. */
  export interface IDrawResult<Id extends createStick.Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, createStick.Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<createStick.Dimension, number>>;
  }

  /** Draw a stick profile in its original seed domain and prepare its builder. */
  export function draw<Id extends createStick.Affordance>(
    kind: createStick.Kind,
    params: Readonly<Omit<createStick.IParams, "kind">>,
    seed: number | undefined,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<createStick.Dimension> =
      new AutoMovieArchetypeDrawSession("stick", UNITS, seed, params);
    const d: Partial<Record<createStick.Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    const builder: AutoMovieArchetypeBuilder<Id, createStick.Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: NAMES[kind],
        draw,
      });
    return { builder, d };
  }

  /** The values {@link contacts} accepts at this place in its signature. */
  export type ContactsSymmetry = "half" | "round";

  /**
   * Declare the two-hand grip and a named playing face from the constructed
   * stick dimensions.
   *
   * @param builder The stick builder that receives the two contacts.
   * @param length The total profile length along local Y, in metres.
   * @param head The height of the head measured from the floor, in metres.
   * @param face A point on the model's local playing face, in metres.
   * @param faceWidth The width of the playing face along X, in metres.
   * @param symmetry The grip symmetry from the shaft's section.
   * @param aperture The measured grasp aperture in metres when the profile
   *   gives one.
   */
  export function contacts(
    builder: AutoMovieArchetypeBuilder<
      createStick.Affordance,
      createStick.Dimension
    >,
    length: number,
    head: number,
    face: IAutoMovieVector3,
    faceWidth: number,
    symmetry: ContactsSymmetry,
    aperture?: number,
  ): void {
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: symmetry,
      frame: AutoMovieArchetypeFrame.facing(
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
      frame: AutoMovieArchetypeFrame.facing(face, v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      width: faceWidth,
      depth: head,
    });
  }
}
