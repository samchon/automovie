import {
  IAutoMovieSubdivisionSurface,
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
import { IAutoMovieHumanFootDraft } from "./IAutoMovieHumanFootDraft";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { fitAutoMovieHumanFootCage } from "./fitAutoMovieHumanFootCage";
import { knitAutoMovieHumanFootCage } from "./knitAutoMovieHumanFootCage";
import { outlineAutoMovieHumanFoot } from "./outlineAutoMovieHumanFoot";
import { placeAutoMovieHumanFootNails } from "./placeAutoMovieHumanFootNails";
import { planAutoMovieHumanFoot } from "./planAutoMovieHumanFoot";
import { shapeAutoMovieHumanFootSole } from "./shapeAutoMovieHumanFootSole";
import { shapeAutoMovieHumanFootToes } from "./shapeAutoMovieHumanFootToes";
import { shapeAutoMovieHumanFootUpper } from "./shapeAutoMovieHumanFootUpper";

/**
 * Foot from the ankle ring, with the heel, the arches, the ball and the five toes, as a quad control cage generated from the person's measurements and skeleton.
 *
 * The cage is built like a shoe on the fixed grid of `AUTOMOVIE_HUMAN_FOOT_GRID`: an upper over the dorsum, the sides and the back of the heel, opened at the ankle ring; a sole; a rim of one face row between them; and a four-sided tube for each toe from every other face across the front. `planAutoMovieHumanFoot` turns foot length and breadth, lateral malleolus height, navicular height and the skeleton's malleoli into an outline, a dorsal crest and toes; `outlineAutoMovieHumanFoot`, `shapeAutoMovieHumanFootUpper`, `shapeAutoMovieHumanFootSole` and `shapeAutoMovieHumanFootToes` place the control points; `knitAutoMovieHumanFootCage` makes the faces; and `fitAutoMovieHumanFootCage` makes the limit surface measure the identity's foot length and breadth. A child's foot follows from its own measured length, breadth, ankle height and navicular height, so it is broader for its length and flatter in the arch than an adult's, as the growth surveys measure.
 *
 * Both feet are shaped in one local frame, the left foot's, and the right foot is its mirror image: every face's corners and the ring are reversed after their first vertex, so faces still wind outward and the ring still runs counterclockwise about its normal.
 *
 * Chart: `u` from 0 at the ankle ring to 1 at the toe tips, `v` counterclockwise about the distal axis from the anterior mark; see `knitAutoMovieHumanFootCage`.
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
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"foot">,
  ): IAutoMovieHumanCage {
    const foot: IFoot = build(props);
    const { side, knit, toModel, layout, order } = foot;

    // the ring sits exactly on the junction's shared shape
    const positions: IAutoMovieVector3[] = knit.positions.map(toModel);
    const ring: number[] = order.map((k: number): number => knit.ring[k]!);
    ring.forEach((vertex: number, j: number): void => {
      positions[vertex] = layout.positions[j]!;
    });
    return {
      vertices: positions.map(
        (position: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({
          position,
        }),
      ),
      faces: knit.faces.map(
        (face: [number, number, number, number]): IAutoMovieHumanCage.IFace => {
          const corners: [number, number, number, number] = mirror(side, face);
          const vs: number[] = corners.map((c: number): number =>
            chartV(side, knit.charts[c]!.v),
          );
          const high: boolean = vs.some((v: number): boolean => v > 0.5);
          return {
            vertices: corners,
            coordinates: corners.map(
              (c: number, k: number): IAutoMovieHumanSurfaceCoordinate => ({
                part: "foot",
                side,
                u: knit.charts[c]!.u,
                v: vs[k] === 0 && high ? 1 : vs[k]!,
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
    };
  }

  /**
   * Generate the foot's toenail plates.
   *
   * @param props Measurements, skeleton and side
   * @returns The five nail plates, hallux first, each riding the toes bone
   */
  public attachments(
    props: IAutoMovieHumanPartGenerator.IProps<"foot">,
  ): IAutoMovieHumanPartGenerator.IAttachment[] {
    const foot: IFoot = build(props);
    const { side, knit, toModel } = foot;
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: {
        positions: knit.positions.flatMap((p: IAutoMovieVector3): number[] => [
          p.x,
          p.y,
          p.z,
        ]),
        faces: knit.faces,
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
    const plates: ReturnType<typeof placeAutoMovieHumanFootNails> =
      placeAutoMovieHumanFootNails({
        plan: foot.plan,
        toes: knit.toes.map((stations: number[][]): IAutoMovieVector3[][] =>
          stations.map((corners: number[]): IAutoMovieVector3[] =>
            corners.map((c: number): IAutoMovieVector3 => knit.positions[c]!),
          ),
        ),
        skin: { positions: surface.limitPositions, triangles },
      });
    const bone: AutoMovieHumanoidBone =
      side === "left" ? "leftToes" : "rightToes";
    return plates.map(
      (plate, t: number): IAutoMovieHumanPartGenerator.IAttachment => {
        // the plate's chart address: the toe's own dorsal column on the foot's chart, toward its tip
        const v: number = chartV(side, knit.charts[knit.toes[t]![0]![0]!]!.v);
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
              ): IAutoMovieHumanCage.IFace => {
                const coordinate: IAutoMovieHumanSurfaceCoordinate = {
                  part: "foot",
                  side,
                  u: 0.95,
                  v,
                };
                return {
                  vertices: mirror(side, quad),
                  coordinates: [coordinate, coordinate, coordinate, coordinate],
                };
              },
            ),
            creases: [],
            rings: [],
          },
        };
      },
    );
  }
}

/** Attachment names of the toenails, hallux first. */
const NAILS: readonly string[] = [
  "hallux",
  "second",
  "third",
  "fourth",
  "fifth",
];

/** One foot's cage in its local frame, with the transforms and ring order that place it on the person. */
interface IFoot {
  side: AutoMovieHumanSide;
  plan: IAutoMovieHumanFootPlan;
  knit: knitAutoMovieHumanFootCage.IOutput;
  toModel: (p: IAutoMovieVector3) => IAutoMovieVector3;
  layout: IAutoMovieHumanRingShape;
  order: number[];
}

/** A face of the left foot, reversed after its first corner on the right foot so it still winds outward. */
const mirror = (
  side: AutoMovieHumanSide,
  face: [number, number, number, number],
): [number, number, number, number] =>
  side === "left" ? face : [face[0], face[3], face[2], face[1]];

/** A chart `v` of the left foot, mirrored on the right foot so it still runs counterclockwise about the distal axis. */
const chartV = (side: AutoMovieHumanSide, v: number): number =>
  side === "left" || v === 0 ? v : 1 - v;

/** Plan, shape, knit and fit one foot in its local frame. */
const build = (props: IAutoMovieHumanPartGenerator.IProps<"foot">): IFoot => {
  const side: AutoMovieHumanSide = props.side;
  const sign: number = side === "left" ? 1 : -1;
  const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
  const leg: IAutoMovieHumanIdentity.ILeg =
    side === "left" ? body.leftLeg : body.rightLeg;
  const landmarks: IAutoMovieHumanLandmarks.ISide =
    side === "left"
      ? props.skeleton.landmarks.left
      : props.skeleton.landmarks.right;
  const ankle: IAutoMovieHumanSkeleton.IJoint | undefined =
    props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
        j.bone === (side === "left" ? "leftFoot" : "rightFoot"),
    );
  if (ankle === undefined) throw new Error(`skeleton lacks the ${side} foot`);
  const base: IAutoMovieVector3 = AutoMovieHumanVector.of(
    ankle.position.x,
    0,
    ankle.position.z,
  );
  const toLocal = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieHumanVector.of(sign * (p.x - base.x), p.y, p.z - base.z);
  const toModel = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieHumanVector.of(base.x + sign * p.x, p.y, base.z + p.z);
  const layout: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
    skeleton: props.skeleton,
    measurements: props.measurements,
    site: "ankle",
    side,
    part: "foot",
  });
  // the ring in the left foot's order: the right foot's layout runs the other way round
  const order: number[] = Array.from(
    { length: layout.count },
    (_: unknown, k: number): number =>
      side === "left" ? k : (layout.count - k) % layout.count,
  );

  const plan: IAutoMovieHumanFootPlan = planAutoMovieHumanFoot({
    leg,
    landmarks,
    toLocal,
    ankle: {
      origin: toLocal(layout.frame.origin),
      radii: order.map((j: number): number => layout.radii[j]!),
    },
  });
  const draft: IAutoMovieHumanFootDraft = outlineAutoMovieHumanFoot(plan);
  shapeAutoMovieHumanFootUpper(plan, draft);
  shapeAutoMovieHumanFootSole(plan, draft);
  draft.toes = shapeAutoMovieHumanFootToes(plan);
  const knit: knitAutoMovieHumanFootCage.IOutput =
    knitAutoMovieHumanFootCage(draft);
  fitAutoMovieHumanFootCage(plan, knit);
  return { side, plan, knit, toModel, layout, order };
};
