import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Low-pass of the sections next to the crotch ring.
 *
 * Where the trunk splits into the legs, the fitted sections ring: on the
 * f1 calibration the trunk's section curvature changes sign 128 times
 * around the crotch ring, falling to 22 at 12 mm above it, and the legs'
 * 62 times at 1 mm below it against 14 at 9 mm. Those alternating spikes
 * are the fitter's Gibbs response to the pinch, not anatomy, and the
 * shared ring prints them as the dotted line along the gluteal fold.
 *
 * Each control point of a section of the parent or a child within
 * {@link REACH} of such a ring moves to `c + w v (F c - c)`, where F is a
 * periodic cubic P-spline projection keeping {@link CYCLES} cycles per
 * section (a wavelength of about 50 mm on the trunk), `w = 1 -
 * smoothstep(d / REACH)` fades with the station distance d from the ring
 * and `v = smoothstep(r / PINCH)` with the horizontal distance r of the
 * control point from the ring's pinch points. The filter thus acts fully on
 * the ring itself, which parent and children share, not at all beyond the
 * reach, and not at the pinches, whose sharp fold between the legs is the
 * contact's real shape (filtering it moved the crotch by up to 8 mm).
 * Station slopes take the same filter plus the fade's own station
 * derivative, `m + w v (F m - m) + w' v (F c - c)`, so the Hermite rule
 * stays consistent; v is held per layer.
 *
 * Only the crotch (the event whose parent is the `trunk`) is filtered,
 * the one contact whose ringing renders as a visible line. The axillae
 * ring less (60 sign changes at the shoulder ring against 128 here) and
 * show no comparable line, so their fitted sections are kept as observed.
 * The head's rings cross the eyes and the nose, whose real detail is
 * shorter than this wavelength.
 */
export namespace AutoMovieHumanContactSmoothing {
  /**
   * Calibration with the crotch sections filtered.
   *
   * @param calibration Merged calibration; not modified.
   * @returns A copy with the filtered layers.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IAutoMovieHumanBodyCalibration {
    const named: Map<string, IAutoMovieHumanLoftChain> = new Map(
      calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );

    // Contact stations and pinch points of every chain touching a torso
    // contact, the parent's ring giving both sides' pinches.
    const contacts: Map<string, IContact[]> = new Map();
    const add: (chain: string, contact: IContact) => void = (
      chain: string,
      contact: IContact,
    ): void => {
      contacts.set(chain, [...(contacts.get(chain) ?? []), contact]);
    };
    for (const event of calibration.events) {
      if (event.parent !== "trunk") continue;
      const parent: IAutoMovieHumanLoftChain = named.get(event.parent)!;
      const station: number =
        event.direction === "down" ? parent.layers[0]!.y : top(parent);
      const pinches: [number, number][] = AutoMovieHumanLoftChain.ring(
        parent,
        station,
        event.splits.flatMap(
          (s: IAutoMovieHumanBodyCalibration.ISplit): number[] =>
            s.arcs
              .filter(
                ([a, b]: [number, number]): boolean =>
                  b - a < 2 * Math.PI - 1e-9,
              )
              .map(([a]: [number, number]): number => a),
        ),
      ).map((p: [number, number, number]): [number, number] => [p[0], p[2]]);
      add(parent.name, { station, pinches });
      for (const split of event.splits) {
        const child: IAutoMovieHumanLoftChain = named.get(split.child)!;
        add(child.name, {
          station: event.direction === "down" ? top(child) : child.layers[0]!.y,
          pinches,
        });
      }
    }
    return {
      ...calibration,
      chains: calibration.chains.map(
        (chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain => {
          const list: IContact[] | undefined = contacts.get(chain.name);
          return list === undefined ? chain : filter(chain, list);
        },
      ),
    };
  }
}

/** One contact ring of a chain. */
interface IContact {
  /** The chain's station at the ring, mm. */
  station: number;

  /** Horizontal `[x, z]` of the ring's pinch points, mm. */
  pinches: [number, number][];
}

/** Station reach of the filter from a contact ring, mm. */
const REACH: number = 15;

/** Horizontal distance from a pinch over which the filter fades in, mm. */
const PINCH: number = 20;

/** Cycles per section the filter keeps at half response. */
const CYCLES: number = 24;

/** One chain's layers near its contact rings, filtered. */
function filter(
  chain: IAutoMovieHumanLoftChain,
  contacts: readonly IContact[],
): IAutoMovieHumanLoftChain {
  if (chain.basis !== "spline") return chain;
  const N: number = chain.order;

  // Samples of a section at four phases per control point, projected back
  // with the cutoff penalty.
  const lowpass: (values: readonly number[]) => number[] = (
    values: readonly number[],
  ): number[] =>
    AutoMovieHumanSplineCurve.project(
      Array.from(
        { length: 4 * N },
        (_: unknown, i: number): [number, number] => {
          const p: [number, number, number, number] =
            AutoMovieHumanSplineCurve.evaluate(
              values,
              N,
              (2 * Math.PI * i) / (4 * N),
            );
          return [p[0], p[1]];
        },
      ),
      N,
      CYCLES,
    );

  return {
    ...chain,
    layers: chain.layers.map(
      (
        layer: IAutoMovieHumanLoftChain.ILayer,
      ): IAutoMovieHumanLoftChain.ILayer => {
        const contact: IContact = contacts.reduce(
          (a: IContact, b: IContact): IContact =>
            Math.abs(layer.y - b.station) < Math.abs(layer.y - a.station)
              ? b
              : a,
        );
        const d: number = Math.abs(layer.y - contact.station);
        if (d >= REACH) return layer;

        // Station fade and its derivative, signed away from the ring.
        const u: number = d / REACH;
        const w: number = 1 - u * u * (3 - 2 * u);
        const dw: number =
          (-6 * u * (1 - u) * (layer.y >= contact.station ? 1 : -1)) / REACH;

        // Pinch mask per control point, from the point of the section at
        // its Greville phase.
        const points: [number, number, number][] = AutoMovieHumanLoftChain.ring(
          chain,
          layer.y,
          Array.from(
            { length: N },
            (_: unknown, j: number): number => (2 * Math.PI * j) / N,
          ),
        );
        const v: number[] = points.map(
          (p: [number, number, number]): number => {
            const r: number = Math.min(
              ...contact.pinches.map((q: [number, number]): number =>
                Math.hypot(p[0] - q[0], p[2] - q[1]),
              ),
            );
            const x: number = Math.min(1, r / PINCH);
            return contact.pinches.length === 0 ? 1 : x * x * (3 - 2 * x);
          },
        );
        const fc: number[] = lowpass(layer.coefficients);
        const fm: number[] = lowpass(layer.slopes);
        return {
          ...layer,
          coefficients: layer.coefficients.map(
            (c: number, k: number): number => c + w * v[k % N]! * (fc[k]! - c),
          ),
          slopes: layer.slopes.map(
            (m: number, k: number): number =>
              m +
              v[k % N]! *
                (w * (fm[k]! - m) + dw * (fc[k]! - layer.coefficients[k]!)),
          ),
        };
      },
    ),
  };
}

/** Top station of a chain. */
function top(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[chain.layers.length - 1]!.y;
}
