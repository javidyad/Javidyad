# JavidYad · جاویدیاد

In memory of the Javidnaman · به یاد جاویدنامان

Live at https://javidyad.com. A free tool to make a printable memorial poster for people killed in Iran's January protests, first made for the #TellTheWorld ceremony on 7 November 2026 in Frankfurt, with posters in seven languages, a gallery of the campaign, and posters and placards anyone can print. Photos are processed only on the visitor's device.

- `index.html` + `js/poster.js` + `css/poster.css`: the poster maker
- `javidnam.html` + `js/list.js` + `css/list.css`: the Javidnam list (data in `javidnam/`)
- `gallery.html`, `placards.html` + `js/media.js` + `css/media.css`: the campaign gallery and posters and placards to print (data in `gallery/`, `placards/`, added with `tools/build_media.py`)
- `js/common.js`, `css/base.css`: shared by every page
- `tools/`: scripts to build the list, the poster templates in every language (`make_templates.py`) and the gallery and placards
- `tests/smoke.js`: end-to-end test, also run by GitHub Actions on every pull request
- Staging: new features are tried at https://javidyad.github.io/javidyad-staging/ first (`tools/stage.py`)

No build step. To try it locally: `python -m http.server`, then open http://localhost:8000.

The code is public so anyone can check that photos never leave the device. All rights reserved: see [LICENSE](LICENSE). Names and photos in the list come from [Iran International's Javidnaman platform](https://javidnaman.iranintl.com/).
