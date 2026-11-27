import { Quaternion } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import { type AutoMovieArchetype } from "../../core";
import { EquineFordConstants } from "./EquineFordConstants";

/*
 * Read the articulated bar a ford clearance calculation uses.
 */
export namespace EquineFordBarReads {
  /*
   * A part of a model.
   */
  export function part(
    model: Pick<AutoMovieArchetype, "parts">,
    id: string,
  ): IAutoMovieModelPart {
    const found: IAutoMovieModelPart | undefined = model.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (found?.transform === undefined || found.transform === null)
      throw new RangeError(`The crossing needs the transformed ${id} part`);
    return found;
  }

  /*
   * The highest surface of a bar, metres in its model.
   */
  export function top(bar: IAutoMovieModelPart): number {
    const solid: EquineFordConstants.IBar = shape(bar);
    const up: number = Quaternion.rotateVectorY(
      bar.transform!.rotation,
      EquineFordConstants.UP,
    );
    const radial: number = solid.capsule
      ? solid.radius
      : solid.radius * Math.sqrt(Math.max(0, 1 - up * up));
    return (
      bar.transform!.translation.y + (Math.abs(up) * solid.height) / 2 + radial
    );
  }

  /*
   * A bar's cylinder or capsule.
   */
  export function shape(bar: IAutoMovieModelPart): EquineFordConstants.IBar {
    const geometry: IAutoMovieModelPart["geometry"] = bar.geometry;
    if (
      geometry.type !== "primitive" ||
      (geometry.shape.type !== "capsule" && geometry.shape.type !== "cylinder")
    )
      throw new RangeError(`The crossing needs the actual ${bar.id} bar`);
    return {
      capsule: geometry.shape.type === "capsule",
      radius: geometry.shape.radius,
      height: geometry.shape.height,
    };
  }
}
