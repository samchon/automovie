import type { Metadata } from "next";
import { Head } from "nextra/components";
import type { ReactElement, ReactNode } from "react";

import "./global.css";

const title: string = "AutoMovie";
const description: string =
  "An LLM writes a film screenplay and authors deterministic staging and motion as hints for video diffusion.";

/** The path GitHub Pages serves the site under, as `next.config.ts` sets it. */
const BASE_PATH: string = "/automovie";

export const metadata: Metadata = {
  metadataBase: new URL("https://samchon.github.io"),
  title: {
    default: title,
    template: "%s | AutoMovie",
  },
  description,
};

/**
 * The document every page of the site is rendered into.
 *
 * @param props The page.
 * @returns The document.
 */
export default function RootLayout(props: {
  children: ReactNode;
}): ReactElement {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head
        color={{
          hue: 39,
          saturation: 100,
          lightness: { light: 27, dark: 62 },
        }}
        backgroundColor={{ light: "#ffffff", dark: "#111317" }}
      >
        <link
          rel="icon"
          type="image/svg+xml"
          href={`${BASE_PATH}/favicon.svg`}
        />
        <meta name="theme-color" content="#1c1a18" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>
      <body>{props.children}</body>
    </html>
  );
}
