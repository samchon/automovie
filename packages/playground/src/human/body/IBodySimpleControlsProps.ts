import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

/**
 * Inputs of `renderBodySimpleControls`: where the simple tier is drawn, its
 * off-thread solvers, the panel's intent hooks, and where its whole-person
 * readings come from.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Carries the off-thread solvers and whole-person reading source the simple-tier inputs use.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Names where the simple tier is drawn and the expansion and inversion solvers its inputs drive.
 * @author Samchon
 */
export interface IBodySimpleControlsProps {
  /** Document that creates the control elements. */
  dom: Document;

  /** Element the controls replace their children in. */
  container: HTMLElement;

  /** The expansion over the current shape, solved off the page's thread. */
  expand: (simple: IAutoMovieHumanBodySimpleShape, over: Record<string, number>) => Promise<Record<string, number>>;

  /** The projection of a detailed shape, solved off the page's thread. */
  project: (shape: Record<string, number>) => Promise<IAutoMovieHumanBodySimpleShape>;

  /**
   * Where stature and mass are read: the whole person and the head it was
   * read with, shown beside those two rows because the body alone does not
   * determine them.
   */
  wholeSource: string;

  /** The current detailed shape the expansion applies over. */
  current: () => Record<string, number>;

  /** Reserve the panel's intent generation synchronously at Apply click. */
  reserveIntent: () => number;

  /** Read the panel generation when asynchronous work settles. */
  currentIntent: () => number;

  /** Whether an intent ticket is still the latest. */
  isCurrentIntent: (ticket: number) => boolean;

  /** The expanded shape, with the values it was expanded from. */
  onApply: (shape: Record<string, number>, ticket: number, simple: IAutoMovieHumanBodySimpleShape) => void;

  /** Report a refused expansion or projection. */
  onRefuse: (error: unknown) => void;

  /** Show a building status. */
  onBusy: (text: string) => void;

  /** Restore a ready status when a typed draft retires its in-flight solve. */
  onDraftChanged: () => void;
}
