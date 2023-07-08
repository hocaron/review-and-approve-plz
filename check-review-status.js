const { IncomingWebhook } = require('@slack/webhook');
const { Octokit } = require('@octokit/rest');

// Secrets에서 SLACK_WEBHOOK_URL 값을 가져옵니다.
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function checkReviewStatus() {
    try {
        const octokit = new Octokit();
        const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
        const pulls = await octokit.pulls.list({
            owner,
            repo,
            state: 'open',
        });

        for (const pull of pulls.data) {
            const number = pull.number;
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
            const missingReviewersText = missingReviewers.join(', ');

            if (missingReviewers.length > 0) {
                const slackWebhook = new IncomingWebhook(SLACK_WEBHOOK_URL);
                const message = {
                    text: '🥶얼어가는 PR 이 있습니다 🥶',
                    attachments: [
                        {
                            color: '#36a64f',
                            title: pullRequest.data.title,
                            title_link: pullRequest.data.html_url,
                            fields: [
                                {
                                    type: "markdown",
                                    title: '선택받은 리뷰어',
                                    value: "<@호선우 [회원마케팅서비스개발]>",
                                },
                                {
                                    title: '부탁드린 요청자',
                                    value: pullRequest.data.owner,
                                    short: true,
                                },
                            ],
                            image_url: 'https://i1.ruliweb.com/cmt/23/04/14/18780118f5c482067.jpg',
                            footer: '🔥 따뜻한 관심이 필요해요 🔥',
                            ts: Math.floor(Date.now() / 1000),
                        },
                    ],
                };
                await slackWebhook.send(message);
            }
        }
    } catch (error) {
        console.error('Error occurred while checking review status:', error);
    }
}

checkReviewStatus();
