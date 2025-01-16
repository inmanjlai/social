const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();
const { formatDistance } = require('date-fns')

function formatDateTime(date) { 
    const now = new Date(); 
    return formatDistance(date, now, { addSuffix: true })
}

router.get('/posts/:post_id', async(req, res) => {
    const post = await prisma.post.findUnique({
        where: {
            id: req.params.post_id
        },
        include: {
            author: true
        }
    });

    post.posted_date = formatDateTime(post.dateCreated)

    return res.render('postPage', { post, user: req.session.user })
});

router.post('/posts', async (req, res) => {
    const { content } = req.body;
    const authorId = req.session.user.id;

    await prisma.post.create({
        data: {
            id: nanoid(),
            content: content,
            authorId: authorId,
            dateCreated: new Date()
        },
    });

    res.redirect('/');
});

router.delete("/posts/:post_id", async(req, res) => {   
    const post_id = req.params.post_id;
    const authorId = req.session.user.id;

    const post = await prisma.post.findUnique({
        where: {
            id: post_id,
        },
    });

    if (post.authorId !== authorId) {
        return res.status(403).send('You are not authorized to delete this post');
    }

    await prisma.post.delete({
        where: {
            id: post_id,
        },
    });

    return res.redirect(303, '/');
});

module.exports = router;