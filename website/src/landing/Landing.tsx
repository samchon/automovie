import Link from "next/link";
import type { ReactElement } from "react";

import { SITE_BASE } from "../SITE_BASE";
import { BakedClient } from "../baked/BakedClient";
import { BakedManifest } from "../baked/BakedManifest";
import type { IBakedManifest } from "../baked/IBakedManifest";
import { CopyCommand } from "../components/landing/CopyCommand";
import { EvidenceGraph } from "../components/landing/EvidenceGraph";
import { Reveal } from "../components/landing/Reveal";
import { ScriptStage } from "../components/landing/ScriptStage";
import { TakeBench } from "../components/landing/TakeBench";
import { GalleryCatalogue } from "../gallery/package/GalleryCatalogue";
import type { IGalleryCatalogue } from "../gallery/structures/IGalleryCatalogue";
import { MotionReference } from "../motions/package/MotionReference";
import type { IMotionReference } from "../motions/structures/IMotionReference";
import { SCENES } from "../scenes/SCENES";
import type { IScene } from "../scenes/structures/IScene";
import { LANDING_FILM } from "./LANDING_FILM";
import { LANDING_RAIL } from "./LANDING_RAIL";

/**
 * The landing page. It follows one scene from the decisions it rests on to
 * the frames it computes: the screenplay beside its take, the chain of
 * documents and code, the evidence graph that checks the chain, the takes
 * that vary one choice, the vocabulary it is composed from, and how to
 * start. The counts are read from the installed packages while the site is
 * exported.
 *
 * @returns The page.
 */
export function Landing(): ReactElement {
  const manifest: IBakedManifest = BakedManifest.read();
  const reference: IMotionReference = MotionReference.read();
  const rows: number = reference.families.reduce(
    (sum: number, f: IMotionReference.IFamily): number => sum + f.rows.length,
    0,
  );
  const archetypes: number = GalleryCatalogue.catalogue().groups.reduce(
    (sum: number, group: IGalleryCatalogue.IGroup): number =>
      sum + group.subjects.length,
    0,
  );
  const scene: IScene = SCENES.find(
    (s: IScene): boolean => s.id === LANDING_FILM.scene,
  )!;
  const playing: number = Object.keys(manifest.scenes).length;
  const rail: string[] = LANDING_RAIL.filter(
    (name: string): boolean => manifest.motions[name] !== undefined,
  );

  return (
    <main className="am-landing">
      {/* Hero */}
      <section className="am-hero" aria-labelledby="am-hero-title">
        <div className="am-hero-copy">
          <h1 id="am-hero-title">
            Write the film.
            <br />
            <em>Program the motion.</em>
          </h1>
          <div className="am-hero-side">
            <p className="am-hero-lede">
              Your coding agent writes the screenplay and programs every
              performance as code. AutoMovie computes the same frames every
              time, as a motion hint for video diffusion.
            </p>
            <div className="am-hero-actions">
              <Link className="am-button am-button-primary" href="/docs/">
                Read the docs
              </Link>
              <Link className="am-button" href="/scenes/">
                See the scenes
              </Link>
            </div>
            <CopyCommand command="npx automovie create my-film" />
          </div>
        </div>
        <ScriptStage film={LANDING_FILM} />
      </section>

      {/* Why */}
      <section className="am-why" aria-labelledby="am-why-title">
        <Reveal className="am-why-inner">
          <h2 id="am-why-title" className="am-section-title">
            A video model invents motion.
            <br />A motion hint tells it what happens.
          </h2>
          <div className="am-why-columns">
            <p>
              A prompt can describe a fight. It cannot put a fist on a jaw at
              4.2 seconds, keep both feet on the floor through the turn, or make
              the next take match this one. The model fills in what the words
              leave out, differently every time.
            </p>
            <p>
              AutoMovie gives the model who is where, what they do, what they
              touch and when: a hint video and the control channels a model
              takes, pose, depth, normal, outline and mask, rendered from one
              performance and aligned frame for frame.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Pipeline */}
      <section className="am-chain" aria-labelledby="am-chain-title">
        <header className="am-chain-head">
          <h2 id="am-chain-title" className="am-section-title">
            From a decision to a frame,
            <br />
            every link is written down.
          </h2>
          <p>
            A short runs brief to screenplay; a series runs settings, treatments
            and scripts first. Each layer cites the one above it, and the code
            cites the screenplay, so nothing in the film exists without a
            written reason.
          </p>
        </header>
        <ol className="am-chain-steps">
          <Reveal as="li" className="am-chain-step">
            <div className="am-chain-text">
              <span className="am-chain-number">1</span>
              <h3>Decide</h3>
              <p>
                The brief holds only the decisions several scenes must keep
                true: a fighter&apos;s stance, his temper, the ring. Each has an
                anchor a scene can cite.
              </p>
            </div>
            <div className="am-chain-panel">
              <p className="am-panel-file">{LANDING_FILM.brief.file}</p>
              <pre className="am-doc">{LANDING_FILM.brief.text.join("\n")}</pre>
            </div>
          </Reveal>
          <Reveal as="li" className="am-chain-step">
            <div className="am-chain-text">
              <span className="am-chain-number">2</span>
              <h3>Write</h3>
              <p>
                The screenplay is the last place a decision is made. One file
                per scene, one heading per beat, and each beat records who is in
                it, what they intend, what comes of it and where the camera
                stands.
              </p>
            </div>
            <div className="am-chain-panel">
              <p className="am-panel-file">{LANDING_FILM.file}</p>
              <pre className="am-doc am-doc-script">
                {LANDING_FILM.record.join("\n")}
              </pre>
            </div>
          </Reveal>
          <Reveal as="li" className="am-chain-step">
            <div className="am-chain-text">
              <span className="am-chain-number">3</span>
              <h3>Program</h3>
              <p>
                The agent composes each performance from typed actions and cites
                the beats it realizes. An action the vocabulary lacks does not
                type-check; a placement the body cannot reach is refused with
                the reason and a fix.
              </p>
            </div>
            <div className="am-chain-panel">
              <p className="am-panel-file">{LANDING_FILM.modules[0]!.file}</p>
              <pre className="am-doc am-doc-code">
                {lines(LANDING_FILM.code.text)}
              </pre>
            </div>
          </Reveal>
          <Reveal as="li" className="am-chain-step">
            <div className="am-chain-text">
              <span className="am-chain-number">4</span>
              <h3>Check</h3>
              <p>
                With the composition check on, <code>pnpm run evidence</code>{" "}
                counts every beat, section and scene file and fails while one is
                not realized, so an agent cannot report a scene done while a
                beat is missing.
              </p>
            </div>
            <div className="am-chain-panel am-chain-panel-dark">
              <pre className="am-terminal" data-failed="true">
                {LANDING_FILM.report.failing.join("\n")}
              </pre>
              <p className="am-panel-note">
                An abridged report in the format <code>@wrtnlabs/evidence</code>{" "}
                prints; the counts are this example production&apos;s.
              </p>
            </div>
          </Reveal>
          <Reveal as="li" className="am-chain-step">
            <div className="am-chain-text">
              <span className="am-chain-number">5</span>
              <h3>Render</h3>
              <p>
                The engine computes each frame from the code and a seed. A
                defect is found on a still, fixed in the module that caused it
                and recomputed at the same second, never regenerated.
              </p>
            </div>
            <div className="am-chain-panel am-chain-panel-still">
              <img
                src={BakedClient.address("scene", LANDING_FILM.scene, "svg")}
                alt="A still of the kickboxing take: the key pose solid, the poses around it faint, and the hands' paths."
                width={480}
                height={360}
                loading="lazy"
              />
              <ul className="am-channels" aria-label="What a hint delivers">
                {[
                  "hint video",
                  "pose",
                  "depth",
                  "normal",
                  "outline",
                  "mask",
                ].map(
                  (c: string): ReactElement => (
                    <li key={c}>{c}</li>
                  ),
                )}
              </ul>
            </div>
          </Reveal>
        </ol>
      </section>

      {/* Evidence graph */}
      <section className="am-room" aria-labelledby="am-room-title">
        <div className="am-room-inner">
          <header className="am-room-head">
            <h2 id="am-room-title" className="am-section-title">
              The evidence graph checks every link.
            </h2>
            <p>
              Every citation is an obligation <code>pnpm run evidence</code>{" "}
              counts on its own, so one reference never covers another. Point at
              a node to see what it rests on and what rests on it. Then delete a
              citation.
            </p>
          </header>
          <EvidenceGraph film={LANDING_FILM} />
          <ul className="am-room-facts">
            <li>
              <h3>Separate reviewers</h3>
              <p>
                The author, the answerer and the reviewer work in separate
                contexts, and the reviewer reads the screenplay without its
                answers.
              </p>
            </li>
            <li>
              <h3>Reviews expire</h3>
              <p>
                A review is tied to the text it read; edit a beat and its review
                is stale until it is read again.
              </p>
            </li>
            <li>
              <h3>Verified or watched</h3>
              <p>
                The acceptance record says what the agent verified on stills and
                what only you watched.
              </p>
            </li>
          </ul>
          <Link
            className="am-button am-button-light"
            href="/docs/screenplay/evidence-graph/"
          >
            How the evidence graph works
          </Link>
        </div>
      </section>

      {/* Coarse models, detailed motion */}
      <section className="am-motion" aria-labelledby="am-motion-title">
        <div className="am-motion-copy">
          <h2 id="am-motion-title" className="am-section-title">
            Simple bodies.
            <br />
            Precise motion.
          </h2>
          <p>
            People are a polygon man and sets are coarse models, on purpose: a
            video model supplies the surfaces. The accuracy goes into the
            performance. A fist meets the struck region, each foot lands on the
            floor at its step, both hands close on a grip, all scaled to the
            body that performs it.
          </p>
          <p>
            One composition plays the same way every time. A seed changes how
            and when, never what. Change the bodies or the skill and the same
            code fits them.
          </p>
          <Link className="am-text-link" href="/docs/motion/motion-as-code/">
            Motion as code
          </Link>
        </div>
        <TakeBench
          scene={scene}
          baked={manifest.scenes[scene.id] !== undefined}
        />
      </section>

      {/* Library */}
      <section className="am-library" aria-labelledby="am-library-title">
        <header className="am-library-head">
          <h2 id="am-library-title" className="am-section-title">
            A vocabulary to compose from.
          </h2>
          <p>
            {reference.actions.length} actions and {rows} named rows in{" "}
            {reference.families.length} families, {archetypes} archetypes of
            things people hold, sit on, ride and fight with, and {playing}{" "}
            scenes composed from them. A production writes a law of its own only
            for what the vocabulary lacks.
          </p>
        </header>
        <ul className="am-rail" aria-label="Some motions">
          {rail.map(
            (name: string): ReactElement => (
              <li key={name}>
                <a href={`${SITE_BASE}/motions/${name}/`}>
                  <img
                    src={BakedClient.address("motion", name, "svg")}
                    alt=""
                    width={240}
                    height={180}
                    loading="lazy"
                  />
                  <span>{name}</span>
                </a>
              </li>
            ),
          )}
        </ul>
        <nav className="am-library-links" aria-label="Library">
          <Link href="/scenes/">
            <strong>Scenes</strong>
            <span>Whole performances, each with its takes and its code.</span>
          </Link>
          <Link href="/motions/">
            <strong>Motions</strong>
            <span>Every action and row, by family, with its parameters.</span>
          </Link>
          <Link href="/archetypes/">
            <strong>Archetypes</strong>
            <span>Coarse seeded objects and the contacts an action reads.</span>
          </Link>
          <Link href="/playground/">
            <strong>Playground</strong>
            <span>Compose a performance and watch it computed.</span>
          </Link>
        </nav>
      </section>

      {/* Start */}
      <section className="am-start" aria-labelledby="am-start-title">
        <h2 id="am-start-title" className="am-section-title">
          Start a production.
        </h2>
        <ol className="am-start-steps">
          <li>
            <p>Create it and install.</p>
            <CopyCommand command="npx automovie create my-film" />
            <CopyCommand command="cd my-film && pnpm install" />
          </li>
          <li>
            <p>
              Open it in a coding agent that reads AGENTS.md or CLAUDE.md, and
              say what to make.
            </p>
            <blockquote className="am-prompt">
              Write a three-minute short about two sparring partners whose
              friendly round stops being friendly. Deliver the motion hint.
            </blockquote>
          </li>
          <li>
            <p>
              The agent records your decisions in PROJECT.md, writes the
              screenplay, programs the scenes and hands you the hint with what
              it verified.
            </p>
            <div className="am-hero-actions">
              <Link className="am-button am-button-primary" href="/docs/setup/">
                Setup
              </Link>
              <Link className="am-button" href="/docs/first-film/">
                Your first film
              </Link>
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}

/** Lines of code, each `@evidence` tag and its reason marked, so the citations stand out. */
function lines(text: readonly string[]): ReactElement[] {
  return text.map(
    (line: string, index: number): ReactElement => (
      <span
        key={index}
        className={
          line.includes("@evidence") || line.startsWith(" *   ")
            ? "am-line-evidence"
            : undefined
        }
      >
        {line}
        {"\n"}
      </span>
    ),
  );
}
