import type {
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBranchEvent,
  IAutoMovieHumanBranchSplit,
  IAutoMovieHumanFootBody,
  IAutoMovieHumanFootBones,
  IAutoMovieHumanFootConstruction,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootPrior,
  IAutoMovieHumanFootToeSpan,
  IAutoMovieHumanFootWebLine,
  IAutoMovieHumanFootWebRing,
  IAutoMovieHumanNailWindow,
  IAutoMovieHumanSurfacePole,
  IAutoMovieLoftChain,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import { AutoMovieHumanFootBodyChain } from "./AutoMovieHumanFootBodyChain";
import { AutoMovieHumanFootBones } from "./AutoMovieHumanFootBones";
import { AutoMovieHumanFootCrestForefoot } from "./AutoMovieHumanFootCrestForefoot";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootKnots } from "./AutoMovieHumanFootKnots";
import { AutoMovieHumanFootMalleolus } from "./AutoMovieHumanFootMalleolus";
import { AutoMovieHumanFootReflection } from "./AutoMovieHumanFootReflection";
import { AutoMovieHumanFootToeChain } from "./AutoMovieHumanFootToeChain";
import { AutoMovieHumanFootToeSpan } from "./AutoMovieHumanFootToeSpan";
import { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";
import { AutoMovieHumanFootWebRing } from "./AutoMovieHumanFootWebRing";

/**
 * Both feet generated from foot length, foot breadth and lateral malleolus
 * height by one construction in the left foot's frame and a declared
 * reflection ({@link AutoMovieHumanFootReflection}); each side takes its own
 * dimensions into the same construction.
 *
 * This module only composes the foot's pieces, each in its own file under
 * `./foot`:
 *
 * - {@link AutoMovieHumanFootBones}: the anatomical centres, before any skin,
 *   which {@link bones} hands to the skeleton.
 * - {@link AutoMovieHumanFootFan}: the body's section planes.
 * - `AutoMovieHumanFootGuide`: the five guides, each owning its junction's jet.
 * - {@link AutoMovieHumanFootBody}: each section from the dorsal arcs, the
 *   lateral border's plantar piece, the sole's contact and the medial arch.
 * - {@link AutoMovieHumanFootMalleolus}: the malleoli's relief windows.
 * - {@link AutoMovieHumanFootBodyChain}: the body's chain to the ankle ring.
 * - {@link AutoMovieHumanFootWebRing}: the ring the toes leave through the
 *   webs' surface (`AutoMovieHumanBodyWeb`, event `web: true`).
 * - {@link AutoMovieHumanFootToeSpan}, `AutoMovieHumanFootToeSection` and
 *   {@link AutoMovieHumanFootToeChain}: each toe on its line.
 *
 * The ankle centre stands at the origin here; the stance belongs to
 * `AutoMovieHumanLegConstruction.stand`.
 */
export namespace AutoMovieHumanFootConstruction {
  /** Calibration with both feet, their events and their poles added. */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IAutoMovieHumanFootConstruction.IInputs,
  ): IAutoMovieHumanBodyCalibration {
    const feet: IFoot[] = (["left", "right"] as const).map(
      (side: "left" | "right"): IFoot =>
        foot(inputs[side], side, calibration.diagnostics ?? []),
    );
    return {
      ...calibration,
      chains: [
        ...calibration.chains,
        ...feet.flatMap((f: IFoot): IAutoMovieLoftChain[] => f.chains),
      ],
      events: [
        ...calibration.events,
        ...feet.flatMap((f: IFoot): IAutoMovieHumanBranchEvent[] => f.events),
      ],
      poles: [
        ...calibration.poles,
        ...feet.flatMap((f: IFoot): IAutoMovieHumanSurfacePole[] => f.poles),
      ],
      nails: [
        ...(calibration.nails ?? []),
        ...feet.flatMap((f: IFoot): IAutoMovieHumanNailWindow[] => f.nails),
      ],
    };
  }

  /**
   * Both sides' anatomical centres, in the frame the chains are built in.
   *
   * @param inputs Dimensions in calibration millimetres.
   */
  export function bones(
    inputs: IAutoMovieHumanFootConstruction.IInputs,
  ): Record<"left" | "right", IAutoMovieHumanFootBones.IBones> {
    return {
      left: AutoMovieHumanFootBones.of(inputs.left, 1).bones,
      right: AutoMovieHumanFootBones.of(inputs.right, -1).bones,
    };
  }

  /**
   * Dimensions of a person whose feet are not measured: ANSUR II's women's and
   * men's foot length over stature, breadth over length and lateral malleolus
   * line, mixed by the masculine-feminine control (+1 feminine, -1 masculine).
   *
   * @param stature Stature in world millimetres.
   * @param sex Masculine-feminine control.
   * @param scale Calibration millimetres per world millimetre.
   */
  export function expected(
    stature: number,
    sex: number,
    scale: number,
  ): IAutoMovieHumanFootFrame.IDimensions {
    const e = AutoMovieHumanFootPrior.PRIOR.expected;
    const men: number = Math.min(1, Math.max(0, (1 - sex) / 2));
    const mix = (pair: readonly [number, number]): number =>
      pair[0] + (pair[1] - pair[0]) * men;
    const length: number = mix(e.length) * stature;
    return {
      length: length * scale,
      breadth: mix(e.breadth) * length * scale,
      ankle:
        mix([
          e.ankle[0][0] + e.ankle[0][1] * stature,
          e.ankle[1][0] + e.ankle[1][1] * stature,
        ]) * scale,
    };
  }

  /** Whether a chain belongs to a foot. */
  export function owns(name: string): boolean {
    return OWNED.test(name);
  }

  /** One side's chains, events and poles. */
  interface IFoot {
    chains: IAutoMovieLoftChain[];
    events: IAutoMovieHumanBranchEvent[];
    poles: IAutoMovieHumanSurfacePole[];
    nails: IAutoMovieHumanNailWindow[];
  }

  /**
   * One side's foot: the left construction with this side's dimensions, reflected.
   *
   * @param d The side's dimensions.
   * @param side Which side.
   * @param diagnostics The list a degraded piece records into.
   */
  function foot(
    d: IAutoMovieHumanFootFrame.IDimensions,
    side: "left" | "right",
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
  ): IFoot {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const prior: IAutoMovieHumanFootPrior.IPrior =
      AutoMovieHumanFootPrior.PRIOR;
    const centres: IAutoMovieHumanFootBones.ICentres =
      AutoMovieHumanFootBones.of(d, 1);
    const k: IAutoMovieHumanFootFrame.IFrame = centres.frame;
    const line: IAutoMovieHumanFootWebLine.IWebLine =
      AutoMovieHumanFootWebLine.of({
        frame: k,
        depth: AutoMovieHumanFootCrestForefoot.depth,
      });
    const guides: IAutoMovieHumanFootBody.IGuides =
      AutoMovieHumanFootKnots.guides(k, line);
    const body: IAutoMovieHumanFootBody.IBody = AutoMovieHumanFootBody.of({
      frame: k,
      line,
      guides,
      diagnostics,
      producer: `foot.${side}`,
    });
    const web: IAutoMovieHumanFootWebRing.IWebRing =
      AutoMovieHumanFootWebRing.of(k, body);
    const toes: IAutoMovieHumanFootToeSpan.IToe[] = prior.toes.map(
      (
        _: IAutoMovieHumanFootPrior.IToe,
        i: number,
      ): IAutoMovieHumanFootToeSpan.IToe =>
        AutoMovieHumanFootToeSpan.of({
          frame: k,
          lines: centres.lines,
          index: i,
        }),
    );
    const name = (n: string): string => n.replace("{side}", side);
    const splits: IAutoMovieHumanBranchSplit[] = prior.toes.map(
      (
        t: IAutoMovieHumanFootPrior.IToe,
        i: number,
      ): IAutoMovieHumanBranchSplit => ({
        child: name(t.name),
        arcs: AutoMovieHumanFootReflection.arcs(web.arcs[i]!, sign),
      }),
    );
    return {
      chains: [
        AutoMovieHumanFootBodyChain.of(body, name("foot.{side}"), sign, [
          AutoMovieHumanFootMalleolus.of("lateral", k, body, sign, side),
          AutoMovieHumanFootMalleolus.of("medial", k, body, sign, side),
        ]),
        ...toes.map(
          (t: IAutoMovieHumanFootToeSpan.IToe): IAutoMovieLoftChain =>
            AutoMovieHumanFootToeChain.of(t, name(t.name), sign),
        ),
      ],
      events: [
        {
          parent: name("leg.{side}"),
          direction: "down",
          splits: [{ child: name("foot.{side}"), arcs: [[0, G.TWO_PI]] }],
        },
        {
          parent: name("foot.{side}"),
          direction: "down",
          web: true,
          splits: sign === 1 ? splits : [...splits].reverse(),
        },
      ],
      poles: toes.map(
        (t: IAutoMovieHumanFootToeSpan.IToe): IAutoMovieHumanSurfacePole => ({
          chain: name(t.name),
          end: "bottom",
          critical: true,
          point: G.sided(t.pole, sign),
        }),
      ),
      nails: toes.map(
        (t: IAutoMovieHumanFootToeSpan.IToe): IAutoMovieHumanNailWindow =>
          AutoMovieHumanFootToeChain.nail(t, name(t.name), sign),
      ),
    };
  }
}

/** Chains a foot owns. */
const OWNED: RegExp = /^(foot|forefoot|toe)\./;
