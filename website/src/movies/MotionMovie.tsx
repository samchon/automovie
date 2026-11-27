"use client";

import Link from "next/link";
import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";

import { SITE_BASE } from "../SITE_BASE";
import { BakedClient } from "../baked/BakedClient";
import { SceneView } from "../components/scenes/SceneView";
import { useSceneClock } from "../components/scenes/useSceneClock";
import { Transport } from "../components/stage/Transport";
import { TransportKeys } from "../components/stage/TransportKeys";
import type { MotionIndex } from "../motions/package/MotionIndex";
import type { SceneClock } from "../scenes/SceneClock";
import type { IScenePlayer } from "../scenes/structures/IScenePlayer";

/**
 * One motion: its take in the 3D player, alone or in the first scene that
 * performs it, beside its name and family; how a chain writes it and where the
 * API reference describes its parameters; the scenes that use it and the
 * motions next to it in its family.
 *
 * @param props The motion's page data.
 * @returns The page.
 */
export default function MotionMovie(props: {
  detail: MotionIndex.IDetail;
}): ReactElement {
  const { detail }: { detail: MotionIndex.IDetail } = props;
  const clock: SceneClock = useSceneClock();
  const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);
  return (
    <main className="am-app am-scene-page am-motion-page" data-pagefind-body>
      <header className="am-scene-head">
        <nav aria-label="Breadcrumb" className="am-crumbs">
          <Link href="/gallery/">Gallery</Link>
          <span aria-hidden="true">/</span>
          <Link href="/motions/">Motions</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/motions/#${detail.category.id}`}>
            {detail.category.title}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/motions/#family-${detail.family.name}`}>
            {detail.family.label}
          </Link>
        </nav>
        <h1 className="am-motion-name">{detail.name}</h1>
        <p>
          {detail.family.name === "actions"
            ? "An action of the core vocabulary. A chain appends it by name, with its parameters."
            : `A named row of the ${detail.family.label.toLowerCase()} family: an action with some parameters fixed, fitted, refused and checked as that action is.`}
        </p>
      </header>

      <div className="am-scene-layout">
        <div>
          {detail.play === null ? (
            <div className="am-motion-empty">
              <p>
                No scene performs this motion yet, and it needs a partner, a
                prop or a parameter a trial alone cannot supply.
              </p>
            </div>
          ) : (
            <TransportKeys clock={clock} label="Motion player">
              <SceneView
                scene={detail.play.record}
                take={0}
                clock={clock}
                orbit
                label={detail.play.label}
                baked={detail.play.baked ?? undefined}
                poster={
                  detail.play.baked === null
                    ? undefined
                    : BakedClient.address(
                        detail.play.baked,
                        detail.play.record.id,
                        "svg",
                      )
                }
                onLoad={(take: IScenePlayer): void => {
                  clock.duration = take.duration;
                  clock.fps = take.fps;
                  clock.seek(clock.time);
                  setReady(true);
                }}
              />
              <div className="am-scene-controls">
                {ready ? <Transport clock={clock} /> : null}
              </div>
              <p className="am-muted am-small">{detail.play.label}.</p>
            </TransportKeys>
          )}
        </div>

        <aside className="am-scene-aside" aria-label="About the motion">
          <h2>Write it</h2>
          <pre className="am-code am-motion-snippet">
            <code>{snippet(detail)}</code>
          </pre>
          {detail.family.name === "actions" ? null : (
            <p className="am-muted am-small">
              A row is registered in the performance&apos;s <code>laws</code>{" "}
              too.
            </p>
          )}
          <h2>Used in</h2>
          {detail.uses.length === 0 ? (
            <p className="am-muted">No scene on this site uses it yet.</p>
          ) : (
            <ul className="am-plain">
              {detail.uses.map(
                (use: { id: string; title: string }): ReactElement => (
                  <li key={use.id}>
                    <Link href={`/scenes/${use.id}/`}>{use.title}</Link>
                  </li>
                ),
              )}
            </ul>
          )}
          <nav className="am-motion-step" aria-label="In this family">
            {detail.previous === null ? (
              <span />
            ) : (
              <Link href={`/motions/${detail.previous}/`} rel="prev">
                <span>Previous</span>
                {detail.previous}
              </Link>
            )}
            {detail.next === null ? null : (
              <Link href={`/motions/${detail.next}/`} rel="next">
                <span>Next</span>
                {detail.next}
              </Link>
            )}
          </nav>
        </aside>
      </div>

      <section className="am-panel-body" aria-labelledby="am-parameters">
        <h2 id="am-parameters" className="am-motion-h2">
          Parameters
        </h2>
        <p>
          Its parameters, their types and meanings are in the API reference,
          under{" "}
          <a className="am-text-link" href={`${SITE_BASE}${detail.api}`}>
            <code>
              {detail.namespace === null
                ? detail.family.name === "actions"
                  ? `AutoMovieMotionHumanChain.${detail.name}`
                  : "HUMAN_LEXICON"
                : `${detail.namespace}.${detail.name}`}
            </code>
          </a>
          .
        </p>{" "}
      </section>
    </main>
  );
}

/**
 * How a chain appends the motion, its parameters left to the API reference. A
 * lexicon row is taken from its namespace and extends the chain first, and the
 * performance registers it in its `laws`, as the motions README shows.
 */
function snippet(detail: MotionIndex.IDetail): string {
  const args: string = "/* parameters */";
  if (detail.family.name === "actions")
    return `AutoMovieMotionHumanChain.subject("a")\n  .${detail.name}(${args})`;
  const take: string =
    detail.namespace === null
      ? ""
      : `const { ${detail.name} } = ${detail.namespace};\n`;
  return `${take}const Chain = AutoMovieMotionHumanChain.extend({\n  ${detail.name},\n});\nChain.subject("a")\n  .${detail.name}(${args})`;
}
