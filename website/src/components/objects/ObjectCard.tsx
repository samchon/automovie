"use client";

import { type ReactElement, type RefObject, useEffect, useRef } from "react";

import { loadGalleryCard } from "../../gallery/loadGalleryCard";
import type { IGalleryCard } from "../../gallery/structures/IGalleryCard";
import type { IGalleryCatalogue } from "../../gallery/structures/IGalleryCatalogue";
import { SharedStage } from "../../stage/SharedStage";

/**
 * One archetype in the object gallery: the model drawn on the page's shared
 * renderer, turning while the card is hovered or focused, with its name and
 * the number of its kinds, linking to its page.
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

  useEffect((): (() => void) => {
    let alive: boolean = true;
    let release: (() => void) | null = null;
    loadGalleryCard(subject.id, subject.variants[0]?.id ?? "")
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
      .catch((): void => undefined);
    return (): void => {
      alive = false;
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
      {/* A full navigation: the gallery and an archetype's page are one
          route, which reads its query once when it opens. */}
      <a
        href={`/automovie/objects/?subject=${subject.id}${subject.variants[0] === undefined ? "" : `&variant=${subject.variants[0].id}`}`}
        className="am-scene-card-link"
      >
        <span className="am-object-view">
          <canvas ref={canvas} aria-hidden="true" />
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
