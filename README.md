# Hiking
What's the site about?

The Love for Trails Blog is a simple blog site for hikers and trail enthusiasts to write about 
and discuss their experiences regarding any hiking trails they've walked. The site was designed
to invoke the thought of nature! The site supports creating, viewing, editing, and deleting posts through created accounts. Moderator accounts are also seeded with the ability to delete posts and comments as they see fit.
-------------------------------------------------------------------------------------------------
Tech Stack:
- Backend: Node.js and Express
- Templating: Pug
- Database(db): SQLite
- Style: All custom CSS
-------------------------------------------------------------------------------------------------
To run the site:
1. Install necessary dependencies in terminal by entering: npm install
2. Start the server by entering: node server.js
5. Visit the site in the browser. For me on Mac, it is CMD + click on the http://localhost:4131 in the terminal
-------------------------------------------------------------------------------------------------
Features Implemented:
---------------------
- Storing posts in SQLite
- Creating, reading, editing, and deleting posts (Made with future administrative powers in mind)
- 3 most recent posts on home page
- Pug templates with shared layout (see nav.pug and page_layout.pug)
- Used https://coolors.co/ to generate a complementary color scheme. I wanted a nature vibe
- Utilized images to overlay header, nav bar, and footer to create tree and grass facade
- Page showing all posts made, but no limit for page made at the moment
- Comment features: Adding comments and deleting them. Adding does not refresh page, but deleting does

-------------------------------------------------------------------------------------------------
All routes:
- / -> Home page
- /posts -> List of every post
- /post/:id -> Shows a page of one post
- /admin/new -> Creating a new post with a form
- /admin/edit/:id -> Editing an existing post with a form
- /admin/delete/:id -> Deleting a post, POST only
- 404
-------------------------------------------------------------------------------------------------
Notes:
- Didn't include any validation for super long posts beyond the regular HTML constraints
- There's a few unused images in the images folder
-------------------------------------------------------------------------------------------------
Bugs:
DB error when mod attempts to delete comment
