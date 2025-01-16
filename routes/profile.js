const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { formatDistance } = require('date-fns')

function formatDateTime(date) { 
    const now = new Date(); 
    return formatDistance(date, now, { addSuffix: true })
}

router.get('/profile/:userId', async(req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: {
            id: req.params.userId,
        },
    });

    const posts = await prisma.post.findMany({
        where: {
            authorId: req.params.userId,
        },
        include: { author: true },
        orderBy: { dateCreated: 'desc' },
    });

    const userFollowsProfileUser = await prisma.follow.findFirst({
        where: {
            followerId: req.session.user.id,
            followeeId: req.params.userId
        }
    });

    if (posts.length != 0) {
        posts.forEach((post) => {
            post.posted_date = formatDateTime(post.dateCreated)
        })
    }

    res.render('profile', { posts, profileUser: user, user: req.session.user, isFollowing: userFollowsProfileUser });
});


module.exports = router;