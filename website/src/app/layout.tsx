import type { Metadata } from "next";
import type { NextFontWithVariable } from "next/dist/compiled/@next/font/dist/types";
import {
  Courier_Prime,
  Geist,
  Geist_Mono,
  Instrument_Serif,
} from "next/font/google";
import { Head } from "nextra/components";
import type { ReactElement, ReactNode } from "react";

import { SITE_BASE } from "../SITE_BASE";
import "./site.css";

const title: string = "AutoMovie";
const description: string =
  "Your coding agent writes the screenplay, answers every decision in writing and programs the motion. AutoMovie computes the same frames every time, as a motion hint for video diffusion.";

/** The text and interface face. */
const sans: NextFontWithVariable = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/** The code face. */
const mono: NextFontWithVariable = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/** The headline face. */
const display: NextFontWithVariable = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

/** The screenplay's typewriter face. */
const script: NextFontWithVariable = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://samchon.github.io"),
  title: {
    default: `${title}: write the film, program the motion`,
    template: "%s | AutoMovie",
  },
  description,
};

/**
 * The document every page of the site is rendered into, with the four faces
 * as CSS variables the tokens read.
 *
 * @param props The page.
 * @returns The document.
 */
export default function RootLayout(props: {
  children: ReactNode;
}): ReactElement {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={[
        sans.variable,
        mono.variable,
        display.variable,
        script.variable,
      ].join(" ")}
    >
      <Head
        color={{
          hue: 34,
          saturation: 100,
          lightness: { light: 27, dark: 59 },
        }}
        backgroundColor={{ light: "#fbfaf7", dark: "#0f1013" }}
      >
        <link
          rel="icon"
          type="image/svg+xml"
          href={`${SITE_BASE}/favicon.svg`}
        />
        <meta name="theme-color" content="#17181c" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>
      <body>{props.children}</body>
    </html>
  );
}
