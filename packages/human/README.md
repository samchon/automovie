# @automovie/human

Generates a human figure from typed measurements and appearance parameters, returning an `IAutoMovieModel` for the automovie engine and viewer. Use beginner traits for a default person or an `IAutoMovieHumanIdentity` for detailed measurements.

## Installation

Requires Node.js 22.23.2 or later.

```bash
pnpm add @automovie/human
```

## Usage

The [Human viewer](../playground/src/human/installHumanViewerSession.ts) uses this conversion and model-generation flow with the [default traits](../playground/src/human/HumanViewerPage.ts):

```typescript
import {
  AutoMovieHuman,
  AutoMovieHumanConverter,
  IAutoMovieHumanTraits,
} from "@automovie/human";

const traits: IAutoMovieHumanTraits = {
  version: 1,
  sex: "female",
  age: 30,
  stature: null,
  population: "european",
  build: { adiposity: 0, muscularity: 0, slimness: 0, cuteness: 0 },
};
const converter = new AutoMovieHumanConverter();
const human = AutoMovieHuman.fromTraits({ id: "human", traits, converter });
const identity = human.getIdentity();
const appearance = converter.toAppearance(traits);
const model = human.getModel({
  appearance,
  assembly: "parts",
  skinFinish: "plain",
});
```

Save the identity and appearance to reproduce a person; traits alone depend on the converter version. Restore with `new AutoMovieHuman({ id, identity })`. Identity measurements use millimetres; the emitted model and skeleton use metres. `getModel()` defaults to isolated part skin and authored skin finish; `assembly: "joined"` joins the skin, while `skinFinish: "plain"` skips generated skin detail textures.

## API

| API | Purpose |
| --- | --- |
| `AutoMovieHuman.fromTraits({ id, traits, converter? })` | Convert beginner traits into a person |
| `new AutoMovieHuman({ id, identity, parts? })` | Build from detailed measurements, optionally replacing part generators |
| `getIdentity()`, `getSkeleton()`, `measure()` | Read the saved identity, engine skeleton and skeletal measurements |
| `getModel({ appearance, assembly?, skinFinish? })` | Generate the model, materials and images |
| `pose({ pose })`, `express({ expression })` | Convert Human documents into engine pose and expression documents |
| `validateAutoMovieHuman*` | Validate input documents and return typia `IValidation` results |

Invalid documents throw `AutoMovieHumanAdmissionError` from construction and document-consuming methods; its `errors` identify refused fields and causes. The [public entry](src/index.ts) also exports document types, measurement functions, part generators and junction utilities.

## Limitations

Human is incomplete. Joined skin uses provisional distance-based weights, `express()` returns a neutral expression, and teeth and underwear are not emitted. The default converter does not yet apply `build.cuteness`. Generated form and deformation remain under development.
