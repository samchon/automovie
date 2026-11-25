# src/analysis/IAutoMovieSolveSunPosition.ts#IAutoMovieSolveSunPosition.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Documents each field's unit, sign convention, range and default, which correction reads the optional atmosphere fields, and the solver's refusal of out-of-domain values by a thrown error naming the field.

## @evidence contracts/development/design.md#principled-representation

Latitude and longitude in degrees with north and east positive, height in metres, pressure in millibars and temperature in degrees Celsius, the units of the cited solar position report. Ranges cannot be typed; `solveAutoMovieSunPosition` checks them at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is read: latitude and longitude by the hour angle and horizon transform, elevation by parallax, pressure and temperature by refraction. The atmosphere fields are optional with the report's standard defaults because most productions know only the place and time.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional fields have single documented defaults rather than combining into states; no field is present only for a test.

# src/analysis/IAutoMovieSolveSunPosition.ts#IAutoMovieSolveSunPosition.IUtc

## @evidence contracts/development/common.md#meaningful-documentation

States the calendar (proleptic Gregorian), the timescale (UTC), the astronomical year numbering, every field's integer range and the leap-second allowance of `second`.

## @evidence contracts/development/design.md#principled-representation

Calendar fields rather than a timestamp, because a screenplay states a date and an hour; the solver converts them to a Julian Day. Integer and month-length rules are runtime checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six fields, all read by the Julian Day conversion; no time zone or day-of-week field, which no computation needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields; a fractional time of day lives only in `second`, so no two fields can state conflicting fractions.
