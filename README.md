# JavidYad · جاویدیاد

In memory of the Javidnaman · به یاد جاویدنامان

Live at https://javidyad.com. A free tool to make a printable memorial poster for people killed in Iran's January protests, for the ceremony on 7 November 2026 in Frankfurt. Photos are processed only on the visitor's device.

- `index.html` + `js/poster.js` + `css/poster.css`: the poster maker
- `javidnam.html` + `js/list.js` + `css/list.css`: the Javidnam list (data in `javidnam/`)
- `js/common.js`, `css/base.css`: shared by both pages
- `tools/`: scripts to build the list and the German template
- `tests/smoke.js`: end-to-end test, also run by GitHub Actions on every pull request

No build step. To try it locally: `python -m http.server`, then open http://localhost:8000. Details for contributors are in `CLAUDE.md`.

The code is public so anyone can check that photos never leave the device. All rights reserved: see [LICENSE](LICENSE). Names and photos in the list come from [Iran International's Javidnaman platform](https://javidnaman.iranintl.com/).
