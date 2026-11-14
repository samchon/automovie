import type { Metadata } from "next";
import type { ReactElement } from "react";

import { MotionReference } from "../../../../motions/package/MotionReference";
import type { IMotionReference } from "../../../../motions/structures/IMotionReference";
import SceneMovie from "../../../../movies/SceneMovie";
import { SCENES } from "../../../../scenes/SCENES";
import { SceneChainNames } from "../../../../scenes/package/SceneChainNames";
import { readBakedManifest } from "../../../../scenes/readBakedManifest";
import type { IScene } from "../../../../scenes/structures/IScene";
import type { ISceneManifest } from "../../../../scenes/structures/ISceneManifest";

/** What Next passes a page of this route. */
interface IPageProps {
  /** The scene's id. */
  params: Promise<{ id: string }>;
}

/** Only the scenes listed here have a page. */
export const dynamicParams: boolean = false;

/**
 * One page per listed scene.
 *
 * @returns The ids.
 */
export function generateStaticParams(): { id: string }[] {
  return SCENES.filter((s: IScene): boolean => s.hidden !== true).map(
    (s: IScene): { id: string } => ({ id: s.id }),
  );
}

/**
 * A scene page's title and description, from its record.
 *
 * @param props The route's parameters.
 * @returns The metadata.
 */
export async function generateMetadata(props: IPageProps): Promise<Metadata> {
  const { id }: { id: string } = await props.params;
  const scene: IScene | undefined = SCENES.find(
    (s: IScene): boolean => s.id === id,
  );
  return scene === undefined
    ? {}
    : { title: scene.title, description: scene.summary };
}

/**
 * One scene's route: its record and, when the build baked it, its takes.
 *
 * @param props The route's parameters.
 * @returns The page.
 */
export default async function ScenePage(
  props: IPageProps,
): Promise<ReactElement> {
  const { id }: { id: string } = await props.params;
  const scene: IScene = SCENES.find((s: IScene): boolean => s.id === id)!;
  const manifest: ISceneManifest | null = readBakedManifest();

  // Each action links to its page of the motion reference.
  const reference: IMotionReference = MotionReference.read();
  const pages: Record<string, string> = Object.fromEntries([
    ...reference.actions.map((a: IMotionReference.IRow): [string, string] => [
      a.name,
      "actions",
    ]),
    ...reference.families.flatMap(
      (f: IMotionReference.IFamily): [string, string][] =>
        f.rows.map((r: IMotionReference.IRow): [string, string] => [
          r.name,
          f.name,
        ]),
    ),
  ]);
  return (
    <SceneMovie
      scene={scene}
      baked={manifest?.scenes[id] ?? null}
      pages={pages}
      names={
        scene.composition === null
          ? null
          : SceneChainNames.read(scene.composition)
      }
    />
  );
}
