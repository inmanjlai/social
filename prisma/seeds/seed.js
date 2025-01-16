const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();


async function main() {

    const user1 = await prisma.user.create({
        data: {
            id: nanoid(),
            username: 'lmartinez',
            hashed_password: await argon2.hash('password'),
        },
    });

    const user2 = await prisma.user.create({
        data: {
            id: nanoid(),
            username: 'imanjlai',
            hashed_password: await argon2.hash('password'),
        },
    });

    const posts = [
        {
            id: nanoid(),
            content: 'Just had the best coffee ever! ☕️ #coffee #morning',
            authorId: user1.id,
        },
        {
            id: nanoid(),
            content: 'Excited for the new season of my favorite show! 📺 #TV #entertainment',
            authorId: user1.id,
        },
        {
            id: nanoid(),
            content: 'Loving the new features in the latest update! 🚀 #tech #update',
            authorId: user2.id,
        },
        {
            id: nanoid(),
            content: 'Had a great workout session today! 💪 #fitness #health',
            authorId: user2.id,
        },
        {
            id: nanoid(),
            content: 'Reading a fascinating book on AI. 🤖 #reading #AI',
            authorId: user1.id,
        },
    ];

    for (const post of posts) {
        await prisma.post.create({
            data: post,
        });
    }
}

main()
            