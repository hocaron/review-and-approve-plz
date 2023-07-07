const { IncomingWebhook } = require('@slack/webhook');
const { Octokit } = require('@octokit/rest');

// 리뷰어의 GitHub 사용자명을 리뷰어 목록에 맞게 변경하세요.
const REVIEWERS_LIST = ['hocaron'];

// Secrets에서 SLACK_WEBHOOK_URL 값을 가져오거나 직접 입력하세요.
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function checkReviewStatus() {
    try {
        const octokit = new Octokit();
        const pullRequests = await octokit.pulls.list({
            owner: 'hocaron',
            repo: 'review-and-approve-plz',
            state: 'open',
        });

        const pendingReviewPrs = pullRequests.data.filter(pr => {
            const requestedReviewers = pr.requested_reviewers.map(reviewer => reviewer.login);
            const missingReviewers = REVIEWERS_LIST.filter(reviewer => !requestedReviewers.includes(reviewer));
            return missingReviewers.length > 0;
        });

        if (pendingReviewPrs.length > 0) {
            const slackWebhook = new IncomingWebhook(SLACK_WEBHOOK_URL);
            const message = {
                text: 'The following pull requests are pending review:',
                attachments: pendingReviewPrs.map(pr => ({
                    title: pr.title,
                    title_link: pr.html_url,
                })),
            };
            await slackWebhook.send(message);
        }
    } catch (error) {
        console.error('Error occurred while checking review status:', error);
    }
}

checkReviewStatus();
