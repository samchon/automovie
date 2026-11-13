"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import type { SceneClock } from "../../scenes/SceneClock";
import { SceneFacts } from "../../scenes/SceneFacts";
import type { IScene } from "../../scenes/structures/IScene";
import type { IScenePlayer } from "../../scenes/structures/IScenePlayer";
import { SceneView } from "./SceneView";
import { useSceneClock } from "./useSceneClock";

/**
 * One scene in the gallery: its first take playing, its title, who and what
 * is in it, and a link to its page. A visitor who asked for reduced motion
 * sees a held frame that plays only while the card is hovered or focused.
 *
 * @param props The scene.
 * @returns The card.
 */
export function SceneCard(props: { scene: IScene }): ReactElement {
  const { scene }: typeof props = props;
  const clock: SceneClock = useSceneClock();
  const hold: (playing: boolean) => void = (playing: boolean): void => {
    if (!SceneCard.reduced() || clock.playing === playing) return;
    clock.toggle();
  };
  return (
    <li
      className="am-scene-card"
      onPointerEnter={(): void => hold(true)}
      onPointerLeave={(): void => hold(false)}
      onFocus={(): void => hold(true)}
      onBlur={(): void => hold(false)}
    >
      <Link href={`/scenes/${scene.id}/`} className="am-scene-card-link">
        <SceneView
          scene={scene}
          take={0}
          clock={clock}
          onLoad={(player: IScenePlayer): void => {
            clock.duration = player.duration;
            clock.fps = player.fps;
          }}
        />
        <span className="am-scene-card-title">{scene.title}</span>
      </Link>
      <span className="am-scene-card-facts am-muted">
        {SceneFacts.counts(scene)}
      </span>
    </li>
  );
}
export namespace SceneCard {
  /**
   * Whether the visitor asked for reduced motion.
   *
   * @returns Whether animation waits for a request.
   */
  export function reduced(): boolean {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
}
