import "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeStick } from "../AutoMovieArchetypeStick";
import { StickBuildData } from "./StickBuildData";


/*
 * The sport-stick draw and contacts shared by the individual shape producers.
 */
export namespace StickBuild {
  /*
   * The units of the recorded stick dimensions.
   */
  export const UNITS: Readonly<
    Record<AutoMovieArchetypeStick.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    head: "m",
    reach: "m",
    width: "m",
    depth: "m",
    mass: "kg",
  };

  /*
   * The bands for each stick profile.
   */
  export const BANDS: Readonly<
    Record<
      AutoMovieArchetypeStick.Kind,
      Readonly<Partial<Record<AutoMovieArchetypeStick.Dimension, IAutoMovieArchetypeBand>>>
    >
  > = {
    iceHockey: {
      length: AutoMovieArchetypeBand.metres(
        1.63,
        1.63,
        `${StickBuildData.IIHF}; the model takes the limit`,
      ),
      head: AutoMovieArchetypeBand.metres(0.05, 0.076, StickBuildData.IIHF),
      reach: AutoMovieArchetypeBand.metres(
        0.32,
        0.32,
        `${StickBuildData.IIHF}; the model takes the limit`,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.03,
        0.03,
        `${StickBuildData.IIHF}; the model takes the limit`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        0.025,
        0.025,
        `${StickBuildData.IIHF}; the model takes the limit`,
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
        `${StickBuildData.FIH}; the model takes the limit`,
      ),
      head: AutoMovieArchetypeBand.metres(0.1, 0.1, StickBuildData.FIH),
      width: AutoMovieArchetypeBand.metres(
        0.051,
        0.051,
        `${StickBuildData.FIH}; the model takes the ring`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.5,
        0.737,
        `${StickBuildData.FIH}: at most 737 g; the lower end is ${AutoMovieArchetypeBand.TYPICAL_MASS}`,
        true,
      ),
    },
    lacrosse: {
      length: AutoMovieArchetypeBand.metres(0.9, 1.1, StickBuildData.SIXES),
      head: AutoMovieArchetypeBand.metres(0.254, 0.254, StickBuildData.SIXES),
      width: AutoMovieArchetypeBand.metres(0.15, 0.15, StickBuildData.SIXES),
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
        `${StickBuildData.MCC}; the model takes the limit`,
      ),
      head: AutoMovieArchetypeBand.metres(
        0.9652 * 0.48,
        0.9652 * 0.48,
        `${StickBuildData.MCC}: the blade the length less the handle's greatest 52%`,
      ),
      width: AutoMovieArchetypeBand.metres(
        0.108,
        0.108,
        `${StickBuildData.MCC}; the model takes the limit`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        0.067,
        0.067,
        `${StickBuildData.MCC}; the model takes the limit`,
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

  /*
   * What draw prepares for its caller.
   */
  export interface IDrawResult<Id extends AutoMovieArchetypeStick.Affordance> {
    /*
     * The prepared `builder` this call returns.
     */
    builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeStick.Dimension>;

    /*
     * The prepared `d` this call returns.
     */
    d: Partial<Record<AutoMovieArchetypeStick.Dimension, number>>;
  }

  /*
   * Draw a stick profile in its original seed domain and prepare its builder.
   */
  export function draw<Id extends AutoMovieArchetypeStick.Affordance>(
    kind: AutoMovieArchetypeStick.Kind,
    params: Readonly<Omit<AutoMovieArchetypeStick.IParams, "kind">>,
    seed: number | undefined,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStick.Dimension> =
      new AutoMovieArchetypeDrawSession("stick", UNITS, seed, params);
    const d: Partial<Record<AutoMovieArchetypeStick.Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    const builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeStick.Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: NAMES[kind],
        draw,
      });
    return { builder, d };
  }

  /*
   * The values contacts accepts at this place in its signature.
   */
  export type ContactsSymmetry = "half" | "round";

  /*
   * Declare the two-hand grip and a named playing face from the constructed
   * stick dimensions.
   * Parameter builder: The stick builder that receives the two contacts.
   * Parameter length: The total profile length along local Y, in metres.
   * Parameter head: The height of the head measured from the floor, in metres.
   * Parameter face: A point on the model's local playing face, in metres.
   * Parameter faceWidth: The width of the playing face along X, in metres.
   * Parameter symmetry: The grip symmetry from the shaft's section.
   * Parameter aperture: The measured grasp aperture in metres when the profile
   * gives one.
   */
  export function contacts(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeStick.Affordance,
      AutoMovieArchetypeStick.Dimension
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
        StickBuildData.v(0, (length + head) / 2, 0),
        StickBuildData.v(0, 0, 1),
        StickBuildData.v(0, 1, 0),
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
      frame: AutoMovieArchetypeFrame.facing(face, StickBuildData.v(0, 0, 1), StickBuildData.v(1, 0, 0)),
      extent: null,
      width: faceWidth,
      depth: head,
    });
  }
}

/*
 * The readable name of each kind.
 */
const NAMES: Readonly<Record<AutoMovieArchetypeStick.Kind, string>> = {
  iceHockey: "ice hockey stick",
  fieldHockey: "field hockey stick",
  lacrosse: "lacrosse crosse",
  cricketBat: "cricket bat",
};
