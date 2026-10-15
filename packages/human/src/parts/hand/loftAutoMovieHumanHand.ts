import { IAutoMovieSurfaceCage, sampleAutoMovieSurfaceNetwork } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { networkAutoMovieHumanHand } from "./networkAutoMovieHumanHand";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * Loft one hand: lay out its surface network in the hand frame, sample it at the human profile's tier, and address every face corner on the hand's charts.
 *
 * The engine fits the cage so its Catmull-Clark limit passes through the network at every vertex, and pins the wrist ring to the shared ring shape the arm opens and the collar loop beside it to that ring carried into the hand, so the junction welds and the joined girth along the ring is the ring's own.
 *
 * @param props Measurements, skeleton and side
 * @returns The hand, its ring, and the cage in the hand frame, millimetres
 */
export function loftAutoMovieHumanHand(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
}): loftAutoMovieHumanHand.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const arm: IAutoMovieHumanIdentity.IArm =
    props.side === "left"
      ? props.measurements.identity.body.leftArm
      : props.measurements.identity.body.rightArm;
  const ring: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
    skeleton: props.skeleton,
    measurements: props.measurements,
    site: "wrist",
    side: props.side,
    part: "hand",
  });
  const hand: readAutoMovieHumanHand.IHand = readAutoMovieHumanHand(props.skeleton, props.side, ring);
  const toLocal = (d: IAutoMovieVector3): IAutoMovieVector3 =>
    V.of(V.dot(d, hand.distal), V.dot(d, hand.palmar), V.dot(d, hand.radial));
  const laid: networkAutoMovieHumanHand.IOutput = networkAutoMovieHumanHand({ hand, arm, ring, toLocal });
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: laid.network, tier: TIER });
  const positions: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < sampled.cage.positions.length; k += 3)
    positions.push(
      V.of(sampled.cage.positions[k]! * 1000, sampled.cage.positions[k + 1]! * 1000, sampled.cage.positions[k + 2]! * 1000),
    );
  const faces: loftAutoMovieHumanHand.IFace[] = sampled.cage.faces.map(
    (face: number[], f: number): loftAutoMovieHumanHand.IFace => {
      const raw: networkAutoMovieHumanHand.IPoint[] = sampled.corners[f]!.map((c) =>
        laid.addresses[c.patch]!(c.s, c.t),
      );
      const known: number[] = raw.map((c) => c.v).filter((v: number): boolean => !Number.isNaN(v));
      const wrap: boolean = Math.max(...known) - Math.min(...known) > 0.5;
      const unwrapped = (v: number): number => (wrap && v < 0.5 ? v + 1 : v);
      // a tip's apex takes the mean turn of the face's other corners
      const apex: number = known.reduce((sum: number, v: number): number => sum + unwrapped(v), 0) / known.length;
      return {
        vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
        corners: raw.map((c) => ({
          branch: c.branch,
          u: c.u,
          v: Number.isNaN(c.v) ? apex : unwrapped(c.v),
        })) as loftAutoMovieHumanHand.IFace["corners"],
      };
    },
  );
  return { hand, arm, ring, positions, faces, wrist: sampled.rings.wrist! };
}
/** Output and face types of {@link loftAutoMovieHumanHand}. */
export namespace loftAutoMovieHumanHand {
  /**
   * One lofted hand in its own frame.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The hand in its frame. */
    hand: readAutoMovieHumanHand.IHand;

    /** Its arm's measurements. */
    arm: IAutoMovieHumanIdentity.IArm;

    /** Its wrist ring's shared shape. */
    ring: IAutoMovieHumanRingShape;

    /** Control points, hand frame, millimetres. */
    positions: IAutoMovieVector3[];

    /** Quads, counterclockwise from outside in the hand frame taken as right-handed. */
    faces: IFace[];

    /** The wrist ring's vertices in the shared shape's order. */
    wrist: number[];
  }

  /**
   * One quad and its corners' chart addresses, `v` counterclockwise about the distal axis in the hand frame.
   *
   * @author Samchon
   */
  export interface IFace {
    /** Vertex indices. */
    vertices: [number, number, number, number];

    /** Chart address of each corner. */
    corners: [ICorner, ICorner, ICorner, ICorner];
  }

  /**
   * A corner's chart address.
   *
   * @author Samchon
   */
  export interface ICorner {
    /** The digit, or null on the palm. */
    branch: AutoMovieHumanBranch<"hand"> | null;

    /** Along the chart. */
    u: number;

    /** Around it, within half a turn of the face's other corners. */
    v: number;
  }
}

/** The tier the human profile samples; one tier keeps one topology until resolution tiers reach every part. */
const TIER = "medium" as const;
