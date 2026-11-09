import { RingCamera } from "../../src/entities/cameras/ring-camera/RingCamera";
import { Fighter } from "../../src/entities/cast/fighter/Fighter";
import type { IFighterBody } from "../../src/entities/cast/fighter/IFighterBody";
import { fighterA } from "../../src/entities/cast/fighter/fighterA";
import { fighterB } from "../../src/entities/cast/fighter/fighterB";
import { Referee } from "../../src/entities/cast/referee/Referee";
import { Bell } from "../../src/entities/props/bell/Bell";
import { Ring } from "../../src/entities/sets/ring/Ring";
import type { IRingCast } from "../../src/interactions/kickboxing/IRingCast";
import type { IFighterMeasure } from "../../src/laws/kickboxing/IFighterMeasure";

/**
 * The bout's cast on polygon men: each body is measured from the Drillis and
 * Contini segment proportions of its settings stature (Winter, Biomechanics
 * and Motor Control of Human Movement, table 4.1), so schedule, footwork,
 * officiating and coverage logic runs in milliseconds without generating a
 * Human figure. Posing a polygon man is not supported; units that need poses
 * test laws directly.
 */
export function polygonCast(): IRingCast {
  const body = (stature: number, gloves: number): IFighterBody => ({
    measure: measure(stature, gloves),
    regions: {},
    weapons: {},
    profile: { segments: [], joints: [] } as unknown as IFighterBody["profile"],
    place: (): never => {
      throw new Error("A polygon man is not posed");
    },
    complete: (): never => {
      throw new Error("A polygon man is not posed");
    },
  });
  return {
    a: new Fighter(fighterA, undefined, body(1.8, 0.095)),
    b: new Fighter(fighterB, undefined, body(1.8, 0.095)),
    referee: new Referee({
      measure: measure(1.78, 0),
      profile: {
        segments: [],
        joints: [],
      } as unknown as IFighterBody["profile"],
      place: (): never => {
        throw new Error("A polygon man is not posed");
      },
    }),
    ring: new Ring(),
    camera: new RingCamera(),
    bell: new Bell(),
  };
}

/** Segment lengths as shares of stature (Drillis and Contini 1966). */
function measure(h: number, gloves: number): IFighterMeasure {
  return {
    hip: 0.53 * h,
    hipHalfWidth: (0.191 * h) / 2,
    shoulder: 0.818 * h,
    shoulderHalfWidth: (0.259 * h) / 2,
    head: 0.936 * h,
    headRadius: (0.13 * h) / 2,
    gloveRadius: gloves,
    armReach: (0.186 + 0.146 + 0.108 / 2) * h,
    thigh: 0.245 * h,
    shank: 0.246 * h,
    ankle: 0.039 * h,
    foot: 0.152 * h,
    // Half the shank's breadth, about a fifth of its length (Winter table 4.1 segment girths).
    shinRadius: (0.246 * h) / 10,
    // Upright polygon men: each level's front surface over the origin.
    front: {
      head: (0.13 * h) / 2,
      body: (0.259 * h) / 4,
      leg: (0.191 * h) / 2,
    },
  };
}
