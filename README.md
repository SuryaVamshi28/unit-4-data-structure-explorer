# Unit IV Data Structure Explorer

An interactive, responsive study guide for Unit IV of **25CS21001 – Advanced Data Structures** (B.Tech CSE-CS, II Year, I Semester). It is a static browser app: no account, database, server, or third-party JavaScript library is needed. It is designed for desktop and mobile screens and can be installed from a supported browser after it is hosted over HTTPS.

## Unit IV coverage

### Multiway search trees

- **B-tree and B-tree ADT:** search, insertion, splitting, occupancy, sorted traversal, and node-visit complexity. The interactive B-tree uses configurable minimum degree `t` and inserts unique integer keys.
- **2–3 trees:** 2-nodes, 3-nodes, equal leaf depth, promotion, and root growth. The interactive demo limits nodes to at most two keys and shows splits.
- **B* trees:** sibling redistribution before splitting, the 2-to-3 split idea, and the higher-occupancy tradeoff. An interactive step walkthrough illustrates the policy. B* variants differ in exact capacity and redistribution details; the walkthrough is conceptual, not a production B* implementation.
- **B+ trees:** separator keys in internal nodes, records at linked leaves, leaf splitting, range scans, and `O(log n + k)` range reporting for `k` results. The interactive demo inserts unique integer keys and performs inclusive range scans.

### Heaps

- **Binary min-heap:** complete-tree shape, array parent/child formulas, heap-order invariant, insert/bubble-up, extract-min/sift-down, peek, arbitrary-search cost, and linear bottom-up build bound. The visualizer supports insertion and extraction; its example is a sequence of inserts rather than bottom-up heapify.
- **Binomial heap:** `B_k` construction, degree-unique forest, binary-counter interpretation, equal-degree linking, insertion, and extract-min consolidation.
- **Fibonacci heap:** lazy root-list insertion, minimum tracking, extract-min child promotion/consolidation, amortized complexity table, and the potential-method intuition. The visual interaction illustrates insert and extract-min consolidation. Decrease-key/cascading cuts are explained conceptually but are not an interactive operation in this teaching demo.
- **Heap applications:** graph algorithms (Dijkstra and Prim), scheduling, event simulation, top-k, merging sorted streams, and heap sort.
- **Comparison and applications:** a complexity table and workload-based decision prompts.
- **Quick check:** eight multiple-choice questions show an explanation after answering.

## Run locally

Open `index.html` in a recent browser. The learning content and interactions work without a backend. The service worker is enabled only when the page is served over HTTP/HTTPS (as with a hosted link); direct `file:` opening does not support service workers.

## Publish for a shareable link

The app is static and can be hosted as a public site using GitHub Pages or another static-site host. To publish, upload the files in this folder to a public repository and enable that host's static publishing feature. The hosting account must be authorized for the upload and publication. After publication, test the generated HTTPS link on a phone; the app contains no student records or private data.

This repository includes `.github/workflows/deploy.yml`. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions** once. Then every push to `main` will publish the site. The expected site address is https://suryavamshi28.github.io/unit-4-data-structure-explorer/; it becomes active after the first successful deployment in the **Actions** tab.

## Notes

- All records used in the examples are integer keys invented for demonstration.
- Complexity figures are asymptotic textbook bounds. They are not benchmark results.
- The site is a teaching visualization, not a production storage index or database implementation.
- Source files: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, and `service-worker.js`.

