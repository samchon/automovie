# src/model/IAutoMovieBody.ts#IAutoMovieBody

## @evidence contracts/development/design.md#principled-representation

validateBody admits positive finite mass, nullable finite local centre and bounded declared contact coefficients. An absent restitution records unknown rebound behaviour: model construction remains valid, while a requested collision response or rebound requires a declared coefficient. Available collision and centre helpers consume those declarations or the centre; detectors are not automatically wired into product execution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Required mass and centre, optional measured or authored restitution, static and kinetic friction, and a launched body's drag and contact outcomes remain independent of optical materials and skeletons. Unknown coefficients need not be invented merely to construct a kinematic model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No named object selects mass or grip presets, and an unmeasured friction is absent rather than a placeholder coefficient; an authored centre overrides uniform-density geometric estimation, and physical advice remains distinct from rejecting malformed numeric inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Defines authored kilograms, local metre centre and contact coefficients, distinct null-body helper behavior, the flying-prop coefficient reader, collision adviser heuristic and current detector wiring limits.
