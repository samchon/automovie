
import type { IAutoMovieHumanBodyToeRay } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyToeRay";
import type { AutoMovieHumanBodyToeBone } from "@automovie/human/body/structures/rig/AutoMovieHumanBodyToeBone";

import { HUMAN_SOURCE_TOE_BONES } from "./HUMAN_SOURCE_TOE_BONES.ts";
import { readHumanSourceWorkBytes } from "./readHumanSourceWorkBytes.ts";
import type { IHumanSourceGenerationInput } from "./structures/IHumanSourceGenerationInput.ts";
import type { IHumanSourceRigBone } from "./structures/IHumanSourceRigBone.ts";

/**
 * The per-ray toe bones of the body basis, read from the pinned MPFB default
 * rig (`rigs/standard/rig.default.json`, CC0). Each phalanx keeps its head
 * and tail joint cubes as landmark ids, its upstream bone name and its roll,
 * converted from the rig's radians to degrees. A proximal phalanx hangs from
 * the humanoid toes bone of its side and every other from the phalanx before
 * it in the ray; the list is ordered so a parent precedes its child. A bone
 * missing from the rig, or a parent the rig names otherwise, refuses.
 */
export function defineHumanSourceToeRays(work: string, inputs: IHumanSourceGenerationInput[]): IAutoMovieHumanBodyToeRay[] {
  const rig = JSON.parse(readHumanSourceWorkBytes(inputs, work, "upstream/mpfb2/src/mpfb/data/rigs/standard/rig.default.json", "native toe rig").toString("utf8")) as Record<string, IHumanSourceRigBone>;
  const rays: IAutoMovieHumanBodyToeRay[] = [];
  for (const [suffix, side] of [
    [".L", "left"],
    [".R", "right"],
  ] as const) {
    for (const [source, leftName] of HUMAN_SOURCE_TOE_BONES) {
      const name = (side === "left" ? leftName : leftName.replace(/^left/, "right")) as AutoMovieHumanBodyToeBone;
      const bone = rig[source + suffix];
      if (bone === undefined) throw new Error(`The default rig has no toe bone ${source + suffix}.`);
      const phalanx = Number(source.split("-")[1]);
      const ray = source.split("-")[0];
      const expectedParent = phalanx === 1 ? `foot${suffix}` : `${ray}-${phalanx - 1}${suffix}`;
      if (bone.parent !== expectedParent) throw new Error(`Toe bone ${source + suffix} hangs from ${bone.parent}, not ${expectedParent}.`);
      const { roll } = bone;
      const head = bone.head.cube_name;
      const tail = bone.tail.cube_name;
      if (roll === undefined || head === undefined || tail === undefined)
        throw new Error(`Toe bone ${source + suffix} lacks a roll or a joint-cube head or tail.`);
      const previous = rays[rays.length - 1];
      rays.push({
        bone: name,
        parent: phalanx === 1 ? (side === "left" ? "leftToes" : "rightToes") : previous.bone,
        head,
        tail,
        source: source + suffix,
        roll: (roll * 180) / Math.PI,
      });
    }
  }
  return rays;
}
