import { AutoMovieHumanHeadConstruction as Head } from "../../../../packages/human/src/generation/AutoMovieHumanHeadConstruction";
import { AutoMovieHumanNeckConstruction as Neck } from "../../../../packages/human/src/generation/AutoMovieHumanNeckConstruction";
import { AutoMovieHumanLegPrior as Leg } from "../../../../packages/human/src/generation/AutoMovieHumanLegPrior";
import { AutoMovieHumanTrunkConstruction as Trunk } from "../../../../packages/human/src/generation/AutoMovieHumanTrunkConstruction";
import { AutoMovieHumanBodySpecimenCalibration as Specimen } from "../../../../packages/human/src/generation/calibration/AutoMovieHumanBodySpecimenCalibration";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters as Parameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";

/** Reach the actual neck/trunk producer without constructing unrelated hands or a head mesh. */
export namespace HumanTrunkFixture {
  /** Canonical public controls, with the same documented unknown-input fallback as BodyLaw. */
  export function inputs(params: Parameters): Trunk.IInputs {
    const read: (key: keyof Parameters["body"]["controls"]) => number = (key: keyof Parameters["body"]["controls"]): number => control(params, key);
    return { hip: read("hip"), thigh: read("thigh"), highHip: read("highHip"), waist: read("waist"), underbust: read("underbust"), chest: read("chest"), bustSpan: read("bustSpan"), neckBase: read("neckBase"), acrossShoulder: read("acrossShoulder"), bicep: read("bicep"), neckToWaist: read("neckToWaist"), shoulderToApex: read("shoulderToApex"), frontInterscyeLength: read("frontInterscyeLength"), sex: read("masculineFeminine"), fat: read("fat"), muscularity: read("muscularity"), scale: 1 };
  }

  /**
   * Evaluate the exact upstream neck and column with explicit public inputs.
   * No event is invented: this part-only observation is separate from actual
   * BodyLaw composition and cannot certify whole-person anatomy.
   */
  export function generate(params: Parameters, own: Trunk.IInputs): Body {
    const height: number = control(params, "height");
    const head: Head.IInputs = { head: params.head, height, neckLength: control(params, "neckLength"), neck: control(params, "neck"), sex: own.sex, fat: own.fat };
    const law: Leg.ICrotch = Leg.PRIOR.crotch;
    const floor: number = law.offset + law.height * height + law.inseam * control(params, "inseam") + law.thigh * own.thigh + law.sex * own.sex;
    const neck: Chain = Neck.generate({ top: Head.seat(head), neck: head.neck, neckBase: own.neckBase, sex: own.sex, scale: own.scale });
    return Trunk.apply({ stature: height, chains: [neck], events: [], poles: [], apertures: [], eyes: [] }, own, floor);
  }

  /** Read public inputs without reading any generated measurement or fitted output. */
  function control(params: Parameters, key: keyof Parameters["body"]["controls"]): number {
    const explicit: number | null = params.body.controls[key].value;
    const value: number = explicit === null ? (Specimen.controls as Record<string, number>)[key]! : explicit;
    if (!Number.isFinite(value)) throw new Error("The trunk fixture lacks a finite canonical input: " + key);
    return value;
  }
}
