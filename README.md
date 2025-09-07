# The Tale of Genji Database and Web Application Project.

The Tale of Genji Poetry Database is an ongoing project created by Professor J. Keith Vincent and his students in LJ250 "Masterpieces of Japanese Literature" at Boston University. The database contains all 795 poems from Murasaki Shikibu's tenth-century masterpiece, _The Tale of Genji_. The poems are presented in their original Japanese, transliterated Roman letters (romaji), and in five different English translations by Arthur Waley, Edward Seidensticker, Royall Tyler, Dennis Washburn, and Edwin Cranston.


### Main Pages

- **Poems Tab**: Navigate through individual pages for each poem, where you can find all five translations and additional metadata and commentary.
- **Characters Tab**: Explore a chart of character relations within _The Tale of Genji_. Pin characters using the search bar to view their specific relations or click "Read Info" to find detailed information about a character.
- **Search Tab**: Look up all poems in a given chapter, or search by speaker and addressee.


## Tech Stack

### Frontend & Backend

- **Framework**: [Next.js](https://nextjs.org/) - A React-based framework that enables both frontend and backend API endpoint development, with a focus on security, speed, and scalability.
- **Languages**: JavaScript and CSS
- **Hosting**: [Vercel](https://vercel.com/) - Efficient deployment of static and server-side rendered content.

### Database

- **Database**: [Neo4j](https://neo4j.com/) - A graph database that efficiently organizes the relationships between characters, poems, and their metadata. We utilize Cypher queries to retrieve and display relevant data on the web app.
- **Tools**: Aura, Bloom, Browser for DB management, including querying, importing CSV data, and visualizing relationships.

##
We hope you enjoy exploring the poems of The Tale of Genji. Stay tuned for new features and updates!
