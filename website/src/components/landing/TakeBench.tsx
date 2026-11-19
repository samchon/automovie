"use client";

import { type Dispatch, type ReactElement, type SetStateAction, useState } from "react";

import { BakedClient } from "../../baked/BakedClient";
import type { SceneClock } from "../../scenes/SceneClock";
import type { IScene } from "../../scenes/structures/IScene";
import type { IScenePlayer } from "../../scenes/structures/IScenePlayer";
import { SceneView } from "../scenes/SceneView";
import { useSceneClock } from "../scenes/useSceneClock";

/**
 * One scene in the 3D player with its takes as a row of buttons: the scene
 * itself plays from its baked take at once, and another take is computed in
 * the take worker when chosen, so the visitor sees what one changed choice
 * does to the same composition.
 *
 * @param props The scene and whether its first take was baked.
 * @returns The bench.
 */
export function TakeBench(props: { scene: IScene; baked: boolean }): ReactElement {
  const clock: SceneClock = useSceneClock();
  const [take, setTake]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
  return (
    <div className="am-bench">
      <div className="am-bench-view">
        <SceneView
          scene={props.scene}
          take={take}
          clock={clock}
          orbit
          label={props.scene.takes[take]?.label}
          baked={props.baked ? "scene" : undefined}
          poster={
            props.baked && take === 0
              ? BakedClient.address("scene", props.scene.id, "svg")
              : undefined
          }
          onLoad={(player: IScenePlayer): void => {
            clock.duration = player.duration;
            clock.fps = player.fps;
          }}
        />
      </div>
      <div className="am-bench-takes" role="group" aria-label="Takes">
        {props.scene.takes.map(
          (t: IScene.ITake, index: number): ReactElement => (
            <button
              key={t.label}
              type="button"
              aria-pressed={index === take}
              onClick={(): void => setTake(index)}
            >
              {t.label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
