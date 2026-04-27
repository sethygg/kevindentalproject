# Setup: Push this project to GitHub

This walks you through getting `kevin-dental-project` onto your GitHub account. Pick the path that matches what you have installed.

---

## Path A — The simple way (no command line knowledge needed)

### 1. Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new) (sign in if needed)
2. **Repository name:** `kevin-dental-project`
3. **Description:** `Modern website redesign for Farley Family Dental`
4. Choose **Public** (or Private — your call)
5. **Do NOT** check "Add a README" — we already have one
6. Click **Create repository**

GitHub will now show you setup instructions. Keep that page open.

### 2. Install GitHub Desktop (if you don't already have Git)

[desktop.github.com](https://desktop.github.com/) — free, official, takes 2 minutes. Sign in with your GitHub account when prompted.

### 3. Add this folder to GitHub Desktop

1. Open GitHub Desktop → **File → Add local repository**
2. Browse to the folder this `SETUP-GITHUB.md` lives in (`kevin-dental-project`)
3. It'll say "this isn't a git repository — create one." Click **create a repository**.
4. Name: `kevin-dental-project` → Create
5. Bottom-left: enter a commit message like `Initial commit` → **Commit to main**
6. Top: **Publish repository** → uncheck "Keep this code private" if you want it public → **Publish**

Done. Your code is on GitHub.

---

## Path B — Command line (if you have Git installed)

Open a terminal in the `kevin-dental-project` folder and run:

```bash
# 1. Initialize the local repo
git init
git add .
git commit -m "Initial commit: modern dental practice site"
git branch -M main

# 2. Create the repo on GitHub first (see Path A step 1), then:
git remote add origin https://github.com/<your-username>/kevin-dental-project.git
git push -u origin main
```

Replace `<your-username>` with your actual GitHub username.

---

## Path C — GitHub CLI (fastest if you have `gh` installed)

```bash
cd kevin-dental-project
git init
git add .
git commit -m "Initial commit"
gh repo create kevin-dental-project --public --source=. --remote=origin --push
```

One command creates the repo and pushes. Done.

---

## Bonus: Turn on free hosting (GitHub Pages)

Once the repo is on GitHub, you can host the site for free at `https://<your-username>.github.io/kevin-dental-project/`:

1. Go to your repo → **Settings** → **Pages** (left sidebar)
2. Under **Source**, choose:
   - Branch: `main`
   - Folder: `/ (root)`
3. Click **Save**
4. Wait ~1 minute. Refresh — you'll see the live URL at the top.

To use a custom domain like `farleyfamilydental.com` later, add it in that same Pages settings page and point the domain's DNS to GitHub.

---

## Day-to-day editing workflow

After the first push, every edit looks like:

**GitHub Desktop:** edit file → it shows up in the changes list → write a message → Commit → Push

**Command line:**
```bash
git add .
git commit -m "Update services section"
git push
```

If you have GitHub Pages on, the live site updates automatically about a minute after each push.
