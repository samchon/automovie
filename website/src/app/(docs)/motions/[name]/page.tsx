import type { Metadata } from "next";
import type { ReactElement } from "react";

import { MotionIndex } from "../../../../motions/package/MotionIndex";
import ForwardMovie from "../../../../movies/ForwardMovie";
import MotionMovie from "../../../../movies/MotionMovie";

/** What Next passes a page of this route. */
interface IPageProps {
  /** The motion's name, or a family's that no motion shares. */
  params: Promise<{ name: string }>;
}

/** Only the installed vocabulary's motions and families have a page. */
export const dynamicParams: boolean = false;

/**
 * One page per action and named row, and one per family whose former page
 * lived at this address, which forwards to the family's section.
 *
 * @returns The names.
 */
export function generateStaticParams(): { name: string }[] {
  return [...MotionIndex.names(), ...MotionIndex.families()].map(
    (name: string): { name: string } => ({ name }),
  );
}

/**
 * A motion page's title and description.
 *
 * @param props The route's parameters.
 * @returns The metadata.
 */
export async function generateMetadata(props: IPageProps): Promise<Metadata> {
  const { name }: { name: string } = await props.params;
  if (!MotionIndex.has(name)) return { title: "Motions", robots: { index: false } };
  const detail: MotionIndex.IDetail = MotionIndex.detail(name);
  return {
    title: name,
    description: `${name}, a motion of the ${detail.family.label.toLowerCase()} family: its parameters, a take and the scenes that use it.`,
  };
}

/**
 * One motion's route: its family, its parameters, the scenes that use it and
 * the take its page plays, read while the site is exported; or, for a
 * family's former address, a page that forwards to its section.
 *
 * @param props The route's parameters.
 * @returns The page.
 */
export default async function MotionPage(props: IPageProps): Promise<ReactElement> {
  const { name }: { name: string } = await props.params;
  return MotionIndex.has(name) ? (
    <MotionMovie detail={MotionIndex.detail(name)} />
  ) : (
    <ForwardMovie to={`/motions/#family-${name}`} label="its family in the motions" />
  );
}
