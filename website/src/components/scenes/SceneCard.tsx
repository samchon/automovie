"use client";

import Link from "next/link";
import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";

import { BakedClient } from "../../baked/BakedClient";
import type { SceneClock } from "../../scenes/SceneClock";
import { SceneFacts } from "../../scenes/SceneFacts";
import type { IScene } from "../../scenes/structures/IScene";
import type { IScenePlayer } from "../../scenes/structures/IScenePlayer";
import { SceneView } from "./SceneView";
import { useSceneClock } from "./useSceneClock";

/**
 * One scene in the gallery: its still, its title, what happens and who is in
 * it, linking to its page. Pointing at the card or focusing it plays the
 * scene's baked take in 3D in place of the still, and leaving it lets the view
 * go, so a page of cards draws only the one the visitor looks at.
 *
 * The link is named by the title alone; the still and the view are decoration
 * inside it.
 *
 * @param props The scene and whether its first take was baked.
 * @returns The card.
 */
export function SceneCard(props: {
  scene: IScene;
  baked: boolean;
  /** The baked take's length, seconds; absent when it was not baked. */
  seconds?: number;
}): ReactElement {
  const { scene }: typeof props = props;
  const [live, setLive]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);
  const poster: string = BakedClient.address("scene", scene.id, "svg");
  return (
    <li
      className="am-scene-card"
      onPointerEnter={(): void => setLive(true)}
      onPointerLeave={(): void => setLive(false)}
      onFocus={(): void => setLive(true)}
      onBlur={(): void => setLive(false)}
    >
      <Link href={`/scenes/${scene.id}/`} className="am-scene-card-link">
        <span className="am-scene-card-view">
          {props.baked ? (
            <img
              src={poster}
              alt=""
              width={480}
              height={360}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="am-scene-card-blank" aria-hidden="true" />
          )}
          {live && props.baked ? (
            <LiveTake scene={scene} poster={poster} />
          ) : null}
        </span>
        <span className="am-scene-card-title">{scene.title}</span>
      </Link>
      <span className="am-scene-card-summary">{scene.summary}</span>
      <span className="am-scene-card-facts">
        {SceneFacts.counts(scene, props.seconds)}
      </span>
    </li>
  );
}

/** The scene's first take, playing over the still while the card is pointed at. */
function LiveTake(props: { scene: IScene; poster: string }): ReactElement {
  const clock: SceneClock = useSceneClock();
  return (
    <span className="am-scene-card-live">
      <SceneView
        scene={props.scene}
        take={0}
        clock={clock}
        decorative
        baked="scene"
        poster={props.poster}
        onLoad={(player: IScenePlayer): void => {
          clock.duration = player.duration;
          clock.fps = player.fps;
        }}
      />
    </span>
  );
}
