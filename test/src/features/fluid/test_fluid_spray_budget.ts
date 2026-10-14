import type { IAutoMovieFluidDomain, IAutoMovieFluidSpray, IAutoMovieFluidSprayParticle } from "@automovie/interface";

import { sampleFluidSpray, simulateFluidDomain } from "@automovie/engine";

import { TestValidator } from "@nestia/e2e";

import { fluidDomain } from "../internal/fluidFixtures";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

const JET: IAutoMovieFluidSpray = {
  id: "jet",
  column: 1,
  row: 1,
  rate: 8,
  lifetime: 1,
  speed: 4,
  direction: { x: 0, y: 1, z: 0 },
  spread: 0,
  size: 0.1,
  seed: 42,
  maxParticles: 16,
  lodDistance: 10,
};

/** Borrow the supplied emitter list in the original raised 4x4 flat-water domain; its authored nozzle position and dyadic clock make the ballistic expectation hand-computable. */
const misted: (sprays: IAutoMovieFluidSpray[]) => IAutoMovieFluidDomain = (sprays: IAutoMovieFluidSpray[]): IAutoMovieFluidDomain =>
  fluidDomain({
    id: "jet-basin",
    grid: {
      columns: 4,
      rows: 4,
      cellX: 0.5,
      cellZ: 0.5,
      origin: { x: 2, y: 1, z: -3 },
    },
    solver: {
      fixedStepSeconds: 0.015625,
      gravity: 8,
      drag: 0,
      dryDepth: 0,
      referenceDepth: 1,
      maxSteps: 5_000,
    },
    bed: new Array<number>(16).fill(0),
    depth: new Array<number>(16).fill(0.5),
    solid: new Array<boolean>(16).fill(false),
    sprays,
  });

/**
 * Observe CPU spray particles against the authored ballistic arc, selected
 * per-emitter cap and distance LOD, leaving the input water depths unchanged.
 *
 * The selected cap and LOD are observed before rendering; no GPU projection
 * is executed or compared here. The arc itself is hand-computable: with zero
 * spread the launch direction is exactly the declared axis, so particle `i` at
 * age `a` stands at `nozzle + (0, speed·a − ½·g·a², 0)`.
 *
 * With `rate = 8/s`, `lifetime = 1 s` and the sample taken at `t = 1 s`, the
 * live set is exactly the indices `1..8`: index 0 is precisely one lifetime old
 * and therefore dead, and index 8 was launched exactly now.
 *
 * Scenarios:
 *
 * 1. Eight particles are live, in ascending spawn order, and particle 6 stands at
 *    the hand-computed `y = 1.5 + 4·0.25 − 4·0.25² = 2.25` over the nozzle at
 *    the free surface, with the matching age ratio.
 * 2. The hard cap keeps the newest survivors: a cap of 3 yields exactly indices 6,
 *    7 and 8.
 * 3. Distance LOD thins deterministically: at 25 m with a 10 m LOD distance the
 *    stride is 3, so exactly indices 3 and 6 survive; a repeat preserves the
 *    particle count and positions with zero component tolerance.
 * 4. A spread jet still launches on the unit sphere: the ballistic term removed,
 *    every particle stands within `1e-9` of `speed · age` from the nozzle.
 * 5. Boundaries: a domain with no emitter samples nothing, a sample before the
 *    first lifetime has elapsed holds only the particles born so far, and the
 *    second declared emitter contributes eight particles.
 * 6. What cannot be sampled is refused rather than silently emptied. A state
 *    solved from another domain puts every nozzle at a free surface this
 *    lattice never had, and a camera distance that is not a real number makes
 *    the LOD stride not a real number too — `index % NaN` rejects every
 *    particle, so the fountain would simply stop with nobody told. Their twins
 *    are this domain's own state and a large finite distance, which
 *    thins hard and still returns.
 * 7. An emitter axis scaled by `1e200` or `1e-200`, whose squared length
 *    overflows or underflows, preserves the unit-axis particle count and
 *    positions within the vector predicate's `1e-6` component tolerance.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples seeded spray at selected times/distances and checks lifetime, ballistic positions, deterministic repeat/order, a per-emitter particle cap, LOD density and refusal bounds; CPU particles are the observed output.
 * @evidence contracts/testing.md#independent-expectations Authored birth windows, fixed-step times, gravity and speed give ballistic expectations, while literal caps and near/far counts provide the budget oracle. Same-call seed comparisons observe reproducibility rather than independent random distribution or GPU agreement.
 * @evidence contracts/testing.md#distinguishing-cases Preserves lifecycle, empty/near/far/negative-distance and cap cases, jitter normalization, foreign-domain/nonfinite-distance refusals and huge/tiny finite direction axes; fluid conservation and rendered pixels are outside this entry.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns all portable CPU spray sampling cases through actual engine functions and existing fixtures, without a GPU, browser or native renderer.
 */
export function test_fluid_spray_budget(): void {
  const domain: ReturnType<typeof misted> = misted([JET]);
  const state: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 64);
  const sample: ReturnType<typeof sampleFluidSpray> = sampleFluidSpray({ domain, state });
  TestValidator.predicate("the fixed-step sample time", (): boolean =>
    Object.is(state.time, 1) && nclose(state.time, 1, 0),
  );
  TestValidator.predicate("the hand-computed ballistic position", (): boolean =>
    vclose(sample.particles[5].position, { x: 2.75, y: 2.25, z: -2.25 }),
  );
  TestValidator.predicate("the hand-computed age ratio", (): boolean =>
    nclose(sample.particles[5].ageRatio, 0.25),
  );
  TestValidator.predicate("the authored particle size", (): boolean =>
    nclose(sample.particles[5].size, 0.1),
  );
  TestValidator.predicate("sampling leaves water depths unchanged", (): boolean =>
    state.depth.every((value: number): boolean => value === 0.5 && nclose(value, 0.5, 0)),
  );
  TestValidator.equals(
    "the live set is the ballistic arc the emitter declared",
    namedFacts([
      ["count", (): boolean => sample.particles.length === 8],
      [
        "ascending",
        (): boolean =>
          sample.particles.every((particle: IAutoMovieFluidSprayParticle, at: number): boolean => particle.index === at + 1),
      ],
      ["emitter", (): boolean => sample.particles[5].spray === "jet"],
      ["step", (): boolean => sample.step === 64],
    ]),
    {
      count: true,
      ascending: true,
      emitter: true,
      step: true,
    },
  );

  const capped: ReturnType<typeof sampleFluidSpray> = sampleFluidSpray({
    domain: misted([{ ...JET, maxParticles: 3 }]),
    state,
  });
  const thinnedDomain: ReturnType<typeof misted> = misted([JET]);
  const thinned: ReturnType<typeof sampleFluidSpray> = sampleFluidSpray({
    domain: thinnedDomain,
    state,
    cameraDistance: 25,
  });
  const thinnedAgain: ReturnType<typeof sampleFluidSpray> = sampleFluidSpray({
    domain: thinnedDomain,
    state,
    cameraDistance: 25,
  });
  TestValidator.predicate("LOD positions repeat without dropping particles", (): boolean =>
    thinnedAgain.particles.length === thinned.particles.length &&
    thinnedAgain.particles.every((particle: IAutoMovieFluidSprayParticle, at: number): boolean =>
      vclose(particle.position, thinned.particles[at].position, 0),
    ),
  );
  TestValidator.equals(
    "the engine, not the renderer, enforces the cap and the LOD",
    namedFacts([
      [
        "cap",
        (): boolean =>
          capped.particles.map((particle: IAutoMovieFluidSprayParticle): number => particle.index).join(",") ===
          "6,7,8",
      ],
      [
        "lod",
        (): boolean =>
          thinned.particles.map((particle: IAutoMovieFluidSprayParticle): number => particle.index).join(",") ===
          "3,6",
      ],
      [
        "negativeDistanceThinsNothing",
        (): boolean =>
          sampleFluidSpray({
            domain,
            state,
            cameraDistance: -40,
          }).particles.length === 8,
      ],
    ]),
    {
      cap: true,
      lod: true,
      negativeDistanceThinsNothing: true,
    },
  );

  const spread: ReturnType<typeof sampleFluidSpray> = sampleFluidSpray({
    domain: misted([{ ...JET, spread: 0.75 }]),
    state,
  });
  TestValidator.predicate(
    "a spread jet still launches on the unit sphere",
    (): boolean =>
      spread.particles.length === sample.particles.length &&
          spread.particles.every((particle: IAutoMovieFluidSprayParticle): boolean => {
            const age: number = particle.ageRatio;
            const dx: number = particle.position.x - 2.75;
            const dy: number = particle.position.y - 1.5 + 0.5 * 8 * age * age;
            const dz: number = particle.position.z + 2.25;
            return nclose(
              Math.sqrt(dx * dx + dy * dy + dz * dz),
              4 * age,
              1e-9,
            );
          }) &&
      spread.particles.some((particle: IAutoMovieFluidSprayParticle): boolean => particle.position.x !== 2.75),
  );

  const bare: ReturnType<typeof misted> = misted([]);
  const early: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(domain, 16);
  const twoEmitters: ReturnType<typeof misted> = misted([JET, { ...JET, id: "mist", column: 2, row: 2 }]);
  TestValidator.equals(
    "the boundaries of the emitter budget",
    namedFacts([
      [
        "noEmitter",
        (): boolean =>
          sampleFluidSpray({
            domain: bare,
            state: simulateFluidDomain(bare, 64),
          }).particles.length === 0,
      ],
      [
        "beforeFirstLifetime",
        (): boolean =>
          sampleFluidSpray({ domain, state: early })
            .particles.map((particle: IAutoMovieFluidSprayParticle): number => particle.index)
            .join(",") === "0,1,2",
      ],
      [
        "twoEmitters",
        (): boolean =>
          sampleFluidSpray({ domain: twoEmitters, state }).particles.filter(
            (particle: IAutoMovieFluidSprayParticle): boolean => particle.spray === "mist",
          ).length === 8,
      ],
    ]),
    { noEmitter: true, beforeFirstLifetime: true, twoEmitters: true },
  );

  const foreign: ReturnType<typeof fluidDomain> = fluidDomain({ id: "other-basin" });
  TestValidator.equals(
    "an unsamplable request is named, never answered with an empty jet",
    namedFacts([
      [
        "foreignState",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof sampleFluidSpray> =>
              sampleFluidSpray({
                domain,
                state: simulateFluidDomain(foreign, 0),
              }),
            ["jet-basin", "other-basin"],
          ),
      ],
      [
        "nanDistance",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof sampleFluidSpray> =>
              sampleFluidSpray({
                domain,
                state,
                cameraDistance: Number.NaN,
              }),
            ["jet-basin", "non-finite camera distance"],
          ),
      ],
      [
        "infiniteDistance",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof sampleFluidSpray> =>
              sampleFluidSpray({
                domain,
                state,
                cameraDistance: Number.POSITIVE_INFINITY,
              }),
            ["jet-basin", "non-finite camera distance"],
          ),
      ],
      [
        // Stride 8 over the live indices 1..8 keeps exactly index 8: heavy
        // thinning still answers, which is what makes the refusals above about
        // the number being unreal rather than about the distance being large.
        "heavyButFinite",
        (): boolean =>
          sampleFluidSpray({
            domain,
            state,
            cameraDistance: 70,
          })
            .particles.map((particle: IAutoMovieFluidSprayParticle): number => particle.index)
            .join(",") === "8",
      ],
    ]),
    {
      foreignState: true,
      nanDistance: true,
      infiniteDistance: true,
      heavyButFinite: true,
    },
  );

  // An axis whose squared length overflows or underflows is still a direction:
  // compare both particle count and positions with the unit-axis sample.
  const unit: IAutoMovieFluidSprayParticle[] = sampleFluidSpray({ domain, state }).particles;
  /** Change only the positive Y-axis magnitude and sample against the original valid state; the unit-axis sample is a scale-invariance twin, not a random-distribution oracle. */
  const scaled: (factor: number) => IAutoMovieFluidSprayParticle[] = (factor: number): IAutoMovieFluidSprayParticle[] =>
    sampleFluidSpray({
      domain: misted([
        { ...JET, direction: { x: 0, y: factor, z: 0 } },
      ]),
      state: simulateFluidDomain(misted([JET]), 64),
    }).particles;
  const huge: IAutoMovieFluidSprayParticle[] = scaled(1e200);
  const tiny: IAutoMovieFluidSprayParticle[] = scaled(1e-200);
  TestValidator.predicate(
    "an enormous finite axis launches along its direction",
    (): boolean => huge.length === unit.length &&
          huge.every(
            (particle: IAutoMovieFluidSprayParticle, at: number): boolean =>
              Number.isFinite(particle.position.y) &&
              vclose(particle.position, unit[at]!.position),
          ),
  );
  TestValidator.predicate(
    "a tiny finite axis launches along its direction",
    (): boolean => tiny.length === unit.length &&
          tiny.every((particle: IAutoMovieFluidSprayParticle, at: number): boolean =>
            vclose(particle.position, unit[at]!.position),
          ),
  );
}
