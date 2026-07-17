const express = require("express");
const session = require("express-session");
const { readdirSync } = require("fs");
const path = require("path");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "templates"));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(session({
    secret: "hiking-blog-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use("/static", express.static(path.join(__dirname, "resources")));

const db = require("./data.js");

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ---------------------------------------------------------------------------------------------------

// AUTHENTICATION ROUTES

app.get("/auth", (req, res) => {
    res.render("auth", { action: null });
});

app.post("/auth/create", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render("auth", { action: "create", error: "Username and password are required" });
    }

    if (username.length > 8) {
        return res.render("auth", { action: "create", error: "Username cannot be longer than 8 characters" });
    }

    if (password.length < 8) {
        return res.render("auth", { action: "create", error: "Password must be at least 8 characters long" });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[$!&]/.test(password);

    if (!hasLetter || !hasNumber || !hasSymbol) {
        return res.render("auth", { action: "create", error: "Password must contain at least one letter, one number, and one of the symbols: $!&" });
    }

    try {
        await db.createUser(username, password);
        req.session.user = { username, is_moderator: false };
        res.redirect("/");
    } catch (err) {
        if (err.message === "username already exists") {
            res.render("auth", { action: "create", error: "username already exists" });
        } else {
            console.error("Error creating account:", err);
            res.render("auth", { action: "create", error: "Problem creating account" });
        }
    }
});

app.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render("auth", { action: "login", error: "Username and password are required" });
    }

    try {
        const user = await db.getUser(username);

        if (!user) {
            return res.render("auth", { action: "login", error: "Username does not exist" });
        }

        if (user.password !== password) {
            return res.render("auth", { action: "login", error: "Incorrect password" });
        }

        req.session.user = { username: user.username, is_moderator: user.is_moderator };
        res.redirect("/");
    } catch (err) {
        console.error("Error logging in:", err);
        res.render("auth", { action: "login", error: "Problem logging in" });
    }
});

app.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error logging out:", err);
        }
        res.redirect("/");
    });
});

// ---------------------------------------------------------------------------------------------------

// home page
app.get("/", async (req, res) => {
    try {
        // query recent 3 posts
        const posts = await db.getRecentPosts();

        // render home page
        res.render("home", {posts});
    } 
    catch (err) {
        console.error(err);
        res.status(500).send("Problem loading home page");
    }
});

// ---------------------------------------------------------------------------------------------------

// look at a particular blog post
app.get("/post/:id", async (req, res) => {
    // get the post id
    const id = req.params.id;

    // query the post by its id
    try {
        const post = await db.getPost(id);

        // if post doesnt exist
        if (!post) {
            return res.status(404).render("404");
        }

        const comments = await db.getComments(id);

        // render page with the post picked
        res.render("post", {post, comments});
    } 
    catch (err) {
        console.error("Problem loading post:", err);
        res.status(500).send("Problem loading post");
    }
    
});

// make a new comment on a post
app.post("/post/:id/comments", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ok: false, error: "Must be logged in to comment"});
    }

    const postId = req.params.id;
    const {content} = req.body || {};
    const author = req.session.user.username;

    if (!content) {
        return res.status(400).json({ok: false, error: "Comment content is required"});
    }

    try {
        const commentId = await db.createComment(postId, author, content);
        const createdAt = new Date().toString().slice(0, 21);

        res.json({ok: true, id: commentId, author, content, created_at: createdAt,});
    }
    catch (err) {
        console.error("Problem creating comment:", err);
        res.status(500).json({ok: false, error: "Problem creating comment"});
    }
});

// look at list of all posts
app.get("/posts", async (req, res) => {
    try {
        // query every single post
        const posts = await db.getAllPosts();

        // render page with every post listed
        res.render("blog_list", {posts});
    } 
    catch (err) {
        console.error("Problem loading all posts:", err);
        res.status(500).send("Problem loading all posts");
    }
});

// ---------------------------------------------------------------------------------------------------

// CREATING NEW POSTS

// show the from for creating a new post (title and blog text, date is auto)
app.get("/admin/new", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth");
    }
    res.render("new_post");
});

// create the new post
app.post("/admin/new", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth");
    }

    try {
        const {title, blogtext} = req.body;

        if (!title || !blogtext) {
            return res.status(400).send("Title and body are required to post.");
        }

        const newId = await db.createPost({title, blogtext, author: req.session.user.username});

        res.redirect(`/post/${newId}`);
    } 
    catch (err) {
        console.error("Problme creating post:", err);
        res.status(500).send("Problem creating post");
    }
});

// ---------------------------------------------------------------------------------------------------

// EDITING POSTS

// form for editing post
app.get("/admin/edit/:id", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth");
    }

    const id = req.params.id;

    try {
        const post = await db.getPost(id);

        if (!post) {
            return res.status(404).render("404");
        }

        if (post.author !== req.session.user.username) {
            return res.status(403).send("You can only edit your own posts");
        }

        res.render("edit_post", {post});
    } 
    catch (err) {
        console.error("Problem loading editing form:", err);
        res.status(500).send("Problem loading editing form");
    }
});

// update the post
app.post("/admin/edit/:id", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth");
    }

    const id = req.params.id;
    const {title, blogtext} = req.body;

    try {
        const post = await db.getPost(id);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        if (post.author !== req.session.user.username) {
            return res.status(403).send("You can only edit your own posts");
        }

        if (!title || !blogtext) {
            return res.status(400).send("Title and body are required to post.")
        }

        await db.editPost(id, title, blogtext);

        res.redirect(`/post/${id}`);
    } 
    catch (err) {
        console.error("Problem updating post:", err);
        res.status(500).send("Problem udpating post");
    }
});

// ---------------------------------------------------------------------------------------------------

// DELETING POSTS / comments

app.post("/admin/delete/:id", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth");
    }

    const id = req.params.id;

    try {
        const post = await db.getPost(id);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        if (post.author !== req.session.user.username && !req.session.user.is_moderator) {
            return res.status(403).send("You can only delete your own posts");
        }

        await db.deletePost(id, req.session.user.username);

        res.redirect("/posts");
    } 
    catch (err) {
        console.error("Problem deleting post:", err);
        res.status(500).send("Problem deleting post");
    }
});

app.post("/admin/comments/:id/delete", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth");
    }

    const commentId = req.params.id;
    const {postId} = req.body;

    try {
        const comments = await db.getComments(postId);
        const comment = comments.find(c => c.id == commentId);

        if (!comment) {
            return res.status(404).send("Comment not found");
        }

        if (comment.author !== req.session.user.username && !req.session.user.is_moderator) {
            return res.status(403).send("You can only delete your own comments");
        }

        await db.deleteComment(commentId, req.session.user.username);

        res.redirect(`/post/${postId}`);
    }
    catch (err) {
        console.error("Problem deleting comment:", err);
        res.status(500).send("Problem deleting comment");
    }
});

// ---------------------------------------------------------------------------------------------------

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

// ---------------------------------------------------------------------------------------------------

// Start server
app.listen(4131, () => {
    console.log('http://localhost:4131')
});