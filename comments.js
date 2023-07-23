// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios').default;

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Store all comments
const commentsByPostId = {};

// Get all comments by post id
app.get('/posts/:id/comments', (req, res) => {
    res.status(200).send(commentsByPostId[req.params.id] || []);
});

// Create new comment
app.post('/posts/:id/comments', async (req, res) => {
    const commentId = Math.random().toString(36).substr(2, 7);
    const { content } = req.body;
    const postId = req.params.id;

    const comments = commentsByPostId[postId] || [];
    comments.push({ id: commentId, content, status: 'pending' });
    commentsByPostId[postId] = comments;

    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: { id: commentId, content, postId, status: 'pending' }
    });

    res.status(201).send(comments);
});

// Receive event from event bus
app.post('/events', async (req, res) => {
    console.log('Event Received:', req.body.type);

    const { type, data } = req.body;

    if (type === 'CommentModerated') {
        const { id, postId, status, content } = data;

        const comments = commentsByPostId[postId];
        const comment = comments.find(comment => comment.id === id);
        comment.status = status;

        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: { id, postId, status, content }
        });
    }

    res.send({});
});

app.listen(4001, () => {
    console.log('Listening on port 4001');
});