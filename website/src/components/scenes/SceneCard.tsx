"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import type { SceneClock } from "../../scenes/SceneClock";
import { SceneFacts } from "../../scenes/SceneFacts";
import type { IScene } from "../../scenes/structures/IScene";
import type { IScenePlayer } from "../../scenes/structures/IScenePlayer";
import { SceneView } from "./SceneView";
import { prefersReducedMotion } from "./prefersReducedMotion";
import { useSceneClock } from "./useSceneClock";

/**
 * One scene in the gallery: its first take playing, its title, who and what
 * is in it, and a link to its page. A visitor who asked for reduced motion
 * sees a held frame that plays only while the card is hovered or focused.
 *
 * The link is named by the title alone: the view and its notes are
 * decoration inside it. A scene its record marks refused says so under the
 * link, from the record, so the card tells it without the view.
 *
 * @param props The scene.
 * @returns The card.
 */
export function SceneCard(props: { scene: IScene }): ReactElement {
  const { scene }: typeof props = props;
  const clock: SceneClock = useSceneClock();
  const hold: (playing: boolean) => void = (playing: boolean): void => {
    if (!prefersReducedMotion() || clock.playing === playing) return;
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
          decorative
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
      {scene.refusedUntil === undefined ? null : (
        <span className="am-scene-card-facts am-muted">
          The packages refuse it until #{scene.refusedUntil} lands.
        </span>
      )}
    </li>
  );
}
