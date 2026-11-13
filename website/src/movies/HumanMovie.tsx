"use client";

import {
  type ReactElement,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { SceneView } from "../components/scenes/SceneView";
import type { IHumanEntry } from "../human/structures/IHumanEntry";
import { SCENES } from "../scenes/SCENES";
import { SceneClock } from "../scenes/SceneClock";
import type { IScene } from "../scenes/structures/IScene";

/** The hidden scene that stands every body side by side. */
const LINEUP: IScene = SCENES.find((s: IScene): boolean => s.id === "lineup")!;

/**
 * The polygon man: every body the site performs with, standing side by side,
 * the measures of the chosen one, and the inspector a production uses to look
 * at a figure, opened on request because it prepares the body in the page.
 *
 * @param props The bodies with their measures, as the bake recorded them.
 * @returns The page.
 */
export default function HumanMovie(props: {
  bodies: IHumanEntry[];
}): ReactElement {
  const [clock] = useState<SceneClock>((): SceneClock => new SceneClock(false));
  const [chosen, setChosen] = useState<string>(props.bodies[0]?.id ?? "");
  const [inspecting, setInspecting] = useState<string | null>(null);
  const body: IHumanEntry | undefined = props.bodies.find(
    (b: IHumanEntry): boolean => b.id === chosen,
  );

  return (
    <div className="am-app" data-pagefind-body>
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
          <SceneView scene={LINEUP} take={0} clock={clock} orbit />
          <p className="am-muted am-small">
            Left to right:{" "}
            {props.bodies.map((b: IHumanEntry): string => b.label).join("; ")}.
            Drag to turn, double-click to frame again.
          </p>
        </section>

        <aside className="am-scene-aside" aria-label="One body">
          <label className="am-field">
            <span className="am-label">Body</span>
            <select
              value={chosen}
              onChange={(event): void => setChosen(event.target.value)}
            >
              {props.bodies.map(
                (b: IHumanEntry): ReactElement => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ),
              )}
            </select>
          </label>
          <details className="am-measures">
            <summary>Measures</summary>
            <table className="am-table">
              <tbody>
                {Object.entries(body?.measures ?? {}).map(
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
    </div>
  );
}

/** The inspector on one body, loaded with the packages it needs on first use. */
function Inspector(props: { body: string }): ReactElement {
  const root: RefObject<HTMLDivElement | null> = useRef(null);
  const [state, setState] = useState<string>("Preparing the body.");
  useEffect((): (() => void) => {
    let alive: boolean = true;
    let mounted: { unmount(): void } | null = null;
    import("../human/package/HumanInspector")
      .then(({ HumanInspector }): void => {
        if (!alive || root.current === null) return;
        mounted = HumanInspector.mount(root.current, props.body);
        setState("");
      })
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
      {state === "" ? null : (
        <p className="am-status" role="status">
          {state}
        </p>
      )}
      <div ref={root} className="am-instrument" />
    </section>
  );
}
