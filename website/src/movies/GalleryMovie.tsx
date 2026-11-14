"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { GalleryDetails } from "../components/gallery/GalleryDetails";
import { GalleryViewport } from "../components/gallery/GalleryViewport";
import { GalleryAddress } from "../gallery/GalleryAddress";
import type { IGalleryAdapter } from "../gallery/IGalleryAdapter";
import { loadGalleryAdapter } from "../gallery/loadGalleryAdapter";
import type { IGalleryCatalogue } from "../gallery/structures/IGalleryCatalogue";
import type { IGalleryRequest } from "../gallery/structures/IGalleryRequest";
import type { IGalleryView } from "../gallery/structures/IGalleryView";
import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import { SCENES } from "../scenes/SCENES";
import type { IScene } from "../scenes/structures/IScene";

/** What the page has of the adapter. */
type Loaded =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; adapter: IGalleryAdapter };

/**
 * One archetype: the view, built in the browser, beside its name and kind,
 * its specs (the dimensions its seed drew, its affordances) and, on request,
 * the controls that customise it (seed, affordance marks, articulations).
 * Under them, the scenes that place it.
 *
 * What is shown is kept in the address's query, so a link shows the same
 * subject in the same state.
 *
 * @returns The page.
 */
export default function GalleryMovie(): ReactElement {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [request, setRequest] = useState<IGalleryRequest | null>(null);
  const [view, setView] = useState<IGalleryView | null>(null);

  useEffect((): (() => void) => {
    let alive: boolean = true;
    loadGalleryAdapter()
      .then((adapter: IGalleryAdapter): void => {
        if (!alive) return;
        setRequest(
          GalleryAddress.decode(window.location.search, adapter.catalogue),
        );
        setLoaded({ kind: "ready", adapter });
      })
      .catch((error: unknown): void => {
        if (alive)
          setLoaded({
            kind: "failed",
            message: error instanceof Error ? error.message : String(error),
          });
      });
    return (): void => {
      alive = false;
    };
  }, []);

  // The address follows the request.
  useEffect((): void => {
    if (request === null) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${GalleryAddress.encode(request)}${window.location.hash}`,
    );
  }, [request]);

  // The tab's title names the archetype shown.
  useEffect((): void => {
    if (loaded.kind !== "ready" || request === null) return;
    const shown: IGalleryCatalogue.ISubject | undefined =
      loaded.adapter.catalogue.groups
        .flatMap(
          (group: IGalleryCatalogue.IGroup): IGalleryCatalogue.ISubject[] =>
            group.subjects,
        )
        .find(
          (s: IGalleryCatalogue.ISubject): boolean => s.id === request.subject,
        );
    if (shown !== undefined) document.title = `${shown.label} | AutoMovie`;
  }, [loaded, request]);

  const onView = useCallback(
    (next: IGalleryView | null): void => setView(next),
    [],
  );

  // The page is named after the archetype it shows, in its heading and its
  // title, with the way back to every object above it.
  const head: (title: string) => ReactElement = (
    title: string,
  ): ReactElement => (
    <header className="am-app-head">
      <nav aria-label="Breadcrumb" className="am-lede">
        <a href="/automovie/objects/">All objects</a>
      </nav>
      <h1>{title}</h1>
    </header>
  );

  if (loaded.kind !== "ready" || request === null)
    return (
      <main className="am-app">
        {head("Objects")}
        {loaded.kind === "failed" ? (
          <div className="am-alert" role="alert">
            <h2>The packages did not load</h2>
            <pre className="am-message">{loaded.message}</pre>
          </div>
        ) : (
          <p className="am-status" role="status">
            Loading the packages.
          </p>
        )}
      </main>
    );

  const catalogue: IGalleryCatalogue = loaded.adapter.catalogue;
  const subjects: IGalleryCatalogue.ISubject[] = catalogue.groups.flatMap(
    (group: IGalleryCatalogue.IGroup): IGalleryCatalogue.ISubject[] =>
      group.subjects,
  );
  const subject: IGalleryCatalogue.ISubject | undefined = subjects.find(
    (s: IGalleryCatalogue.ISubject): boolean => s.id === request.subject,
  );
  const used: IScene[] = SCENES.filter(
    (scene: IScene): boolean =>
      scene.hidden !== true &&
      (scene.composition?.objects ?? []).some(
        (o: IPlaygroundComposition.IObject): boolean =>
          o.producer === request.subject,
      ),
  );

  return (
    <main className="am-app">
      {head(subject?.label ?? "Objects")}
      <div className="am-gallery am-gallery-detail">
        <GalleryViewport
          adapter={loaded.adapter}
          request={request}
          onView={onView}
        />
        {subject === undefined ? null : (
          <GalleryDetails
            subject={subject}
            request={request}
            view={view}
            onChange={setRequest}
          />
        )}
      </div>
      <section aria-labelledby="am-used" className="am-stack">
        <h2 id="am-used">Used in scenes</h2>
        {used.length === 0 ? (
          <p className="am-muted">No scene places it yet.</p>
        ) : (
          <ul className="am-plain">
            {used.map(
              (scene: IScene): ReactElement => (
                <li key={scene.id}>
                  <Link href={`/scenes/${scene.id}/`}>{scene.title}</Link>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </main>
  );
}
