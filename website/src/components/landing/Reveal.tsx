"use client";

import {
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";

/**
 * A block that rises into place the first time it comes into the window.
 * The content is in the page from the start, so a reader without scripts
 * or with reduced motion sees it in place; the stylesheet animates only
 * `[data-reveal="hidden"]`, which this sets once the script runs.
 *
 * @param props The content and its element's class.
 * @returns The block.
 */
export function Reveal(props: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}): ReactElement {
  const ref: RefObject<HTMLElement | null> = useRef(null);
  useEffect((): (() => void) => {
    const element: HTMLElement | null = ref.current;
    if (element === null) return (): void => undefined;
    const rect: DOMRect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight) return (): void => undefined;
    element.dataset.reveal = "hidden";
    const observer: IntersectionObserver = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        if (!entries.some((e: IntersectionObserverEntry): boolean => e.isIntersecting)) return;
        element.dataset.reveal = "shown";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(element);
    return (): void => observer.disconnect();
  }, []);
  const Tag: "div" | "section" | "article" | "li" = props.as ?? "div";
  return (
    <Tag ref={ref as never} className={props.className}>
      {props.children}
    </Tag>
  );
}
