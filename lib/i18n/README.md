# Display translations

`messages.json` is the single catalog for UI, questions, personas, Legend descriptions,
reasons, cautions, and canvas copy. Korean source text is the message key (gettext-style).
Each entry contains `ko`, `en`, and `zh-CN`; `{name}` placeholders preserve runtime values.
Entries prefixed `@` are templates for the existing Korean explanation generator.

`LocaleText` translates text nodes and display attributes in component output without
changing event handlers, values, question IDs, data objects, or recommendation inputs.
Keep a component's JSX inside `LocaleText`. For canvas and other imperative display
APIs use `useLanguage().t`. Do not pass translated strings into scoring or filtering.
Keep complete sentences together where practical; add a parameterized catalog entry
for interpolated copy. The data JSON files remain the only recommendation source.

`core.ts` resolves URL language > saved manual choice > browser language (Korean if
unavailable). Only manual choices are saved. `withLanguage` preserves existing URL
parameters, including the unchanged result payload. `react.tsx` owns independent locale
state, document language/title, and the header selector. No quiz state is remounted.

`names.ts` uses only localized names already present in official project data; otherwise
it returns the official English name. Chinese card names are deliberately not invented.
Official card rules and card artwork remain in their original English; their UI labels,
explanatory summaries and guidance are localized.

To add a locale such as `zh-TW`, add it to `LOCALES` and `LANGUAGE_NAMES` in `core.ts`,
then add its values to catalog entries. Update browser detection if desired. Missing
translations fall back to English, then Korean. Extend `names.ts` only when an official
localized name is actually present in the data.

Run `npx vitest run tests/i18n.test.ts tests/i18n-flow.test.ts tests/i18n-regression.test.ts
 tests/app-flow.test.ts tests/recommendation.test.ts tests/scoring.test.ts tests/share.test.ts`
and `npm run typecheck`, followed by `BASE_PATH=/find-my-legend npm run build`.
The regression fixture captures full ranked IDs, scores, breakdowns and user profiles
for seven answer patterns at all three experience levels from deployment `3b200e4`.
