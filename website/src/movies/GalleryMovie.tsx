"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { GalleryCatalogueNav } from "../components/gallery/GalleryCatalogueNav";
import { GalleryDetails } from "../components/gallery/GalleryDetails";
import { GalleryViewport } from "../components/gallery/GalleryViewport";
import { GalleryAddress } from "../gallery/GalleryAddress";
import type { IGalleryAdapter } from "../gallery/IGalleryAdapter";
import { loadGalleryAdapter } from "../gallery/loadGalleryAdapter";
import type { IGalleryCatalogue } from "../gallery/structures/IGalleryCatalogue";
import type { IGalleryRequest } from "../gallery/structures/IGalleryRequest";
import type { IGalleryView } from "../gallery/structures/IGalleryView";

/** What the page has of the adapter. */
type Loaded =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; adapter: IGalleryAdapter };

/**
 * The gallery: the polygon man and every archetype, one at a time.
 *
 * The catalogue on the left lists every subject the packages export. The
 * view in the middle draws the chosen one, built in the browser. The panel
 * on the right holds its variant, its seed, the dimensions the seed drew
 * and its affordances, with a slider for each articulation.
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

  const onView = useCallback(
    (next: IGalleryView | null): void => setView(next),
    [],
  );

  const head: ReactElement = (
    <header className="am-app-head">
      <h1>Gallery</h1>
      <p className="am-lede">
        The body and the objects the motion vocabulary works with: the polygon
        man of <code>@automovie/human</code> and every archetype of{" "}
        <code>@automovie/archetypes</code>, built in your browser.
      </p>
    </header>
  );

  if (loaded.kind !== "ready" || request === null)
    return (
      <div className="am-app">
        {head}
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
      </div>
    );

  const catalogue: IGalleryCatalogue = loaded.adapter.catalogue;
  const subjects: IGalleryCatalogue.ISubject[] = catalogue.groups.flatMap(
    (group: IGalleryCatalogue.IGroup): IGalleryCatalogue.ISubject[] =>
      group.subjects,
  );
  const subject: IGalleryCatalogue.ISubject | undefined = subjects.find(
    (s: IGalleryCatalogue.ISubject): boolean => s.id === request.subject,
  );

  return (
    <div className="am-app">
      {head}
      <div className="am-gallery">
        <GalleryCatalogueNav
          catalogue={catalogue}
          selected={request.subject}
          onSelect={(id: string): void => {
            const next: IGalleryCatalogue.ISubject | undefined = subjects.find(
              (s: IGalleryCatalogue.ISubject): boolean => s.id === id,
            );
            if (next === undefined) return;
            setView(null);
            setRequest({
              ...request,
              subject: next.id,
              variant: next.variants[0]?.id ?? "",
              state: {},
            });
          }}
        />
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
    </div>
  );
}
