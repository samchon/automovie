import type { IAutoMovieLoftChain } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import type { AutoMovieHumanF1Body } from "../AutoMovieHumanF1Body";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanHeadThroat } from "../head/AutoMovieHumanHeadThroat";
import { AutoMovieHumanTrunkF1Skin } from "./AutoMovieHumanTrunkF1Skin";
import { AutoMovieHumanTrunkJointDatums } from "./AutoMovieHumanTrunkJointDatums";
import type { AutoMovieHumanTrunkPorts } from "./AutoMovieHumanTrunkPorts";
import { AutoMovieHumanTrunkViewCurves } from "./AutoMovieHumanTrunkViewCurves";
import { AutoMovieHumanTrunkViewLoft } from "./AutoMovieHumanTrunkViewLoft";

/**
 * The one S00 constructor every consumer calls: the person's resolved
 * measures, the trunk frames, landmarks and limb ports
 * (`AutoMovieHumanTrunkJointDatums`), f1_head's throat contour the front
 * reads above IJ (`AutoMovieHumanHeadThroat`, from the head identity), the
 * S00 view curves and the engine loft with the mounds composed as reliefs,
 * each stage timed separately.
 *
 * The lateral malleolus height is the person's left foot input, else the
 * ANSUR II women's mean stature fraction 0.0385 (`docs/sources/ansur-ii.md`,
 * 62.7 / 1628.5); the crotch height is the inseam over it (ISO 8559-1 5.7.6).
 */
export namespace AutoMovieHumanTrunkS00 {
  /** Build the fixed-coordinate F1 trunk from its measured world contours and shared ports. */
  export function f1(ports: AutoMovieHumanTrunkPorts.IFixed): AutoMovieHumanF1Body.IFixedPart {
    return { mesh: AutoMovieHumanTrunkF1Skin.f1(ports) };
  }

  /** One build. */
  export interface IOutput {
    /** Resolved measures. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Lateral malleolus height, mm. */
    ankle: number;

    /** Crotch height, mm. */
    crotch: number;

    /** Frames, landmarks (with the neck base S00 solved) and limb ports. */
    datums: AutoMovieHumanTrunkJointDatums.IOutput;

    /** S00 view curves. */
    curves: AutoMovieHumanTrunkViewCurves.IOutput;

    /** The engine loft. */
    loft: AutoMovieHumanTrunkViewLoft.IOutput;

    /** The S00 chain with its mounds, or null. */
    chain: IAutoMovieLoftChain | null;

    /** Stage times, milliseconds. */
    ms: { measures: number; datums: number; curves: number; loft: number; total: number };
  }

  /** Build S00 from the public input (`options`: the view curves' build options, `AutoMovieHumanTrunkViewCurves.IOptions`). */
  export function of(params: IAutoMovieHumanParameters, measures?: IAutoMovieHumanBodyMeasures, options?: AutoMovieHumanTrunkViewCurves.IOptions): IOutput {
    const t0: number = performance.now();
    const m: IAutoMovieHumanBodyMeasures = measures ?? AutoMovieHumanBodyAnatomy.resolve(params);
    const ankle: number = params.extremities?.feet?.left.ankleHeight ?? 0.0385 * m.stature;
    const crotch: number = m.inseam + ankle;
    const t1: number = performance.now();
    const start: AutoMovieHumanTrunkJointDatums.IOutput = AutoMovieHumanTrunkJointDatums.of(m, ankle, crotch);
    const t2: number = performance.now();
    const throat: AutoMovieHumanHeadThroat.IOutput = AutoMovieHumanHeadThroat.of(m, params.head, start);
    const curves: AutoMovieHumanTrunkViewCurves.IOutput = AutoMovieHumanTrunkViewCurves.create(start.frames, start.landmarks, m, crotch, throat, options);
    const datums: AutoMovieHumanTrunkJointDatums.IOutput = { ...start, landmarks: curves.landmarks };
    const t3: number = performance.now();
    const loft: AutoMovieHumanTrunkViewLoft.IOutput = AutoMovieHumanTrunkViewLoft.create(curves, { order: 64, samples: 160, gap: 6 });
    const t4: number = performance.now();
    return { measures: m, ankle, crotch, datums, curves, loft, chain: loft.chain, ms: { measures: t1 - t0, datums: t2 - t1, curves: t3 - t2, loft: t4 - t3, total: t4 - t0 } };
  }
}
