const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "blog.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            is_moderator INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            publish_date TEXT NOT NULL,
            blogtext TEXT NOT NULL,
            author TEXT NOT NULL,
            deleted_by TEXT DEFAULT NULL,
            FOREIGN KEY (author) REFERENCES Users(username) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_by TEXT DEFAULT NULL,
            FOREIGN KEY (post_id) REFERENCES Blogs(id) ON DELETE CASCADE,
            FOREIGN KEY (author) REFERENCES Users(username) ON DELETE CASCADE
        )
    `);

    db.run("PRAGMA foreign_keys = ON");

    db.run(`INSERT OR IGNORE INTO Users (username, password, is_moderator) VALUES ('ZakJ', 'abc1234$', 1)`);
    db.run(`INSERT OR IGNORE INTO Users (username, password, is_moderator) VALUES ('MegW', 'cde5678!', 1)`);
});

async function createPost(data) {
    const title = data.title;
    const blogtext = data.blogtext;
    const author = data.author;
    const publish_date = new Date().toISOString();

    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO Blogs (title, publish_date, blogtext, author) VALUES (?, ?, ?, ?)",
            [title, publish_date, blogtext, author],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

async function editPost(id, title, blogtext) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE Blogs SET title = ?, blogtext = ? WHERE id = ?",
            [title, blogtext, id],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

async function deletePost(id, deletedBy) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE Blogs SET title = 'Deleted by ' || ?, blogtext = 'Deleted by ' || ?, deleted_by = ? WHERE id = ?",
            [deletedBy, deletedBy, deletedBy, id],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

async function getPost(id) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT id, title, publish_date, blogtext, author, deleted_by FROM Blogs WHERE id = ?",
            [id],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            }
        );
    });
}

async function getRecentPosts() {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT id, title, publish_date, blogtext, author, deleted_by FROM Blogs ORDER BY publish_date DESC LIMIT 3",
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

async function getAllPosts() {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT id, title, publish_date, blogtext, author, deleted_by FROM Blogs ORDER BY publish_date DESC",
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

async function createComment(postId, author, content) {
    const created_at = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO Comments (post_id, author, content, created_at) VALUES (?, ?, ?, ?)",
            [postId, author, content, created_at],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

async function getComments(postId) {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT id, post_id, author, content, created_at, deleted_by FROM Comments WHERE post_id = ? ORDER BY created_at ASC",
            [postId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

async function deleteComment(id, deletedBy) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE Comments SET author = 'Deleted by ' || ?, content = 'Deleted by ' || ?, deleted_by = ? WHERE id = ?",
            [deletedBy, deletedBy, deletedBy, id],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

async function createUser(username, password) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO Users (username, password, is_moderator) VALUES (?, ?, 0)",
            [username, password],
            function(err) {
                if (err) {
                    if (err.message.includes("UNIQUE")) {
                        reject(new Error("username already exists"));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

async function getUser(username) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT id, username, password, is_moderator FROM Users WHERE username = ?",
            [username],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            }
        );
    });
}

module.exports = {
    createPost,
    editPost,
    deletePost,
    getPost,
    getRecentPosts,
    getAllPosts,
    createComment,
    getComments,
    deleteComment,
    createUser,
    getUser,
};