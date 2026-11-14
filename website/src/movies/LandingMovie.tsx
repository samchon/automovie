"use client";

import Link from "next/link";
import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

import { SceneCard } from "../components/scenes/SceneCard";
import { SceneView } from "../components/scenes/SceneView";
import { useSceneClock } from "../components/scenes/useSceneClock";
import { SCENES } from "../scenes/SCENES";
import type { SceneClock } from "../scenes/SceneClock";
import { SceneFacts } from "../scenes/SceneFacts";
import type { IScene } from "../scenes/structures/IScene";
import type { IScenePlayer } from "../scenes/structures/IScenePlayer";

/** The commands a production starts with, as the README's "Setup" gives them. */
const START: readonly string[] = [
  "npx automovie create <directory>",
  "cd <directory>",
  "pnpm install",
];

/**
 * The landing page. The first screen says what AutoMovie makes and plays it:
 * the featured scenes in turn on a stage beside the headline. Below, one
 * scene in its takes side by side, the counts of the pieces scenes are
 * composed from, how a film is made, how to start, and the scenes coming
 * next.
 *
 * @param props The scenes the build baked, and the motion package's counts.
 * @returns The page.
 */
export default function LandingMovie(props: {
  baked: string[];
  counts: { actions: number; families: number; rows: number };
}): ReactElement {
  const baked: Set<string> = new Set(props.baked);
  const featured: IScene[] = SCENES.filter(
    (s: IScene): boolean => s.featured !== undefined && baked.has(s.id),
  ).sort((a: IScene, b: IScene): number => a.featured! - b.featured!);
  const coming: IScene[] = SCENES.filter(
    (s: IScene): boolean => s.hidden !== true && !baked.has(s.id),
  );
  const [index, setIndex]: [number, Dispatch<SetStateAction<number>>] =
    useState<number>(0);
  const [held, setHeld]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);
  const stage: SceneClock = useSceneClock();
  const takes: SceneClock = useSceneClock();
  const scene: IScene | undefined = featured[index];

  // The stage moves to the next scene after it has played once, unless the
  // visitor holds it by hovering or focusing it.
  useEffect((): (() => void) => {
    stage.set({ loop: false });
    const timer: number = window.setInterval((): void => {
      if (held || stage.duration === 0 || stage.time < stage.duration - 1e-3)
        return;

      // The scene ended: the next one starts from its beginning, playing
      // unless the visitor asked for reduced motion.
      stage.duration = 0;
      stage.seek(0);
      if (!stage.playing && !SceneCard.reduced()) stage.toggle();
      setIndex((i: number): number => (i + 1) % Math.max(1, featured.length));
    }, 120);
    return (): void => window.clearInterval(timer);
  }, [held, stage, featured.length]);

  const step: (by: number) => void = (by: number): void => {
    stage.duration = 0;
    stage.seek(0);
    setIndex(
      (i: number): number => (i + by + featured.length) % featured.length,
    );
  };

  return (
    <div className="am-app am-landing-page">
      <section className="am-hero" aria-labelledby="am-hero-title">
        <div className="am-hero-text">
          <h1 id="am-hero-title">Your coding agent directs the film.</h1>
          <p className="am-hero-lede">
            AutoMovie composes people, objects and motion from a few typed
            pieces into the same frames every time, as a motion hint for video
            diffusion or as a film rendered directly.
          </p>
          <p className="am-buttons">
            <Link className="am-button" href="/scenes/">
              Browse scenes
            </Link>
            <Link className="am-button am-button-quiet" href="/docs/">
              Get started
            </Link>
            <a
              className="am-button am-button-quiet"
              href="https://github.com/samchon/automovie"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
        {scene === undefined ? null : (
          <figure
            className="am-hero-stage"
            onPointerEnter={(): void => setHeld(true)}
            onPointerLeave={(): void => setHeld(false)}
            onFocus={(): void => setHeld(true)}
            onBlur={(): void => setHeld(false)}
          >
            <SceneView
              key={scene.id}
              scene={scene}
              take={0}
              clock={stage}
              onLoad={(player: IScenePlayer): void => {
                stage.duration = player.duration;
                stage.fps = player.fps;
              }}
            />
            <figcaption className="am-hero-caption">
              <span className="am-muted am-small">
                Now playing {index + 1} / {featured.length}
              </span>
              <strong>{scene.title}</strong>
              <span className="am-muted am-small">
                {SceneFacts.counts(scene)}
              </span>
              <span className="am-hero-controls">
                <button
                  type="button"
                  aria-label="Previous scene"
                  onClick={(): void => step(-1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next scene"
                  onClick={(): void => step(1)}
                >
                  ›
                </button>
                <button type="button" onClick={(): void => stage.toggle()}>
                  Play or pause
                </button>
                <Link href={`/scenes/${scene.id}/#made`}>
                  How is this made?
                </Link>
              </span>
            </figcaption>
          </figure>
        )}
      </section>

      {featured[0] === undefined ? null : (
        <section aria-labelledby="am-takes" className="am-stack">
          <h2 id="am-takes">One composition, many takes</h2>
          <p className="am-muted">
            {featured[0].title}, four times: the same composition under another
            seed, other bodies and other skill. A seed changes how and when,
            never what is done.
          </p>
          <ul className="am-take-grid">
            {featured[0].takes.map(
              (take: IScene.ITake, i: number): ReactElement => (
                <li key={i} className="am-take">
                  <SceneView
                    scene={featured[0]!}
                    take={i}
                    clock={takes}
                    label={take.label}
                    onLoad={(player: IScenePlayer): void => {
                      takes.duration = Math.max(
                        takes.duration,
                        player.duration,
                      );
                      takes.fps = player.fps;
                    }}
                  />
                  <span className="am-take-label">{take.label}</span>
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      <section aria-labelledby="am-pieces" className="am-stack">
        <h2 id="am-pieces">Pieces that compose</h2>
        <ul className="am-figures">
          <li>
            <Link href="/motions/actions/">
              <strong>{props.counts.actions}</strong> actions
            </Link>
          </li>
          {props.counts.families === 0 ? null : (
            <li>
              <Link href="/motions/">
                <strong>{props.counts.rows}</strong> named rows in{" "}
                <strong>{props.counts.families}</strong> families
              </Link>
            </li>
          )}
          <li>
            <Link href="/objects/">Objects people act with</Link>
          </li>
          <li>
            <Link href="/human/">One body, any person</Link>
          </li>
        </ul>
        <p className="am-muted">
          A person&apos;s performance is a chain of these pieces; a scene is
          several chains at once, with objects placed among them. The{" "}
          <Link href="/docs/composing-motion/">guide</Link> shows how.
        </p>
      </section>

      <section aria-labelledby="am-how" className="am-stack">
        <h2 id="am-how">How a film is made</h2>
        <ol className="am-steps">
          <li>
            <strong>Brief</strong> You tell your agent what to make; it records
            the fixed conditions and your decisions.
          </li>
          <li>
            <strong>Screenplay</strong> The agent writes what the audience sees
            and hears, beat by beat, naming each action as one the vocabulary
            performs.
          </li>
          <li>
            <strong>Staging and motion as code</strong> It composes each
            person&apos;s performance from these pieces, places sets and
            objects, and frames the camera.
          </li>
          <li>
            <strong>The hint video</strong> AutoMovie computes the same frames
            every time, with pose, depth and outline passes, for a video model
            or a direct render.
          </li>
        </ol>
      </section>

      <section aria-labelledby="am-start" className="am-stack">
        <h2 id="am-start">Start</h2>
        <pre className="am-code">
          <code>{START.join("\n")}</code>
        </pre>
        <p>
          Open the directory in your coding agent and tell it what to make.{" "}
          <Link href="/docs/">Getting started</Link> says more.
        </p>
      </section>

      {coming.length === 0 ? null : (
        <section aria-labelledby="am-next" className="am-stack">
          <h2 id="am-next">Coming next</h2>
          <p className="am-muted">
            {coming.length} scenes are written for pieces the campaigns are
            building, among them{" "}
            {coming
              .slice(0, 5)
              .map((s: IScene): string => s.title.toLowerCase())
              .join(", ")}
            .
          </p>
          <p>
            <Link href="/scenes/#am-roadmap">See the roadmap</Link>
          </p>
        </section>
      )}
    </div>
  );
}
