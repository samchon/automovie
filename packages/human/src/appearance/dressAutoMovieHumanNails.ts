import { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { pigmentAutoMovieHumanSkin } from "./pigmentAutoMovieHumanSkin";

/**
 * Colour the finger and toe nail plates: the nail bed seen through the plate, with a pale free edge, under a glossy keratin surface.
 *
 * The plate is thin translucent keratin, so most of the nail shows the bed beneath it: a pink of the person's own pigmentation with little melanin and much blood, a fifth of the skin's melanin and six times its haemoglobin through {@link pigmentAutoMovieHumanSkin}. Past the hyponychium the plate leaves the bed and the free edge scatters white, so plate vertices within 1.5 mm of the plate's distal end along its bone turn to an off-white (conventional, adult size; scaled for a child by the plate's own length). The surface is a smooth dielectric with a clear coat, the gloss of a healthy plate. No measured nail colour was read; the factors are conventional.
 *
 * Nail parts are recognised by their id, `<hand|foot>.<side>.nail.<digit>`, and ride their digit's bone, so a vertex's distance along the bone is its position in the part's bone frame dotted with the bone's direction.
 *
 * @param props.parts The attachment parts; nail parts gain vertex colours and the nail material
 * @param props.measurements Resolved measurements, for the pigmentation
 * @param props.skeleton The skeleton at rest, for the bones' directions
 * @returns The parts and the nail material
 */
export function dressAutoMovieHumanNails(props: {
  parts: readonly IAutoMovieModelPart[];
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
}): { parts: IAutoMovieModelPart[]; material: IAutoMovieMaterial } {
  const p = props.measurements.identity.pigmentation;
  const bed = pigmentAutoMovieHumanSkin({
    melanin: 0.2 * p.melanin,
    eumelaninShare: p.eumelaninShare,
    haemoglobin: Math.min(0.32, 6 * p.haemoglobin),
  });
  const edge: number[] = [0.86, 0.84, 0.8];
  const parts: IAutoMovieModelPart[] = props.parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (
        !/\.nail\./.test(part.id) ||
        part.geometry.type !== "mesh" ||
        part.attachedBone === null
      )
        return part;
      const joint: IAutoMovieHumanSkeleton.IJoint | undefined =
        props.skeleton.joints.find(
          (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
            j.bone === part.attachedBone,
        );
      if (joint === undefined) return part;
      const axis: number[] = [
        joint.tail.x - joint.position.x,
        joint.tail.y - joint.position.y,
        joint.tail.z - joint.position.z,
      ];
      const length: number = Math.hypot(axis[0]!, axis[1]!, axis[2]!);
      const d: number[] = axis.map((c: number): number => c / length);
      const positions: number[] = part.geometry.mesh.positions;
      const along: number[] = [];
      for (let i: number = 0; i < positions.length; i += 3)
        along.push(
          1000 *
            (positions[i]! * d[0]! +
              positions[i + 1]! * d[1]! +
              positions[i + 2]! * d[2]!),
        );
      const far: number = Math.max(...along);
      const near: number = Math.min(...along);
      const band: number = Math.min(1.5, 0.15 * (far - near));
      const colors: number[] = [];
      for (const t of along) {
        const w: number = Math.min(
          1,
          Math.max(0, (t - (far - band)) / (0.5 * band)),
        );
        colors.push(
          bed.r + w * (edge[0]! - bed.r),
          bed.g + w * (edge[1]! - bed.g),
          bed.b + w * (edge[2]! - bed.b),
        );
      }
      return {
        ...part,
        material: MATERIAL.id,
        geometry: { type: "mesh", mesh: { ...part.geometry.mesh, colors } },
      };
    },
  );
  return { parts, material: MATERIAL };
}

/** The nail plate's surface over the per-vertex bed colour. */
const MATERIAL: IAutoMovieMaterial = {
  id: "nail.plate",
  name: "nail plate",
  baseColor: { r: 1, g: 1, b: 1, a: null, hex: null },
  metallic: 0,
  roughness: 0.3,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
  ior: 1.55,
  clearcoat: 0.6,
  subsurfaceRadius: { r: 0.0006, g: 0.0003, b: 0.0002 },
};
