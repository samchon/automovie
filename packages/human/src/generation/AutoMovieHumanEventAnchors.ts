import type { IAutoMovieHumanBodyCalibration as Body } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanStationHermite as Hermite } from "../lofting/AutoMovieHumanStationHermite";

/** Retain a column producer's owned interior geometry when its boundary is composed. */
export namespace AutoMovieHumanEventAnchors {
  /**
   * Insert exact polynomial restrictions at owned guides before changing a
   * boundary. Merely shortening a fade leaves a guide inside a changed span.
   * Unframed columns retain their cubic or quintic interpolation and lift;
   * no point, tangent or curvature is fitted to a dimensional target.
   */
  export function subdivide(chain: Chain, stations: readonly number[]): Chain {
    if (stations.length === 0) return chain;
    if (chain.layers.some((layer: Chain.ILayer): boolean => layer.frame !== undefined))
      throw new Error("Column event anchors require unframed owners");
    const bottom: number = chain.layers[0]!.y;
    const top: number = chain.layers.at(-1)!.y;
    if (stations.some((station: number): boolean => !Number.isFinite(station) || station <= bottom || station >= top))
      throw new Error("A preserved event station must be strictly inside its child domain");
    const inserted: Chain.ILayer[] = [...new Set(stations)].filter((station: number): boolean => !chain.layers.some((layer: Chain.ILayer): boolean => layer.y === station)).map((station: number): Chain.ILayer => {
      const [lo, hi] = Loft.bracket(chain, station);
      const a: Chain.ILayer = chain.layers[lo]!;
      const b: Chain.ILayer = chain.layers[hi]!;
      const width: number = b.y - a.y;
      const unit: number = (station - a.y) / width;
      const read: (left: Hermite.IEnd, right: Hermite.IEnd, order: 0 | 1 | 2) => number[] = (left: Hermite.IEnd, right: Hermite.IEnd, order: 0 | 1 | 2): number[] => Hermite.combine(left, right, Hermite.weights(unit, width, order, left.curvature !== undefined && right.curvature !== undefined));
      const left: Hermite.IEnd = { value: a.coefficients, slope: a.slopes, curvature: a.curvatures };
      const right: Hermite.IEnd = { value: b.coefficients, slope: b.slopes, curvature: b.curvatures };
      const zero: number[] = new Array<number>(chain.order).fill(0);
      const liftA: Hermite.IEnd = { value: a.lift ?? zero, slope: a.liftSlopes ?? zero, curvature: a.liftCurvatures };
      const liftB: Hermite.IEnd = { value: b.lift ?? zero, slope: b.liftSlopes ?? zero, curvature: b.liftCurvatures };
      return { y: station, coefficients: read(left, right, 0), slopes: read(left, right, 1), ...(a.curvatures !== undefined && b.curvatures !== undefined ? { curvatures: read(left, right, 2) } : {}), ...(a.lift !== undefined || b.lift !== undefined ? { lift: read(liftA, liftB, 0), liftSlopes: read(liftA, liftB, 1), ...(a.liftCurvatures !== undefined && b.liftCurvatures !== undefined ? { liftCurvatures: read(liftA, liftB, 2) } : {}) } : {}) };
    });
    return { ...chain, layers: [...chain.layers, ...inserted].sort((a: Chain.ILayer, b: Chain.ILayer): number => a.y - b.y) };
  }

  /**
   * Publish material-station constraints for the supplied unframed owners.
   * Existing unrelated children and their constraints remain unchanged. These
   * anchors contain only geometry, never circumference goals or fitted gains.
   */
  export function retain(events: readonly Body.IEvent[], owners: readonly Chain[], stations: readonly number[]): Body.IEvent[] {
    if (stations.some((station: number): boolean => !Number.isFinite(station))) throw new Error("An event anchor needs a finite material station");
    if (owners.some((chain: Chain): boolean => chain.layers.some((layer: Chain.ILayer): boolean => layer.frame !== undefined))) throw new Error("Column event anchors require unframed owners");
    return events.map((event: Body.IEvent): Body.IEvent => ({ ...event, splits: event.splits.map((split: Body.ISplit): Body.ISplit => {
      const chain: Chain | undefined = owners.find((owner: Chain): boolean => owner.name === split.child);
      if (chain === undefined) return split;
      const bottom: number = chain.layers[0]!.y;
      const top: number = chain.layers.at(-1)!.y;
      return { ...split, preservedStations: [...new Set([...(split.preservedStations ?? []), ...stations.filter((station: number): boolean => station > bottom && station < top)])].sort((a: number, b: number): number => a - b) };
    }) }));
  }
}
