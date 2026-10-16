import {
  IAutoMovieMeshRayCaster,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { networkAutoMovieHumanFoot } from "./networkAutoMovieHumanFoot";
import { placeAutoMovieHumanFootNails } from "./placeAutoMovieHumanFootNails";
import { readAutoMovieHumanFoot } from "./readAutoMovieHumanFoot";
import { sweepAutoMovieHumanToe } from "./sweepAutoMovieHumanToe";

/**
 * Foot from the ankle ring, with the malleoli, the heel, the arches, the ball and the five toes, lofted as one surface network of fixed connectivity.
 *
 * `planAutoMovieHumanFoot` turns foot length and breadth, lateral malleolus height, navicular height and the skeleton's malleoli into an outline, a dorsal crest and toes; `networkAutoMovieHumanFoot` lofts one sweep along the foot from the ankle ring and sweeps each toe from its end between web curves; the engine samples it so the cage's limit surface passes through the sweep at every vertex, with the ankle ring pinned to the shared shape the leg opens and the collar beside it to that ring carried into the foot.
 *
 * Both feet are lofted in one local frame, the left foot's, and the right foot is its mirror image: every face's corners are reversed after the first and the chart's turns mirrored, so faces still wind outward and `v` still runs counterclockwise about the distal axis.
 *
 * Chart: `u` from 0 at the ankle ring along the foot to 0.85 at the toes' roots and on along each toe to 1 at its tip, `v` counterclockwise about the distal axis from the anterior mark; a toe holds a narrow band of `v` about its column.
 *
 * Rings, in order: `ankle`. Attachments, in order: the toenails `nail.hallux`, `nail.second`, `nail.third`, `nail.fourth` and `nail.fifth`, each riding the foot's toes bone, the one bone every toe shares, and placed on the final emitted skin after joined fitting and relief (see `placeAutoMovieHumanFootNails`).
 *
 * @author Samchon
 */
export class AutoMovieHumanFootGenerator implements IAutoMovieHumanPartGenerator<"foot"> {
  /** The foot part. */
  public readonly part: "foot" = "foot" as const;

  /**
   * Generate one foot's cage.
   *
   * @param props Measurements, skeleton and side
   * @returns The foot's cage in the model frame and millimetres, opening the ankle ring on the junction's shared shape
   */
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"foot">,
  ): IAutoMovieHumanCage {
    const foot: IFoot = build(props);
    const { side, sampled, toModel, layout }: IFoot = foot;
    const positions: IAutoMovieVector3[] = [];
    for (let k: number = 0; k < sampled.cage.positions.length; k += 3)
      positions.push(
        toModel(
          V.of(
            sampled.cage.positions[k]! * 1000,
            sampled.cage.positions[k + 1]! * 1000,
            sampled.cage.positions[k + 2]! * 1000,
          ),
        ),
      );
    // the ring sits exactly on the junction's shared shape
    const ring: number[] = sampled.rings.ankle!;
    ring.forEach((vertex: number, j: number): void => {
      positions[vertex] = layout.positions[j]!;
    });
    const order: number[] = side === "left" ? [0, 1, 2, 3] : [0, 3, 2, 1];
    return {
      vertices: positions.map(
        (
          position: IAutoMovieVector3,
          i: number,
        ): IAutoMovieHumanCage.IVertex => {
          const sample: IAutoMovieVector3 = toModel(
            V.of(
              sampled.targets[3 * i]! * 1000,
              sampled.targets[3 * i + 1]! * 1000,
              sampled.targets[3 * i + 2]! * 1000,
            ),
          );
          return {
            position,
            fitting: {
              sample,
              target: sampled.limitTargetMask[i] ? { ...sample } : null,
              anchor: sampled.pinned[i]!,
            },
          };
        },
      ),
      faces: sampled.cage.faces.map(
        (face: number[], f: number): IAutoMovieHumanCage.IFace => {
          const raw: networkAutoMovieHumanFoot.IPoint[] = sampled.corners[
            f
          ]!.map(
            (
              c: IAutoMovieSurfaceCoordinate,
            ): networkAutoMovieHumanFoot.IPoint =>
              foot.addresses[c.patch]!(c.s, c.t),
          );
          const vs: number[] = raw.map(
            (c: networkAutoMovieHumanFoot.IPoint): number =>
              side === "left" ? c.v : (1 - c.v) % 1,
          );
          const wrap: boolean = Math.max(...vs) - Math.min(...vs) > 0.5;
          return {
            fitting: `foot.${side}`,
            vertices: order.map(
              (k: number): number => face[k]!,
            ) as IAutoMovieHumanCage.IFace["vertices"],
            coordinates: order.map(
              (k: number): IAutoMovieHumanSurfaceCoordinate => ({
                part: "foot",
                side,
                u: raw[k]!.u,
                v: wrap && vs[k]! < 0.5 ? vs[k]! + 1 : vs[k]!,
              }),
            ) as IAutoMovieHumanCage.IFace["coordinates"],
          };
        },
      ),
      creases: [],
      rings: [
        {
          site: "ankle",
          side,
          vertices: ring,
          start: layout.start,
          frame: layout.frame,
        },
      ],
      construction: foot.construction,
    };
  }

  /**
   * Generate the foot's toenail plates.
   *
   * @param props Measurements, skeleton, side and final emitted rest skin
   * @returns The five nail plates, hallux first, each riding the toes bone
   */
  public attachments(
    props: IAutoMovieHumanPartGenerator.IAttachmentProps<"foot">,
  ): IAutoMovieHumanPartGenerator.IAttachment[] {
    const foot: readAutoMovieHumanFoot.IOutput = readAutoMovieHumanFoot(props);
    const { side, plan, toModel }: readAutoMovieHumanFoot.IOutput = foot;
    const host: IAutoMovieModelPart | undefined = props.skin.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === "skin" || part.id === `skin.foot.${side}`,
    );
    if (host === undefined || host.geometry.type !== "mesh")
      throw new Error("Foot nail placement needs its emitted skin mesh");
    const caster: IAutoMovieMeshRayCaster = props.skinRayCaster(
      host.geometry.mesh,
    );
    const axes: networkAutoMovieHumanFoot.IAxis[] = plan.toes.map(
      (toe: IAutoMovieHumanFootPlan.IToe): networkAutoMovieHumanFoot.IAxis => {
        const { fractions, centres }: sweepAutoMovieHumanToe.IOutput =
          sweepAutoMovieHumanToe({ plan, toe });
        return { fractions, centres };
      },
    );
    const plates: ReturnType<typeof placeAutoMovieHumanFootNails> =
      placeAutoMovieHumanFootNails({
        plan,
        axes,
        skin: {
          project: (
            origin: IAutoMovieVector3,
            ray: IAutoMovieVector3,
          ): number | null => {
            const start: IAutoMovieVector3 = toModel(origin);
            const direction: IAutoMovieVector3 = foot.toModelDirection(ray);
            const hit: number | null = caster.nearest(
              [start.x / 1000, start.y / 1000, start.z / 1000],
              [direction.x, direction.y, direction.z],
              Infinity,
            );
            return hit === null || !(hit > 0) ? null : hit * 1000;
          },
        },
      });
    const bone: AutoMovieHumanoidBone =
      side === "left" ? "leftToes" : "rightToes";
    return plates.map(
      (
        plate: {
          positions: IAutoMovieVector3[];
          quads: Array<[number, number, number, number]>;
        },
        t: number,
      ): IAutoMovieHumanPartGenerator.IAttachment => {
        const coordinate: IAutoMovieHumanSurfaceCoordinate = {
          part: "foot",
          side,
          u: 0.97,
          v: 0,
        };
        return {
          name: `nail.${NAILS[t]!}`,
          bone,
          tissue: "nail",
          cage: {
            vertices: plate.positions.map(
              (p: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({
                position: toModel(p),
              }),
            ),
            faces: plate.quads.map(
              (
                quad: [number, number, number, number],
              ): IAutoMovieHumanCage.IFace => ({
                vertices:
                  side === "left" ? quad : [quad[0], quad[3], quad[2], quad[1]],
                coordinates: [coordinate, coordinate, coordinate, coordinate],
              }),
            ),
            creases: [],
            rings: [],
          },
        };
      },
    );
  }
}

const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;

/** The tier the human profile samples; one tier keeps one topology until resolution tiers reach every part. */
const TIER: "medium" = "medium" as const;

/** Attachment names of the toenails, hallux first. */
const NAILS: readonly string[] = [
  "hallux",
  "second",
  "third",
  "fourth",
  "fifth",
];

/** One foot lofted in its local frame, with the transform and ring that place it on the person. */
interface IFoot {
  side: AutoMovieHumanSide;
  plan: IAutoMovieHumanFootPlan;
  sampled: IAutoMovieSurfaceCage;
  addresses: networkAutoMovieHumanFoot.IAddress[];
  axes: networkAutoMovieHumanFoot.IAxis[];
  toModel: (p: IAutoMovieVector3) => IAutoMovieVector3;

  /** The network the foot was sampled from and where it lands on the person, for inspection. */
  construction: IAutoMovieHumanCage.IConstruction;
  layout: IAutoMovieHumanRingShape;
}

/** Plan and loft one foot in its local frame. */
const build: (props: IAutoMovieHumanPartGenerator.IProps<"foot">) => IFoot = (
  props: IAutoMovieHumanPartGenerator.IProps<"foot">,
): IFoot => {
  const read: readAutoMovieHumanFoot.IOutput = readAutoMovieHumanFoot(props);
  const { side, plan, layout, toModel }: readAutoMovieHumanFoot.IOutput = read;
  const laid: networkAutoMovieHumanFoot.IOutput = networkAutoMovieHumanFoot({
    plan,
    ring: read.ring,
  });
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: laid.network,
    tier: TIER,
  });
  // toModel of a millimetre point, applied to one metre along each axis of the network's frame
  const construction: IAutoMovieHumanCage.IConstruction = {
    network: laid.network,
    origin: read.base,
    ...read.axes,
  };
  return {
    side,
    plan,
    sampled,
    addresses: laid.addresses,
    axes: laid.axes,
    toModel,
    layout,
    construction,
  };
};
