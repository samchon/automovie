import { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { meshAutoMovieHumanCage } from "../junction/meshAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";

/**
 * Every skin part instance of a person: the trunk, neck and head once, the ears, arms, hands, legs and feet once per side.
 */
export const AUTOMOVIE_HUMAN_PART_INSTANCES: ReadonlyArray<
  readonly [AutoMovieHumanPart, AutoMovieHumanSide | null]
> = [
  ["trunk", null],
  ["neck", null],
  ["head", null],
  ["ear", "left"],
  ["ear", "right"],
  ["arm", "left"],
  ["arm", "right"],
  ["hand", "left"],
  ["hand", "right"],
  ["leg", "left"],
  ["leg", "right"],
  ["foot", "left"],
  ["foot", "right"],
];

/**
 * Generate every part's cage for a person, each alone.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param generators The generator of each part
 * @returns One cage per part instance, in `AUTOMOVIE_HUMAN_PART_INSTANCES` order
 */
export const generateAutoMovieHumanCages = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  generators: IAutoMovieHumanPartGenerators,
): Array<{
  part: AutoMovieHumanPart;
  side: AutoMovieHumanSide | null;
  cage: IAutoMovieHumanCage;
}> =>
  AUTOMOVIE_HUMAN_PART_INSTANCES.map(([part, side]) => ({
    part,
    side,
    cage: (
      generators[part] as {
        generate(props: {
          measurements: IAutoMovieHumanMeasurements;
          skeleton: IAutoMovieHumanSkeleton;
          side: AutoMovieHumanSide | null;
        }): IAutoMovieHumanCage;
      }
    ).generate({ measurements, skeleton, side }),
  }));

/**
 * Emit each skin part's own cage, subdivided alone, as a separate static model part, the preview in which a part is judged before joining.
 *
 * Each part keeps its open rings as boundaries, so its edge near a junction is the part's own limit surface, not the joined one. Part ids are `skin.<part>` or `skin.<part>.<side>`, so the viewer can show one part alone.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param levels Subdivision levels
 * @param generators The generator of each part
 * @returns The parts and the material they cite
 */
export const emitAutoMovieHumanSkinParts = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  levels: number,
  generators: IAutoMovieHumanPartGenerators,
): { parts: IAutoMovieModelPart[]; materials: IAutoMovieMaterial[] } => ({
  parts: generateAutoMovieHumanCages(measurements, skeleton, generators).map(
    ({ part, side, cage }): IAutoMovieModelPart => {
      const id: string =
        side === null ? `skin.${part}` : `skin.${part}.${side}`;
      return {
        id,
        name: side === null ? part : `${side} ${part}`,
        geometry: {
          type: "mesh",
          mesh: meshAutoMovieHumanCage({ cage, levels, domain: id }).mesh,
        },
        material: AUTOMOVIE_HUMAN_SKIN_MATERIAL.id,
        attachedBone: null,
        transform: null,
      };
    },
  ),
  materials: [AUTOMOVIE_HUMAN_SKIN_MATERIAL],
});

/** Neutral placeholder skin material until the appearance stage decides it. */
export const AUTOMOVIE_HUMAN_SKIN_MATERIAL: IAutoMovieMaterial = {
  id: "skin",
  name: "skin",
  baseColor: { r: 0.8, g: 0.62, b: 0.52, a: null, hex: null },
  metallic: 0,
  roughness: 0.55,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
};
