# src/model/AutoMovieAffordanceKind.ts#AutoMovieAffordanceKind

## @evidence contracts/development/design.md#principled-representation

Contact semantics distinguish a supporting face from point and line contacts under one frame convention (`+Y` out of the contact, a line along `+X`), the convention game-engine interaction markers use; affordance validation requires an extent only for stack-top, and prop relation validation selects stack-top, socket or hook according to the relation kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nineteen literals discriminate the existing affordance record rather than assigning behavior from descriptive names; the seat, bar, ledge and articulated kinds are the environment contacts human action laws approach (#3201 A8), the trigger, crank, wheel, pedal, stirrup, rein and aperture kinds are the contacts of the archetypes people operate, ride and pass through (#3368), and their few dimensions are optional fields of that record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Table, grip and lantern examples do not select runtime branches; a support relation with the wrong affordance kind is refused instead of relabelled to fit.

## @evidence contracts/development/common.md#meaningful-documentation

States the shared frame convention and every kind's role, frame, turning sense and the fields it reads; live stack-top placement support and the separate contact-helper wiring limit.
