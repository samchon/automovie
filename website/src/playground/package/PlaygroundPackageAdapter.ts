import engineManifest from "@automovie/engine/package.json";
import humanManifest from "@automovie/human/package.json";
import * as motions from "@automovie/motions";
import {
  HUMAN_ACTIONS,
  type HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanVerdicts,
} from "@automovie/motions";
import motionsManifest from "@automovie/motions/package.json";
import renderManifest from "@automovie/render/package.json";
import viewerManifest from "@automovie/viewer/package.json";

import { SCENES } from "../../scenes/SCENES";
import { SceneStatus } from "../../scenes/package/SceneStatus";
import type { IScene } from "../../scenes/structures/IScene";
import type { IPlaygroundAdapter } from "../IPlaygroundAdapter";
import { PLAYGROUND_BODIES } from "../data/PLAYGROUND_BODIES";
import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../structures/IPlaygroundRefusal";
import type { IPlaygroundTimeline } from "../structures/IPlaygroundTimeline";
import type { IPlaygroundVerdicts } from "../structures/IPlaygroundVerdicts";
import type { IPlaygroundVocabulary } from "../structures/IPlaygroundVocabulary";
import { PlaygroundChain } from "./PlaygroundChain";
import { PlaygroundPerformance } from "./PlaygroundPerformance";
import { PlaygroundSchema } from "./PlaygroundSchema";
import { PlaygroundStage } from "./PlaygroundStage";

/**
 * The adapter over the installed packages: it builds a `HumanPerformance` of
 * `@automovie/motions` in the browser, on bodies of `@automovie/human`, and
 * reads the timeline, the refusal and the verdict report from it.
 *
 * Every list it describes is read from the packages' own data, so the
 * editor follows the installed release.
 */
export const PlaygroundPackageAdapter: IPlaygroundAdapter = {
  describe: async (): Promise<IPlaygroundVocabulary> => {
    const exported: Readonly<Record<string, unknown>> = motions as Readonly<
      Record<string, unknown>
    >;
    const laws: Readonly<Record<string, { overlay?: boolean }>> =
      HUMAN_ACTIONS as Readonly<Record<string, { overlay?: boolean }>>;
    const grammar: unknown = exported["HUMAN_GRAMMAR"];
    const schemas: Record<string, IPlaygroundVocabulary.IParameter[]> =
      PlaygroundSchema.rows();
    return {
      actions: Object.keys(laws).map(
        (name: string): IPlaygroundVocabulary.IAction => ({
          name,

          // The package exports no descriptor of an action's parameters yet.
          parameters: null,
          overlay: PlaygroundChain.has("over")
            ? laws[name]!.overlay === true
            : null,
        }),
      ),
      lexicon: Object.entries(PlaygroundChain.lexicon()).map(
        ([name, rows]): IPlaygroundVocabulary.IFamily => ({
          name,
          rows: rows.map((row: { name: string }): string => row.name),
          parameters: Object.fromEntries(
            rows
              .filter((row: { name: string }): boolean => row.name in schemas)
              .map(
                (row: {
                  name: string;
                }): [string, IPlaygroundVocabulary.IParameter[]] => [
                  row.name,
                  schemas[row.name]!,
                ],
              ),
          ),
        }),
      ),
      mutuals: Object.values(PlaygroundChain.mutuals()).map(
        (mutual): IPlaygroundVocabulary.IMutual => ({
          name: mutual.name,
          roles: [...mutual.roles],
        }),
      ),
      grammar:
        typeof grammar === "object" && grammar !== null
          ? (grammar as IPlaygroundVocabulary.IGrammar)
          : null,
      bodies: Object.entries(PLAYGROUND_BODIES).map(
        ([id, entry]): IPlaygroundVocabulary.IBody => ({
          id,
          label: entry.label,
        }),
      ),
      scenes: SCENES.filter(
        (scene: IScene): boolean =>
          scene.hidden !== true && SceneStatus.of(scene).kind === "plays",
      ).map((scene: IScene): string => scene.id),
      operators: {
        until: true,
        over: PlaygroundChain.has("over"),
        sync: PlaygroundChain.has("sync"),
        lexicon:
          PlaygroundChain.has("registered") &&
          Object.keys(PlaygroundChain.lexicon()).length !== 0,
        mutual: Object.keys(PlaygroundChain.mutuals()).length !== 0,
      },
      packages: {
        [motionsManifest.name]: motionsManifest.version,
        [humanManifest.name]: humanManifest.version,
        [engineManifest.name]: engineManifest.version,
        [renderManifest.name]: renderManifest.version,
        [viewerManifest.name]: viewerManifest.version,
      },
    };
  },

  perform: async (
    composition: IPlaygroundComposition,
  ): Promise<IPlaygroundAdapter.Result> => {
    // Let the page paint its "building" state before the synchronous work.
    await pause();
    try {
      const { performance, figures }: PlaygroundPerformance.IBuilt =
        PlaygroundPerformance.build(composition);
      return {
        kind: "performance",
        performance: {
          timeline: timeline(performance, composition),
          mount: (root: HTMLElement): IPlaygroundAdapter.IMounted =>
            PlaygroundStage.mount(root, performance, figures),
          verdicts: async (): Promise<IPlaygroundVerdicts> => {
            await pause();
            const report: HumanVerdicts.IReport = HumanVerdicts.of(performance);
            return {
              clean: report.clean,
              text: HumanVerdicts.describe(report),
              findings: report.findings.map(
                (
                  finding: HumanVerdicts.IFinding,
                ): IPlaygroundVerdicts.IFinding => ({ ...finding }),
              ),
            };
          },
        },
      };
    } catch (error) {
      return { kind: "refusal", refusal: refusal(error) };
    }
  },
};

/** Yield to the browser once, so a state set before heavy synchronous work is painted. */
const pause = (): Promise<void> =>
  new Promise((resolve: () => void): void => {
    setTimeout(resolve, 30);
  });

/** A thrown value as the playground's refusal: a `HumanRefusal` field for field, anything else as an error with its message. */
const refusal = (error: unknown): IPlaygroundRefusal => {
  if (error instanceof HumanRefusal)
    return {
      kind: error.kind,
      message: error.message,
      performer: error.performer,
      act: error.act,
      instance: error.instance,
      axis: error.axis,
      value: error.value,
      feasible:
        error.feasible === null ? null : HumanRefusal.describe(error.feasible),
      alternatives:
        error.feasible !== null && error.feasible.kind === "alternatives"
          ? [...error.feasible.values]
          : [],
      fix: error.fix,
    };
  return {
    kind: "error",
    message: error instanceof Error ? error.message : String(error),
    performer: "",
    act: "",
    instance: 0,
    axis: "",
    value: undefined,
    feasible: null,
    alternatives: [],
    fix: "",
  };
};

/** The placed actions of every performer, with each action's named instants inside its span. */
const timeline = (
  performance: HumanPerformance,
  composition: IPlaygroundComposition,
): IPlaygroundTimeline => {
  const span = (
    segment: HumanSegment.ISegment,
    overlay: boolean,
  ): IPlaygroundTimeline.ISpan => ({
    name: segment.name,
    id: segment.id,
    from: segment.entryTime,
    to: segment.end,
    overlay,
    events: segment.plan.events
      .map(
        (event: {
          name: string;
          share: number;
        }): IPlaygroundTimeline.IEvent => ({
          name: event.name,
          seconds: segment.start + event.share * segment.plan.duration,
        }),
      )
      .filter(
        (event: IPlaygroundTimeline.IEvent): boolean =>
          event.seconds >= segment.entryTime - 1e-9 &&
          event.seconds <= segment.end + 1e-9,
      ),
  });

  // `overlays` exists only on releases whose chain has `over`.
  const overlays:
    | ((subject: string) => readonly HumanSegment.ISegment[])
    | undefined = (
    performance as unknown as {
      overlays?: (subject: string) => readonly HumanSegment.ISegment[];
    }
  ).overlays;
  return {
    duration: performance.duration,
    tracks: composition.performers.map(
      (
        performer: IPlaygroundComposition.IPerformer,
      ): IPlaygroundTimeline.ITrack => ({
        subject: performer.subject,
        spans: [
          ...performance
            .segments(performer.subject)
            .map((s: HumanSegment.ISegment) => span(s, false)),
          ...(overlays === undefined
            ? []
            : overlays
                .call(performance, performer.subject)
                .map((s: HumanSegment.ISegment) => span(s, true))),
        ],
      }),
    ),
  };
};
