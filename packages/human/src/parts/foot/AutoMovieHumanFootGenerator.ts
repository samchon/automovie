import {
  IAutoMovieSubdivisionSurface,
  IAutoMovieSurfaceCage,
  sampleAutoMovieSurfaceNetwork,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { networkAutoMovieHumanFoot } from "./networkAutoMovieHumanFoot";
import { placeAutoMovieHumanFootNails } from "./placeAutoMovieHumanFootNails";
import { planAutoMovieHumanFoot } from "./planAutoMovieHumanFoot";

/**
 * Foot from the ankle ring, with the malleoli, the heel, the arches, the ball and the five toes, lofted as one surface network of fixed connectivity.
 *
 * `planAutoMovieHumanFoot` turns foot length and breadth, lateral malleolus height, navicular height and the skeleton's malleoli into an outline, a dorsal crest and toes; `networkAutoMovieHumanFoot` lofts one sweep along the foot from the ankle ring and sweeps each toe from its end between web curves; the engine samples it so the cage's limit surface passes through the sweep at every vertex, with the ankle ring pinned to the shared shape the leg opens and the collar beside it to that ring carried into the foot.
 *
 * Both feet are lofted in one local frame, the left foot's, and the right foot is its mirror image: every face's corners are reversed after the first and the chart's turns mirrored, so faces still wind outward and `v` still runs counterclockwise about the distal axis.
 *
 * Chart: `u` from 0 at the ankle ring along the foot to 0.85 at the toes' roots and on along each toe to 1 at its tip, `v` counterclockwise about the distal axis from the anterior mark; a toe holds a narrow band of `v` about its column.
 *
 * Rings, in order: `ankle`. Attachments, in order: the toenails `nail.hallux`, `nail.second`, `nail.third`, `nail.fourth` and `nail.fifth`, each riding the foot's toes bone, the one bone every toe shares, and placed on the skin this cage produces (see `placeAutoMovieHumanFootNails`).
 *
 * @author Samchon
 */
export class AutoMovieHumanFootGenerator implements IAutoMovieHumanPartGenerator<"foot"> {
  /** The foot part. */
  public readonly part = "foot" as const;

  /**
   * Generate one foot's cage.
   *
   * @param props Measurements, skeleton and side
   * @returns The foot's cage in the model frame and millimetres, opening the ankle ring on the junction's shared shape
   */
  public generate(props: IAutoMovieHumanPartGenerator.IProps<"foot">): IAutoMovieHumanCage {
    const foot: IFoot = build(props);
    const { side, sampled, toModel, layout } = foot;
    const positions: IAutoMovieVector3[] = [];
    for (let k: number = 0; k < sampled.cage.positions.length; k += 3)
      positions.push(
        toModel(
          V.of(sampled.cage.positions[k]! * 1000, sampled.cage.positions[k + 1]! * 1000, sampled.cage.positions[k + 2]! * 1000),
        ),
      );
    // the ring sits exactly on the junction's shared shape
    const ring: number[] = sampled.rings.ankle!;
    ring.forEach((vertex: number, j: number): void => {
      positions[vertex] = layout.positions[j]!;
    });
    const order: number[] = side === "left" ? [0, 1, 2, 3] : [0, 3, 2, 1];
    return {
      vertices: positions.map((position: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({ position })),
      faces: sampled.cage.faces.map((face: number[], f: number): IAutoMovieHumanCage.IFace => {
        const raw: networkAutoMovieHumanFoot.IPoint[] = sampled.corners[f]!.map((c) => foot.addresses[c.patch]!(c.s, c.t));
        const vs: number[] = raw.map((c: networkAutoMovieHumanFoot.IPoint): number => (side === "left" ? c.v : (1 - c.v) % 1));
        const wrap: boolean = Math.max(...vs) - Math.min(...vs) > 0.5;
        return {
          vertices: order.map((k: number): number => face[k]!) as IAutoMovieHumanCage.IFace["vertices"],
          coordinates: order.map(
            (k: number): IAutoMovieHumanSurfaceCoordinate => ({
              part: "foot",
              side,
              u: raw[k]!.u,
              v: wrap && vs[k]! < 0.5 ? vs[k]! + 1 : vs[k]!,
            }),
          ) as IAutoMovieHumanCage.IFace["coordinates"],
        };
      }),
      creases: [],
      rings: [{ site: "ankle", side, vertices: ring, start: layout.start, frame: layout.frame }],
      construction: foot.construction,
    };
  }

  /**
   * Generate the foot's toenail plates.
   *
   * @param props Measurements, skeleton and side
   * @returns The five nail plates, hallux first, each riding the toes bone
   */
  public attachments(props: IAutoMovieHumanPartGenerator.IProps<"foot">): IAutoMovieHumanPartGenerator.IAttachment[] {
    const foot: IFoot = build(props);
    const { side, sampled, toModel } = foot;
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: {
        positions: sampled.cage.positions.map((x: number): number => x * 1000),
        faces: sampled.cage.faces,
      },
      levels: 2,
    });
    const triangles: number[] = [];
    for (let f: number = 0; f < surface.faces.length; f += 4)
      triangles.push(
        surface.faces[f]!,
        surface.faces[f + 1]!,
        surface.faces[f + 2]!,
        surface.faces[f]!,
        surface.faces[f + 2]!,
        surface.faces[f + 3]!,
      );
    const plates: ReturnType<typeof placeAutoMovieHumanFootNails> = placeAutoMovieHumanFootNails({
      plan: foot.plan,
      axes: foot.axes,
      skin: { positions: surface.limitPositions, triangles },
    });
    const bone: AutoMovieHumanoidBone = side === "left" ? "leftToes" : "rightToes";
    return plates.map((plate, t: number): IAutoMovieHumanPartGenerator.IAttachment => {
      const coordinate: IAutoMovieHumanSurfaceCoordinate = { part: "foot", side, u: 0.97, v: 0 };
      return {
        name: `nail.${NAILS[t]!}`,
        bone,
        tissue: "nail",
        cage: {
          vertices: plate.positions.map((p: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({ position: toModel(p) })),
          faces: plate.quads.map(
            (quad: [number, number, number, number]): IAutoMovieHumanCage.IFace => ({
              vertices: side === "left" ? quad : [quad[0], quad[3], quad[2], quad[1]],
              coordinates: [coordinate, coordinate, coordinate, coordinate],
            }),
          ),
          creases: [],
          rings: [],
        },
      };
    });
  }
}

const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;

/** The tier the human profile samples; one tier keeps one topology until resolution tiers reach every part. */
const TIER = "medium" as const;

/** Attachment names of the toenails, hallux first. */
const NAILS: readonly string[] = ["hallux", "second", "third", "fourth", "fifth"];

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
const build = (props: IAutoMovieHumanPartGenerator.IProps<"foot">): IFoot => {
  const side: AutoMovieHumanSide = props.side;
  const sign: number = side === "left" ? 1 : -1;
  const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
  const leg: IAutoMovieHumanIdentity.ILeg = side === "left" ? body.leftLeg : body.rightLeg;
  const landmarks: IAutoMovieHumanLandmarks.ISide =
    side === "left" ? props.skeleton.landmarks.left : props.skeleton.landmarks.right;
  const ankle: IAutoMovieHumanSkeleton.IJoint | undefined = props.skeleton.joints.find(
    (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === (side === "left" ? "leftFoot" : "rightFoot"),
  );
  if (ankle === undefined) throw new Error(`skeleton lacks the ${side} foot`);
  const base: IAutoMovieVector3 = V.of(ankle.position.x, 0, ankle.position.z);
  const toLocal = (p: IAutoMovieVector3): IAutoMovieVector3 => V.of(sign * (p.x - base.x), p.y, p.z - base.z);
  const toModel = (p: IAutoMovieVector3): IAutoMovieVector3 => V.of(base.x + sign * p.x, p.y, base.z + p.z);
  const layout: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
    skeleton: props.skeleton,
    measurements: props.measurements,
    site: "ankle",
    side,
    part: "foot",
  });
  const origin: IAutoMovieVector3 = toLocal(layout.frame.origin);
  const local: IAutoMovieVector3[] = layout.directions.map(
    (d: IAutoMovieVector3): IAutoMovieVector3 => V.of(sign * d.x, d.y, d.z),
  );
  // the sweep turns counterclockwise about the downward axis: front, medial (-x), back, lateral
  const turnOf = (d: IAutoMovieVector3): number => Math.round((Math.atan2(-d.x, d.z) / (2 * Math.PI)) * layout.count);
  const sense: 1 | -1 = turnOf(local[1]!) === 1 ? 1 : -1;
  const n: number = layout.count;
  const radius = (quarter: number): number => layout.radii[((((sense * quarter * n) / 4) % n) + n) % n]!;
  const mean: number = layout.radii.reduce((a: number, b: number): number => a + b, 0) / n;
  const plan: IAutoMovieHumanFootPlan = planAutoMovieHumanFoot({
    leg,
    landmarks,
    toLocal,
    ankle: { origin, radii: [] },
  });
  const laid: networkAutoMovieHumanFoot.IOutput = networkAutoMovieHumanFoot({
    plan,
    ring: {
      origin,
      girth: layout.girth,
      radii: { anterior: radius(0), medial: radius(1), posterior: radius(2), lateral: radius(3) },
      aspect: {
        anterior: radius(0) / mean,
        medial: radius(1) / mean,
        posterior: radius(2) / mean,
        lateral: radius(3) / mean,
      },
      positions: layout.positions.map(toLocal),
      sense,
    },
  });
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: laid.network, tier: TIER });
  // toModel of a millimetre point, applied to one metre along each axis of the network's frame
  const construction: IAutoMovieHumanCage.IConstruction = {
    network: laid.network,
    origin: base,
    x: V.of(1000 * sign, 0, 0),
    y: V.of(0, 1000, 0),
    z: V.of(0, 0, 1000),
  };
  return { side, plan, sampled, addresses: laid.addresses, axes: laid.axes, toModel, layout, construction };
};
