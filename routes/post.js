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
    if (!req.session.user) return res.redirect('/login')

    const post = await prisma.post.findUnique({
        where: {
            id: req.params.post_id
        },
        include: {
            author: true,
            comments: {
                include: { author: true },
                orderBy: { dateCreated: 'desc' }
            }   
        }
        
    });

    post.posted_date = formatDateTime(post.dateCreated)
    post.comments.forEach(comment => {
        comment.posted_date = formatDateTime(comment.dateCreated)
    })

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

router.post("/posts/:post_id/comments", async(req, res) => {
    const { content } = req.body;
    const authorId = req.session.user.id;

    await prisma.comment.create({
        data: {
            id: nanoid(),
            content: content,
            authorId: authorId,
            content: content,
            postId: req.params.post_id,
            dateCreated: new Date()
        }
    })

    res.redirect(`/posts/${req.params.post_id}`)
})

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

router.delete("/posts/:post_id/comments/:comment_id", async(req, res) => {
    const { post_id, comment_id } = req.params;

    const comment = await prisma.comment.findUnique({
        where: {
            id: comment_id,
        },
    });


    if (comment.authorId !== req.session.user.id) {
        return res.status(403).send('You are not authorized to delete this comment');
    }

    await prisma.comment.delete({
        where: {
            id: comment_id,
        },
    });

    return res.redirect(303, `/posts/${post_id}`);
});

router.get('/search', async(req, res) => {
    if (!req.session.user) return res.redirect('/login')
    const { search_query } = req.query;

    if (search_query.startsWith('@')){
        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: search_query.slice(1)
                }
            }
        })

        return res.render('users', { users, user: req.session.user })
    } else {
        const posts = await prisma.post.findMany({
            where: {
                content: {
                    contains: search_query
                }
            },
            include: { author: true }
        })
    
        posts.forEach((post) => {
            post.posted_date = formatDateTime(post.dateCreated)
        })
    
        return res.render('search', { post_list: true, posts, user: req.session.user, search_query }) 
    }    

})

module.exports = router;