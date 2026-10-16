import { layoutAutoMovieSurfaceTransition } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { pinAutoMovieHumanHeadRing } from "./pinAutoMovieHumanHeadRing";

/**
 * Continue the head's jaw floor and cervical turn into its shared tube cut.
 *
 * The mandibular outline is an internal guide. Two reduction bands and three
 * regular bands keep the complete jaw floor within this mass. The boundary
 * and its parallel support row use one angular pairing of the shared shape.
 * This construction is a gross-form candidate, not clinical registration of
 * the circumference proxy or proof of injectivity on every identity.
 *
 * @param props Shared domain, network, neck ring and jaw loop
 * @returns Nothing; declarations enter the head's network
 */
export function layoutAutoMovieHumanHeadNeck(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  neck: IAutoMovieHumanRingShape;
  bottom: AutoMovieHumanHeadNetwork.IPoint[];
  reduction: number;
  support: number;
  collar: string;
}): void {
  const domain: AutoMovieHumanHeadDomain = props.domain;
  const network: AutoMovieHumanHeadNetwork = props.network;
  const bottom: AutoMovieHumanHeadNetwork.IPoint[] = props.bottom;
  const jawU: number = domain.loft.jaw;
  const collarU: number = domain.loft.cervical;
  const bandU: number = jawU + (collarU - jawU) / 2;
  // ---- jaw floor, cervical turn and upper neck within one head mass
  const band: (from: AutoMovieHumanHeadNetwork.IPoint[], count: number, u: number) => AutoMovieHumanHeadNetwork.IPoint[] = (
    from: AutoMovieHumanHeadNetwork.IPoint[],
    count: number,
    u: number,
  ): AutoMovieHumanHeadNetwork.IPoint[] => {
    const to: AutoMovieHumanHeadNetwork.IPoint[] = Array.from(
      { length: count },
      (_: unknown, j: number): AutoMovieHumanHeadNetwork.IPoint =>
        network.on(u, along(from, true, (j * from.length) / count).v),
    );
    strip(network, props.reduction, from, to, true, "transition");
    return to;
  };
  const collar: AutoMovieHumanHeadNetwork.IPoint[] = band(
    band(bottom, BANDS[0], bandU),
    BANDS[1],
    collarU,
  );
  let ringPoints: AutoMovieHumanHeadNetwork.IPoint[] = collar;
  let supportPoints: AutoMovieHumanHeadNetwork.IPoint[] = [];
  let supportPositions: IAutoMovieVector3[] = [];
  const stations: number[] = [domain.loft.fit, domain.loft.support, 1];
  for (let row: number = 1; row <= NECK_ROWS; ++row) {
    const u: number = stations[row - 1]!;
    const next: AutoMovieHumanHeadNetwork.IPoint[] = collar.map(
      (p: AutoMovieHumanHeadNetwork.IPoint): AutoMovieHumanHeadNetwork.IPoint =>
        row === 1 ? network.on(u, p.domain.v) :
          network.onSweep(props.collar, row === 2 ? 0 : 1, p.domain.v, {u, v: p.domain.v}),
    );
    network.bands([ringPoints, next], "upper-neck");
    if (row === NECK_ROWS - 1) {
      supportPoints = next;
      supportPositions = props.neck.positions.map(
        (p: IAutoMovieVector3): IAutoMovieVector3 =>
          AutoMovieHumanVector.offset(p, [props.neck.frame.normal, -props.support]),
      );
    }
    ringPoints = next;
  }
  const correspondence: { shift: number; sign: number } =
    pinAutoMovieHumanHeadRing(
      domain,
      network,
      "neckTop",
      ringPoints,
      props.neck.positions,
    );
  pinAutoMovieHumanHeadRing(
    domain,
    network,
    "neckTopCollar",
    supportPoints,
    supportPositions,
    correspondence,
  );
}

/**
 * A strip of quads between a finer and a coarser run of points, by the engine's transition layout: 2-to-1 reduction blocks among straight columns, each block's two interior poles of valence three and its coarse corners of valence five. The runs are closed rings or open runs whose ends meet the neighbours; a corner of the layout's coarse or fine side is that run's point, and an interior corner lies `unit` of the way from the fine run toward the coarse at its own place along them.
 */
const strip: (network: AutoMovieHumanHeadNetwork, unit: number, fine: AutoMovieHumanHeadNetwork.IPoint[], coarse: AutoMovieHumanHeadNetwork.IPoint[], closed: boolean, group: string) => void = (
  network: AutoMovieHumanHeadNetwork,
  unit: number,
  fine: AutoMovieHumanHeadNetwork.IPoint[],
  coarse: AutoMovieHumanHeadNetwork.IPoint[],
  closed: boolean,
  group: string,
): void => {
  const F: number = closed ? fine.length : fine.length - 1;
  const K: number = closed ? coarse.length : coarse.length - 1;
  const corner: (c: { s: number; t: number; }) => AutoMovieHumanHeadNetwork.IPoint = (c: {
    s: number;
    t: number;
  }): AutoMovieHumanHeadNetwork.IPoint => {
    if (c.t <= 0) return fine[Math.round(c.s * F) % fine.length]!;
    if (c.t >= 1) return coarse[Math.round(c.s * K) % coarse.length]!;
    const a: { u: number; v: number } = along(fine, closed, c.s * F);
    const b: { u: number; v: number } = along(coarse, closed, c.s * K);
    const v: number = b.v + Math.round(a.v - b.v);
    return network.on(a.u + (b.u - a.u) * unit, a.v + (v - a.v) * unit);
  };
  for (const quad of layoutAutoMovieSurfaceTransition(F, K, 1))
    network.quad(
      [corner(quad[0]), corner(quad[1]), corner(quad[2]), corner(quad[3])],
      group,
    );
};

/** The domain point at a fractional index along a run of points, closed or open. */
const along: (points: AutoMovieHumanHeadNetwork.IPoint[], closed: boolean, x: number) => { u: number; v: number; } = (
  points: AutoMovieHumanHeadNetwork.IPoint[],
  closed: boolean,
  x: number,
): { u: number; v: number } => {
  const n: number = points.length;
  const i: number = Math.min(Math.floor(x), closed ? Infinity : n - 2);
  const f: number = x - i;
  const a: AutoMovieHumanHeadNetwork.IPoint = points[((i % n) + n) % n]!;
  const b: AutoMovieHumanHeadNetwork.IPoint = points[(((i + 1) % n) + n) % n]!;
  const v: number = b.domain.v + Math.round(a.domain.v - b.domain.v);
  return {
    u: a.domain.u + (b.domain.u - a.domain.u) * f,
    v: a.domain.v + (v - a.domain.v) * f,
  };
};


/** Column reductions of the jaw floor onto the cervical tube. */
const BANDS: [number, number] = [40, 28];
/** Regular bands from the cervical turn to the shared neck cut. */
const NECK_ROWS: number = 3;
