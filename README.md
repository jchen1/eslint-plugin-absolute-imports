# eslint-plugin-absolute-imports

A (zero-dependency!) eslint plugin that enforces absolute imports on your codebase.

## Prerequisites

You must have a `baseUrl` defined in either `tsconfig.json` or `jsconfig.json`. **This plugin does not currently work with `paths`!**

## Setup

- `npm i --save-dev eslint-plugin-absolute-imports`
- Add `eslint-plugin-absolute-imports` to your eslint `plugins` section
- Add `absolute-imports/only-absolute-imports` to your eslint `rules` section

## License

MIT
