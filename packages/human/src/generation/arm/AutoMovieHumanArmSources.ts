import type {
  IAutoMovieHumanArmFrame,
  IAutoMovieHumanArmHandControls,
  IAutoMovieHumanArmSources,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanDigitWalk,
  IAutoMovieHumanHandBones,
  IAutoMovieHumanHandParent,
  IAutoMovieHumanSourceDefinition,
} from "@automovie/interface";

import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import { AutoMovieHumanHandAttachment } from "../hand/AutoMovieHumanHandAttachment";
import { AutoMovieHumanDigitInterim } from "../limb/AutoMovieHumanDigitInterim";
import { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanArmFrame } from "./AutoMovieHumanArmFrame";
import { AutoMovieHumanArmHandControls } from "./AutoMovieHumanArmHandControls";
import { AutoMovieHumanArmInterim } from "./AutoMovieHumanArmInterim";
import { AutoMovieHumanArmWalk } from "./AutoMovieHumanArmWalk";

/**
 * Arm and hand original factories from direct rest/attachment definitions,
 * before any trunk or skeleton assembly.
 */
export namespace AutoMovieHumanArmSources {
  /**
   * Enumerate the same digit keys the source factories use, without preparing
   * geometry.
   */
  export function names(
    side: IAutoMovieHumanArmSources.IInput["side"],
  ): string[] {
    return [
      ...FINGERS.map(
        (finger: (typeof FINGERS)[number]): string =>
          `finger.${side}.${finger.toLowerCase()}`,
      ),
      `thumb.${side}`,
    ];
  }

  /**
   * Prepare this side's actual arm laws once; no leg, foot, trunk or opposite
   * arm is evaluated.
   */
  export function create(
    input: IAutoMovieHumanArmSources.IInput,
  ): IAutoMovieHumanArmSources.IOutput {
    const side: IAutoMovieHumanArmSources.IInput["side"] = input.side;
    const measures: IAutoMovieHumanBodyMeasures = input.measures;
    const {
      shoulder,
      elbow,
      wrist,
    }: IAutoMovieHumanArmSources.IInput["rest"]["bones"] = input.rest.bones;
    const hand: IAutoMovieHumanHandBones.IOutput = input.rest.hand;
    const knuckle: Vec3 = hand.knuckle;
    const crease: Vec3 = hand.crease;

    // The arm and palm's sites from the person's tapes.
    const humerus: number = Math.hypot(
      ...shoulder.map((value: number, c: number): number => value - elbow[c]!),
    );
    const arm: IAutoMovieHumanArmWalk.ISiteLaw[] =
      AutoMovieHumanArmInterim.sites(
        side,
        input.arms,
        elbow,
        wrist,
        {
          projection: input.rest.projection,
          humerus,
          calipers: measures,
        },
        true,
        hand.radialCenter,
      );
    const depth: (site: string) => number = (site: string): number => {
      const s: IAutoMovieHumanArmWalk.ISiteLaw | undefined = arm.find(
        (l: IAutoMovieHumanArmWalk.ISiteLaw): boolean => l.site === site,
      );
      if (s === undefined)
        throw new Error(`The ${side} arm lacks its sided ${site} source law`);
      return s.edges[0] - s.edges[2];
    };
    const palm: IAutoMovieHumanArmWalk.ISiteLaw = arm.find(
      (site: IAutoMovieHumanArmWalk.ISiteLaw): boolean =>
        site.site === "knuckles",
    )!;
    const palmDepth: number = palm.edges[1] - palm.edges[3];

    // The common chart is skeletal geometry only. Its local palm controls
    // close no upper-arm tape or bideltoid constraint for a digit request.
    const frame: () => IAutoMovieHumanArmFrame.IOutput = lazy(
      (): IAutoMovieHumanArmFrame.IOutput => {
        const value: IAutoMovieHumanArmFrame.IOutput | string =
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
    const shared: () => IAutoMovieHumanArmHandControls.IOutput = lazy(
      (): IAutoMovieHumanArmHandControls.IOutput =>
        AutoMovieHumanArmHandControls.create(frame()),
    );

    const armControls: () => IAutoMovieHumanArmWalk.IPrepared = lazy(
      (): IAutoMovieHumanArmWalk.IPrepared =>
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
    const armDefinition: () => IAutoMovieHumanSourceDefinition = lazy(
      (): IAutoMovieHumanSourceDefinition =>
        AutoMovieHumanSiteViewPart.fromControls(armControls()),
    );
    const handParent: () => IAutoMovieHumanHandParent.IOutput = lazy(
      (): IAutoMovieHumanHandParent.IOutput =>
        AutoMovieHumanHandAttachment.fromControls(shared().hand),
    );
    const branch: (
      walk: IAutoMovieHumanDigitWalk.IInput,
    ) => IAutoMovieHumanBodyLane.IDigit = (
      walk: IAutoMovieHumanDigitWalk.IInput,
    ): IAutoMovieHumanBodyLane.IDigit => {
      const digit: IAutoMovieHumanDigitWalk.IInput =
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
    ) => IAutoMovieHumanBodyLane.IDigit = (
      f: "Index" | "Middle" | "Ring" | "Little",
      digit: 2 | 3 | 4 | 5,
    ): IAutoMovieHumanBodyLane.IDigit => {
      const source: IAutoMovieHumanHandBones.IDigit = hand.fingers[f];
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
    const digits: Map<string, () => IAutoMovieHumanBodyLane.IDigit> = new Map(
      FINGERS.map(
        (
          f: (typeof FINGERS)[number],
          k: number,
        ): [string, () => IAutoMovieHumanBodyLane.IDigit] => [
          `finger.${side}.${f.toLowerCase()}`,
          lazy(
            (): IAutoMovieHumanBodyLane.IDigit =>
              finger(f, (k + 2) as 2 | 3 | 4 | 5),
          ),
        ],
      ),
    );
    digits.set(
      `thumb.${side}`,
      lazy(
        (): IAutoMovieHumanBodyLane.IDigit =>
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
      arm: (): Omit<IAutoMovieHumanBodyLane.ISide["arm"], "trunk"> => ({
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
      digit(part: string): IAutoMovieHumanBodyLane.IDigit | undefined {
        return digits.get(part)?.();
      },
      fingers: (): IAutoMovieHumanBodyLane.IDigit[] =>
        [...digits.values()].map(
          (
            read: () => IAutoMovieHumanBodyLane.IDigit,
          ): IAutoMovieHumanBodyLane.IDigit => read(),
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
