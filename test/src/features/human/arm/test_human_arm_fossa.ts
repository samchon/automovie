import { HumanAnatomy } from "../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanAnatomyShared } from "../../internal/HumanAnatomyShared";
import { HumanInputs } from "../../internal/HumanInputs";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanCurveKinks } from "../../internal/curves/HumanCurveKinks";

type V3 = [number, number, number];

/**
 * The cubital fossa at the neutral is no sharper than at the bind: straightening
 * the bind's slight elbow flexion opens the hollow in front of the elbow, so the
 * sharpest turn across it may not grow past one crease sagitta.
 *
 * Scenarios:
 * 1. Red proof on f1: a groove 3 mm deep made across the front of the left elbow at the neutral reads past the bound.
 * 2. Every person of `HumanPeople`, both elbows: the neutral's sharpest turn on the front meridians across the elbow against the bind's, listed by person and side.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the front meridians (-40 to 40 degrees round the arm's forward direction) across each elbow, 0.04 S either side of the elbow joint along the shoulder-to-wrist axis, with the shared kink reader (`HumanCurveKinks.rows`: half-plane cuts, the sharpest turn over a 10 mm chord past a 12.5 mm radius) on the bind and the neutral skins of the same person. It catches a fossa folded into a notch when the neutral straightens the elbow under the binding, which the owner's frames showed on m1 and m2.
 * @evidence contracts/testing.md#independent-expectations Anatomy: extension opens the cubital fossa (Gray 1918), so the neutral's front turn is at most the bind's; the tolerance is the crease sagitta (`HumanAnatomyShared.CREASE`, 1 mm), the smallest relief that reads on skin. The expectation compares a person with itself, so no population value enters. Proven red by scenario 1.
 * @evidence contracts/testing.md#distinguishing-cases Women and men, both elbows. Red: the made groove.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_arm_fossa`, reading the bind and neutral skins in process with no browser or GPU.
 */
export function test_human_arm_fossa(): void {
  const failures: string[] = [];

  // 1. The made groove on f1's left elbow at the neutral.
  const f1: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
  const S: number = HumanInputs.stature(f1.params);
  const neutral: HumanAnatomy.ISkin = f1.neutral();
  const left: HumanCurveKinks.IRegion = region("left");
  const base: number = worst(HumanCurveKinks.rows(f1, left, neutral));
  const made: number = worst(HumanCurveKinks.rows(f1, left, HumanCurveKinks.ridge(neutral, left, S, 0, -GROOVE, 2)));
  if (!(made > base + HumanAnatomyShared.CREASE)) failures.push(`proof: f1's left elbow with a made groove reads ${made.toFixed(2)} mm against ${base.toFixed(2)} unedited, expected past ${HumanAnatomyShared.CREASE} more`);

  // 2. Every person, both elbows, neutral against bind.
  for (const name of HumanPeople.names()) {
    try {
      const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(name);
      for (const side of ["left", "right"] as const) {
        const r: HumanCurveKinks.IRegion = region(side);
        const bind: number = worst(HumanCurveKinks.rows(subject, r, subject.bind()));
        const rest: number = worst(HumanCurveKinks.rows(subject, r, subject.neutral()));
        if (rest > bind + HumanAnatomyShared.CREASE) failures.push(`${name.padEnd(14)} ${side} cubital fossa: neutral ${rest.toFixed(2)} mm against bind ${bind.toFixed(2)}, more than ${HumanAnatomyShared.CREASE} sharper`);
      }
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} cubital fossa findings:\n${failures.join("\n")}`);
}

/** Depth of the made groove, mm: three crease sagittas. */
const GROOVE: number = 3 * HumanAnatomyShared.CREASE;

/** Half the read span across the elbow, a share of the stature. */
const SPAN: number = 0.04;

/**
 * The front of one elbow as a kink region: the arm's chain cut through the
 * shoulder-to-wrist axis at the front azimuths, about the elbow joint.
 *
 * @param side The arm.
 * @returns The region.
 */
function region(side: "left" | "right"): HumanCurveKinks.IRegion {
  return {
    name: `${side} cubital fossa, front meridians`,
    rule: side === "left" ? "FOSSA-AR-1" : "FOSSA-AR-2",
    chains: new RegExp(`^arm\\.${side}$`),
    frame: (skin: HumanAnatomy.ISkin, stature: number): HumanCurveKinks.IFrame => {
      const shoulder: V3 = HumanAnatomy.joint(skin, `${side}UpperArm`);
      const elbow: V3 = HumanAnatomy.joint(skin, `${side}LowerArm`);
      const wrist: V3 = HumanAnatomy.joint(skin, `${side}Hand`);
      const axis: V3 = HumanAnatomy.unit(HumanAnatomy.sub(wrist, shoulder));
      return { origin: elbow, axis, forward: [1, 0, 0], from: -SPAN * stature, to: SPAN * stature, reach: 0.05 * stature };
    },
    azimuths: [-40, -30, -20, -10, 0, 10, 20, 30, 40],
  };
}

/**
 * The sharpest reading of a region's rows.
 *
 * @param rows The rows.
 * @returns The largest value, mm; 0 when none.
 */
function worst(rows: HumanAnatomyAudit.IRow[]): number {
  return rows.reduce((m: number, r: HumanAnatomyAudit.IRow): number => Math.max(m, Number.isFinite(r.value) ? r.value : 0), 0);
}
