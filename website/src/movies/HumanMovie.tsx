"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type ReactElement,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { SceneView } from "../components/scenes/SceneView";
import type { IHumanEntry } from "../human/structures/IHumanEntry";
import type { IPlaygroundVocabulary } from "../playground/structures/IPlaygroundVocabulary";
import { SceneClock } from "../scenes/SceneClock";
import type { IScene } from "../scenes/structures/IScene";
import { TakeClient } from "../takes/TakeClient";

/**
 * The polygon man: every body the site performs with, standing side by side,
 * the measures of the chosen one, and the inspector a production uses to look
 * at a figure, opened on request because it prepares the body in the page.
 *
 * The lineup is computed in the browser like any scene, and the chosen
 * body's measures in the take worker when it is chosen.
 *
 * @param props The bodies' ids and labels, and the hidden scene that stands them side by side, handed over alone so the page carries no other scene record.
 * @returns The page.
 */
export default function HumanMovie(props: {
  bodies: IPlaygroundVocabulary.IBody[];
  lineup: IScene;
}): ReactElement {
  const [clock]: [SceneClock, Dispatch<SetStateAction<SceneClock>>] =
    useState<SceneClock>((): SceneClock => new SceneClock(false));
  const [chosen, setChosen]: [string, Dispatch<SetStateAction<string>>] =
    useState<string>(props.bodies[0]?.id ?? "");
  const [inspecting, setInspecting]: [
    string | null,
    Dispatch<SetStateAction<string | null>>,
  ] = useState<string | null>(null);
  const [measured, setMeasured]: [
    IHumanEntry | string | null,
    Dispatch<SetStateAction<IHumanEntry | string | null>>,
  ] = useState<IHumanEntry | string | null>(null);
  const body: IPlaygroundVocabulary.IBody | undefined = props.bodies.find(
    (b: IPlaygroundVocabulary.IBody): boolean => b.id === chosen,
  );

  // The chosen body is prepared in the take worker for its measures; a
  // failure is shown in place of them.
  useEffect((): (() => void) => {
    let alive: boolean = true;
    setMeasured(null);
    TakeClient.body(chosen)
      .then((entry: IHumanEntry): void => {
        if (alive) setMeasured(entry);
      })
      .catch((error: unknown): void => {
        if (alive)
          setMeasured(error instanceof Error ? error.message : String(error));
      });
    return (): void => {
      alive = false;
    };
  }, [chosen]);

  return (
    <main className="am-app" data-pagefind-body>
      <header className="am-app-head">
        <h1>Human</h1>
        <p className="am-lede">
          The polygon man: a few plain primitives over the skeleton{" "}
          <code>@automovie/human</code> generates from a person&apos;s measures.
          Every scene on this site is performed by these bodies.
        </p>
      </header>

      <div className="am-scene-layout">
        <section aria-label="The bodies" className="am-player">
          <SceneView scene={props.lineup} take={0} clock={clock} orbit />
          <p className="am-muted am-small">
            Left to right:{" "}
            {props.bodies
              .map((b: IPlaygroundVocabulary.IBody): string => b.label)
              .join("; ")}
            . Drag or use the arrow keys to turn, and double-click or press 0 to
            frame again.
          </p>
        </section>

        <aside className="am-scene-aside" aria-label="One body">
          <label className="am-field">
            <span className="am-label">Body</span>
            <select
              value={chosen}
              onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                setChosen(event.target.value)
              }
            >
              {props.bodies.map(
                (b: IPlaygroundVocabulary.IBody): ReactElement => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ),
              )}
            </select>
          </label>
          <details className="am-measures">
            <summary>Measures</summary>
            {measured === null ? (
              <p className="am-status" role="status">
                Preparing the body.
              </p>
            ) : typeof measured === "string" ? (
              <p className="am-danger-text" role="alert">
                {measured}
              </p>
            ) : null}
            <table className="am-table">
              <tbody>
                {Object.entries(
                  typeof measured === "object" && measured !== null
                    ? measured.measures
                    : {},
                ).map(
                  ([name, value]: [string, number]): ReactElement => (
                    <tr key={name}>
                      <th scope="row" className="am-mono">
                        {name}
                      </th>
                      <td className="am-mono">
                        {name === "mass"
                          ? `${value.toFixed(0)} kg`
                          : `${value.toFixed(3)} m`}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </details>
          <p>
            <button
              type="button"
              className="am-primary"
              disabled={body === undefined}
              onClick={(): void => setInspecting(chosen)}
            >
              Inspect
            </button>
          </p>
          <p className="am-muted am-small">
            Opens the inspector a production uses: views, shading, marks and
            every bone. It prepares the body here, which takes a few seconds.
          </p>
        </aside>
      </div>

      {inspecting === null ? null : <Inspector body={inspecting} />}
    </main>
  );
}

/** The inspector on one body, loaded with the packages it needs on first use. */
function Inspector(props: { body: string }): ReactElement {
  const root: RefObject<HTMLDivElement | null> = useRef(null);
  const [state, setState]: [string, Dispatch<SetStateAction<string>>] =
    useState<string>("Preparing the body.");
  useEffect((): (() => void) => {
    let alive: boolean = true;
    let mounted: { unmount(): void } | null = null;
    import("../human/package/HumanInspector")
      .then(
        ({
          HumanInspector,
        }: typeof import("../human/package/HumanInspector")): void => {
          if (!alive || root.current === null) return;
          mounted = HumanInspector.mount(root.current, props.body);
          setState("");
        },
      )
      .catch((error: unknown): void => {
        if (alive)
          setState(error instanceof Error ? error.message : String(error));
      });
    return (): void => {
      alive = false;
      mounted?.unmount();
    };
  }, [props.body]);
  return (
    <section aria-label="Inspector" className="am-inspector-region">
      <h2>Inspector</h2>
      {/* The live region stays mounted and only its text changes, so each
          change is announced. */}
      <div role="status">
        {state === "" ? null : <p className="am-status">{state}</p>}
      </div>
      <div ref={root} className="am-instrument" />
    </section>
  );
}
