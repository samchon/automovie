import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
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
 * Chart: `u` from 0 at the ankle ring to 1 at the toe tips, `v` counterclockwise about the distal axis from the anterior mark; see `knitAutoMovieHumanFootCage`. Toenails are separate meshes, not part of this cage.
 *
 * Rings, in order: `ankle`.
 *
 * @author Samchon
 */
export class AutoMovieHumanFootGenerator implements IAutoMovieHumanPartGenerator<"foot"> {
  public readonly part = "foot" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"foot">,
  ): IAutoMovieHumanCage {
    const side: AutoMovieHumanSide = props.side;
    const sign: number = side === "left" ? 1 : -1;
    const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
    const leg: IAutoMovieHumanIdentity.ILeg =
      side === "left" ? body.leftLeg : body.rightLeg;
    const landmarks: IAutoMovieHumanLandmarks.ISide =
      side === "left" ? props.skeleton.landmarks.left : props.skeleton.landmarks.right;
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
    const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "ankle",
      side,
      part: "foot",
    });

    const plan: IAutoMovieHumanFootPlan = planAutoMovieHumanFoot({
      leg,
      landmarks,
      toLocal,
      origin: toLocal(layout.frame.origin),
    });
    const draft: IAutoMovieHumanFootDraft = outlineAutoMovieHumanFoot(plan);
    shapeAutoMovieHumanFootUpper(plan, draft);
    shapeAutoMovieHumanFootSole(plan, draft);
    draft.toes = shapeAutoMovieHumanFootToes(plan);
    const knit: knitAutoMovieHumanFootCage.IOutput = knitAutoMovieHumanFootCage(draft);
    fitAutoMovieHumanFootCage(plan, knit);

    // the ring sits exactly on the layout: each vertex along its layout direction, at its local distance from the origin
    const positions: IAutoMovieVector3[] = knit.positions.map(toModel);
    const ring: number[] = knit.ring.map(
      (_: number, k: number): number => knit.ring[side === "left" ? k : (8 - k) % 8]!,
    );
    ring.forEach((vertex: number, k: number): void => {
      positions[vertex] = AutoMovieHumanVector.offset(layout.frame.origin, [
        layout.directions[k]!,
        AutoMovieHumanVector.distance(knit.positions[vertex]!, plan.ankle.origin),
      ]);
    });
    const address = (index: number, v: number): IAutoMovieHumanSurfaceCoordinate => ({
      part: "foot",
      side,
      u: knit.charts[index]!.u,
      v,
    });
    return {
      vertices: positions.map(
        (position: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({ position }),
      ),
      faces: knit.faces.map(
        (face: [number, number, number, number]): IAutoMovieHumanCage.IFace => {
          const corners: [number, number, number, number] =
            side === "left" ? face : [face[0], face[3], face[2], face[1]];
          const vs: number[] = corners.map((c: number): number => {
            const v: number = knit.charts[c]!.v;
            return side === "left" || v === 0 ? v : 1 - v;
          });
          const high: boolean = vs.some((v: number): boolean => v > 0.5);
          return {
            vertices: corners,
            coordinates: corners.map(
              (c: number, k: number): IAutoMovieHumanSurfaceCoordinate =>
                address(c, vs[k] === 0 && high ? 1 : vs[k]!),
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
}
