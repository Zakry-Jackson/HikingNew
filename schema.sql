-- table for users
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(8) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_moderator BOOLEAN DEFAULT FALSE
);

-- table for blogs
CREATE TABLE Blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    publish_date DATETIME NOT NULL,
    blogtext TEXT NOT NULL,
    author VARCHAR(8) NOT NULL,
    FOREIGN KEY (author) REFERENCES Users(username) ON DELETE CASCADE
);

-- table for comments
CREATE TABLE Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author VARCHAR(8) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_by VARCHAR(8) DEFAULT NULL,
    FOREIGN KEY (post_id) REFERENCES Blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (author) REFERENCES Users(username) ON DELETE CASCADE
);