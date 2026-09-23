# Gaurav Tiwari · personal profile site

Static profile site for Gaurav Tiwari, Research Data Scientist, Boston. Plain HTML, CSS and JavaScript. No build step, no dependencies, no tracking.

Live at <https://gtiwari1992.github.io>.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site: hero, stats, about, research themes, publications, experience, projects, skills, education, contact |
| `styles.css` | Design tokens, light and dark themes, layout, animations |
| `script.js` | All interactivity (see below). The page is fully readable with JavaScript disabled |
| `assets/gaurav.jpg` | Headshot |
| `assets/Gaurav_Tiwari_Resume.pdf` | Public resume for the download button. Contains email only, no phone or street address |
| `assets/favicon.svg` | Browser tab icon |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Interactive features

- **Command palette**: press `⌘K` (or `Ctrl K`) to jump to any section, open a profile, toggle the theme, copy the email address, or search publications by title.
- **Publications**: full-text search (press `/` to focus), filter by type (article / preprint / abstract), year, or topic. Click a bar in the "Output by year" chart or a topic chip to filter. Each entry has a "Cite" button that copies a plain-text citation.
- **Research themes**: each card links to the related publications with a topic filter applied.
- **Experience**: expandable timeline with auto-computed durations.
- **Projects**: filter by technology; cards tilt and glow with the cursor.
- **Skills**: tabbed categories, keyboard navigable.
- **Hero**: animated network canvas that reacts to the pointer, rotating role phrases, animated counters.
- **Dark / light theme**: toggle in the header, remembered across visits, respects system preference on first visit.
- Scroll-progress bar, active-section nav highlighting, reveal-on-scroll, back-to-top button.
- All motion is disabled when the OS "reduce motion" setting is on.

## Preview locally

Open `index.html` in a browser, or run a tiny server from this folder:

```bash
python3 -m http.server 8000
```

then visit <http://localhost:8000>.

## Hosting on GitHub Pages

The repository is named `gtiwari1992.github.io`, so GitHub Pages serves it at the root. In **Settings → Pages**, "Build and deployment" should be set to *Deploy from a branch*, branch `main`, folder `/ (root)`.

Push to `main` and GitHub Pages redeploys automatically within a minute or so.

## Updating content

### New publication

1. Copy one `<li class="pub">` block in `index.html` and place it at the top of the list (the list is newest first).
2. Edit the title, link, authors, venue and the `data-year`, `data-type` (`article`, `preprint` or `abstract`) and `data-tags` (comma-separated topics) attributes. Tags feed the topic cloud and the research-theme links, so reuse existing tag names where possible.
3. Add `is-featured` to the class and copy the `.pub-star` span if it should be starred.
4. If it is a new year, add a chip in `.pub-filters`. The chart updates itself.
5. Update the numbers in the stats strip (`data-count`) and the "18 publications" hero badge when convenient.

### New role or project

Copy the matching block in the Experience or Projects section. For roles, set `data-start` (and `data-end`) as `YYYY-MM` on the `.tl-dates` span and the duration is computed automatically.

### New resume

Replace `assets/Gaurav_Tiwari_Resume.pdf` with a version that has no phone number or address.

### Colours and fonts

Everything is driven by CSS custom properties at the top of `styles.css` (`--accent`, `--accent-2`, `--accent-3`, fonts, radii). Change them once and the whole site follows, in both themes.

## Optional extras

- **Custom domain**: add it under Settings → Pages → Custom domain and point the domain's DNS at GitHub Pages.
- **Analytics**: add a single script tag from a privacy-friendly service such as GoatCounter or Plausible.
