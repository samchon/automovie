import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/*
 * Published dimensions and per-unit mass of the adult half-cuff model.
 */
const SOURCE: string =
  "Walk Easy 445 adult half-cuff forearm crutch, grip to floor 29.8–38.0 in, grip to cuff 9.0 in, cuff inside diameter 3.5 in, grip length 4.25 in and diameter 1.5 in, mass 552.8 g each (https://walkeasy.com/shop/crutches/forearm-elbow/445.php)";

/*
 * Visual simplifications for the shaft, tip and cuff section, in metres.
 */
const SHAPE: Readonly<ICrutchShape> = {
  shaft: 0.011,
  baseRadius: 0.023,
  baseHeight: 0.037,
  cuffSection: 0.007,
  topSetback: 0.06,
};

/** Constructs the crutch archetype from its recipe. */
export namespace AutoMovieArchetypeCrutch {
/**
 * A single digital forearm crutch with an open half cuff, a handle along `+Z`
 * and a base that stands at the origin. The grip is on the handle's axis and
 * the tip is on the real bottom face with its local `+Y` pointing down.
 *
 * @param params The scene identifier and optional floor-to-grip height in
 *   metres.
 * @param seed Draws the floor-to-grip height when it is omitted. Without a
 *   seed, use the midpoint of the recorded range.
 * @returns The generated prop with its grip and tip contacts.
 * @throws {AutoMovieArchetypeRefusal} For a grip height outside the recorded
 *   range.
 */
export function create(
  params: AutoMovieArchetypeCrutch.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeCrutch.Affordance, AutoMovieArchetypeCrutch.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCrutch.Dimension> =
    new AutoMovieArchetypeDrawSession("crutch", { height: "m" }, seed, params);
  const { height }: Record<AutoMovieArchetypeCrutch.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeCrutch.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCrutch.Affordance,
    AutoMovieArchetypeCrutch.Dimension
  > = new AutoMovieArchetypeBuilder({
    name: "forearm crutch",
    id: params.id,
    material: "composite",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const base: IAutoMovieVector3 = v(0, 0, 0);
  const heel: IAutoMovieVector3 = v(0, SHAPE.baseHeight, 0);
  const junction: IAutoMovieVector3 = v(0, height, 0);
  const cuffHeight: number = height + 9 * AutoMovieArchetypeUnits.INCH;
  const attachment: IAutoMovieVector3 = v(0, cuffHeight, -SHAPE.topSetback);
  const barLength: number = 4.25 * AutoMovieArchetypeUnits.INCH;
  const diameter: number = 1.5 * AutoMovieArchetypeUnits.INCH;
  // The midpoints of the four chords carry the published inner radius.
  const cuffRadius: number =
    ((3.5 * AutoMovieArchetypeUnits.INCH) / 2 + SHAPE.cuffSection) /
    Math.cos(Math.PI / 8);

  builder.rod("tip", SHAPE.baseRadius, base, heel, { color: "#33363a" });
  builder.rod("shaft", SHAPE.shaft, heel, junction, { color: "#a5b0b7" });
  builder.rod("cuffPost", SHAPE.shaft, junction, attachment, {
    color: "#a5b0b7",
  });
  builder.rod("handle", diameter / 2, junction, v(0, height, barLength), {
    color: "#33363a",
  });

  // Four outer chords leave the cuff open toward the handle and behind the hand.
  for (let i: number = 0; i < 4; i++) {
    const from: number = (i * Math.PI) / 4;
    const to: number = ((i + 1) * Math.PI) / 4;
    builder.rod(
      `cuff-${i + 1}`,
      SHAPE.cuffSection,
      v(
        cuffRadius * Math.cos(from),
        cuffHeight,
        attachment.z + cuffRadius * (1 - Math.sin(from)),
      ),
      v(
        cuffRadius * Math.cos(to),
        cuffHeight,
        attachment.z + cuffRadius * (1 - Math.sin(to)),
      ),
      { color: "#33363a" },
    );
  }
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, height, barLength / 2),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: diameter,
    length: barLength,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(base, v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });
  return builder.build(0.5528);
}

  /* The settings and local contacts of {@link createCrutch}. */
  /** The handle and the tip's floor contact. */
  export type Affordance = "grip" | "tip";

  /** Vertical distance from the floor to the handle axis, in metres. */
  export type Dimension = "height";

  /** Parameters for one forearm crutch. */
  export interface IParams {
    /** Stable scene identifier. Defaults to `crutch`. */
    id?: string;

    /** Floor-to-grip height in metres. Drawn when omitted. */
    height?: number;
  }

  /** The measured adjustment envelope of the selected object. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    height: AutoMovieArchetypeBand.metres(
      29.8 * AutoMovieArchetypeUnits.INCH,
      38 * AutoMovieArchetypeUnits.INCH,
      SOURCE,
    ),
  };
}

/*
 * The crutch's drawn proportions, metres.
 */
interface ICrutchShape {
  /*
   * The shaft's radius.
   */
  shaft: number;

  /*
   * The rubber tip's radius.
   */
  baseRadius: number;

  /*
   * The rubber tip's height.
   */
  baseHeight: number;

  /*
   * The cuff band's section.
   */
  cuffSection: number;

  /*
   * How far the cuff's top stands behind the grip.
   */
  topSetback: number;
}
