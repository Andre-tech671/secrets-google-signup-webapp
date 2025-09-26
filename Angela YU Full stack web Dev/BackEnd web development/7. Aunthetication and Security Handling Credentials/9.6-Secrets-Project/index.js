import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

env.config();
const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Setup static and views
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// PostgreSQL setup
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

// Routes
app.get("/", (req, res) => res.render("home"));
app.get("/login", (req, res) => res.render("login"));
app.get("/register", (req, res) => res.render("register"));

app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query("SELECT secret FROM users WHERE email = $1", [req.user.email]);
      const secret = result.rows[0]?.secret || "Jack Bauer is my hero.";
      res.render("secrets", { secret });
    } catch (err) {
      console.error(err);
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async (req, res) => {
  const submittedSecret = req.body.secret;
  try {
    await db.query("UPDATE users SET secret = $1 WHERE email = $2", [submittedSecret, req.user.email]);
    res.redirect("/secrets");
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

// Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);
      if (result.rows.length === 0) return done(null, false);

      const user = result.rows[0];
      bcrypt.compare(password, user.password, (err, isValid) => {
        if (err) return done(err);
        return isValid ? done(null, user) : done(null, false);
      });
    } catch (err) {
      return done(err);
    }
  })
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://secrets-google-signup-webapp-1.onrender.com/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.email]);
        if (result.rows.length === 0) {
          const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [
            profile.email,
            "google",
          ]);
          return done(null, newUser.rows[0]);
        } else {
          return done(null, result.rows[0]);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Auth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/secrets", passport.authenticate("google", { successRedirect: "/secrets", failureRedirect: "/login" }));

app.post("/login", passport.authenticate("local", { successRedirect: "/secrets", failureRedirect: "/login" }));

app.post("/register", async (req, res) => {
  const { username: email, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) return res.redirect("/login");

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) return console.error(err);
      const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [email, hash]);
      req.login(newUser.rows[0], err => {
        if (err) return console.error(err);
        res.redirect("/secrets");
      });
    });
  } catch (err) {
    console.error(err);
    res.redirect("/register");
  }
});

// Passport session handlers
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
