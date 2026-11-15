import engineManifest from "@automovie/engine/package.json";
import humanManifest from "@automovie/human/package.json";
import * as motions from "@automovie/motions";
import { HUMAN_ACTIONS } from "@automovie/motions";
import motionsManifest from "@automovie/motions/package.json";
import renderManifest from "@automovie/render/package.json";
import viewerManifest from "@automovie/viewer/package.json";

import { SCENES } from "../../scenes/SCENES";
import { SceneStatus } from "../../scenes/package/SceneStatus";
import type { IScene } from "../../scenes/structures/IScene";
import { TakeClient } from "../../takes/TakeClient";
import type { ITake } from "../../takes/structures/ITake";
import type { IPlaygroundAdapter } from "../IPlaygroundAdapter";
import { PLAYGROUND_BODIES } from "../data/PLAYGROUND_BODIES";
import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";
import type { IPlaygroundVerdicts } from "../structures/IPlaygroundVerdicts";
import type { IPlaygroundVocabulary } from "../structures/IPlaygroundVocabulary";
import { PlaygroundChain } from "./PlaygroundChain";
import { PlaygroundSchema } from "./PlaygroundSchema";
import { PlaygroundStage } from "./PlaygroundStage";

/**
 * The adapter over the installed packages. It lists the vocabulary from the
 * packages' own data, so the editor follows the installed release, and it
 * computes a composition through `TakeClient` in the take worker, the path
 * every scene takes too, so the page stays responsive while a take is
 * planned and posed and a scene and its playground composition are one
 * performance.
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
    const actions: Record<string, IPlaygroundVocabulary.IParameter[]> =
      PlaygroundSchema.actions();
    return {
      actions: Object.keys(laws).map(
        (name: string): IPlaygroundVocabulary.IAction => ({
          name,

          // An action the release ships no schema for is edited as JSON.
          parameters: Object.hasOwn(actions, name) ? actions[name]! : null,
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
              .filter((row: { name: string }): boolean =>
                Object.hasOwn(schemas, row.name),
              )
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
      // A refused scene, like one that waits, is not offered: it would only
      // open on the packages' refusal.
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
    // A failure of the worker itself is shown as the playground shows any
    // other error, in place of the performance.
    let result: TakeClient.Result;
    try {
      result = await TakeClient.take(composition, PlaygroundStage.FPS);
    } catch (error) {
      return {
        kind: "refusal",
        refusal: {
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
        },
      };
    }
    if (result.kind === "refusal")
      return { kind: "refusal", refusal: result.refusal };
    const take: ITake = result.take;
    return {
      kind: "performance",
      performance: {
        timeline: take.timeline,
        mount: (root: HTMLElement): IPlaygroundAdapter.IMounted =>
          PlaygroundStage.mount(root, take),
        verdicts: (): Promise<IPlaygroundVerdicts> =>
          TakeClient.verdicts(composition),
      },
    };
  },
};
