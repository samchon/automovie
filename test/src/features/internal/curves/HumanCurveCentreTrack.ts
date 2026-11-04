import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import type { HumanCurveRings } from "./HumanCurveRings";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The track of a chain's section centres (catalog rules CUR-4, PRO-LG-9 and
 * PRO-AR-5): a composed chain's centre runs along its axis without a kink,
 * so no layer stands offset from its neighbours.
 *
 * A section's outline is its centre plus its radius in each direction; where
 * the radius changes smoothly, a turn of the centre's track is carried by the
 * outline on at least one side. The catalog's crease definition
 * (`HumanAnatomyShared.CREASE`) therefore bounds the track: resampled at
 * 1 mm, its sagitta over a 10 mm chord less the 1.04 mm a 12.5 mm radius
 * gives stays within 1 mm, the bound every meridian of the skin keeps. An
 * offset layer, at any girth, reads as a tent in the track and fails it;
 * the girth profile cannot see it.
 *
 * Read on the framed limb and digit chains, the neck chain and the trunk;
 * the head chains below the vault are left out, because a horizontal section
 * there gains the chin or the nose within a few millimetres of height and
 * its centre lawfully jumps forward, and the ears are open shells.
 */
export namespace HumanCurveCentreTrack {
  /** The chains read. */
  export const CHAINS: RegExp = /^(trunk$|head$|arm\.|hand\.|finger\.|thumb\.|leg\.|foot\.|toe\.)/;

  /** Stations left out at each end of a chain, for the seam and cap rules, as in `HumanCurveRingAudit`. */
  export const ENDS: number = 3;

  /** Half the chord, in 1 mm samples. */
  export const HALF: number = 5;

  /** The sagitta a 12.5 mm radius gives over a 10 mm chord, mm. */
  export const SMOOTH: number = 12.5 - Math.sqrt(12.5 ** 2 - 25);

  /** The sharpest turn of a centre track. */
  export interface ITurn {
    /** Sagitta over the 10 mm chord less the 12.5 mm radius' sagitta, mm; zero on a track too short to read. */
    excess: number;

    /** Station nearest the turn, input mm. */
    station: number;

    /** Where, input mm. */
    at: V3;
  }

  /** The sharpest turn of a profile's centre track, its end stations left out. */
  export function turn(profile: HumanCurveRings.IProfile): ITurn {
    const centre: V3[] = profile.centre.slice(ENDS, profile.centre.length - ENDS);
    const stations: number[] = profile.stations.slice(ENDS, profile.stations.length - ENDS);
    const best: ITurn = { excess: 0, station: NaN, at: [NaN, NaN, NaN] };
    if (centre.length < 2) return best;
    const s: V3[] = HumanAnatomyShared.resample(centre, 1);
    for (let i: number = HALF; i + HALF < s.length; i++) {
      const m: V3 = s[i]!;
      const excess: number = A.dist(m, A.lerp(s[i - HALF]!, s[i + HALF]!, 0.5)) - SMOOTH;
      if (excess <= best.excess) continue;
      best.excess = excess;
      best.at = m;

      // The station of the nearest centre, for the row's site.
      let near: number = 0;
      for (let k: number = 1; k < centre.length; k++) if (A.dist(centre[k]!, m) < A.dist(centre[near]!, m)) near = k;
      best.station = stations[near]!;
    }
    return best;
  }

  /** One row per chain read: the sharpest turn of its centre track against the crease bound. */
  export function rows(person: string, chains: readonly string[], read: (chain: string) => HumanCurveRings.IProfile): IRow[] {
    return chains
      .filter((c: string): boolean => CHAINS.test(c))
      .map((chain: string): IRow => {
        const t: ITurn = turn(read(chain));
        return {
          person,
          site: `${chain} section centre track: sharpest turn over a 10 mm chord past a 12.5 mm radius, at station ${t.station.toFixed(0)} mm, point ${t.at.map((v: number): string => v.toFixed(0)).join(" ")} (CUR-4)`,
          value: t.excess,
          low: -Infinity,
          high: HumanAnatomyShared.CREASE,
          unit: "mm",
        };
      });
  }
}
