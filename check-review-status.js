const { IncomingWebhook } = require('@slack/webhook');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');

// Secrets에서 SLACK_WEBHOOK_URL 값을 가져오거나 직접 입력하세요.
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function checkReviewStatus() {
    try {
        const octokit = new Octokit();
        console.log()
        const { owner, repo } = process.env.GITHUB_REPOSITORY.split('/');
        console.log(process.env.GITHUB_REPOSITORY)
        console.log(process.env.GITHUB_REPOSITORY.split('/'))
        console.log(owner)
        const number = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        console.log(process.env.GITHUB_REPOSITORY)
        const pullRequest = await octokit.pulls.get({
            owner,
            repo,
            pull_number: number,
        });

        const requestedReviewers = pullRequest.data.requested_reviewers.map(reviewer => reviewer.login);
        const reviews = await octokit.pulls.listReviews({
            owner,
            repo,
            pull_number: number,
        });

        const reviewers = reviews.data.map(review => review.user.login);
        const missingReviewers = requestedReviewers.filter(reviewer => !reviewers.includes(reviewer));

        if (missingReviewers.length > 0) {
            const slackWebhook = new IncomingWebhook(SLACK_WEBHOOK_URL);
            const message = {
                text: 'The following pull requests are pending review:',
                attachments: [{
                    title: pullRequest.data.title,
                    title_link: pullRequest.data.html_url,
                }],
            };
            await slackWebhook.send(message);
        }
    } catch (error) {
        console.error('Error occurred while checking review status:', error);
    }
}

checkReviewStatus();
