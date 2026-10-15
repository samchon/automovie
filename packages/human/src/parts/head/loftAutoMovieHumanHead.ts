import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_HEAD_FORM } from "./AUTOMOVIE_HUMAN_HEAD_FORM";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { layoutAutoMovieHumanHead } from "./layoutAutoMovieHumanHead";
import { profileAutoMovieHumanHead } from "./profileAutoMovieHumanHead";
import { reliefAutoMovieHumanHead } from "./reliefAutoMovieHumanHead";
import { sweepAutoMovieHumanHead } from "./sweepAutoMovieHumanHead";

/**
 * Loft the head: one sweep of sections from under the vertex to the neck-top ring, laid out as a network of quads with the face's loops, sampled into the head's cage.
 *
 * The steps, all in the head's own frame ({@link frameAutoMovieHumanHead}): guide curves from the landmarks and measurements ({@link profileAutoMovieHumanHead}); sections lofted through them ({@link sweepAutoMovieHumanHead}); the quads laid over the sweep's domain with the eyes', mouth's and ears' openings and loops ({@link layoutAutoMovieHumanHead}); and the engine's sampling, which evaluates every point of the domain on the sweep and fits the cage so its limit surface passes through them, the rings kept on their shared shapes.
 *
 * The chart runs `u` from the bottom of the head's canonical sphere to the vertex and `v` counterclockwise about the vertical from the anterior midline, each corner's address the direction of its control point from a centre a tenth of head height above tragion. Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @param measurements Resolved measurements of the person
 * @param skeleton The person's skeleton
 * @param form The head's form coefficients, {@link AUTOMOVIE_HUMAN_HEAD_FORM} unless a fit to a reference passes others
 * @returns The head cage, model frame, millimetres
 */
export function loftAutoMovieHumanHead(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  form: IAutoMovieHumanHeadForm = AUTOMOVIE_HUMAN_HEAD_FORM,
): IAutoMovieHumanCage {
  const built: INetwork = networkOf(measurements, skeleton, form);
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: built.network,
    tier: TIER,
  });
  return {
    ...emit(sampled, built.frame, measurements.identity.head.headHeight, built.rings),
    construction: IAutoMovieHumanCage.inModel(built.network),
  };
}

interface INetwork {
  network: IAutoMovieSurfaceNetwork;
  frame: frameAutoMovieHumanHead.IFrame;
  rings: Array<[string, IAutoMovieHumanRingShape]>;
}

/** The head's network and the rings it reports, before sampling. */
const networkOf = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  form: IAutoMovieHumanHeadForm,
): INetwork => {
  const frame: frameAutoMovieHumanHead.IFrame = frameAutoMovieHumanHead(skeleton);
  const shape = (site: "neckTop" | "ear", side: "left" | "right" | null): IAutoMovieHumanRingShape =>
    shapeAutoMovieHumanRing({ skeleton, measurements, site, side, part: "head" });
  const neck: IAutoMovieHumanRingShape = shape("neckTop", null);
  const ears: Record<"left" | "right", IAutoMovieHumanRingShape> = {
    left: shape("ear", "left"),
    right: shape("ear", "right"),
  };
  const local = (p: IAutoMovieVector3): IAutoMovieVector3 => frameAutoMovieHumanHead.toLocal(frame, p);
  const direction = (d: IAutoMovieVector3): IAutoMovieVector3 =>
    frameAutoMovieHumanHead.toLocal({ ...frame, origin: AutoMovieHumanVector.of(0, 0, 0) }, d);
  // the ring's limit points along itself, which the sections end on
  const controls: IAutoMovieVector3[] = neck.positions.map(local);
  const n: number = controls.length;
  const limit: IAutoMovieVector3[] = controls.map((p: IAutoMovieVector3, k: number) =>
    AutoMovieHumanVector.offset(
      AutoMovieHumanVector.of(0, 0, 0),
      [controls[(k + n - 1) % n]!, 1 / 6],
      [p, 4 / 6],
      [controls[(k + 1) % n]!, 1 / 6],
    ),
  );
  const profile: profileAutoMovieHumanHead.IProfile = profileAutoMovieHumanHead({
    frame,
    head: measurements.identity.head,
    ring: { posterior: limit[n / 2]!, posterolateral: limit[(2 * n) / 3]! },
    form,
  });
  const loft: sweepAutoMovieHumanHead.IOutput = sweepAutoMovieHumanHead({
    frame,
    profile,
    ring: { origin: local(neck.frame.origin), normal: direction(neck.frame.normal), limit },
    tilt: frame.eye.y,
    blend: frame.stomion.y,
    relief: reliefAutoMovieHumanHead({
      frame,
      head: measurements.identity.head,
      composition: measurements.identity.composition,
      profile,
      form: form.relief,
    }),
  });
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(loft.sweep);
  const domain: AutoMovieHumanHeadDomain = new AutoMovieHumanHeadDomain(surface, loft, frame, profile);
  const network: AutoMovieHumanHeadNetwork = new AutoMovieHumanHeadNetwork(SWEEP);
  layoutAutoMovieHumanHead({ domain, network, head: measurements.identity.head, form, neck, ears });
  return {
    network: network.build(loft.sweep),
    frame,
    rings: [
      ["neckTop", neck],
      ["ear.left", ears.left],
      ["ear.right", ears.right],
    ],
  };
};

/** The sweep's name in the network. */
const SWEEP: string = "head";

/** The tier the human profile samples. */
const TIER = "medium" as const;

/** Height of the chart's centre above tragion, over head height. */
const CHART_CENTRE: number = 0.1;

/** Turn the sampled network into the head cage: millimetres, chart addresses and rings. */
const emit = (
  sampled: IAutoMovieSurfaceCage,
  frame: frameAutoMovieHumanHead.IFrame,
  headHeight: number,
  rings: Array<[string, IAutoMovieHumanRingShape]>,
): IAutoMovieHumanCage => {
  const positions: number[] = sampled.cage.positions;
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for (let k: number = 0; k < positions.length; k += 3)
    vertices.push({
      position: AutoMovieHumanVector.of(
        positions[k]! * 1000,
        positions[k + 1]! * 1000,
        positions[k + 2]! * 1000,
      ),
    });
  const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(0, CHART_CENTRE * headHeight, 0);
  const chart: IAutoMovieHumanSurfaceCoordinate.IOn<"head">[] = vertices.map(
    (v: IAutoMovieHumanCage.IVertex): IAutoMovieHumanSurfaceCoordinate.IOn<"head"> => {
      const d: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
        AutoMovieHumanVector.offset(frameAutoMovieHumanHead.toLocal(frame, v.position), [centre, -1]),
      );
      return {
        part: "head",
        side: null,
        u: (Math.asin(Math.max(-1, Math.min(1, d.y))) + Math.PI / 2) / Math.PI,
        v: (((Math.atan2(d.x, d.z) / (2 * Math.PI)) % 1) + 1) % 1,
      };
    },
  );
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[]): IAutoMovieHumanCage.IFace => ({
      vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
      coordinates: face.map(
        (i: number): IAutoMovieHumanSurfaceCoordinate.IOn<"head"> => chart[i]!,
      ) as IAutoMovieHumanCage.IFace["coordinates"],
    }),
  );
  return {
    vertices,
    faces,
    creases: [],
    rings: rings.map(
      ([name, shape]: [string, IAutoMovieHumanRingShape]): IAutoMovieHumanCage["rings"][number] => ({
        site: shape.site,
        side: shape.side,
        vertices: sampled.rings[name]!,
        start: shape.start,
        frame: shape.frame,
      }),
    ),
  };
};
