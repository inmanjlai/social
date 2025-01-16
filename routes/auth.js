const express = require('express')
const argon2 = require('argon2')
const router = express.Router()
const { nanoid } = require('nanoid');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect(301, '/')
    res.render('login');
});

router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect(301, '/')
    res.render('register');
});

// CREATE ACCOUNT
router.post("/register", async(req, res) => {
    const { username, password, password2 } = req.body;

    if (!username || !password || !password2) {
        return res.render('register', { error: "All fields are required" });
    }

    if (password !== password2) {
        return res.render('register', { error: "Passwords do not match" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username,
            },
        });

        if (user) {
            return res.render('register', { error: "Username already in use" });
        }
    } catch (error) {
        return res.render('register', { error: "An error occurred" });
    }

    await prisma.user.create({
        data: {
            id: nanoid(),
            username: username,
            hashed_password: await argon2.hash(password),
        },
    });

    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
        include: {
            posts: true,
            followers: true,
            following: true,
        },
    });

    req.session.user = user;
    res.cookie('userid', user.id, { maxAge: 900000 });

    return res.redirect("/");
}); 

// LOG OUT
router.get("/logout", async(req, res) => {
    req.session.destroy();
    res.clearCookie('userid');
    res.redirect('/login');
});

// LOG IN
router.post("/login", async(req, res) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
        include: {
            posts: true,
            followers: true,
            following: true,
        },
    });

    if (!user) {
        return res.render('login', { error: "Invalid username or password" });
    }

    const valid = await argon2.verify(user.hashed_password, password);

    if (!valid) {
        return res.render('login', { error: "Invalid username or password" });
    }

    req.session.user = user;
    res.cookie('userid', user.id, { maxAge: 900000 });

    return res.redirect("/");
});


module.exports = router;