import {
  AutoMovieHumanoidBone,
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanJunction } from "../junction/AutoMovieHumanJunction";
import { AutoMovieHumanJunctionSite } from "../junction/AutoMovieHumanJunctionSite";
import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanJunction } from "../junction/IAutoMovieHumanJunction";
import { meshAutoMovieHumanCage } from "../junction/meshAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import {
  AUTOMOVIE_HUMAN_SKIN_MATERIAL,
  generateAutoMovieHumanCages,
} from "./emitAutoMovieHumanSkinParts";

/**
 * Join every part's cage into the person's one closed cage.
 *
 * Joins run outward from the trunk, so the proximal cage of each join is everything joined so far: the neck at its base, the head on the neck, the ears on the head, then per side the arm, the hand, the leg and the foot. The junction welds each site's two rings; when every site is joined no ring is left open.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param junction The junction that joins two rings
 * @returns The joined cage
 * @throws {Error} When a part opens a ring the joins leave open
 */
export const joinAutoMovieHumanCages = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  junction: IAutoMovieHumanJunction = new AutoMovieHumanJunction(),
): IAutoMovieHumanCage => {
  const cages = generateAutoMovieHumanCages(measurements, skeleton);
  const cage = (
    part: AutoMovieHumanPart,
    side: AutoMovieHumanSide | null,
  ): IAutoMovieHumanCage =>
    cages.find((c) => c.part === part && c.side === side)!.cage;
  let joined: IAutoMovieHumanCage = cage("trunk", null);
  for (const [site, side, part] of JOINS)
    joined = junction.join({
      site,
      side,
      proximal: joined,
      distal: cage(part, side),
    });
  if (joined.rings.length !== 0)
    throw new Error(
      `joined skin leaves rings open: ${joined.rings.map((r) => `${r.side ?? ""} ${r.site}`.trim()).join(", ")}`,
    );
  return joined;
};

/**
 * Emit the person's skin as one skinned mesh: the joined cage subdivided once by the engine, with limit positions and normals, UVs from the published layout and placeholder skin weights.
 *
 * The weights bind each vertex to the bones of the part it lies on, by inverse fourth power of its distance to each bone's segment, the four nearest kept and normalized. They only let the joined skin follow a pose until the rig stage derives real weights.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param levels Subdivision levels
 * @returns The skin part, id `skin`
 */
export const emitAutoMovieHumanSkin = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  levels: number,
): IAutoMovieModelPart => {
  const cage: IAutoMovieHumanCage = joinAutoMovieHumanCages(
    measurements,
    skeleton,
  );
  const output: meshAutoMovieHumanCage.IOutput = meshAutoMovieHumanCage({
    cage,
    levels,
    domain: "skin",
  });
  const mesh: IAutoMovieMesh = output.mesh;
  const joints: AutoMovieHumanoidBone[] = [];
  const jointIndex: Map<AutoMovieHumanoidBone, number> = new Map();
  const segments: Map<AutoMovieHumanoidBone, IAutoMovieHumanSkeleton.IJoint> =
    new Map(skeleton.joints.map((j) => [j.bone, j]));
  const boneIndices: number[] = [];
  const weights: number[] = [];
  const cache: Map<number, Array<[number, number]>> = new Map();
  output.vertices.forEach((v: number): void => {
    let influences: Array<[number, number]> | undefined = cache.get(v);
    if (influences === undefined) {
      const face: IAutoMovieHumanCage.IFace =
        cage.faces[output.surface.parameters[v]!.face]!;
      const { part, side } = face.coordinates[0];
      const p: IAutoMovieVector3 = {
        x: output.surface.limitPositions[3 * v]! * 1000,
        y: output.surface.limitPositions[3 * v + 1]! * 1000,
        z: output.surface.limitPositions[3 * v + 2]! * 1000,
      };
      const ranked = candidates(part, side)
        .map((bone: AutoMovieHumanoidBone): [AutoMovieHumanoidBone, number] => {
          const d: number = distance(p, segments.get(bone)!);
          return [bone, 1 / Math.pow(d * d + 1, 2)];
        })
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const total: number = ranked.reduce((s, [, w]) => s + w, 0);
      influences = ranked.map(([bone, w]): [number, number] => {
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
};

/** The joins in order: site, side and the distal part joined there. */
const JOINS: Array<
  [AutoMovieHumanJunctionSite, AutoMovieHumanSide | null, AutoMovieHumanPart]
> = [
  ["neckBase", null, "neck"],
  ["neckTop", null, "head"],
  ["ear", "left", "ear"],
  ["ear", "right", "ear"],
  ["upperArm", "left", "arm"],
  ["upperArm", "right", "arm"],
  ["wrist", "left", "hand"],
  ["wrist", "right", "hand"],
  ["thigh", "left", "leg"],
  ["thigh", "right", "leg"],
  ["ankle", "left", "foot"],
  ["ankle", "right", "foot"],
];

/** Bones a vertex of a part may follow under the placeholder weights. */
const candidates = (
  part: AutoMovieHumanPart,
  side: AutoMovieHumanSide | null,
): AutoMovieHumanoidBone[] => {
  const s = (name: string): AutoMovieHumanoidBone =>
    `${side}${name}` as AutoMovieHumanoidBone;
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
      return [s("LowerArm"), s("Hand")];
    case "leg":
      return [s("UpperLeg"), s("LowerLeg"), s("Foot")];
    case "foot":
      return [s("LowerLeg"), s("Foot"), s("Toes")];
  }
};

/** Distance from a point to a bone's segment from its joint centre to its tail, millimetres. */
const distance = (
  p: IAutoMovieVector3,
  joint: IAutoMovieHumanSkeleton.IJoint,
): number => {
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
};
