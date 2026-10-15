import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { anchorAutoMovieHumanHead } from "./anchorAutoMovieHumanHead";
import { buildAutoMovieHumanHeadTopology } from "./buildAutoMovieHumanHeadTopology";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { liftAutoMovieHumanHeadCage } from "./liftAutoMovieHumanHeadCage";
import { relaxAutoMovieHumanHeadCage } from "./relaxAutoMovieHumanHeadCage";

/**
 * Generates the head: the cranial vault and the one continuous face surface, open at the neck top and at both ear attachments.
 *
 * Generation runs in four steps, all in the head's own frame ({@link frameAutoMovieHumanHead}):
 *
 * 1. Skin: a signed distance field of the vault, the face mass, the upper neck and their relief ({@link AutoMovieHumanHeadField}), shaped by the identity's head measurements and the skeleton's landmarks through calibrated form coefficients.
 * 2. Connectivity: a box of quads wrapped round the skull with the eyes' and the mouth's concentric loops and pockets, the same for every person ({@link buildAutoMovieHumanHeadTopology}).
 * 3. Anchors: the rings exactly on the shared ring shapes, the feature loops where the eyes and lips lie, and the box corners on the head's own corners ({@link anchorAutoMovieHumanHead}); every other vertex settles over the skin between them ({@link relaxAutoMovieHumanHeadCage}).
 * 4. Lift: the free vertices rise until the limit surface of one subdivision lies on the skin rather than inside it ({@link liftAutoMovieHumanHeadCage}).
 *
 * The eyes, nose and mouth are neutral regions of that one surface: closed lids over a pocket for the eyeball, a neutral nose, closed lips over a pocket for the mouth's interior. Their modules reshape those regions without changing the connectivity.
 *
 * The chart runs `u` from the bottom of the head's canonical sphere to the vertex and `v` counterclockwise about the vertical from the anterior midline. Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadGenerator implements IAutoMovieHumanPartGenerator<"head"> {
  /** The part this generator produces. */
  public readonly part = "head" as const;

  /**
   * Generate the head's cage for one person.
   *
   * @param props Measurements and skeleton; the side is null
   * @returns The cage with its three rings
   */
  public generate(props: IAutoMovieHumanPartGenerator.IProps<"head">): IAutoMovieHumanCage {
    const frame: frameAutoMovieHumanHead.IFrame = frameAutoMovieHumanHead(props.skeleton);
    const topology: buildAutoMovieHumanHeadTopology.ITopology = buildAutoMovieHumanHeadTopology();
    const shape = (site: "neckTop" | "ear", side: "left" | "right" | null): IAutoMovieHumanRingShape =>
      shapeAutoMovieHumanRing({ skeleton: props.skeleton, measurements: props.measurements, site, side, part: "head" });
    const neck: IAutoMovieHumanRingShape = shape("neckTop", null);
    const ears: Record<"left" | "right", IAutoMovieHumanRingShape> = {
      left: shape("ear", "left"),
      right: shape("ear", "right"),
    };
    const direction = (d: IAutoMovieVector3): IAutoMovieVector3 =>
      frameAutoMovieHumanHead.toLocal({ ...frame, origin: AutoMovieHumanVector.of(0, 0, 0) }, d);
    // the skin rises to each ear's attachment plane, so the ear ring lies on the head rather than off it
    const field: AutoMovieHumanHeadField = new AutoMovieHumanHeadField(
      frame,
      props.measurements,
      undefined,
      (["left", "right"] as const).map((side): AutoMovieHumanHeadField.IPlatform => {
        const ring: IAutoMovieHumanRingShape = ears[side];
        const longest: number = ring.radii.indexOf(Math.max(...ring.radii));
        return {
          origin: frameAutoMovieHumanHead.toLocal(frame, ring.frame.origin),
          normal: direction(ring.frame.normal),
          axis: direction(ring.directions[longest]!),
          long: Math.max(...ring.radii),
          short: Math.min(...ring.radii),
        };
      }),
    );
    // ring vertices sit exactly on the shared boundary: the neck ring in build order, each ear vertex on the direction nearest its place around the attachment
    const rings: Map<number, IAutoMovieVector3> = new Map();
    AutoMovieHumanCageBuilder.buildOrder(neck).forEach((j: number, b: number): void => {
      rings.set(topology.neck[b]!, neck.positions[j]!);
    });
    const earOrder: Record<"left" | "right", number[]> = { left: [], right: [] };
    for (const side of ["left", "right"] as const) {
      const ring: IAutoMovieHumanRingShape = ears[side];
      earOrder[side] = AutoMovieHumanCageBuilder.buildOrder(ring).map((j: number): number => {
        const l: IAutoMovieVector3 = direction(ring.directions[j]!);
        let best: number = -1;
        let score: number = -Infinity;
        for (const e of topology.ears[side]) {
          const s: number = (l.y * e.up + l.z * e.forward) / Math.hypot(e.up, e.forward);
          if (s > score) {
            score = s;
            best = e.vertex;
          }
        }
        rings.set(best, ring.positions[j]!);
        return best;
      });
    }
    const anchors: Map<number, IAutoMovieVector3> = anchorAutoMovieHumanHead({
      topology,
      field,
      frame,
      measurements: props.measurements,
    });
    for (const [vertex, position] of rings) anchors.set(vertex, frameAutoMovieHumanHead.toLocal(frame, position));
    const head = props.measurements.identity.head;
    const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(0, 0.1 * head.headHeight, 0);
    const box: IAutoMovieVector3 = AutoMovieHumanVector.of(
      props.measurements.headBreadth / 2,
      frame.vertex.y - centre.y,
      (frame.glabella.z - frame.opisthocranion.z) / 2,
    );
    const initial: IAutoMovieVector3[] = topology.vertices.map((v) =>
      field.project(
        centre,
        AutoMovieHumanVector.of(v.canonical.x * box.x, v.canonical.y * box.y, v.canonical.z * box.z),
      ),
    );
    const settled: IAutoMovieVector3[] = relaxAutoMovieHumanHeadCage({
      positions: initial,
      faces: topology.faces,
      anchors,
      mirror: mirrorOf(topology),
      field,
      centre,
      sweeps: SWEEPS,
    });
    const mirror: number[] = mirrorOf(topology);
    const local: IAutoMovieVector3[] = liftAutoMovieHumanHeadCage({
      positions: settled,
      faces: topology.faces,
      // the rings, the lid margins and the lips inward keep their places; the orbital rims, lid sulci, outer lip border and box corners lie on the skin and lift with it
      fixed: new Set(
        [...anchors.keys()].filter(
          (v: number): boolean =>
            rings.has(v) ||
            (topology.vertices[v]!.loop !== null && topology.vertices[v]!.loop!.loop >= (topology.vertices[v]!.loop!.feature === "mouth" ? 1 : 2)),
        ),
      ),
      mirror,
      field,
      centre,
      rounds: LIFT_ROUNDS,
      share: LIFT_SHARE,
    });

    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder("head", null);
    local.forEach((p: IAutoMovieVector3, i: number): void => {
      builder.vertex(rings.get(i) ?? frameAutoMovieHumanHead.toModel(frame, p));
    });
    const chart: AutoMovieHumanCageBuilder.IChart[] = topology.vertices.map((v) => chartOf(v.canonical));
    for (const f of topology.faces) {
      const charts: AutoMovieHumanCageBuilder.IChart[] = f.map((i: number) => chart[i]!);
      const known: number[] = charts.filter((c) => !Number.isNaN(c.v)).map((c) => c.v);
      const spread: boolean = Math.max(...known) - Math.min(...known) > 0.5;
      const mean: number =
        known.map((v: number) => (spread && v < 0.5 ? v + 1 : v)).reduce((a, b) => a + b, 0) / known.length;
      builder.face(
        f,
        charts.map((c) => (Number.isNaN(c.v) ? { u: c.u, v: mean % 1 } : c)) as [
          AutoMovieHumanCageBuilder.IChart,
          AutoMovieHumanCageBuilder.IChart,
          AutoMovieHumanCageBuilder.IChart,
          AutoMovieHumanCageBuilder.IChart,
        ],
      );
    }
    builder.record(neck, {
      vertices: topology.neck,
      coordinates: topology.neck.map((i: number) => chart[i]!),
    });
    for (const side of ["left", "right"] as const)
      builder.record(ears[side], {
        vertices: earOrder[side],
        coordinates: earOrder[side].map((i: number) => chart[i]!),
      });
    return builder.build();
  }
}

/** Rounds and share of lifting the cage so its limit surface reaches the skin. */
const LIFT_ROUNDS: number = 6;
const LIFT_SHARE: number = 0.6;

/** Relaxation sweeps, enough for the grid to stop moving by more than a tenth of a millimetre. */
const SWEEPS: number = 150;

/** Chart address of a canonical direction: `u` the elevation from the bottom pole to the top, `v` the turn from the front toward the left. */
const chartOf = (c: IAutoMovieVector3): AutoMovieHumanCageBuilder.IChart => ({
  u: (Math.asin(Math.max(-1, Math.min(1, c.y))) + Math.PI / 2) / Math.PI,
  v:
    Math.abs(c.x) < 1e-9 && Math.abs(c.z) < 1e-9
      ? Number.NaN
      : ((Math.atan2(c.x, c.z) / (2 * Math.PI)) % 1 + 1) % 1,
});

/** Mirror image of each vertex across the midline, by canonical direction. */
const mirrorOf = (topology: buildAutoMovieHumanHeadTopology.ITopology): number[] => {
  const key = (c: IAutoMovieVector3): string =>
    `${Math.round(c.x * 1e6)},${Math.round(c.y * 1e6)},${Math.round(c.z * 1e6)}`;
  const index: Map<string, number> = new Map();
  topology.vertices.forEach((v, i: number): void => {
    index.set(key(v.canonical), i);
  });
  return topology.vertices.map((v, i: number): number => {
    const m: number | undefined = index.get(key(AutoMovieHumanVector.of(-v.canonical.x, v.canonical.y, v.canonical.z)));
    if (m === undefined) throw new Error(`head vertex ${i} has no mirror`);
    return m;
  });
};
