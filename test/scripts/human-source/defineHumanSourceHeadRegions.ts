import { addressHumanSourceRegion } from "./addressHumanSourceRegion.ts";
import { assertHumanSourceMirroredFill } from "./assertHumanSourceMirroredFill.ts";
import { fillHumanSourceReadRegion } from "./fillHumanSourceReadRegion.ts";
import { HUMAN_SOURCE_READ_REGIONS } from "./HUMAN_SOURCE_READ_REGIONS.ts";
import { mirrorHumanSourceReadRegion } from "./mirrorHumanSourceReadRegion.ts";
import type { IHumanSourceHeadRegionInput } from "./structures/IHumanSourceHeadRegionInput.ts";
import type { IHumanSourceHeadRegions } from "./structures/IHumanSourceHeadRegions.ts";
import type { IHumanSourceReadRegion } from "./structures/IHumanSourceReadRegion.ts";

const EAR_RULE =
  "base faces reached from the seed without crossing the read attachment loop, proved not to reach the outside vertex; region vertices are those faces' corners less the loop (the loop is scalp), and a subdivided sample belongs when every base face it lies on is on the ear side";

/**
 * Determine the head view's skin regions: the right ear from its frame-read
 * attachment loop (`HUMAN_SOURCE_READ_REGIONS`) and the left ear from the
 * mirrored reading, which must fill exactly the mirror twins of the right.
 * Each region gets its record: the loop, that it closed, the seed and outside
 * vertex, and its base and head view vertex counts.
 */
export function defineHumanSourceHeadRegions(input: IHumanSourceHeadRegionInput): IHumanSourceHeadRegions {
  const { faces, mirror, sampleFaces, faceToG1 } = input;
  const rightRead = HUMAN_SOURCE_READ_REGIONS["ear-right"];
  const leftRead = mirrorHumanSourceReadRegion(mirror, rightRead);
  const right = fillHumanSourceReadRegion("ear-right", faces, rightRead);
  const left = fillHumanSourceReadRegion("ear-left", faces, leftRead);
  assertHumanSourceMirroredFill("ear-left", mirror, right, left);
  const skinRegions: IHumanSourceHeadRegions["skinRegions"] = {};
  const records: IHumanSourceHeadRegions["records"] = [];
  const sides: [string, IHumanSourceReadRegion, ReturnType<typeof fillHumanSourceReadRegion>][] = [
    ["ear-right", rightRead, right],
    ["ear-left", leftRead, left],
  ];
  for (const [name, read, fill] of sides) {
    const vertices = addressHumanSourceRegion(name, fill, sampleFaces, faceToG1);
    skinRegions[name] = { surface: 0, vertices };
    records.push({
      name,
      definition: `The ${name === "ear-right" ? "right" : "left"} external ear, bounded by its attachment to the head.`,
      status: "definition, read from renders",
      rule: EAR_RULE,
      loop: read.loop,
      closed: true,
      seed: read.seed,
      outside: read.outside,
      baseVertices: fill.vertices.length,
      viewVertices: vertices.length,
      frames: read.frames,
    });
  }
  return { skinRegions, records };
}
