import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * Inputs of `renderBodySimpleControls`: where the simple tier is drawn, its
 * off-thread solvers, the panel's intent hooks, and where its whole-person
 * readings come from.
 *
 * @author Samchon
 */
export interface IBodySimpleControlsProps {
  /** Document that creates the control elements. */
  dom: Document;

  /** Element the controls replace their children in. */
  container: HTMLElement;

  /** The expansion over the current shape, solved off the page's thread. */
  expand: (
    simple: IAutoMovieHumanBodySimpleShape,
    over: Record<string, number>,
  ) => Promise<Record<string, number>>;

  /** The projection of a detailed shape, solved off the page's thread. */
  project: (body: IBodySimpleBody) => Promise<IAutoMovieHumanBodySimpleShape>;

  /**
   * Where stature and mass are read: the whole person and the head it was
   * read with, shown beside those two rows because the body alone does not
   * determine them.
   */
  wholeSource: string;

  /** The current detailed shape the expansion applies over. */
  current: () => IBodySimpleBody;

  /** Reserve the panel's intent generation synchronously at Apply click. */
  reserveIntent: () => number;

  /** Read the panel generation when asynchronous work settles. */
  currentIntent: () => number;

  /** Whether an intent ticket is still the latest. */
  isCurrentIntent: (ticket: number) => boolean;

  /** The expanded shape, with the values it was expanded from. */
  onApply: (
    shape: Record<string, number>,
    ticket: number,
    simple: IAutoMovieHumanBodySimpleShape,
  ) => void;

  /** Report a refused expansion or projection. */
  onRefuse: (error: unknown) => void;

  /** Show a building status. */
  onBusy: (text: string) => void;

  /** Restore a ready status when a typed draft retires its in-flight solve. */
  onDraftChanged: () => void;

  /** Name the simple tier as preparing until its first projection answers. */
  onPreparing: (active: boolean) => void;
}
