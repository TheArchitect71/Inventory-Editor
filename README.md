# Inventory Editor

Angular 22 local inventory tracker: add/edit/delete products, search by name/SKU/category, filter low stock, calculate stock/value totals, and export JSON. It runs offline with no account or backend. The existing `inventory-editor.items.v1` storage key and record format are preserved. Run at the same origin/port as before to keep access to that browser's saved inventory.

## Run

Node is pinned to 26.10.0 in `.nvmrc`. Angular supports Node ^22.22.3, ^24.15.0, or >=26.0.0.

```sh
npm ci
npm start
```

Open http://127.0.0.1:5173 and stop the foreground server with Ctrl+C.

## Checks

```sh
npm run build
npm run typecheck
npm run test:logic
npm test -- --browsers=ChromeHeadless
npm audit
```

Four inventory logic tests and three Angular tests cover calculations, validation, filtering, corrupt storage, original storage compatibility, and rendering. Desktop/mobile browser validation also covers add/edit/delete, duplicate SKU rejection, search/low-stock controls, reload persistence, exported JSON content, cancel, no page overflow, and no external HTTP requests.

TypeScript 6.0.3 is held within Angular 22's >=6.0 <6.1 compatibility range. Jasmine 6.3/types 6 are held because Zone.js 0.16.3's Jasmine adapter is incompatible with Jasmine 7's read-only describe globals. Production bundle is about 251 KB. System fonts replace remote font requests.

Original plain-JavaScript implementation remains in `app/` and root `index.html` as a reference. The earlier Angular 6 prototype is preserved in `legacy-angular6/`. Current build and server use `src/main.ts` and Angular configuration. Saved user inventory is browser-local and is not bundled or seeded.
