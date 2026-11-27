import { Vector3, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieBuildWall,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";

/*
 * Form the side, back and slotted front walls of an upright lift shaft.
 * Openings are measured in the front wall's own metre plane. The side walls run
 * between the front and rear plates without entering the cab clearance.
 */
export function liftShaftParts(
  props: liftShaftParts.IProps,
): IAutoMovieModelPart[] {
  const { thickness, width, height, openings, centerY, front, back, material } =
    props;
  return [
    {
      id: "front",
      name: null,
      geometry: {
        type: "mesh",
        mesh: AutoMovieEngineGeometry.buildWall({ width, height, depth: thickness, openings }),
      },
      material,
      attachedBone: null,
      transform: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, centerY, front - thickness / 2),
      ),
    },
    liftShaftParts.box(
      "back",
      material,
      width,
      height,
      thickness,
      Vector3.create(0, centerY, back + thickness / 2),
    ),
    ...[-1, 1].map(
      (side: number): IAutoMovieModelPart =>
        liftShaftParts.box(
          `side-${side}`,
          material,
          thickness,
          height,
          front - back - 2 * thickness,
          Vector3.create(
            (side * (width - thickness)) / 2,
            centerY,
            (front + back) / 2,
          ),
        ),
    ),
  ];
}

/*
 * Shaft inputs and its shared rigid box producer.
 */
export namespace liftShaftParts {
  /*
   * The local bounds and cut data of a shaft, all in metres. The four walls
   * share a rectangular plan and one wall thickness. Each door cut uses the
   * wall kernel's face-opening coordinates.
   */
  export interface IProps extends Omit<IAutoMovieBuildWall.IProps, "depth"> {
    /*
     * Thickness of each sheet, along its local normal.
     */
    thickness: number;

    /*
     * Common centre elevation in shaft-local metres.
     */
    centerY: number;

    /*
     * Forward outer face of the shaft, local +Z.
     */
    front: number;

    /*
     * Rear outer face of the shaft, local −Z.
     */
    back: number;

    /*
     * Model-local material id shared by the shaft parts.
     */
    material: string | null;
  }

  /*
   * Build an unrotated box from its centre and dimensions in lift-local metres.
   */
  export function box(
    id: string,
    material: string | null,
    width: number,
    height: number,
    depth: number,
    center: IAutoMovieVector3,
  ): IAutoMovieModelPart {
    return {
      id,
      name: null,
      material,
      attachedBone: null,
      transform: AutoMovieArchetypeFrame.upright(center),
      geometry: {
        type: "primitive",
        shape: { type: "box", width, height, depth },
      },
    };
  }
}
