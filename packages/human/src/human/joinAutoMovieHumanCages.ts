import { AutoMovieHumanJunction } from "../junction/AutoMovieHumanJunction";
import { AutoMovieHumanJunctionSite } from "../junction/AutoMovieHumanJunctionSite";
import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanJunction } from "../junction/IAutoMovieHumanJunction";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { generateAutoMovieHumanCages } from "./generateAutoMovieHumanCages";

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

/**
 * Join every part's cage into the person's one closed cage.
 *
 * Joins run outward from the trunk, so the proximal cage of each join is everything joined so far: the neck at its base, the head on the neck, the ears on the head, then per side the arm, the hand, the leg and the foot. The junction welds each site's two rings; it refuses a pair that is not on the shared boundary, and every refusal is collected and thrown together, so one call names every site whose parts disagree. Nothing is moved to close a gap.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param generators The generator of each part
 * @param junction The junction that joins two rings
 * @returns The joined cage, with no ring left open
 * @throws {Error} When any site's rings do not join, listing every such site
 */
export function joinAutoMovieHumanCages(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  generators: IAutoMovieHumanPartGenerators,
  junction: IAutoMovieHumanJunction = new AutoMovieHumanJunction(),
  prepared?: ReturnType<typeof generateAutoMovieHumanCages>,
): IAutoMovieHumanCage {
  const cages: ReturnType<typeof generateAutoMovieHumanCages> =
    prepared ?? generateAutoMovieHumanCages(measurements, skeleton, generators);
  function cage(
    part: AutoMovieHumanPart,
    side: AutoMovieHumanSide | null,
  ): IAutoMovieHumanCage {
    return cages.find(
      (c: ReturnType<typeof generateAutoMovieHumanCages>[number]): boolean =>
        c.part === part && c.side === side,
    )!.cage;
  }
  const refused: string[] = [];
  let joined: IAutoMovieHumanCage = cage("trunk", null);
  for (const [site, side, part] of JOINS) {
    const distal: IAutoMovieHumanCage = cage(part, side);
    try {
      joined = junction.join({ site, side, proximal: joined, distal });
    } catch (cause) {
      refused.push(cause instanceof Error ? cause.message : String(cause));
      // keep the refused part beside the rest so the sites beyond it are still checked
      joined = beside(joined, distal);
    }
  }
  if (refused.length !== 0)
    throw new Error(
      [
        `the skin does not close at ${refused.length} junctions:`,
        ...refused,
      ].join("; "),
    );
  if (joined.rings.length !== 0)
    throw new Error(
      `joined skin leaves rings open: ${joined.rings.map((r: IAutoMovieHumanCage["rings"][number]): string => `${r.side ?? ""} ${r.site}`.trim()).join(", ")}`,
    );
  return joined;
}

/** Two cages as one without any shared vertex. */
function beside(
  a: IAutoMovieHumanCage,
  b: IAutoMovieHumanCage,
): IAutoMovieHumanCage {
  const n: number = a.vertices.length;
  function shift(v: number): number {
    return v + n;
  }
  return {
    vertices: [...a.vertices, ...b.vertices],
    faces: [
      ...a.faces,
      ...b.faces.map(
        (f: IAutoMovieHumanCage.IFace): IAutoMovieHumanCage.IFace => ({
          fitting: f.fitting,
          skin: f.skin,
          vertices: f.vertices.map(
            shift,
          ) as IAutoMovieHumanCage.IFace["vertices"],
          coordinates: f.coordinates,
          ...(f.uvs === undefined ? {} : { uvs: f.uvs }),
        }),
      ),
    ],
    creases: [
      ...a.creases,
      ...b.creases.map(
        (c: IAutoMovieHumanCage.ICrease): IAutoMovieHumanCage.ICrease => ({
          edge: [shift(c.edge[0]), shift(c.edge[1])],
          sharpness: c.sharpness,
        }),
      ),
    ],
    rings: [
      ...a.rings,
      ...b.rings.map(
        (
          r: IAutoMovieHumanCage["rings"][number],
        ): IAutoMovieHumanCage["rings"][number] => ({
          ...r,
          vertices: r.vertices.map(shift),
        }),
      ),
    ],
  };
}
