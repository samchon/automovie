"use client";

import { type ReactElement, useEffect, useState } from "react";

import { SITE_BASE } from "../../SITE_BASE";
import { PlaygroundAddress } from "../../playground/PlaygroundAddress";
import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { SceneClock } from "../../scenes/SceneClock";
import type { IScene } from "../../scenes/structures/IScene";
import type { IScenePlayer } from "../../scenes/structures/IScenePlayer";
import { SceneView } from "../scenes/SceneView";
import { useSceneClock } from "../scenes/useSceneClock";
import { Transport } from "../stage/Transport";
import { TransportKeys } from "../stage/TransportKeys";

/** A legacy fragment that carries either a saved composition or a reading error. */
type Saved = { composition: IPlaygroundComposition } | { error: string };

/** Keep saved composition links and the old archetype queries readable. */
export function GallerySavedTake(): ReactElement | null {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  useEffect((): (() => void) => {
    function read(): void {
      const { hash, search }: Location = window.location;
      setOpen(false);
      try {
        const composition: IPlaygroundComposition | null =
          PlaygroundAddress.decode(hash);
        setSaved(composition === null ? null : { composition });
        if (composition !== null) return;
      } catch (error: unknown) {
        setSaved({
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }
      const fields: URLSearchParams = new URLSearchParams(search);
      const archetype: boolean = [...fields.keys()].some(
        (key: string): boolean =>
          ["q", "subject", "variant", "seed", "affordances"].includes(key) ||
          key.startsWith("move."),
      );
      if (archetype)
        window.location.replace(`${SITE_BASE}/archetypes/${search}`);
    }
    read();
    window.addEventListener("hashchange", read);
    return (): void => window.removeEventListener("hashchange", read);
  }, []);
  if (saved === null) return null;
  return (
    <section className="am-gallery-saved" aria-labelledby="am-saved-title">
      <h2 id="am-saved-title">Saved take</h2>
      {"error" in saved ? (
        <p className="am-danger-text" role="alert">
          {saved.error}
        </p>
      ) : open ? (
        <SavedPlayer composition={saved.composition} />
      ) : (
        <button
          type="button"
          className="am-button am-button-primary"
          onClick={(): void => setOpen(true)}
        >
          Load saved take
        </button>
      )}
    </section>
  );
}

/** Replay the saved composition through the same player as a scene. */
function SavedPlayer(props: {
  composition: IPlaygroundComposition;
}): ReactElement {
  const clock: SceneClock = useSceneClock();
  const [ready, setReady] = useState<boolean>(false);
  const [scene] = useState<IScene>(
    (): IScene => ({
      id: "saved-take",
      title: "Saved take",
      summary: "The composition from this address.",
      setting: "everyday",
      cast: props.composition.performers.map(({ subject }) => ({
        subject,
        role: subject,
      })),
      composition: props.composition,
      takes: [{ label: "Saved" }],
      camera: { view: "three-quarter" },
      needs: [],
    }),
  );
  return (
    <TransportKeys clock={clock} label="Saved take player">
      <SceneView
        scene={scene}
        take={0}
        clock={clock}
        orbit
        onLoad={(player: IScenePlayer): void => {
          clock.duration = player.duration;
          clock.fps = player.fps;
          setReady(true);
        }}
      />
      {ready ? <Transport clock={clock} /> : null}
    </TransportKeys>
  );
}
