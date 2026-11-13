"use client";

import {
  type ReactElement,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { PlaygroundActionEditor } from "../components/playground/PlaygroundActionEditor";
import { PlaygroundEditor } from "../components/playground/PlaygroundEditor";
import { PlaygroundRefusal } from "../components/playground/PlaygroundRefusal";
import { PlaygroundStage } from "../components/playground/PlaygroundStage";
import { PlaygroundTimeline } from "../components/playground/PlaygroundTimeline";
import { PlaygroundVerdicts } from "../components/playground/PlaygroundVerdicts";
import type { IPlaygroundAdapter } from "../playground/IPlaygroundAdapter";
import { PlaygroundAddress } from "../playground/PlaygroundAddress";
import { applyPlaygroundFix } from "../playground/applyPlaygroundFix";
import { findPlaygroundRefusedAction } from "../playground/findPlaygroundRefusedAction";
import { formatPlaygroundReport } from "../playground/formatPlaygroundReport";
import { loadPlaygroundAdapter } from "../playground/loadPlaygroundAdapter";
import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import type { IPlaygroundVerdicts } from "../playground/structures/IPlaygroundVerdicts";
import type { IPlaygroundVocabulary } from "../playground/structures/IPlaygroundVocabulary";
import { SCENES } from "../scenes/SCENES";
import type { IScene } from "../scenes/structures/IScene";

/** What the page has of the adapter. */
type Loaded =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | {
      kind: "ready";
      adapter: IPlaygroundAdapter;
      vocabulary: IPlaygroundVocabulary;
    };

/** What the page has of the composition's performance. */
type Outcome =
  | { kind: "none" }
  | { kind: "building" }
  | IPlaygroundAdapter.Result;

/**
 * What the page opens with when its address carries no composition: a scene
 * that plans in under a second, so the page answers at once.
 */
const FIRST: IPlaygroundComposition = SCENES.find(
  (s: IScene): boolean => s.id === "dance-circle",
)!.composition!;

/** Which pane a narrow screen shows. */
type Pane = "compose" | "result";

/**
 * The composition playground.
 *
 * The left pane edits a composition: who performs, where they start, and
 * each person's chain of actions. Perform builds it with the packages behind
 * the adapter. A composition that plans is drawn in the right pane with its
 * timeline and, on request, its verdict report; one that does not shows the
 * refusal in the package's words there and on the action it names.
 *
 * The composition is kept in the address's fragment, so the address
 * reproduces what the page shows. The page opens with the composition of
 * its address, or the dance circle, and performs it at once. On a narrow
 * screen the panes are two tabs, and performing shows the result.
 *
 * @returns The page.
 */
export default function PlaygroundMovie(): ReactElement {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [composition, setComposition] = useState<IPlaygroundComposition>(
    (): IPlaygroundComposition => structuredClone(FIRST),
  );

  // The composition the outcome belongs to: a refusal is shown on the action
  // it names only while that composition is the one being edited.
  const [performed, setPerformed] = useState<IPlaygroundComposition | null>(
    null,
  );
  const [outcome, setOutcome] = useState<Outcome>({ kind: "none" });
  const [verdicts, setVerdicts] = useState<PlaygroundVerdicts.State>({
    kind: "idle",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [pane, setPane] = useState<Pane>("compose");

  // Each build takes a number; a result that is no longer the latest is dropped.
  const generation: RefObject<number> = useRef<number>(0);

  const perform = useCallback(
    async (
      adapter: IPlaygroundAdapter,
      next: IPlaygroundComposition,
    ): Promise<void> => {
      const mine: number = ++generation.current;
      setOutcome({ kind: "building" });
      setVerdicts({ kind: "idle" });
      setPerformed(next);
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}${PlaygroundAddress.encode(next)}`,
      );
      const result: IPlaygroundAdapter.Result = await adapter.perform(next);
      if (mine === generation.current) setOutcome(result);
    },
    [],
  );

  // Load the adapter, read the address's composition and perform it.
  useEffect((): (() => void) => {
    let alive: boolean = true;
    (async (): Promise<void> => {
      let first: IPlaygroundComposition = structuredClone(FIRST);
      try {
        const linked: IPlaygroundComposition | null = PlaygroundAddress.decode(
          window.location.hash,
        );

        // A link to a composition is followed for its result, so a narrow
        // screen opens on that pane.
        if (linked !== null) {
          first = linked;
          setPane("result");
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : String(error));
      }
      try {
        const adapter: IPlaygroundAdapter = await loadPlaygroundAdapter();
        const vocabulary: IPlaygroundVocabulary = await adapter.describe();
        if (!alive) return;
        setComposition(first);
        setLoaded({ kind: "ready", adapter, vocabulary });
        await perform(adapter, first);
      } catch (error) {
        if (alive)
          setLoaded({
            kind: "failed",
            message: error instanceof Error ? error.message : String(error),
          });
      }
    })();
    return (): void => {
      alive = false;
    };
  }, [perform]);

  const head: ReactElement = (
    <header className="am-app-head">
      <h1>Composition playground</h1>
      <p className="am-lede">
        Compose what each person does from the actions of{" "}
        <code>@automovie/motions</code>, perform it on the polygon man, and read
        what the package refuses and which physical bounds the result breaks.
      </p>
    </header>
  );

  if (loaded.kind !== "ready")
    return (
      <div className="am-app">
        {head}
        {loaded.kind === "loading" ? (
          <p className="am-status" role="status">
            Loading the motion packages.
          </p>
        ) : (
          <div className="am-alert" role="alert">
            <h2>The motion packages did not load</h2>
            <pre className="am-message">{loaded.message}</pre>
          </div>
        )}
      </div>
    );
  const { adapter, vocabulary } = loaded;

  const read = async (
    performance: IPlaygroundAdapter.IPerformance,
  ): Promise<void> => {
    const mine: number = generation.current;
    setVerdicts({ kind: "reading" });
    try {
      const report: IPlaygroundVerdicts = await performance.verdicts();
      if (mine === generation.current) setVerdicts({ kind: "read", report });
    } catch (error) {
      if (mine === generation.current)
        setVerdicts({
          kind: "failed",
          message: error instanceof Error ? error.message : String(error),
        });
    }
  };

  const share = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("The address of the performed composition was copied.");
    } catch {
      setNotice("Copy the address from the address bar.");
    }
  };

  const start = (next: IPlaygroundComposition): void => {
    setPane("result");
    void perform(adapter, next);
  };

  // The refusal on the action it names, while the refused composition is
  // still the one in the editor.
  let refused: PlaygroundActionEditor.IRefused | null = null;
  if (outcome.kind === "refusal" && performed === composition) {
    const action: IPlaygroundComposition.IAction | null =
      findPlaygroundRefusedAction(composition, outcome.refusal);
    if (action !== null)
      refused = {
        action,
        refusal: outcome.refusal,
        fixable:
          outcome.refusal.alternatives.length !== 0 &&
          applyPlaygroundFix(
            composition,
            outcome.refusal,
            outcome.refusal.alternatives[0]!,
          ) !== null,
        onFix: (value: string): void => {
          const fixed: IPlaygroundComposition | null = applyPlaygroundFix(
            composition,
            outcome.refusal,
            value,
          );
          if (fixed === null) return;
          setComposition(fixed);
          start(fixed);
        },
      };
  }

  return (
    <div className="am-app">
      {head}
      <div className="am-tabs" role="tablist" aria-label="Pane">
        <button
          type="button"
          role="tab"
          id="am-tab-compose"
          aria-selected={pane === "compose"}
          aria-controls="am-pane-compose"
          onClick={(): void => setPane("compose")}
        >
          Composition
        </button>
        <button
          type="button"
          role="tab"
          id="am-tab-result"
          aria-selected={pane === "result"}
          aria-controls="am-pane-result"
          onClick={(): void => setPane("result")}
        >
          {outcome.kind === "refusal" ? "Result: refused" : "Result"}
        </button>
      </div>
      <div className="am-split" data-pane={pane}>
        <section
          id="am-pane-compose"
          className="am-pane-compose am-panel"
          aria-labelledby="am-compose"
        >
          <h2 id="am-compose">Composition</h2>
          <PlaygroundEditor
            composition={composition}
            vocabulary={vocabulary}
            refused={refused}
            onChange={setComposition}
          />
          <p className="am-muted am-hint">
            Running{" "}
            {Object.entries(vocabulary.packages)
              .map(([name, version]): string => `${name} ${version}`)
              .join(", ")}
            .
          </p>
          <div className="am-sticky-actions am-stack">
            <div className="am-buttons">
              <button
                type="button"
                className="am-primary"
                disabled={outcome.kind === "building"}
                onClick={(): void => start(composition)}
              >
                {outcome.kind === "building" ? "Performing" : "Perform"}
              </button>
              <button type="button" onClick={(): void => void share()}>
                Copy address
              </button>
              <button
                type="button"
                title="Open a prefilled issue about a composition that looks wrong"
                onClick={(): void => {
                  window.open(
                    formatPlaygroundReport({
                      address: window.location.href,
                      packages: vocabulary.packages,
                      verdicts:
                        verdicts.kind === "read" ? verdicts.report : null,
                    }),
                    "_blank",
                    "noopener",
                  );
                }}
              >
                Report
              </button>
            </div>
            {notice === null ? null : (
              <p className="am-muted" role="status">
                {notice}
              </p>
            )}
          </div>
        </section>

        <section
          id="am-pane-result"
          className="am-pane-result"
          aria-label="Result"
          aria-busy={outcome.kind === "building"}
        >
          {outcome.kind === "none" ? (
            <p className="am-status">Press Perform to build the composition.</p>
          ) : outcome.kind === "building" ? (
            <p className="am-status" role="status">
              Building the performance. A body is prepared the first time it
              performs, which takes a few seconds.
            </p>
          ) : outcome.kind === "refusal" ? (
            <PlaygroundRefusal
              refusal={outcome.refusal}
              located={refused !== null}
            />
          ) : (
            <>
              <PlaygroundStage performance={outcome.performance} />
              <PlaygroundTimeline timeline={outcome.performance.timeline} />
              <PlaygroundVerdicts
                state={verdicts}
                onRead={(): void => void read(outcome.performance)}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
