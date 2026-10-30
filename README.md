# TrueCart AI — GitHub Pages package

This repository contains the static TrueCart AI prototype and its supplied catalogue/policy data. It intentionally excludes the hackathon evaluator and test datasets.

## Publish

1. Create a GitHub repository and push these files to its `main` branch.
2. In repository Settings → Pages, set the publishing source to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes the site on each push to `main` and reports the live URL in the Actions run.

No build step or secrets are required. The website reads `data/catalogue.csv` and `data/policy.md` from this repository. Prices are from the supplied snapshot; retailer links are searches, not live price feeds. Price alerts are saved in the current browser and do not send email.
