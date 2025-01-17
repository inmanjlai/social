const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const followRoutes = require('./routes/follow');
const profileRoutes = require('./routes/profile')
const { formatDistance } = require('date-fns')

const session = require('express-session');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
}));
app.use('/', authRoutes);
app.use('/', postRoutes);
app.use('/', followRoutes);
app.use('/', profileRoutes);
app.use(express.static('public'));

function formatDateTime(date) { 
    const now = new Date(); 
    return formatDistance(date, now, { addSuffix: true })
}

app.get('/', async(req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    // Find all users that the current user follows
    const following = await prisma.follow.findMany({
        where: { followerId: req.session.user.id },
        select: { followeeId: true }
    });

    const followingIds = following.map(f => f.followeeId);

    followingIds.push(req.session.user.id)

    // Query for posts from those users
    let posts = await prisma.post.findMany({ 
        where: { authorId: { in: followingIds } },
        include: { author: true, comments: true }, 
        orderBy: { dateCreated: 'desc' }, 
    });

    if (posts.length != 0) {
        posts.forEach((post) => {
            post.posted_date = formatDateTime(post.dateCreated)
        })
    }
    res.render('home', { user: req.session.user, posts, post_list: true });
});

app.listen(8080, () => {
  console.log('Server is running at http://localhost:8080');
});