# @automovie/human

Generates a human figure from typed parameters by code: named measurements, physiological motions and closed-set choices go in, and an `IAutoMovieModel` comes out. The package holds no mesh, morph target or baked data.

The package is being rebuilt under [#2788](https://github.com/samchon/automovie/issues/2788). Today it admits the documents, converts traits for any age and either sex from published anthropometry, generates the full 55-bone humanoid skeleton with landmarks and per-joint ranges of motion, and emits it as a stick figure with a skin joined from one generator per part, `getModel({ appearance, assembly: "joined" })` for one skinned surface or `"parts"` for each part alone; the real parts, face, hair and underwear arrive stage by stage.

## Usage

```typescript
import { AutoMovieHuman, AutoMovieHumanConverter, IAutoMovieHumanTraits } from "@automovie/human";

const traits: IAutoMovieHumanTraits = {
  version: 1,
  sex: "female",
  age: 30,
  stature: null,
  population: "european",
  build: { adiposity: 0, muscularity: 0, slimness: 0, cuteness: 0 },
};
const human: AutoMovieHuman = AutoMovieHuman.fromTraits({ id: "person", traits });
const model = human.getModel({
  appearance: new AutoMovieHumanConverter().toAppearance(traits),
});
const pose = human.pose({
  pose: {
    version: 1,
    joints: [{ bone: "leftLowerArm", flexion: 90, abduction: 0, twist: 0 }],
  },
});
```

`new AutoMovieHuman({ id, identity })` builds a person from a detailed `IAutoMovieHumanIdentity` directly; save `human.getIdentity()`, not the traits, as the person. `human.measure()` measures the generated skeleton back in the anthropometric posture and returns the identity's stature, heights, breadths and segment lengths. An inadmissible document throws `AutoMovieHumanAdmissionError`, whose `errors` name each field, bound and cause.

## Public Surface

| Export | Role |
| --- | --- |
| `AutoMovieHuman` | One person: skeleton, model, posing and expression |
| `IAutoMovieHumanIdentity` | Detailed measurements, composition and pigmentation; the only input modeling reads |
| `IAutoMovieHumanTraits`, `IAutoMovieHumanConverter`, `AutoMovieHumanConverter` | Beginner inputs and their deterministic expansion into an identity |
| `IAutoMovieHumanSkeleton`, `IAutoMovieHumanLandmarks` | The generated skeleton with declared joint axes and ranges, and its palpable landmarks |
| `measureAutoMovieHumanSkeleton`, `measureAutoMovieHumanLandmarks`, `IAutoMovieHumanSkeletalMeasurements` | Measuring a skeleton or landmarks by the survey definitions |
| `IAutoMovieHumanPose`, `IAutoMovieHumanExpression`, `IAutoMovieHumanAppearance` | Pose, FACS expression and surface appearance documents |
| `validateAutoMovieHuman*` | Admission returning typia's `IValidation` |
| `IAutoMovieHumanPartGenerator`, `IAutoMovieHumanJunction`, `IAutoMovieHumanCage`, `IAutoMovieHumanRing` | Contracts for skin part generators and the junction that joins them |
| `AUTOMOVIE_HUMAN_RINGS`, `layoutAutoMovieHumanRing`, `AutoMovieHumanCageBuilder` | The ring every junction site fixes, resolved against a skeleton, and the builder parts open rings with |
| `AutoMovieHumanJunction`, `meshAutoMovieHumanCage`, `AUTOMOVIE_HUMAN_UV_LAYOUT` | Welding rings, one engine subdivision into a mesh with limit normals, and the versioned UV layout |
| `AUTOMOVIE_HUMAN_PART_GENERATORS`, `IAutoMovieHumanPartGenerators` | The profile's generator per part; `AutoMovieHuman` accepts replacements through `parts` |

The build first runs `scripts/guard.ts`, which refuses a file other than TypeScript, Markdown and the package's own configuration, a file above 256 KiB, and an array literal under `src` holding more than 64 numbers. Lint keeps the source layers one-way, as listed in `lint.config.ts`.
