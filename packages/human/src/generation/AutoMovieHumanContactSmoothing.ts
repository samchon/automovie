import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Low-pass of the sections next to contact rings.
 *
 * Where a chain splits into children at a contact ring, the fitted
 * sections ring: on the f1 calibration the trunk's section curvature
 * changes sign 128 times around the crotch ring against 22 at 12 mm above
 * it, the middle head's 60 times at the 1595.5 mm ring against 38 at 6 mm,
 * and its 54 times at the 1543.2 mm ring against 24 at 6 mm. Those
 * alternating spikes are the fitter's Gibbs response to the pinch, not
 * anatomy; the shared ring prints them as a line (the dotted gluteal line,
 * the groove at eye height, the line under the nostrils).
 *
 * Each control point of a section of the parent or a child within the
 * contact's reach R of its ring moves to `c + w v (F c - c)`, where F is a
 * periodic cubic P-spline projection whose half-response wavelength is the
 * contact's {@link IContactRule.wavelength} along the section,
 * `w = 1 - smoothstep(d / R)` fades with the station distance d from the
 * ring and `v = smoothstep(r / P)` with the horizontal distance r of
 * the control point from the ring's pinch points, P the rule's pinch radius. The filter thus acts
 * fully on the ring itself, which parent and children share, not at all
 * beyond the reach, and not at the pinches, whose sharp folds are the
 * contacts' real shape (filtering the crotch pinch moved it by up to
 * 8 mm). Station slopes take the same filter plus the fade's own station
 * derivative, `m + v (w (F m - m) + w' (F c - c))`, so the Hermite rule
 * stays consistent; v is held per layer.
 *
 * The rules ({@link RULES}) keep each wavelength above the real detail its
 * ring crosses: 50 mm at the crotch, 20 mm at the axillae, where 50 mm
 * filled the spinal groove and left a 0.7 mm ridge across the upper back
 * at the reach's end, 15 mm at both ends of
 * the neck, above the throat prominence's width, 8 mm on the head, where
 * the rings cross the eye corners and the nose bridge, and 6 mm at the
 * hand and foot webs. The axillary ring rang 56 times on the shoulder
 * side and 62 on the trunk's (a lump at the front of each armpit under
 * raking light), and the neck's rings 42 to 70 times on sections whose
 * shape changes sign a few times at most.
 */
export namespace AutoMovieHumanContactSmoothing {
  /**
   * Calibration with its contact sections filtered.
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

    // Contact stations and pinch points of every chain touching a filtered
    // contact, the parent's ring giving both sides' pinches.
    const contacts: Map<string, IContact[]> = new Map();
    const add: (chain: string, contact: IContact) => void = (
      chain: string,
      contact: IContact,
    ): void => {
      contacts.set(chain, [...(contacts.get(chain) ?? []), contact]);
    };
    for (const event of calibration.events) {
      const rule: IContactRule | undefined = RULES.find(
        (r: IContactRule): boolean => r.parent.test(event.parent),
      );
      if (rule === undefined) continue;
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
      add(parent.name, { station, pinches, rule });
      for (const split of event.splits) {
        const child: IAutoMovieHumanLoftChain = named.get(split.child)!;
        add(child.name, {
          station: event.direction === "down" ? top(child) : child.layers[0]!.y,
          pinches,
          rule,
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

/** Filter parameters of the contacts whose parent chain matches. */
interface IContactRule {
  /** Parent chain names the rule applies to. */
  parent: RegExp;

  /** Half-response wavelength of the section filter along the section, mm. */
  wavelength: number;

  /** Horizontal distance from a pinch point over which the filter fades in, mm. */
  pinch: number;

  /** Station reach of the filter on both sides of the ring, mm. */
  reach: number;
}

/** Contact rules, first match wins. */
const RULES: IContactRule[] = [
  { parent: /^trunk$/, wavelength: 50, pinch: 20, reach: 15 },
  { parent: /^upper$/, wavelength: 20, pinch: 20, reach: 15 },
  { parent: /^head$/, wavelength: 15, pinch: 8, reach: 10 },
  { parent: /^head\.middle$/, wavelength: 8, pinch: 8, reach: 6 },
  { parent: /^(arm|hand)\./, wavelength: 6, pinch: 3, reach: 6 },
  { parent: /^(foot|forefoot)\./, wavelength: 6, pinch: 4, reach: 6 },
];

/** One contact ring of a chain. */
interface IContact {
  /** The chain's station at the ring, mm. */
  station: number;

  /** Horizontal `[x, z]` of the ring's pinch points, mm. */
  pinches: [number, number][];

  /** The rule of the ring's parent. */
  rule: IContactRule;
}

/** One chain's layers near its contact rings, filtered. */
function filter(
  chain: IAutoMovieHumanLoftChain,
  contacts: readonly IContact[],
): IAutoMovieHumanLoftChain {
  if (chain.basis !== "spline") return chain;
  const N: number = chain.order;

  // Samples of a section at four phases per control point, projected back
  // with the cutoff penalty in cycles per section.
  const lowpass: (values: readonly number[], cycles: number) => number[] = (
    values: readonly number[],
    cycles: number,
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
      cycles,
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
        const reach: number = contact.rule.reach;
        const d: number = Math.abs(layer.y - contact.station);
        if (d >= reach) return layer;

        // Station fade and its derivative, signed away from the ring.
        const u: number = d / reach;
        const w: number = 1 - u * u * (3 - 2 * u);
        const dw: number =
          (-6 * u * (1 - u) * (layer.y >= contact.station ? 1 : -1)) / reach;

        // Points of the section at the control points' Greville phases, for
        // the pinch mask and the section's perimeter.
        const points: [number, number, number][] = AutoMovieHumanLoftChain.ring(
          chain,
          layer.y,
          Array.from(
            { length: N },
            (_: unknown, j: number): number => (2 * Math.PI * j) / N,
          ),
        );
        let perimeter: number = 0;
        points.forEach((p: [number, number, number], j: number): void => {
          const q: [number, number, number] = points[(j + 1) % N]!;
          perimeter += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
        });
        const cycles: number = perimeter / contact.rule.wavelength;
        if (cycles >= N / 2) return layer;

        const v: number[] = points.map(
          (p: [number, number, number]): number => {
            if (contact.pinches.length === 0) return 1;
            const r: number = Math.min(
              ...contact.pinches.map((q: [number, number]): number =>
                Math.hypot(p[0] - q[0], p[2] - q[1]),
              ),
            );
            const x: number = Math.min(1, r / contact.rule.pinch);
            return x * x * (3 - 2 * x);
          },
        );
        const fc: number[] = lowpass(layer.coefficients, cycles);
        const fm: number[] = lowpass(layer.slopes, cycles);
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
