"use client";

import {
  type Dispatch,
  type ReactElement,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { SITE_BASE } from "../../SITE_BASE";
import { loadGalleryCard } from "../../gallery/loadGalleryCard";
import type { IGalleryCard } from "../../gallery/structures/IGalleryCard";
import type { IGalleryCatalogue } from "../../gallery/structures/IGalleryCatalogue";
import { SharedStage } from "../../stage/SharedStage";

/**
 * One archetype in the object gallery: the model drawn on the page's shared
 * renderer, turning while the card is hovered or focused, with its name and
 * the number of its kinds, linking to its page.
 *
 * The model is built only when the card first comes near the window, so a
 * page of cards builds the cards it shows. A model that fails to build
 * leaves a short note in the view, kept out of the link's name.
 *
 * @param props The subject.
 * @returns The card.
 */
export function ObjectCard(props: {
  subject: IGalleryCatalogue.ISubject;
}): ReactElement {
  const { subject }: typeof props = props;
  const canvas: RefObject<HTMLCanvasElement | null> = useRef(null);
  const hovered: RefObject<boolean> = useRef(false);
  const [failed, setFailed]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);

  useEffect((): (() => void) => {
    let alive: boolean = true;
    let release: (() => void) | null = null;
    setFailed(false);

    // The model waits until the card comes near the window.
    let cancel: () => void = (): void => undefined;
    const near: Promise<void> = new Promise((resolve: () => void): void => {
      if (canvas.current === null) return resolve();
      cancel = SharedStage.near(canvas.current, resolve);
    });
    near
      .then(
        (): Promise<IGalleryCard> =>
          loadGalleryCard(subject.id, subject.variants[0]?.id ?? ""),
      )
      .then((card: IGalleryCard): void => {
        if (!alive || canvas.current === null) {
          card.dispose();
          return;
        }
        let heading: number = 0.4;
        let last: number | null = null;
        const registration: SharedStage.IRegistration = SharedStage.register({
          canvas: canvas.current,
          scene: card.scene,
          camera: card.camera,
          tick: (now: number): boolean => {
            const delta: number = last === null ? 0 : now - last;
            last = now;
            if (!hovered.current) return false;
            heading += delta * 0.0012;
            card.turn(heading);
            return true;
          },
        });
        card.turn(heading);
        release = (): void => {
          registration.release();
          card.dispose();
        };
      })
      .catch((): void => {
        if (alive) setFailed(true);
      });
    return (): void => {
      alive = false;
      cancel();
      release?.();
    };
  }, [subject]);

  return (
    <li
      className="am-object-card"
      onPointerEnter={(): void => {
        hovered.current = true;
      }}
      onPointerLeave={(): void => {
        hovered.current = false;
      }}
      onFocus={(): void => {
        hovered.current = true;
      }}
      onBlur={(): void => {
        hovered.current = false;
      }}
    >
      {/* A full navigation: an archetype's page reads its request from the
          address once, when it mounts. */}
      <a
        href={`${SITE_BASE}/objects/?subject=${subject.id}${subject.variants[0] === undefined ? "" : `&variant=${subject.variants[0].id}`}`}
        className="am-scene-card-link"
      >
        <span className="am-object-view">
          <canvas ref={canvas} aria-hidden="true" />
          {failed ? (
            <span className="am-scene-view-note" aria-hidden="true">
              The model did not build.
            </span>
          ) : null}
        </span>
        <span className="am-scene-card-title">{subject.label}</span>
      </a>
      <span className="am-scene-card-facts am-muted">
        {subject.variants.length === 0
          ? "one form"
          : `${subject.variants.length} kinds: ${subject.variants
              .slice(0, 4)
              .map((v: { label: string }): string => v.label)
              .join(", ")}${subject.variants.length > 4 ? ", …" : ""}`}
      </span>
    </li>
  );
}
