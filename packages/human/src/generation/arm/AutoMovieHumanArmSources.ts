import type { AutoMovieHumanArmConstruction } from "../AutoMovieHumanArmConstruction";
import type { AutoMovieHumanBodyLane } from "../AutoMovieHumanBodyLane";
import type { AutoMovieHumanLimbRest } from "../AutoMovieHumanLimbRest";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanHandAttachment } from "../hand/AutoMovieHumanHandAttachment";
import type { AutoMovieHumanHandBones } from "../hand/AutoMovieHumanHandBones";
import { AutoMovieHumanDigitInterim } from "../limb/AutoMovieHumanDigitInterim";
import { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanArmFrame } from "./AutoMovieHumanArmFrame";
import { AutoMovieHumanArmHandControls } from "./AutoMovieHumanArmHandControls";
import { AutoMovieHumanArmInterim } from "./AutoMovieHumanArmInterim";
import { AutoMovieHumanArmWalk } from "./AutoMovieHumanArmWalk";

/** Arm and hand original factories from direct rest/attachment definitions, before any trunk or skeleton assembly. */
export namespace AutoMovieHumanArmSources {
  /** The arm's actual inputs; no other source, curve or mesh is required. */
  export interface IInput {
    /** Side-qualified source names. */
    side: "left" | "right";

    /** The same direct rest definition later used by bind bones. */
    rest: AutoMovieHumanLimbRest.IArm;

    /** Public arm/hand dimensions, calibration mm. */
    arms: AutoMovieHumanArmConstruction.IInputs & { bideltoid: number };

    /** Resolved public measures used by the original digit law. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Calibration scale. */
    scale: number;
  }

  /** Source-only capabilities; no full body, raw loft or proximal join is implied. */
  export interface IOutput {
    /** Same arm definition used by production and the hand contact owner. */
    definition(): AutoMovieHumanSiteViewPart.IDefinition;

    /** Explicit production arm metadata; its trunk fold is assembly-owned. */
    arm(): Omit<AutoMovieHumanBodyLane.ISide["arm"], "trunk">;

    /** Existing digit names without authoring their geometry. */
    digitNames: readonly string[];

    /** Request one actual digit while reusing its shared palm controls. */
    digit(name: string): AutoMovieHumanBodyLane.IDigit | undefined;

    /** Explicit all-digit request used only by full assembly. */
    fingers(): AutoMovieHumanBodyLane.IDigit[];
  }

  /** Enumerate the same digit keys the source factories use, without preparing geometry. */
  export function names(side: IInput["side"]): string[] {
    return [
      ...FINGERS.map(
        (finger: (typeof FINGERS)[number]): string =>
          `finger.${side}.${finger.toLowerCase()}`,
      ),
      `thumb.${side}`,
    ];
  }

  /** Prepare this side's actual arm laws once; no leg, foot, trunk or opposite arm is evaluated. */
  export function create(input: IInput): IOutput {
    const side: IInput["side"] = input.side;
    const measures: IAutoMovieHumanBodyMeasures = input.measures;
    const { shoulder, elbow, wrist }: IInput["rest"]["bones"] =
      input.rest.bones;
    const hand: AutoMovieHumanHandBones.IOutput = input.rest.hand;
    const knuckle: Vec3 = hand.knuckle;
    const crease: Vec3 = hand.crease;

    // The arm and palm's sites from the person's tapes.
    const humerus: number = Math.hypot(
      ...shoulder.map((value: number, c: number): number => value - elbow[c]!),
    );
    const arm: AutoMovieHumanArmWalk.ISiteLaw[] =
      AutoMovieHumanArmInterim.sites(
        side,
        input.arms,
        elbow,
        wrist,
        {
          projection: input.rest.projection,
          humerus,
        },
        true,
        hand.radialCenter,
      );
    const depth: (site: string) => number = (site: string): number => {
      const s: AutoMovieHumanArmWalk.ISiteLaw | undefined = arm.find(
        (l: AutoMovieHumanArmWalk.ISiteLaw): boolean => l.site === site,
      );
      if (s === undefined)
        throw new Error(`The ${side} arm lacks its sided ${site} source law`);
      return s.edges[0] - s.edges[2];
    };
    const palm: AutoMovieHumanArmWalk.ISiteLaw = arm.find(
      (site: AutoMovieHumanArmWalk.ISiteLaw): boolean =>
        site.site === "knuckles",
    )!;
    const palmDepth: number = palm.edges[1] - palm.edges[3];

    // The common chart is skeletal geometry only. Its local palm controls
    // close no upper-arm tape or bideltoid constraint for a digit request.
    const frame: () => AutoMovieHumanArmFrame.IOutput = lazy(
      (): AutoMovieHumanArmFrame.IOutput => {
        const value: AutoMovieHumanArmFrame.IOutput | string =
          AutoMovieHumanArmFrame.create({
            name: `arm.${side}`,
            bones: { shoulder, elbow, wrist },
            knuckle,
            reach: palmDepth / 2,
            sites: arm,
            joints: { elbow: depth("elbow"), wrist: depth("wrist") },
            gap: AutoMovieHumanTrunkRows.MAX_GAP,
            crease,
            radial: hand.frame.across,
            order: AutoMovieHumanArmWalk.ORDER,
          });
        if (typeof value === "string") throw new Error(value);
        return value;
      },
    );
    const shared: () => AutoMovieHumanArmHandControls.IOutput = lazy(
      (): AutoMovieHumanArmHandControls.IOutput =>
        AutoMovieHumanArmHandControls.create(frame()),
    );

    const armControls: () => AutoMovieHumanArmWalk.IPrepared = lazy(
      (): AutoMovieHumanArmWalk.IPrepared =>
        AutoMovieHumanArmWalk.prepare(
          `arm.${side}`,
          { shoulder, elbow, wrist },
          knuckle,
          palmDepth / 2,
          arm,
          { elbow: depth("elbow"), wrist: depth("wrist") },
          AutoMovieHumanTrunkRows.MAX_GAP,
          crease,
          hand.frame.across,
          {
            breadth: input.arms.bideltoid,
            lateral: Math.abs(shoulder[2]),
            humerus,
          },
          { frame: frame(), hand: shared() },
        ),
    );
    const armDefinition: () => AutoMovieHumanSiteViewPart.IDefinition = lazy(
      (): AutoMovieHumanSiteViewPart.IDefinition =>
        AutoMovieHumanSiteViewPart.fromControls(armControls()),
    );
    const handParent: () => AutoMovieHumanHandAttachment.IParent = lazy(
      (): AutoMovieHumanHandAttachment.IParent =>
        AutoMovieHumanHandAttachment.fromControls(shared().hand),
    );
    const branch: (
      walk: AutoMovieHumanDigitWalk.IInput,
    ) => AutoMovieHumanBodyLane.IDigit = (
      walk: AutoMovieHumanDigitWalk.IInput,
    ): AutoMovieHumanBodyLane.IDigit => {
      const digit: AutoMovieHumanDigitWalk.IInput =
        AutoMovieHumanHandAttachment.attach(handParent(), walk);
      return {
        digit,
        definition: AutoMovieHumanDigitWalk.define(digit),
        fold: {
          search: { phi: 0, from: 0, to: 0.5 },
          radius: walk.law("base").breadth / 2,
        },
      };
    };

    // The source hand owns these material directions. A cross product of
    // unequal metacarpals and an already flexed middle phalanx would
    // reconstruct a different frame and then lend it to every digit.
    const handLength: number =
      (side === "left" ? input.arms.left : input.arms.right).length /
      input.scale;
    const finger: (
      f: "Index" | "Middle" | "Ring" | "Little",
      digit: 2 | 3 | 4 | 5,
    ) => AutoMovieHumanBodyLane.IDigit = (
      f: "Index" | "Middle" | "Ring" | "Little",
      digit: 2 | 3 | 4 | 5,
    ): AutoMovieHumanBodyLane.IDigit => {
      const source: AutoMovieHumanHandBones.IDigit = hand.fingers[f];
      return branch(
        AutoMovieHumanDigitInterim.finger(
          `finger.${side}.${f.toLowerCase()}`,
          source.centres,
          source.dorsal,
          measures.sex,
          handLength,
          digit,
          input.scale,
        ),
      );
    };
    const digits: Map<string, () => AutoMovieHumanBodyLane.IDigit> = new Map(
      FINGERS.map(
        (
          f: (typeof FINGERS)[number],
          k: number,
        ): [string, () => AutoMovieHumanBodyLane.IDigit] => [
          `finger.${side}.${f.toLowerCase()}`,
          lazy(
            (): AutoMovieHumanBodyLane.IDigit =>
              finger(f, (k + 2) as 2 | 3 | 4 | 5),
          ),
        ],
      ),
    );
    digits.set(
      `thumb.${side}`,
      lazy(
        (): AutoMovieHumanBodyLane.IDigit =>
          branch(
            AutoMovieHumanDigitInterim.finger(
              `thumb.${side}`,
              hand.thumb.centres,
              hand.thumb.dorsal,
              measures.sex,
              handLength,
              1,
              input.scale,
            ),
          ),
      ),
    );

    return {
      definition: armDefinition,
      arm: (): Omit<AutoMovieHumanBodyLane.ISide["arm"], "trunk"> => ({
        definition: armDefinition(),
        bones: { shoulder, elbow, wrist },
        knuckle,
        crease,
        radial: hand.frame.across,
        reach: palmDepth / 2,
        measuring: {
          breadth: input.arms.bideltoid,
          lateral: Math.abs(shoulder[2]),
          humerus,
        },
        sites: arm,
        joints: { elbow: depth("elbow"), wrist: depth("wrist") },
      }),
      digitNames: [...digits.keys()],
      digit(part: string): AutoMovieHumanBodyLane.IDigit | undefined {
        return digits.get(part)?.();
      },
      fingers: (): AutoMovieHumanBodyLane.IDigit[] =>
        [...digits.values()].map(
          (
            read: () => AutoMovieHumanBodyLane.IDigit,
          ): AutoMovieHumanBodyLane.IDigit => read(),
        ),
    };
  }
}

/** Original calibration-mm vector. */
type Vec3 = [number, number, number];

/** Actual fixed digit names shared with the bind vocabulary. */
const FINGERS: readonly ("Index" | "Middle" | "Ring" | "Little")[] = [
  "Index",
  "Middle",
  "Ring",
  "Little",
];

/** The existing call-owned original factory memo; failures are not substituted. */
const { lazy }: Pick<typeof AutoMovieHumanSiteViewPart, "lazy"> =
  AutoMovieHumanSiteViewPart;
