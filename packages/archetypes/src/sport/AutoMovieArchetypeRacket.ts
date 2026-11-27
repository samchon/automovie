import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand } from "../core";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { buildTennisRacketHead } from "./internal/buildTennisRacketHead";
import * as AutoMovieArchetypeRacketData from "./internal/AutoMovieArchetypeRacketData";
import {
  m as AutoMovieArchetypeRacketDatam,
  kg as AutoMovieArchetypeRacketDataKg,
} from "./internal/AutoMovieArchetypeRacketData";

/** Canonical producer and authoring contract for Racket. */
export namespace AutoMovieArchetypeRacket {
  /** The kinds. */
  export type Kind =
    | "tennis"
    | "badminton"
    | "squash"
    | "tableTennis"
    | "padel";
  /**
   * The affordance ids:
   *
   * - `grip`: the handle, taken from `-Z`, its length along the racket.
   * - `face`: the hitting face toward `+Z`, as wide and as long as the head, its
   *   `+X` across the head.
   * - `sweetSpot`: the head's centre on the racket's axis, its `+Y` along the
   *   racket.
   */
  export type Affordance = "grip" | "face" | "sweetSpot";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the butt to the head's top.
   * - `headWidth`, `headLength`: the head across and along.
   * - `handleLength`: the handle from the butt.
   * - `gripDiameter`: the handle's.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "headWidth"
    | "headLength"
    | "handleLength"
    | "gripDiameter"
    | "mass";

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which racket. */
    kind: Kind;

    /** The model's id, unique in a scene; `racket` when absent. */
    id?: string;
  }

  /**
   * A tennis, badminton, squash or padel racket, or a table tennis bat.
   *
   * It stands along `+Y` from the butt of its handle at the origin to the top of
   * its head, the strung face toward `+Z`. `grip` is the handle a hand closes on,
   * `face` the strung surface that meets the ball, its `+Y` out of the strings,
   * and `sweetSpot` the head's centre on the racket's axis, its `+Y` running
   * along the racket toward the head's top: a swing carries `sweetSpot` through
   * the ball as its working point (`tip`) with `face` leading as its edge
   * (`edge`).
   *
   * @param params The kind and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The racket.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeRacket.IParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeRacket.Affordance, AutoMovieArchetypeRacket.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRacket.Dimension> =
      new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRacket.Dimension>(
        "racket",
        AutoMovieArchetypeRacket.UNITS,
        seed,
        params,
      );
    const kind: AutoMovieArchetypeRacket.Kind = ArchetypeDraw.choice(
      "racket",
      "kind",
      params.kind,
      AutoMovieArchetypeRacket.KINDS,
    );
    const d: Record<AutoMovieArchetypeRacket.Dimension, number> = draw.dimensions(
      AutoMovieArchetypeRacket.BANDS[kind],
    );
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeRacket.Affordance,
      AutoMovieArchetypeRacket.Dimension
    > = new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: AutoMovieArchetypeRacket.NAMES[kind],
      draw,
    });
    const v: typeof Vector3.create = Vector3.create;
    const thick: number = AutoMovieArchetypeRacket.THICKNESS[kind];
    const base: number = d.length - d.headLength;
    builder.rod(
      "handle",
      d.gripDiameter / 2,
      v(0, 0, 0),
      v(0, d.handleLength, 0),
      {
        color: "#2c2f33",
      },
    );
    if (base > d.handleLength)
      builder.rod("throat", thick / 2, v(0, d.handleLength, 0), v(0, base, 0), {
        color: "#8a8d91",
        opacity: kind === "tennis" ? 0 : undefined,
      });
    const head: ReturnType<typeof v> = v(0, base + d.headLength / 2, 0);
    const material: { color: string; density: number } = {
      color: AutoMovieArchetypeRacket.HEAD_COLORS[kind],
      density: 0.3,
    };
    if (kind === "padel") {
      const contour: ReturnType<typeof v>[] = [];
      for (let i: number = 0; i < AutoMovieArchetypeRacket.PADEL_RIM_SEGMENTS; ++i) {
        const angle: number = (2 * Math.PI * i) / AutoMovieArchetypeRacket.PADEL_RIM_SEGMENTS;
        const x: number = (Math.cos(angle) * d.headWidth) / 2;
        const y: number = (Math.sin(angle) * d.headLength) / 2;
        contour.push(v(x, y, -thick / 2), v(x, y, thick / 2));
      }
      builder.convex("head", contour, head, material);
    } else if (kind === "tennis") {
      builder.box("head", v(d.headWidth, d.headLength, thick), head, {
        ...material,
        opacity: 0,
      });
      const { rim, strings }: { rim: IAutoMovieMesh; strings: IAutoMovieMesh } =
        buildTennisRacketHead(
          d.headWidth,
          d.headLength,
          thick,
          d.handleLength - head.y,
          d.gripDiameter / 2,
        );
      builder.visualMesh("head-rim", rim, head, { color: "#364451" });
      builder.visualMesh("head-strings", strings, head, {
        color: material.color,
      });
    } else
      builder.box("head", v(d.headWidth, d.headLength, thick), head, material);
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, d.handleLength / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter,
      length: d.handleLength,
    });
    builder.affordance({
      id: "face",
      kind: "surface",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, base + d.headLength / 2, thick / 2),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      width: d.headWidth,
      depth: d.headLength,
    });
    builder.affordance({
      id: "sweetSpot",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, base + d.headLength / 2, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
    return builder.build(d.mass);
  }

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "tennis",
    "badminton",
    "squash",
    "tableTennis",
    "padel",
  ];

  /** The readable name of each kind. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    tennis: "tennis racket",
    badminton: "badminton racket",
    squash: "squash racket",
    tableTennis: "table tennis bat",
    padel: "padel racket",
  };

  /**
   * Head thickness in metres. Padel uses the FIP overall limit. Other values
   * are provisional.
   */
  export const THICKNESS: Readonly<Record<Kind, number>> = {
    tennis: 0.024,
    badminton: 0.008,
    squash: 0.02,
    tableTennis: 0.012,
    padel: 0.038,
  };

  /** Facets around the provisional padel head outline. */
  export const PADEL_RIM_SEGMENTS: number = 20;

  /** Flat head colour by kind in sRGB. */
  export const HEAD_COLORS: Readonly<Record<Kind, string>> = {
    tennis: "#c9ccd1",
    badminton: "#c9ccd1",
    squash: "#c9ccd1",
    tableTennis: "#b22222",
    padel: "#383f4e",
  };

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    headWidth: "m",
    headLength: "m",
    handleLength: "m",
    gripDiameter: "m",
    mass: "kg",
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    tennis: {
      length: AutoMovieArchetypeRacketDatam(0.685, 0.737, `${AutoMovieArchetypeRacketData.BABOLAT}, to ${AutoMovieArchetypeRacketData.ITF}: at most 73.7 cm long`),
      headWidth: AutoMovieArchetypeRacketDatam(
        0.247,
        0.292,
        `${AutoMovieArchetypeRacketData.ITF}: the hitting surface at most 29.2 cm wide; the narrower end is the ${AutoMovieArchetypeRacketData.BABOLAT} head read as an ellipse of the rule's proportions`,
      ),
      headLength: AutoMovieArchetypeRacketDatam(
        0.333,
        0.394,
        `${AutoMovieArchetypeRacketData.ITF}: the hitting surface at most 39.4 cm long; the shorter end is the ${AutoMovieArchetypeRacketData.BABOLAT} head read as an ellipse of the rule's proportions`,
      ),
      handleLength: AutoMovieArchetypeRacketDatam(0.17, 0.2, AutoMovieArchetypeRacketData.UNREAD, true),
      gripDiameter: AutoMovieArchetypeRacketDatam(
        (4 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        (4.5 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        "grip sizes 4 to 4 1/2 in round, Babolat Pure Drive Lite (https://tennisracquets.com/products/babolat-pure-drive-lite-tennis-racquet), as a diameter",
      ),
      mass: AutoMovieArchetypeRacketDataKg(0.293, 0.307, AutoMovieArchetypeRacketData.BABOLAT),
    },
    badminton: {
      length: AutoMovieArchetypeRacketDatam(
        0.673,
        0.677,
        "Yonex Astrox 10DG, 675 mm +/- 2 (https://www.badmintonbay.com/yonex-astrox-10dg-navy-turquoise-4ug5-badminton-racket.html), inside the BWF Law 4.1's 680 mm",
      ),
      headWidth: AutoMovieArchetypeRacketDatam(
        0.23,
        0.23,
        `${AutoMovieArchetypeRacketData.BWF}: the frame at most 230 mm wide, the limit the model takes`,
      ),
      headLength: AutoMovieArchetypeRacketDatam(
        0.28,
        0.28,
        `${AutoMovieArchetypeRacketData.BWF}: the strung area at most 280 mm long, the limit the model takes`,
      ),
      handleLength: AutoMovieArchetypeRacketDatam(0.19, 0.21, AutoMovieArchetypeRacketData.UNREAD, true),
      gripDiameter: AutoMovieArchetypeRacketDatam(
        0.08 / Math.PI,
        0.084 / Math.PI,
        "a Yonex G5 grip, 80 to 84 mm round (https://www.badmintonbay.com/yonex-astrox-10dg-navy-turquoise-4ug5-badminton-racket.html), as a diameter",
      ),
      mass: AutoMovieArchetypeRacketDataKg(
        0.08,
        0.0899,
        "Yonex weight grades 4U, 80 to 84.9 g, and 3U, 85 to 89.9 g (https://centralsports.co.uk/products/yonex-astrox-100-tour-kurenai)",
      ),
    },
    squash: {
      length: AutoMovieArchetypeRacketDatam(0.67, 0.686, AutoMovieArchetypeRacketData.WSF, true),
      headWidth: AutoMovieArchetypeRacketDatam(0.19, 0.215, AutoMovieArchetypeRacketData.WSF, true),
      headLength: AutoMovieArchetypeRacketDatam(0.25, 0.28, AutoMovieArchetypeRacketData.UNREAD, true),
      handleLength: AutoMovieArchetypeRacketDatam(0.18, 0.2, AutoMovieArchetypeRacketData.UNREAD, true),
      gripDiameter: AutoMovieArchetypeRacketDatam(0.03, 0.034, AutoMovieArchetypeRacketData.UNREAD, true),
      mass: AutoMovieArchetypeRacketDataKg(0.11, 0.255, AutoMovieArchetypeRacketData.WSF, true),
    },
    tableTennis: {
      length: AutoMovieArchetypeRacketDatam(
        0.257,
        0.257,
        `${AutoMovieArchetypeRacketData.BUTTERFLY}: the blade's 157 mm and the handle's 100 mm`,
      ),
      headWidth: AutoMovieArchetypeRacketDatam(0.15, 0.15, AutoMovieArchetypeRacketData.BUTTERFLY),
      headLength: AutoMovieArchetypeRacketDatam(0.157, 0.157, AutoMovieArchetypeRacketData.BUTTERFLY),
      handleLength: AutoMovieArchetypeRacketDatam(0.1, 0.1, AutoMovieArchetypeRacketData.BUTTERFLY),
      gripDiameter: AutoMovieArchetypeRacketDatam(0.022, 0.024, AutoMovieArchetypeRacketData.BUTTERFLY),
      mass: AutoMovieArchetypeRacketDataKg(
        0.15,
        0.2,
        `${AutoMovieArchetypeRacketData.BUTTERFLY} for the blade alone; the two rubbers' mass ${AutoMovieArchetypeRacketData.UNREAD}`,
        true,
      ),
    },
    padel: {
      length: AutoMovieArchetypeRacketDatam(0.455, 0.455, `${AutoMovieArchetypeRacketData.FIP}: maximum racket length 455 mm`),
      headWidth: AutoMovieArchetypeRacketDatam(
        0.205,
        0.23,
        `${AutoMovieArchetypeRacketData.FIP}: provisional head width within the overall limit`,
        true,
      ),
      headLength: AutoMovieArchetypeRacketDatam(
        0.255,
        0.28,
        "provisional head length for the round paddle profile",
        true,
      ),
      handleLength: AutoMovieArchetypeRacketDatam(
        0.12,
        0.145,
        `${AutoMovieArchetypeRacketData.FIP}: provisional handle length within the limit`,
        true,
      ),
      gripDiameter: AutoMovieArchetypeRacketDatam(0.03, 0.034, "provisional adult grip diameter", true),
      mass: AutoMovieArchetypeRacketDataKg(0.36, 0.36, AutoMovieArchetypeRacketData.HEAD),
    },
  };
}
