# @automovie/interface

The common and domain contracts of AutoMovie, from authored models and shots to computation inputs, results and host protocols. `engine`, `human`, `motions`, `recovery`, `ingest` and `render` use these declarations at their public boundaries. The package has no runtime dependency.

Fields use plain `string` and `number`; their JSDoc states units, frames, ranges, ownership and absence behavior. Closed unions describe alternatives. The implementation that admits or produces each record owns its runtime checks, so importing a type alone does not validate data. Validator-specific metadata stays with that implementation.

## Use

```powershell
npm install @automovie/interface
```

```ts
import type { IAutoMovieModel, IAutoMovieShot } from "@automovie/interface";
```

## Conventions

Authored scene coordinates are right-handed and y-up, with lengths in metres and time in seconds. Authored joint angles are degrees of anatomical movement. Numerical construction, Human preparation, imported observations and film clocks may use millimetres, radians, other frames or exact frame counts; the containing field defines the convention. Tuple and object coordinate representations do not imply a conversion between them.

Object contracts and object unions use `IAutoMovie*`; scalar, literal, tuple and utility aliases use `AutoMovie*`. Type-only namespaces group related contracts. Optional and null values retain distinct meanings stated at the field, including any default supplied by its runtime owner.

Archetype assets and their producer APIs remain in `@automovie/archetypes`, using the common model, affordance, body, rig and geometry contracts. Adding an asset does not require an interface entry. Frontend state and contracts requiring Three, Node or another implementation dependency remain with their owning packages.

## Where to look

Import contracts from the package root. Start from `IAutoMovieModel` for a figure or prop and `IAutoMovieShot` for a shot; the declarations document the related domain inputs, results and runtime admission owners.
