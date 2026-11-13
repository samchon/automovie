"use client";

import {
  type KeyboardEvent,
  type ReactElement,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import type { IGalleryAdapter } from "../../gallery/IGalleryAdapter";
import type { IGalleryRequest } from "../../gallery/structures/IGalleryRequest";
import type { IGalleryView } from "../../gallery/structures/IGalleryView";

/** The named views a button puts the camera on. */
const VIEWS: readonly { view: IGalleryAdapter.View; label: string }[] = [
  { view: "quarter", label: "Three-quarter" },
  { view: "front", label: "Front" },
  { view: "right", label: "Right" },
  { view: "back", label: "Back" },
  { view: "left", label: "Left" },
  { view: "top", label: "Top" },
];

/**
 * The 3D view of the chosen subject, with the controls that turn it.
 *
 * The view is turned by dragging, by the arrow keys while it has focus, and
 * by the buttons under it, so every way of turning has a keyboard path.
 * While a subject is built the view says so over the previous picture; when
 * the packages refuse a request the view shows their message instead.
 *
 * @param props The adapter, what to show, and the listener for what was built.
 * @returns The view.
 */
export function GalleryViewport(props: {
  /** The adapter that draws. */
  adapter: IGalleryAdapter;

  /** What to show. */
  request: IGalleryRequest;

  /** Hear what was built, or null while nothing is. */
  onView: (view: IGalleryView | null) => void;
}): ReactElement {
  const canvas: RefObject<HTMLCanvasElement | null> =
    useRef<HTMLCanvasElement>(null);
  const labels: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  const stage: RefObject<IGalleryAdapter.IStage | null> =
    useRef<IGalleryAdapter.IStage | null>(null);

  // The subject and variant last drawn, which decides whether the camera is
  // put back on the whole subject.
  const shown: RefObject<string> = useRef<string>("");
  const [busy, setBusy] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [grid, setGrid] = useState<number | null>(null);
  const { adapter, request, onView } = props;

  // One stage for the life of the view.
  useEffect((): (() => void) | undefined => {
    if (canvas.current === null || labels.current === null) return undefined;
    try {
      stage.current = adapter.mount(canvas.current, labels.current);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : String(thrown));
      setBusy(false);
      return undefined;
    }
    return (): void => {
      stage.current?.unmount();
      stage.current = null;
      shown.current = "";
    };
  }, [adapter]);

  // Build and draw whenever the request changes. The camera goes back to
  // the whole subject only when the subject or its variant changes.
  useEffect((): (() => void) | undefined => {
    const current: IGalleryAdapter.IStage | null = stage.current;
    if (current === null) return undefined;
    let alive: boolean = true;
    const form: string = `${request.subject}/${request.variant}`;
    setBusy(true);
    current
      .show(request, form !== shown.current)
      .then((view: IGalleryView): void => {
        if (!alive) return;
        shown.current = form;
        setName(view.name);
        setGrid(view.grid);
        setError(null);
        setBusy(false);
        onView(view);
      })
      .catch((thrown: unknown): void => {
        if (!alive) return;
        setError(thrown instanceof Error ? thrown.message : String(thrown));
        setBusy(false);
        onView(null);
      });
    return (): void => {
      alive = false;
    };
  }, [request, onView]);

  const key = (event: KeyboardEvent<HTMLCanvasElement>): void => {
    const step: number = event.shiftKey ? 45 : 15;
    const moves: Record<string, [number, number, number]> = {
      ArrowLeft: [-step, 0, 1],
      ArrowRight: [step, 0, 1],
      ArrowUp: [0, step, 1],
      ArrowDown: [0, -step, 1],
      "+": [0, 0, 1 / 1.2],
      "=": [0, 0, 1 / 1.2],
      "-": [0, 0, 1.2],
    };
    const move: [number, number, number] | undefined = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    stage.current?.orbit(...move);
  };

  return (
    <section className="am-viewport-region" aria-label="3D view">
      <div className="am-viewport" aria-busy={busy}>
        <canvas
          ref={canvas}
          className="am-viewport-canvas"
          tabIndex={0}
          role="img"
          aria-label={
            name === ""
              ? "3D view"
              : `3D view of the ${name}. Arrow keys turn it, plus and minus zoom.`
          }
          onKeyDown={key}
        />
        <div ref={labels} className="am-viewport-tags" aria-hidden="true" />
        {busy ? (
          <p className="am-viewport-status" role="status">
            Building the model.
          </p>
        ) : null}
        {error === null ? null : (
          <div className="am-viewport-error" role="alert">
            <strong>Not built</strong>
            <pre className="am-message">{error}</pre>
          </div>
        )}
      </div>
      <div className="am-toolbar" role="group" aria-label="View">
        {VIEWS.map(
          ({ view, label }): ReactElement => (
            <button
              key={view}
              type="button"
              onClick={(): void => stage.current?.view(view)}
            >
              {label}
            </button>
          ),
        )}
        <span className="am-toolbar-gap" />
        <button
          type="button"
          aria-label="Zoom in"
          onClick={(): void => stage.current?.orbit(0, 0, 1 / 1.2)}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={(): void => stage.current?.orbit(0, 0, 1.2)}
        >
          −
        </button>
      </div>
      <p className="am-muted am-hint">
        Drag to turn. With the view focused, the arrow keys turn it and the
        wheel zooms.
        {grid === null
          ? ""
          : ` The floor grid has ${grid >= 1 ? `${grid} m` : `${Math.round(grid * 100)} cm`} cells.`}
      </p>
    </section>
  );
}
