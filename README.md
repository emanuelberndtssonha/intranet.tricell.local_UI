# intranet.tricell.local_UI
## User Interface Design

### Overview
This repository contains a professional user interface for a web application, developed as a student project within the course **"User Interface Design" (5 ECTS)** at Åland University of Applied Sciences.

The project focuses on implementing a modern, responsive frontend that integrates with existing backend logic. It serves as the final piece in a trilogy of courses:
1. **Frontend Development** (5 ECTS)
2. **Backend Development** (5 ECTS)
3. **User Interface Design** (5 ECTS)

> **Note:** This repository contains the enhanced frontend. Students are required to integrate this UI with their personal backend and database logic developed in previous courses.

---
This repository contains several different frontend implementations of the same web application.
Each implementation is stored in a separate Git branch.

---

## Branch Overview

- **main** – Original base version of the application

- **bootstrap-version** – Layout implemented using the Bootstrap framework

- **html5-version** – Layout implementation using semantic HTML5

- **multimedia-version** – Layout implementation using HTML5 including multimedia elements

- **responsive-version** – Responsive layout implementation

- **css-grid-version** – Layout implemented using CSS Grid

## How to View a VersionOn GitHub, select the desired branch from the branch selector at the top of
the repository page.
Each branch represents a different approach to responsive frontend design.

### Project Structure
```text
/config          – Configuration files (DB settings, port, etc.)
/data            – Data sources (JSON, XML, and SQLite databases)
/masterframe     – Layout templates and core HTML structures
/public/css      – Custom stylesheets and UI frameworks
/public/images   – General UI assets (GIF, JPG, PNG)
/public/photos   – Personnel registry and dynamic profile images
/public/scripts  – Client-side JavaScript logic
/routes          – Express route definitions
/views           – EJS templates for dynamic rendering
/                – Main application entry points (app.js/server.js)
```

Installation & Setup
Clone the repository:

Bash
git clone [https://github.com/SabumnimKim/www.tricell.top_UI.git](https://github.com/SabumnimKim/www.tricell.top_UI.git)
cd www.tricell.top_UI
Install dependencies:

Bash
npm install
Database Configuration:
Ensure your SQLite database file is placed in the /data folder. Update your connection string in /config to utilize the better-sqlite3 driver.

Run the application:

Bash
# For development (auto-reload)
npm run dev 

# For production
npm start
Dependencies
The project utilizes the following key technologies:

View Engine: ejs (Embedded JavaScript templates)

Database: better-sqlite3 (High-performance SQLite driver)

Framework: express & express-session

Parsers: body-parser, cookie-parser, xml2js

File Uploads: multer (Middleware for handling multipart/form-data)

Legacy Support: node-adodb (For MDB data integration exercises), formidable 2.0.1

Dev Tool: nodemon

Disclaimer
This project is intended for educational purposes only. Security mechanisms, including authentication and input validation, are deliberately simplified to focus on UI/UX learning objectives. Do not use this in a production environment without significant hardening.

Author
Elias Koskinen Higher Education IT Program

Åland University of Applied Sciences (Högskolan på Åland)

elias.koskinen@ha.ax

Åland Islands, Finland - 2026
