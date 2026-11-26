import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";

/**
 * Make a coarse single-seat amusement ride car with a level side threshold.
 *
 * The origin is at track height. The car faces +Z, its threshold is on +X and
 * its seat faces +Z. The body is a visual proxy with no physics or restraint
 * metadata. A production can substitute another admitted rigid carriage while
 * leaving the course unchanged.
 *
 * @param id Model identity, defaulting to coaster-car.
 * @returns A generated model with seat and boarding affordances.
 */
export function createCoasterCar(id: string = "coaster-car"): IAutoMovieModel {
  const part = (
    name: string,
    material: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
  ): IAutoMovieModelPart => ({
    id: name,
    name: null,
    attachedBone: null,
    material,
    geometry: {
      type: "primitive",
      shape: { type: "box", width, height, depth },
    },
    transform: AutoMovieArchetypeFrame.upright({ x, y, z }),
  });

  /** The boarding and seating heights are the tops of the floor and cushion. */
  const floor: number = 0.38;
  const seat: number = floor + 0.43;
  return {
    id,
    name: "Scenic coaster car",
    origin: "generated",
    asset: null,
    skeleton: null,
    body: null,
    materials: [
      {
        id: "shell",
        name: "Red shell",
        baseColor: AutoMovieEngineMath.srgbHexToLinearColor("#a52026"),
        metallic: 0.2,
        roughness: 0.45,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
      },
      {
        id: "upholstery",
        name: "Charcoal upholstery",
        baseColor: AutoMovieEngineMath.srgbHexToLinearColor("#393b43"),
        metallic: 0,
        roughness: 0.87,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
      },
    ],
    parts: [
      part("base", "shell", 0, 0.16, 0, 1.16, 0.26, 1.58),
      part("floor", "upholstery", 0, floor - 0.055, 0, 1.16, 0.11, 1.58),
      part("seat", "upholstery", -0.04, seat - 0.065, -0.2, 0.58, 0.13, 0.45),
      part("back", "upholstery", -0.04, seat + 0.19, -0.46, 0.58, 0.51, 0.13),
      part("front", "shell", 0, 0.52, 0.69, 1.16, 0.28, 0.2),
    ],
    affordances: [
      {
        id: "seat",
        kind: "seat",
        extent: null,
        frame: AutoMovieArchetypeFrame.upright({ x: -0.04, y: seat, z: 0.025 }),
        width: 0.58,
        depth: 0.45,
        back: 0.445,
      },
      {
        id: "boarding",
        kind: "surface",
        extent: null,
        frame: AutoMovieArchetypeFrame.upright({ x: 0.48, y: floor, z: 0.16 }),
        width: 0.2,
        depth: 0.8,
      },
    ],
  };
}
