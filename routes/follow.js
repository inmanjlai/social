const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

// Follow a user
router.post('/follow/:userId', async (req, res) => {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        return res.status(404).send('User not found');
    }

    // check if user already follows
    const followAlreadyExists = await prisma.follow.findFirst({
        where: {
            followerId: req.session.user.id,
            followeeId: userId
        }
    });

    if (followAlreadyExists) {
        return res.status(400).send("You already follow this user")
    }

    await prisma.follow.create({
        data: {
            id: nanoid(),
            followerId: req.session.user.id,
            followeeId: userId,
        },
    });

    return res.render('unfollow', { userId })
});

// Unfollow a user
router.delete('/unfollow/:userId', async (req, res) => {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
        where: {
            id:  userId,
        },
    });

    if (!user) {
        return res.status(404).send('User not found');
    }

    const isFollowing = await prisma.follow.findFirst({
        where: {
            followerId: req.session.user.id,
            followeeId: userId
        }
    });

    if (isFollowing) {
        await prisma.follow.delete({
            where: {
                id: isFollowing.id
            },
        });
        
        return res.render('follow', { userId });
    } else {
        return res.status(404).send("You do not follow this User")
    }
});

module.exports = router;