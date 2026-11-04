import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHuman } from "../../../src/AutoMovieHuman";
import { AutoMovieHumanHairStage } from "../../../src/appearance/AutoMovieHumanHairStage";
import { AutoMovieHumanHeadField } from "../../../src/appearance/AutoMovieHumanHeadField";
import type { IAutoMovieHumanAppearanceBody } from "../../../src/appearance/IAutoMovieHumanAppearanceBody";
import { AutoMovieHumanBodyAnatomy } from "../../../src/generation/AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanBodyCalibration } from "../../../src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../../../src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanScalpHair } from "../../../src/structures/appearance/IAutoMovieHumanScalpHair";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";

/**
 * `hair.guides[:<every>]`: the person's scalp hair as the production hair stage builds it on the
 * generated figure, at the bind: the head and ear skin (`human.skin.<chain>/<k>`), the hair cards
 * (`human.hair.cards`) and the scalp layer's shell (`human.hair.scalp`) as parts, and every
 * `<every>`-th guide (default 1, all of them) as a curve `human.construction.hair.<side>/g<root>`,
 * `side` being `left` for a canonical root and `right` for its mirror, so a pattern such as
 * `curves=hair.left/*` shows one side. The guides are the polylines the cards realise, in body
 * millimetres: each guide's points are head-local, placed at the head chart's centre.
 */
export const HumanDebugPieceHairGuides: IHumanDebugPiece = {
  name: "hair.guides",
  region: "head",
  description: "Scalp hair guides as curves over the head skin, with the cards and the scalp layer",
  arguments: ["4"],
  build: (person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument => {
    const every: number = argument === null || argument === "" ? 1 : Number(argument);
    if (!(Number.isInteger(every) && every >= 1))
      throw new Error("hair.guides takes a whole number of guides per shown guide; got " + argument);

    const params: IAutoMovieHumanParameters = person.parameters;
    const hair: IAutoMovieHumanScalpHair | undefined = params.appearance?.hair;
    const model: IAutoMovieModelPart[] = AutoMovieHuman.generate(params).model.parts;
    const body: IAutoMovieHumanAppearanceBody = appearanceBody(person, model);
    const parts: IHumanDebugDocument.IPart[] = model
      .filter(
        (part: IAutoMovieModelPart): boolean =>
          AutoMovieHumanHeadField.owns(part.id) ||
          part.id === "human.hair.cards" ||
          part.id === "human.hair.scalp",
      )
      .flatMap((part: IAutoMovieModelPart): IHumanDebugDocument.IPart[] =>
        part.geometry.type === "mesh" ? [millimetres(part.id, part.geometry.mesh)] : [],
      );
    if (hair === undefined || !(hair.length > 0))
      return { parts, provenance: { piece: "hair.guides", person: person.alias, guides: 0 } };

    // The production stage reuses the chart and guides the figure's own generation solved.
    const realised: AutoMovieHumanHairStage.IOutput | null = AutoMovieHumanHairStage.realise(
      params,
      body,
      hair,
    );
    const centre: [number, number, number] = AutoMovieHumanHeadField.create(params, body).centre;
    const curves: IHumanDebugDocument.ICurve[] = (realised?.guides ?? [])
      .filter((_guide: AutoMovieHumanHairStage.IOutput["guides"][number], k: number): boolean => k % every === 0)
      .map(
        (guide: AutoMovieHumanHairStage.IOutput["guides"][number]): IHumanDebugDocument.ICurve => ({
          id: `human.construction.hair.${guide.mirror ? "right" : "left"}/g${guide.root}`,
          closed: false,
          points: guide.points.map(
            (p: [number, number, number]): IHumanDebugDocument.Point => [
              p[0] + centre[0],
              p[1] + centre[1],
              p[2] + centre[2],
            ],
          ),
        }),
      );

    // The curves ride on the cards' part, the one they realise.
    const cards: IHumanDebugDocument.IPart | undefined = parts.find(
      (part: IHumanDebugDocument.IPart): boolean => part.id === "human.hair.cards",
    );
    if (cards !== undefined) cards.curves = curves;
    return {
      parts,
      provenance: {
        piece: "hair.guides" + (argument === null || argument === "" ? "" : ":" + argument),
        person: person.alias,
        style: hair.style,
        length: hair.length,
        hairline: hair.hairline,
        guides: realised?.guides.length ?? 0,
        shown: curves.length,
        centre,
      },
    };
  },
};

/**
 * The appearance body the figure's generation gave the hair: its eye frames from the calibration's
 * eyes at the stature scale, its parts, and the calibration.
 *
 * @param person The person
 * @param parts The generated model's parts, in metres
 * @returns The body the hair stage reads
 */
function appearanceBody(
  person: IHumanDebugPerson,
  parts: IAutoMovieModelPart[],
): IAutoMovieHumanAppearanceBody {
  const calibration: IAutoMovieHumanBodyCalibration = person.calibration();
  const stature: number = calibration.stature;
  const scale: number =
    AutoMovieHumanBodyAnatomy.resolve(person.parameters).stature / stature / 1000;
  const eye: (side: "left" | "right") => IAutoMovieHumanAppearanceBody.IEye = (
    side: "left" | "right",
  ): IAutoMovieHumanAppearanceBody.IEye => {
    const found: IAutoMovieHumanBodyCalibration.IEye | undefined = calibration.eyes.find(
      (e: IAutoMovieHumanBodyCalibration.IEye): boolean => e.side === side,
    );
    if (found === undefined) throw new Error(`Calibration lacks the ${side} eye`);
    return {
      centre: [found.centre[0] * scale, found.centre[1] * scale, found.centre[2] * scale],
      forward: [1, 0, 0],
      up: [0, 1, 0],
      radius: found.radius * scale,
    };
  };
  return {
    eyePair: { left: eye("left"), right: eye("right") },
    parts: parts.filter(
      (part: IAutoMovieModelPart): boolean => part.id.startsWith("human.skin."),
    ),
    calibration,
  };
}

/**
 * A model mesh part as a document part in body millimetres.
 *
 * @param id The part id
 * @param mesh The mesh, positions in metres
 * @returns The document part
 */
function millimetres(id: string, mesh: IAutoMovieMesh): IHumanDebugDocument.IPart {
  const points: IHumanDebugDocument.Point[] = [];
  for (let i: number = 0; i + 2 < mesh.positions.length; i += 3)
    points.push([
      mesh.positions[i]! * 1000,
      mesh.positions[i + 1]! * 1000,
      mesh.positions[i + 2]! * 1000,
    ]);
  const indices: number[] =
    mesh.indices ?? Array.from({ length: points.length }, (_v: unknown, k: number): number => k);
  return {
    id,
    space: "body-mm",
    frame: { origin: [0, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], left: [0, 0, 1] },
    points,
    indices,
    curves: [],
  };
}
