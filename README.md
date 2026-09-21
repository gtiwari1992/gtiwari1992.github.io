# Gaurav Tiwari · personal profile site

Static profile site for Gaurav Tiwari, Research Data Scientist, Boston. Plain HTML, CSS and a small
amount of JavaScript. No build step, no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole site: hero, about, publications, experience, projects, skills, education, contact |
| `styles.css` | Styling, light and dark themes, responsive layout |
| `script.js` | Dark-mode toggle, mobile menu, publication year filter, email link and copy button |
| `assets/gaurav.jpg` | Headshot (from Google Scholar) |
| `assets/Gaurav_Tiwari_Resume.pdf` | Public resume for the download button. Contains email only, no phone or street address |
| `assets/favicon.svg` | Browser tab icon |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Preview locally

Open `index.html` in a browser, or run a tiny server from this folder:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Hosting on GitHub Pages

1. Sign in to GitHub as `gtiwari1992` and create a new **public** repository named exactly
   `gtiwari1992.github.io`. Leave it empty (no README, no .gitignore).
2. Upload every file in this folder, including the `assets` folder and the hidden `.nojekyll` file.
   Either drag and drop through the GitHub web interface ("uploading an existing file"), or from a terminal
   in this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial profile site"
   git branch -M main
   git remote add origin https://github.com/gtiwari1992/gtiwari1992.github.io.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**. Under "Build and deployment", set Source to
   **Deploy from a branch**, Branch to **main** and folder to **/ (root)**. Save.
4. After about a minute the site is live at **https://gtiwari1992.github.io**.

## Updating content

- **New publication:** copy one `<li class="pub">` block in `index.html`, edit the title, link, authors,
  venue and `data-year`, and place it at the top of the list. Add a new year chip in `.pub-filters` if needed.
  Update the citation numbers in the About panel when convenient.
- **New role or project:** copy the matching block in the Experience or Projects section.
- **New resume:** replace `assets/Gaurav_Tiwari_Resume.pdf` with a version that has no phone number or address.
- Push the change (or upload the edited file). GitHub Pages redeploys automatically.

## Optional extras

- **Custom domain:** buy a domain, add it under Settings → Pages → Custom domain, and point the domain's DNS
  at GitHub Pages as described in GitHub's docs.
- **Analytics:** add a single script tag from a privacy-friendly service such as GoatCounter or Plausible.
