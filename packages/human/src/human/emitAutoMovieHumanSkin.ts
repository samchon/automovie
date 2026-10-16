import {
  AutoMovieHumanoidBone,
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { meshAutoMovieHumanCage } from "../junction/meshAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_SKIN_MATERIAL } from "./AUTOMOVIE_HUMAN_SKIN_MATERIAL";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { joinAutoMovieHumanCages } from "./joinAutoMovieHumanCages";
import { reliefAutoMovieHumanSkin } from "./reliefAutoMovieHumanSkin";

/**
 * Emit the person's skin as one skinned mesh: the joined cage subdivided once by the engine, with limit positions and normals, UVs from the published layout and placeholder skin weights.
 *
 * The weights bind each vertex to the bones of the part it lies on, by inverse fourth power of its distance to each bone's segment, the four nearest kept and normalized. They only let the joined skin follow a pose until the rig stage derives real weights.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param levels Subdivision levels
 * @param generators The generator of each part
 * @returns The skin part, id `skin`
 */
export function emitAutoMovieHumanSkin(measurements: IAutoMovieHumanMeasurements, skeleton: IAutoMovieHumanSkeleton, levels: number, generators: IAutoMovieHumanPartGenerators, prepared?: { cage: IAutoMovieHumanCage; output: meshAutoMovieHumanCage.IOutput }): IAutoMovieModelPart {
  const cage: IAutoMovieHumanCage = prepared?.cage ?? joinAutoMovieHumanCages(
    measurements,
    skeleton,
    generators,
  );
  const output: meshAutoMovieHumanCage.IOutput = prepared?.output ?? meshAutoMovieHumanCage({
    cage,
    levels,
    domain: "skin",
    relief: reliefAutoMovieHumanSkin(measurements, skeleton, generators),
  });
  const mesh: IAutoMovieMesh = output.mesh;
  const joints: AutoMovieHumanoidBone[] = [];
  const jointIndex: Map<AutoMovieHumanoidBone, number> = new Map();
  const segments: Map<AutoMovieHumanoidBone, IAutoMovieHumanSkeleton.IJoint> =
    new Map(skeleton.joints.map((j: IAutoMovieHumanSkeleton.IJoint): [AutoMovieHumanoidBone, IAutoMovieHumanSkeleton.IJoint] => [j.bone, j]));
  const boneIndices: number[] = [];
  const weights: number[] = [];
  const cache: Map<number, Array<[number, number]>> = new Map();
  output.vertices.forEach((v: number): void => {
    let influences: Array<[number, number]> | undefined = cache.get(v);
    if (influences === undefined) {
      const face: IAutoMovieHumanCage.IFace =
        cage.faces[output.surface.parameters[v]!.face]!;
      const { part, side }: IAutoMovieHumanCage.IFace["coordinates"][number] = face.coordinates[0];
      const p: IAutoMovieVector3 = {
        x: output.surface.limitPositions[3 * v]! * 1000,
        y: output.surface.limitPositions[3 * v + 1]! * 1000,
        z: output.surface.limitPositions[3 * v + 2]! * 1000,
      };
      const ranked: Array<[AutoMovieHumanoidBone, number]> = candidates(part, side)
        .map((bone: AutoMovieHumanoidBone): [AutoMovieHumanoidBone, number] => {
          const d: number = distance(p, segments.get(bone)!);
          return [bone, 1 / Math.pow(d * d + 1, 2)];
        })
        .sort((a: [AutoMovieHumanoidBone, number], b: [AutoMovieHumanoidBone, number]): number => b[1] - a[1])
        .slice(0, 4);
      const total: number = ranked.reduce((s: number, [, w]: [AutoMovieHumanoidBone, number]): number => s + w, 0);
      influences = ranked.map(([bone, w]: [AutoMovieHumanoidBone, number]): [number, number] => {
        let index: number | undefined = jointIndex.get(bone);
        if (index === undefined) {
          index = joints.length;
          joints.push(bone);
          jointIndex.set(bone, index);
        }
        return [index, w / total];
      });
      while (influences.length < 4) influences.push([0, 0]);
      cache.set(v, influences);
    }
    for (const [index, w] of influences) {
      boneIndices.push(index);
      weights.push(w);
    }
  });
  return {
    id: "skin",
    name: "skin",
    geometry: {
      type: "mesh",
      mesh: { ...mesh, skin: { joints, boneIndices, weights } },
    },
    material: AUTOMOVIE_HUMAN_SKIN_MATERIAL.id,
    attachedBone: null,
    transform: null,
  };
}

/** Bones a vertex of a part may follow under the placeholder weights. */
function candidates(part: AutoMovieHumanPart, side: AutoMovieHumanSide | null): AutoMovieHumanoidBone[] {
  function s(name: string): AutoMovieHumanoidBone { return `${side}${name}` as AutoMovieHumanoidBone; }
  switch (part) {
    case "trunk":
      return [
        "hips",
        "spine",
        "chest",
        "upperChest",
        "neck",
        "leftShoulder",
        "rightShoulder",
        "leftUpperArm",
        "rightUpperArm",
        "leftUpperLeg",
        "rightUpperLeg",
      ];
    case "neck":
      return ["upperChest", "neck", "head"];
    case "head":
    case "ear":
      return ["neck", "head"];
    case "arm":
      return [s("UpperArm"), s("LowerArm"), s("Hand")];
    case "hand":
      return [
        s("LowerArm"),
        s("Hand"),
        ...["Thumb", "Index", "Middle", "Ring", "Little"].flatMap(
          (digit: string): AutoMovieHumanoidBone[] =>
            (digit === "Thumb"
              ? ["Metacarpal", "Proximal", "Distal"]
              : ["Proximal", "Intermediate", "Distal"]
            ).map(
              (phalanx: string): AutoMovieHumanoidBone =>
                s(`${digit}${phalanx}`),
            ),
        ),
      ];
    case "leg":
      return [s("UpperLeg"), s("LowerLeg"), s("Foot")];
    case "foot":
      return [s("LowerLeg"), s("Foot"), s("Toes")];
  }
}

/** Distance from a point to a bone's segment from its joint centre to its tail, millimetres. */
function distance(p: IAutoMovieVector3, joint: IAutoMovieHumanSkeleton.IJoint): number {
  const a: IAutoMovieVector3 = joint.position;
  const d: IAutoMovieVector3 = {
    x: joint.tail.x - a.x,
    y: joint.tail.y - a.y,
    z: joint.tail.z - a.z,
  };
  const length2: number = d.x * d.x + d.y * d.y + d.z * d.z;
  const t: number =
    length2 === 0
      ? 0
      : Math.min(
          1,
          Math.max(
            0,
            ((p.x - a.x) * d.x + (p.y - a.y) * d.y + (p.z - a.z) * d.z) /
              length2,
          ),
        );
  return Math.hypot(
    p.x - a.x - d.x * t,
    p.y - a.y - d.y * t,
    p.z - a.z - d.z * t,
  );
}
