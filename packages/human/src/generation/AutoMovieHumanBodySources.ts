import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  IAutoMovieHumanBodyFrame,
  IAutoMovieHumanBodySources,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanHeadPlacement,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanLimbSources,
  IAutoMovieHumanNeckBoundary,
  IAutoMovieHumanNeckConstruction,
  IAutoMovieHumanNeckSource,
  IAutoMovieHumanSkeletonLaw,
  IAutoMovieHumanTrunkSolution,
  IAutoMovieLoftChain,
  IAutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyBox } from "./AutoMovieHumanBodyBox";
import { AutoMovieHumanBodyFrame } from "./AutoMovieHumanBodyFrame";
import { AutoMovieHumanLimbRest } from "./AutoMovieHumanLimbRest";
import { AutoMovieHumanLimbSources } from "./AutoMovieHumanLimbSources";
import { AutoMovieHumanNeckBoundary } from "./AutoMovieHumanNeckBoundary";
import { AutoMovieHumanNeckSource } from "./AutoMovieHumanNeckSource";
import { AutoMovieHumanShoulderDatum } from "./AutoMovieHumanShoulderDatum";
import { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import { AutoMovieHumanHeadLane } from "./head/AutoMovieHumanHeadLane";
import { AutoMovieHumanHeadNeckScalars } from "./head/AutoMovieHumanHeadNeckScalars";
import { AutoMovieHumanHeadPose } from "./head/AutoMovieHumanHeadPose";
import { AutoMovieHumanHeadSourceAxis } from "./head/AutoMovieHumanHeadSourceAxis";

/** Direct common anatomical definitions and explicit original-family requests, before tree assembly or raw geometry. */
export namespace AutoMovieHumanBodySources {
  /**
   * Resolve source invocation inputs and expose explicit common/original requests.
   * The same local boundary is prepared only when an actual consumer needs it. No source/property/metadata getter constructs
   * a head, trunk tree or raw chain.
   *
   * @evidence contracts/common.md#principled-implementation Anatomical inputs produce shared neck scalar/section/frame2 before either part; body bones use only their actual common attachment datum, and requested factories consume these same original definitions.
   * @evidence contracts/common.md#clear-and-simple-design Keeps common definition, head originals, trunk constraints, body anatomy, selected original factories and explicit raw requests at distinct calls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither HeadLane.prepare nor lower/lowerSource runs to obtain the boundary. No fake head, empty completed skeleton, alternate coordinate, fitted endpoint or hidden Point0 inverse replaces a dependency.
   * @evidence contracts/common.md#meaningful-documentation Local native supports and world frame2 are separate; null intervals are unrequested, body bones are a subset, and raw is an explicit method rather than an observable getter.
   * @evidence contracts/performance.md#efficient-algorithms Performs required common scalar constraints once at explicit demand; a requested family owns its actual remaining arithmetic and no unrequested head/body sibling or raw geometry is generated.
   * @evidence contracts/performance.md#reuse-equivalent-work Call-owned closures retain identical actual head, solution, body anatomy and raw results; full production completes this same source context.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only this invocation's generating definitions and explicitly requested sources; no global cache, watcher, renderer or process is introduced.
   */
  export function create(
    input: IAutoMovieHumanBodySources.IInput,
  ): IAutoMovieHumanBodySources.IOriginal {
    const sex: AutoMovieHumanSexType = AutoMovieHumanBodyAnatomy.sexOf(
      input.params,
    );
    const scale: number = input.limbs.legs.scale;

    // This is HeadLandmarks.layout's public stature arithmetic, before any
    // head layout or neck inverse. It preserves its binary64 operation order.
    const stature: number =
      (input.headInputs.height - input.headInputs.head.height) * scale +
      input.headInputs.head.height * scale;
    const frame: IAutoMovieHumanBodyFrame.IOutput =
      AutoMovieHumanBodyFrame.create(
        AutoMovieHumanBodyAnatomy.resolve(input.params),
        scale,
      );
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [
      ...AutoMovieHumanBodyBox.diagnose(
        AutoMovieHumanBodyAnatomy.resolve(input.params),
      ),
    ];
    const milliseconds: IAutoMovieHumanBodySources.IOriginal["milliseconds"] = {
      common: null,
      neckBoundary: null,
      headSource: null,
      trunkConstraints: null,
      bodyAnatomy: null,
      neckRaw: null,
    };
    let shared: IAutoMovieHumanBodySources.ICommon | undefined;
    let boundary: IAutoMovieHumanNeckBoundary.IOutput | undefined;
    let boundaryFailed: boolean = false;
    let boundaryError: unknown;
    let commonFailed: boolean = false;
    let commonError: unknown;
    let head: IAutoMovieHumanHeadLane.IPrepared | undefined;
    let solution: IAutoMovieHumanTrunkSolution | undefined;
    let anatomy: IAutoMovieHumanSkeletonLaw.IOutput | undefined;
    let rests: IAutoMovieHumanLimbRest.IOutput | undefined;
    let limbs: IAutoMovieHumanLimbSources.IOutput | undefined;
    let neck: IAutoMovieHumanNeckConstruction.IOutput | undefined;

    /** Required shared constraints are measured here on explicit first demand, including original failures. */
    const common: IAutoMovieHumanBodySources.IOriginal["common"] =
      (): IAutoMovieHumanBodySources.ICommon => {
        if (shared !== undefined) return shared;
        if (commonFailed) throw commonError;
        const began: number = performance.now();
        try {
          const neckSource: IAutoMovieHumanNeckSource.IOutput =
            AutoMovieHumanNeckSource.of(
              input.headInputs,
              input.limbs.legs.scale,
            );
          const pose: IAutoMovieHumanHeadPlacement.IOutput =
            AutoMovieHumanHeadPose.create(input.headInputs, sex, neckSource);
          const controls: typeof pose.neck.layout.neck.curves =
            pose.neck.layout.neck.curves;
          if (controls === undefined)
            throw new Error(
              "The original neck boundary has no shared generating controls",
            );
          if (pose.neck.layout.vertex !== stature)
            throw new Error(
              "Common and head source stature arithmetic disagree",
            );
          const stations: number[] = [neckSource.bottom[1], stature];
          const upperSupport: IAutoMovieHumanBodySources.ICommon["upperSupport"] =
            {
              part: {
                stations,
                axis: AutoMovieHumanHeadSourceAxis.of(
                  {
                    x: controls.centre,
                    y: {
                      knots: stations.map(
                        (
                          station: number,
                          i: number,
                        ): IAutoMovieViewPart.IKnot => ({
                          site: `common.neck.axis.${i}`,
                          station,
                          value: station,
                        }),
                      ),
                    },
                    z: {
                      knots: stations.map(
                        (
                          station: number,
                          i: number,
                        ): IAutoMovieViewPart.IKnot => ({
                          site: `common.neck.zero.${i}`,
                          station,
                          value: 0,
                        }),
                      ),
                    },
                  },
                  [1, 0, 0],
                  [0, 0, 1],
                ),
              },
              crown: [pose.neck.layout.centre, stature, 0],
            };

          shared = {
            parameters: input.params,
            inputs: input.headInputs,
            neckSource,
            upperSupport,
            pose,
          };
          return shared;
        } catch (error: unknown) {
          commonFailed = true;
          commonError = error;
          throw error;
        } finally {
          milliseconds.common = performance.now() - began;
        }
      };

    /** Prepare only the actual legacy receiver cut when that consumer explicitly needs it. */
    const neckBoundary: IAutoMovieHumanBodySources.IOriginal["neckBoundary"] =
      (): IAutoMovieHumanNeckBoundary.IOutput => {
        if (boundary !== undefined) return boundary;
        if (boundaryFailed) throw boundaryError;
        const began: number = performance.now();
        try {
          const actual: IAutoMovieHumanBodySources.ICommon = common();
          const controls: typeof actual.pose.neck.layout.neck.curves =
            actual.pose.neck.layout.neck.curves;
          if (controls === undefined)
            throw new Error(
              "The requested neck cut has no closed common scalar family",
            );
          boundary = AutoMovieHumanNeckBoundary.create(
            controls,
            actual.neckSource.bottom[1],
          );
          return boundary;
        } catch (error: unknown) {
          boundaryFailed = true;
          boundaryError = error;
          throw error;
        } finally {
          milliseconds.neckBoundary = performance.now() - began;
        }
      };

    /** This is the actual head producer, called only by a requested head or explicit raw consumer. */
    const headSource: IAutoMovieHumanBodySources.IOriginal["headSource"] =
      (): IAutoMovieHumanHeadLane.IPrepared => {
        if (head !== undefined) return head;
        const began: number = performance.now();
        try {
          const actual: IAutoMovieHumanBodySources.ICommon = common();
          head = AutoMovieHumanHeadLane.prepare(
            input.headInputs,
            sex,
            actual.neckSource,
            actual.pose,
          );
          return head;
        } finally {
          milliseconds.headSource = performance.now() - began;
        }
      };

    /** Only the explicit legacy loft consumer calls this supplier. */
    const neckRaw: IAutoMovieHumanBodySources.IOriginal["neckRaw"] =
      (): IAutoMovieLoftChain => {
        if (neck === undefined) {
          const began: number = performance.now();
          try {
            neck = headSource().source.lower(common().neckSource);
            diagnostics.push(...neck.loft.diagnostics);
          } finally {
            milliseconds.neckRaw = performance.now() - began;
          }
        }
        if (neck.loft.chain === null)
          throw new Error(
            "The actual head-source neck interval made no chain: " +
              JSON.stringify(neck.loft.diagnostics),
          );
        return neck.loft.chain;
      };

    /** The shared numerical placement consumes the original cut, never a manufactured chain. */
    const trunkSolution: IAutoMovieHumanBodySources.IOriginal["trunkSolution"] =
      (): IAutoMovieHumanTrunkSolution => {
        if (solution !== undefined) return solution;
        const began: number = performance.now();
        try {
          solution = AutoMovieHumanTrunkSolver.solve({
            inputs: input.trunkInputs,
            stature,
            crotch: input.limbs.crotch,
            neckBoundary: neckBoundary().seat,
            rawNeck: neckRaw,
          });
          diagnostics.push(...solution.diagnostics);
          return solution;
        } finally {
          milliseconds.trunkConstraints = performance.now() - began;
        }
      };

    /** Keep independent local limb placement before either source or whole bind consumes it. */
    const limbRest: IAutoMovieHumanBodySources.IOriginal["limbRest"] =
      (): IAutoMovieHumanLimbRest.IOutput => {
        rests ??= AutoMovieHumanLimbRest.create({
          stature,
          arms: input.limbs.arms,
          feet: input.limbs.feet,
          legs: input.limbs.legs,
          sex,
          diagnostics,
          hipForward: frame.perineum,
          shoulder: (): IAutoMovieHumanLimbRest.IShoulder =>
            AutoMovieHumanShoulderDatum.create(
              input.trunkInputs,
              stature,
              neckBoundary().seat.side,
            ),
        });
        return rests;
      };

    /** A factory request prepares no whole rest, head, trunk, part or raw geometry. */
    const limbSources: IAutoMovieHumanBodySources.IOriginal["limbSources"] =
      (): IAutoMovieHumanLimbSources.IOutput => {
        limbs ??= AutoMovieHumanLimbSources.create({
          rest: limbRest(),
          measures: AutoMovieHumanBodyAnatomy.resolve(input.params),
          arms: input.limbs.arms,
          feet: input.limbs.feet,
          scale,
          crotch: input.limbs.crotch,
          diagnostics,
          completeLeg: input.completeLeg,
        });
        return limbs;
      };

    /** Body-only rest data uses the common neck local/world datum, not eye or head geometry. */
    const bodyAnatomy: IAutoMovieHumanBodySources.IOriginal["bodyAnatomy"] =
      (): IAutoMovieHumanSkeletonLaw.IOutput => {
        if (anatomy !== undefined) return anatomy;
        const placed: IAutoMovieHumanTrunkSolution = trunkSolution();
        const began: number = performance.now();
        try {
          const actual: IAutoMovieHumanBodySources.ICommon = common();
          anatomy = AutoMovieHumanSkeletonLaw.body(
            { stature, diagnostics },
            {
              arms: input.limbs.arms,
              feet: input.limbs.feet,
              legs: input.limbs.legs,
              trunk: placed.landmarks,
              sex,
              limbs: limbRest(),
              neckBase: AutoMovieHumanHeadNeckScalars.axis(
                actual.pose.neck.layout.neck,
              ).point(actual.neckSource.bottom[1]),
              neckRadius: actual.pose.neck.layout.neck.radius,
            },
          );
          return anatomy;
        } finally {
          milliseconds.bodyAnatomy = performance.now() - began;
        }
      };
    return {
      ...input,
      stature,
      frame,
      limbRest,
      limbSources,
      diagnostics,
      milliseconds,
      common,
      neckBoundary,
      headSource,
      trunkSolution,
      bodyAnatomy,
      neckRaw,
    };
  }
}
