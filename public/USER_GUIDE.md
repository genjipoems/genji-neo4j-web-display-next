# Genjipoems.org — User Guide

A digital humanities edition of the poems of *The Tale of Genji*. The site presents every poem in the original Japanese and romanization alongside five published English translations, lets you explore the characters who speak and receive them, and surfaces scholarly commentary on the poems' context, technique, and afterlife.

This guide describes everything on the public site. Administrative tools used by editors are not covered here.

---

## Table of contents

- [1. Site map at a glance](#1-site-map-at-a-glance)
- [2. The Poem Search page](#2-the-poem-search-page-search)
    - [2.1 The keyword search](#21-the-keyword-search)
    - [2.2 The filter sidebar](#22-the-filter-sidebar)
    - [2.3 The results panel](#23-the-results-panel)
- [3. Poem Pages](#3-poem-pages-poemschapterpoem)
    - [3.1 The poem header](#31-the-poem-header)
    - [3.2 The ANALYSIS column](#32-the-analysis-column)
    - [3.3 The TRANSLATIONS column](#33-the-translations-column)
- [4. Character Pages](#4-character-pages)
    - [4.1 The Characters list](#41-the-characters-list-characters)
    - [4.2 A Character Profile](#42-a-character-profile-charactersname)
    - [4.3 The Relationships graph](#43-the-relationships-graph-charactersrelationships)
    - [4.4 The Map](#44-the-map-charactersmap)
    - [4.5 The Timeline](#45-the-timeline-characterstimeline)
- [5. Chapter Pages](#5-chapter-pages)
    - [5.1 The Chapters list](#51-the-chapters-list-chapters)
    - [5.2 A Chapter Profile](#52-a-chapter-profile-chaptersname)
- [6. The Translators](#6-the-translators-translators)
- [7. The Blog](#7-the-blog-blog)
- [8. Reference pages](#8-reference-pages)
- [9. Account features](#9-account-features)
    - [9.1 Signing in](#91-signing-in-login)
    - [9.2 Favorites](#92-favorites)
    - [9.3 Discussion and replies](#93-discussion-and-replies)
    - [9.4 Private notes](#94-private-notes)
    - [9.5 Submitting your own translation](#95-submitting-your-own-translation)
    - [9.6 Contributors](#96-contributors)
    - [9.7 Your User Page](#97-your-user-page-user)
    - [9.8 Your public homepage](#98-your-public-homepage-user-home-pageuserid)
    - [9.9 Notifications](#99-notifications)
- [10. Using the site on mobile](#10-using-the-site-on-mobile)
- [11. Reporting errors and contacting the team](#11-reporting-errors-and-contacting-the-team)

---

## 1. Site map at a glance

The top of every page has a primary navigation bar with the following entry points:

- **poem search** — the main keyword and filter search for all ~800 poems.
- **characters** — an alphabetical list of every named character.
- **chapters** — a list of all 54 chapters of the *Tale*.
- **more ▾** — a dropdown containing: blog, further reading, relationships graph, map, timeline, what's new.
- **about ▾** — a dropdown containing: this site, user guide, sources, translators, team members, methodology, collaborate, report an error.
- **top-right controls** — the notification bell (visible when signed in) and the Sign In button.

The site has a separate streamlined experience for phones (see [Section 10](#10-using-the-site-on-mobile)).

---

## 2. The Poem Search page (`/search`)

The Poem Search is the heart of the site. It loads with every poem visible and a sidebar of filters; you narrow the list down by typing a keyword and/or ticking filter options. The page remembers your query and filter selections between pages — leave and return and your search is still set up.

### 2.1 The keyword search

The big input labeled **POEM TEXT SEARCH** at the top performs a full-text search across all translation lines and (optionally) the romanized Japanese. Matches are highlighted with a yellow mark inside each result card.

- The search runs as you type (after a brief pause).
- Empty input = "show everything." The page is designed as a *filter-first* explorer, so starting with everything visible is normal.
- To force a fresh start, click **Clear all** at the top of the filter sidebar — this also clears your saved state.

### 2.2 The filter sidebar

The sidebar groups filters into searchable, collapsible panels. Each panel has its own small search box at the top that filters the *options inside that panel*. Inside each panel, tick the checkboxes for the values you want included.

- **SETTINGS** — "Include Romanization in Search": when on, your keyword is matched against the romanized Japanese as well as the English translations.
- **TRANSLATOR FILTER** — Waley, Seidensticker, Tyler, Washburn, Cranston. When one or more is selected, the keyword search only looks at those translators' texts.
- **CHAPTER FILTER** — all 54 chapters; tick to include.
- **SPEAKER FILTER** — every named speaker in the database; type to filter the option list. Includes a *Speaker Gender* sub-filter (male / female / nonhuman).
- **ADDRESSEE FILTER** — same as Speaker, for the addressee. Includes its own *Addressee Gender* sub-filter.
- **GENJI AGE FILTER** — filter to poems composed when Genji was a particular age (1–75).
- **PERSON REFERENCE FILTER** — "All translators agree," "At least one translator differs," "Contain a person referent," "Contain a pronoun." These surface poems where the translators handle person-reference differently or where translators must supply pronouns or nouns absent in the original.
- **UPDATES FILTER** — show only poems updated in the last Week / Month / Three Months / Six Months / during 2025 (single-select).
- **OTHER FILTERS** — a combined panel containing two sub-sections:
    - **Poem Type** — Proffered, Reply, Group, Soliloquy.
    - **Other Tags** — Included in a Run of Poems, My Favorites, Omitted By Waley, Omitted By Seidensticker, Bad Poems, Annotations Complete.

> **Composing filters.** Filters compose with AND across panels, OR within a panel. For example: ticking "Chapter 5" and "Chapter 12" returns poems from *either* chapter, but adding "speaker = Genji" further narrows the result to poems Genji speaks in those chapters.

> **"Included in a Run of Poems"** constrains not only the result list but also the Chapter, Speaker, and Addressee dropdowns themselves: when the checkbox is ticked, those dropdowns shrink to show only chapters/speakers/addressees that actually appear in run-poems.

### 2.3 The results panel

Below the chapter count bar (a small horizontal strip showing how many poems each chapter currently contributes to the visible results) is the main results list.

- A large counter shows the total: `### POEMS FOUND`.
- A small indicator dot appears when one or more filters are active.
- Each result is a card showing:
  - **Speaker name** (color-coded: blue-grey for male, terracotta for female) followed by `»`
  - The poem code (chapter number + two-letter chapter abbreviation, then the poem number) and the chapter's kanji title
  - The first line of the Japanese poem and the first line of romaji
  - `»` followed by the **Addressee name** (same color coding)
- Click any card to open the full Poem page.

---

## 3. Poem Pages (`/poems/[chapter]/[poem]`)

When you click into an individual poem, the page is divided into three main areas: the **header poem display**, the **analysis panel column** (left), and the **translations column** (right).

### 3.1 The poem header

A wide banner shows the poem written vertically in Japanese with each character spaced for legibility, accompanied by the romanized text. If you are signed in, a **★ / ☆ favorite star** appears next to the poem; click it to add or remove the poem from your favorites.

An information grid wraps the poem with quick facts. Each box is empty when no data is available:

- **POEM FROM ›› [Speaker]** (linked to that character's profile)
- **›› POEM TO [Addressee]** (linked)
- **GENJI'S AGE** — Genji's age in the chronology when the poem is composed
- **MESSENGER** — the character who carried the poem, if any (linked)
- **PROXY POET** — the character who composed it for someone else, if any (linked)
- **UPDATED ON** — the last edit date
- **spoken / written** — annotated as ticked, struck through if explicitly *not*, or empty if unknown
- **POEM TYPE** — checkboxes for PROFFERED / REPLY / SOLILOQUY / GROUP
- **POETIC TECHNIQUE** — filled or empty circle indicators for KAKEKOTOBA, ENGO, UTAMAKURA, MAKURAKOTOBA
- **CHAPTER / POEM** — chapter number and English name + the kanji
- **SEASON** — one of Spring (❀), Summer (☼), Autumn (✾), Winter (❋)

Below the header are **◀ Previous** and **Next ▶** buttons that move you through the poems in order across the entire *Tale*.

### 3.2 The ANALYSIS column

A stack of expandable panels. Click a panel header to open or close it.

1. **WHERE WE ARE IN THE TALE** — narrative context: what is happening in the story when the poem is spoken.
2. **WHAT THE POEM IS SAYING** — a prose paraphrase of the poem.
3. **COMMENTARY** — scholarly notes on the poem (formatted with the rich-text editor — links and emphasis preserved).
4. **MORE DETAILS** — a long, structured panel with a variable set of subsections, displayed only when data is present. Possible subsections:
   - **OTHER RECIPIENTS / UNINTENDED RECIPIENTS / GROUP PARTICIPANTS** (with hover-to-reveal evidence on each name)
   - **PAPER/MEDIUM**, **HANDWRITING DESCRIPTION**, **DELIVERY STYLE**
   - **SEASON IN NARRATIVE** — the season the poem references, with an expandable evidence quote
   - **SEASONAL WORD** (*kigo*)
   - **POETIC TECHNIQUES EMPLOYED**, **POETIC WORD**
   - **COMPOSED AT / RECEIVED AT** — the place names where the poem is composed and received
   - **SPOKEN OR WRITTEN** — the evidence and reasoning behind the classification
   - **TAGS** — extra labels (Chapter Title Poem, Character Name Poem, Morning After Poem, Proxy Poem, etc.)
   - **REPRESENTATIVE CHARACTER**, **REPLY TO**, **INTERNAL ALLUSION** (other Genji poems this poem alludes to), **GROUPED WITH** (other poems in the same exchange), **ALLUSION(S)** (allusions to outside sources)
   - **FURTHER READING** — pointers to external scholarship
   - **CONTRIBUTORS** — list of the people who built this entry (see [Section 9.6](#96-contributors))
5. **DISCUSSION** — a threaded comment area (see [Section 9.3](#93-discussion-and-replies)).
6. **USER NOTES** — a personal note area visible only to you (see [Section 9.4](#94-private-notes)).

### 3.3 The TRANSLATIONS column

Stacked cards, one per translator, in this order: **Waley, Seidensticker, Tyler, Washburn, Cranston**. Each card shows:

- The translator's text (or a placeholder if not available).
- A meta strip linking the Speaker and Addressee back to their profiles, the poem code (e.g. `06SU03`), and the translator's name. Clicking the translator name jumps to that translator's profile page.

After the five published translations:

- **ORIGINAL** — the Japanese and romanized text again, side by side.
- **Other translations** — any additional translations the editors have added.
- **YOURS** — a textarea where signed-in users can submit their own translation (see [Section 9.5](#95-submitting-your-own-translation)).

---

## 4. Character Pages

### 4.1 The Characters list (`/characters`)

A two-column page. The left column is a **search-and-scroll** list of every named character; the search box at the top narrows the list as you type. Click any name to open that character's profile. The right column displays an editorial introduction to the Genji cast (the "Characters" blog post).

### 4.2 A Character Profile (`/characters/[name]`)

The hero banner shows the character's English name and Japanese name. Below the hero you'll find:

- A **search box** that lets you jump to a different character without going back to the list.
- A description, often with an "**AKA:**" line listing alternative names and nicknames.
- **IN POEMS** — every poem where this character is either the speaker or the addressee, presented as small result cards (same layout as the Poem Search results).
- **MESSENGER OF** — poems where this character carries the message between speaker and addressee.
- **PROXY POET OF** — poems composed by this character on someone else's behalf.
- **RELATIONS** — every related character, grouped by relationship type (e.g. *parent*, *sibling*, *consort*). Names are color-coded by gender (blue-grey = male, terracotta = female).
- A **timeline strip** of dated events involving this character (𖤓 marks Genji's age at the time).
- A **Gantt chart** showing the same events on a zoomable, scrollable scale.
- **Contributors** to this character page.
- A **Discussion** area for comments on the character.

### 4.3 The Relationships graph (`/characters/relationships`)

An interactive node-and-edge map of who is related to whom.

- **Reset** — clears the graph and reloads.
- A **language toggle** (English / Japanese) changes how names display on the graph.
- Two **search boxes** let you pick a pair of characters. Click the **⇄** button to find the relationship path between them.
- In the per-character menu, each character has:
  - a **checkbox** to add or remove that node from the graph
  - a **📌 pin** button to display *all* of that character's relationships at once
  - a name dropdown to toggle between the English and Japanese label
- Names are draggable. Drop a name into a search field to populate that field.

### 4.4 The Map (`/characters/map`)

A zoomable historical map of the locations that appear in the *Tale*. Each location is marked either by a building icon, a circle, or a path:

- **Hover** to dim the marker and reveal a small location pin icon for each poem set there.
- **Click** a marker to open a popup listing every poem associated with that place.
- Use the **+ / −** buttons at the bottom of the map to zoom; drag to pan.
- Close the popup with the **×** at the top.

### 4.5 The Timeline (`/characters/timeline`)

A site-wide Gantt timeline of dated events drawn from every character page, plotted against Genji's age. Click any event bar to read its Japanese and English description.

---

## 5. Chapter Pages

### 5.1 The Chapters list (`/chapters`)

Same two-column layout as Characters: a search-and-scroll list on the left (each entry is the chapter number, romaji name, and kanji title) and an editorial introduction on the right (the "Chapters" blog post).

### 5.2 A Chapter Profile (`/chapters/[name]`)

The page opens with:

- A chapter-jump search box (same as on character pages).
- **"Chapter N Summary"** followed by an "**AKA:**" line of alternate chapter titles when applicable, then the chapter description.
- **POEMS IN THIS CHAPTER** — every poem in that chapter, in order, displayed as clickable result cards.

---

## 6. The Translators (`/translators`)

The list page shows a profile card for each of the five published translators (Arthur Waley, Edward Seidensticker, Royall Tyler, Dennis Washburn, Edwin Cranston). Click one to open that translator's individual page, which has a portrait, biography, and a **FURTHER READINGS** section linking to relevant scholarship.

The translator name on any translation card on a Poem page links to the corresponding profile.

---

## 7. The Blog (`/blog`)

The blog index has a left panel with a searchable list of all blog posts and a discussion area (general blog discussion); the right side displays a default landing post titled "Genjipoems Blog." Click any post in the list to read it (`/blog/[title]`). Individual posts use the same rich-content rendering as the rest of the site.

---

## 8. Reference pages

A cluster of editorial pages, each rendered with a hero banner:

- **about this site** — project overview, scope, and goals.
- **user guide** — this document.
- **sources** — bibliographic details and links for the five published translations and other primary sources.
- **translators** — index of translator profile pages.
- **team members** — project credits.
- **methodology** — the encoding model, editorial decisions, and data structure behind the database.
- **collaborate** — how to get involved or contribute.
- **further reading** — annotated bibliography of secondary scholarship, plus a feed of database-linked sources.
- **what's new** — a changelog and recent additions.
- **terms** and **privacy** — legal pages, linked from the Sign In flow.
- **report an error** — a link in the About dropdown that opens an external Google Form.

---

## 9. Account features

You can browse the entire site without an account. Signing in unlocks the personal and collaborative features described below.

### 9.1 Signing in (`/login`)

The only sign-in method is Google OAuth. On the login page:

1. Tick the **Terms of Service and Privacy Policy** checkbox.
2. Click **Sign in with Google**.
3. After Google's prompt, you are returned to your User Page.

There is no password to manage.

### 9.2 Favorites

On any Poem page, the **☆ star** next to the Japanese poem becomes a clickable button when you're signed in. Click it to mark the poem as a favorite (the star fills to ★) — your favorites appear on your User Page and on your public profile. Click again to remove.

The "My Favorites" checkbox under **OTHER FILTERS > Other Tags** on the Poem Search page filters to your favorites only.

### 9.3 Discussion and replies

The **DISCUSSION** panel appears on Poem pages, Character Profile pages, and the Blog page. When signed in:

- Type a comment in the input next to your avatar and press the **send** icon.
- Reply to existing comments — replies are nested under the parent.
- **Edit** or **delete** your own comments and replies.
- **Like** any comment (♥ counter increments).
- Use the **refresh** icon at the top of the panel to reload comments without reloading the page.
- Long threads are split across pages via the pagination control.
- Admins can additionally **hide** problematic comments and **pin** comments to the top of the thread.

### 9.4 Private notes

The **USER NOTES** panel on each Poem page is a private scratchpad: anything you write there is visible only to you. You can edit and delete your own notes.

### 9.5 Submitting your own translation

The **YOURS** card at the bottom of the Translations column lets you write and submit your own English translation of the poem. Click **Submit Translation**; you'll see a confirmation message and the translation is saved against your account. (It appears as an "other translation" card on the poem page.)

### 9.6 Contributors

The **CONTRIBUTORS** section under MORE DETAILS lists the people credited for building that poem's entry. Each name links to the contributor's public profile. Admins can add or remove contributors using the user search box at the bottom of the section.

### 9.7 Your User Page (`/user`)

A dashboard with a sidebar of tabs. Available to all signed-in users:

- **🎈 Profile Information** — your username, email, and a link to your public homepage.
- **⭐ Favorite Poems** — every poem you've starred.
- **🔔 Activity Notifications** — incoming notifications when someone comments on or contributes to a page you're following.

Admin-only tabs (👤 Users, ✅ Review Notification) appear here for accounts with the admin role.

### 9.8 Your public homepage (`/user-home-page/[userid]`)

A profile page that other signed-in users can see. From this page you can edit:

- **Display Name** (defaults to your Google name)
- **Bio**
- **Location**
- **Occupation** (e.g. "Graduate Student at Boston University")

A stats row shows your totals: **Comments**, **Contributions**, **Translations**, **Blogs**, **Favorites**. Below that, tabs surface your activity:

- **RECENT COMMENTS** — your most recent discussion posts, linked back to the poem or character they live on.
- **POEM PAGES EDITED** — pages where you appear as a contributor.
- **TRANSLATIONS** — your submitted translations.
- **BLOGS** — blog posts you've authored (if you have editor permissions).
- **FAVORITE POEMS** — your starred poems.
- **RECENT NOTES** — your recent private notes (visible to you only).

### 9.9 Notifications

When you're signed in, the **🔔 bell** in the top-right of the navigation opens a panel:

- **Notifications** — incoming activity (replies, contributions, etc.) with a "No new notifications" empty state.
- **Content Review** (admin only) — items awaiting moderator approval.

---

## 10. Using the site on mobile

The full desktop site is best viewed at a laptop or desktop screen size. The first time you load the site on a screen 768px or narrower, a **Mobile Experience** modal explains what you can do on phone and offers a "Continue to Mobile Site" button.

The mobile experience at **`/mobile-search`** provides:

- A **POEM SEARCH** keyword box.
- A **gear (⚙) button** in the header opens *Display Options*: pick one of **Japanese, Romaji, Waley, Seidensticker, Tyler, Washburn, Cranston** as the text to show in each result.
- A **chapter filter** input below the keyword bar that limits results to a single chapter (clear it with the × button next to the chapter name).
- A clean results list — tap any result to open the full Poem Detail.
- A **Clear All** button at the top of the results.

Other pages on the site are still accessible from the mobile nav, but rich features (the relationships graph, map, timeline, and the full Poem Search) are designed for larger screens.

---

## 11. Reporting errors and contacting the team

The **about ▸ report an error** link opens a Google Form maintained by the project team for typo reports, scholarly corrections, and bug reports. Project credits and contact information are on the **team members** page; for ongoing collaboration inquiries, see the **collaborate** page.

---

*This guide reflects the public-facing features as of the time of writing; the **what's new** page on the site lists the most recent additions and changes.*
